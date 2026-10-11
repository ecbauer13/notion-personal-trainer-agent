// Compare recorded performances without changing any Notion data.
const review = $input.first().json;
const issues = [];
const groups = new Map();
const clean = value => String(value ?? '').trim();
const keyText = value => clean(value).toLowerCase().replace(/\s+/g, ' ');
const round = value => Math.round(value * 100) / 100;
function numbers(value, integerOnly) {
  const text = clean(value);
  if (!text) return null;
  const parts = text.split(',').map(part => part.trim());
  if (parts.some(part => !/^\d+(?:\.\d+)?$/.test(part))) return null;
  const result = parts.map(Number);
  if (result.some(number => !Number.isFinite(number) ||
    (integerOnly && (!Number.isInteger(number) || number <= 0)))) return null;
  return result;
}
for (const record of review.workout_records) {
  const name = clean(record.name || record.property_entry);
  const date = record.property_workout_date?.start?.slice(0, 10);
  const session = clean(record.property_session);
  const block = clean(record.property_training_block);
  const reps = numbers(record.property_set_reps, true);
  const flag = reason => issues.push({ id: record.id, exercise: name, date, reason, url: record.url });
  if (!name || !date || !session || record.property_completed !== true) {
    flag('Missing exercise, workout date, session, or completed status; excluded from comparisons.');
    continue;
  }
  if (!reps) { flag('Missing or invalid comma-separated reps; excluded from comparisons.'); continue; }
  const weightsText = clean(record.property_set_weights);
  const parsedWeights = numbers(weightsText, false);
  const matchedWeights = parsedWeights && parsedWeights.length === reps.length;
  if (weightsText && !matchedWeights) flag('Weights are invalid or the number of weights differs from the number of rep entries; load comparison unavailable.');
  const notes = clean(record.property_notes);
  const assisted = /\b(assisted|assistance|counterweight)\b/i.test(name + ' ' + notes);
  const weights = matchedWeights ? parsedWeights : null;
  const loadUsable = Boolean(weights && !assisted);
  const performance = {
    id: record.id, date, url: record.url, set_count: reps.length,
    total_reps: reps.reduce((sum, value) => sum + value, 0),
    set_reps: reps, set_weights_lb_as_logged: weights,
    max_load_lb_as_logged: loadUsable ? Math.max(...weights) : null,
    volume_lb_reps_as_logged: loadUsable ? round(reps.reduce((sum, value, index) => sum + value * weights[index], 0)) : null,
    load_status: assisted ? 'assistance_not_compared' : loadUsable ? 'recorded_weights' : weightsText ? 'invalid_weights' : 'no_external_weight_logged',
    notes,
  };
  // Keep different sessions and training blocks separate.
  const key = JSON.stringify([keyText(name), keyText(session), keyText(block)]);
  if (!groups.has(key)) groups.set(key, { exercise: name, session, training_block: block || null, history: [] });
  groups.get(key).history.push(performance);
}
const trends = [...groups.values()].map(group => {
  const history = group.history.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const latest = history[history.length - 1];
  const previousDate = history.filter(entry => entry.date < latest.date).at(-1)?.date;
  const previousRows = previousDate ? history.filter(entry => entry.date === previousDate) : [];
  const latestRows = history.filter(entry => entry.date === latest.date);
  const cautions = [];
  if (!group.training_block) cautions.push('Training block is blank; confirm it before interpreting this group.');
  let comparison = null;
  let status = 'insufficient_history';
  if (latestRows.length > 1 || previousRows.length > 1) {
    status = 'duplicate_date_needs_review';
    cautions.push('Multiple records for this exercise and session on a comparison date; comparison withheld.');
  } else if (previousRows.length === 1) {
    status = 'comparison_available';
    const previous = previousRows[0];
    const sameSets = latest.set_count === previous.set_count;
    const loadedPair = latest.load_status === 'recorded_weights' && previous.load_status === 'recorded_weights';
    const sameLoads = loadedPair && JSON.stringify(latest.set_weights_lb_as_logged) === JSON.stringify(previous.set_weights_lb_as_logged);
    comparison = {
      previous_date: previous.date, latest_date: latest.date,
      set_count_change: latest.set_count - previous.set_count,
      total_reps_change: latest.total_reps - previous.total_reps,
      max_load_change_lb_as_logged: loadedPair ? round(latest.max_load_lb_as_logged - previous.max_load_lb_as_logged) : null,
      volume_change_lb_reps_as_logged: loadedPair && sameSets ? round(latest.volume_lb_reps_as_logged - previous.volume_lb_reps_as_logged) : null,
      same_number_of_sets: sameSets, same_weights_by_set: sameLoads,
      reps_change_at_same_weights: sameLoads && sameSets ? latest.total_reps - previous.total_reps : null,
    };
    if (!sameSets) cautions.push('Set count changed; total reps alone does not show strength progress.');
    if (loadedPair && !sameLoads) cautions.push('Loads changed; consider reps and load together.');
    if (!loadedPair) cautions.push('Load comparison unavailable; reps are shown without assuming blank weights mean zero.');
  }
  const result = { ...group, status, latest, previous: previousRows.length === 1 ? previousRows[0] : null, comparison, cautions };
  result.weekly_review_eligible = latest.load_status !== 'no_external_weight_logged' &&
    !(latest.set_weights_lb_as_logged?.every(weight => weight === 0));
  result.performance_classification = classifyPerformance(result);
  return result;
}).sort((a, b) => a.exercise.localeCompare(b.exercise) || a.session.localeCompare(b.session));

// Labels describe the latest valid pair only; they do not establish a multiweek trend.
function classifyPerformance(group) {
  const result = (category, reason, differences = []) => ({
    category, reason, scope: 'latest_vs_previous_valid_session',
    previous_date: group.comparison?.previous_date ?? null,
    latest_date: group.latest?.date ?? null,
    set_differences: differences,
    establishes_sustained_trend: false,
  });
  if (!group.weekly_review_eligible) return result('Insufficient evidence', 'Bodyweight movement excluded from weekly performance analysis.');
  if (group.status !== 'comparison_available' || !group.previous || !group.comparison)
    return result('Insufficient evidence', group.status === 'duplicate_date_needs_review' ? 'Ambiguous duplicate records; comparison withheld.' : 'Fewer than two valid distinct sessions.');
  if (!group.training_block) return result('Insufficient evidence', 'Training block is missing; comparability is not confirmed.');
  const { latest, previous } = group;
  const validLoads = row => row.load_status === 'recorded_weights' &&
    Array.isArray(row.set_weights_lb_as_logged) && row.set_weights_lb_as_logged.length === row.set_count &&
    row.set_weights_lb_as_logged.every(weight => Number.isFinite(weight) && weight > 0);
  if (!validLoads(latest) || !validLoads(previous))
    return result('Insufficient evidence', 'Comparable external loads are unavailable, invalid, zero, or represent assistance.');
  if (latest.set_count !== previous.set_count)
    return result('Mixed change', 'Working-set count changed; added or removed sets are not strength progression.');
  const differences = latest.set_reps.map((reps, index) => ({
    set: index + 1,
    load_change_lb_as_logged: round(latest.set_weights_lb_as_logged[index] - previous.set_weights_lb_as_logged[index]),
    reps_change: reps - previous.set_reps[index],
  }));
  const allUnchanged = differences.every(set => set.load_change_lb_as_logged === 0 && set.reps_change === 0);
  const noDecreases = differences.every(set => set.load_change_lb_as_logged >= 0 && set.reps_change >= 0);
  const noIncreases = differences.every(set => set.load_change_lb_as_logged <= 0 && set.reps_change <= 0);
  if (allUnchanged) return result('Maintained performance', 'Loads, repetitions, and working-set count are identical. Maintenance alone does not require a program change.', differences);
  if (noDecreases) return result('Clear progress', 'At least one set improved in load or reps with no decreases in other set loads or reps and unchanged set count.', differences);
  if (noIncreases) return result('Decline to monitor', 'Comparable load or reps decreased in this session. This pair alone does not establish regression, a plateau, fatigue, or its cause.', differences);
  return result('Mixed change', 'Loads or reps moved in opposing directions, either within or between sets; no unambiguous improvement or decline is assigned.', differences);
}
const categories = ['Clear progress', 'Maintained performance', 'Mixed change', 'Decline to monitor', 'Insufficient evidence'];

// Describe every consecutive pair in the existing 28-day history separately from the latest-session label.
const trendCategories = ['Repeated progress', 'Maintained performance', 'Repeated declines to monitor', 'Mixed pattern', 'Insufficient evidence'];
function classifyShortTerm(group) {
  const history = group.history;
  const dateCounts = new Map();
  for (const row of history) dateCounts.set(row.date, (dateCounts.get(row.date) ?? 0) + 1);
  const validSession = row => row.load_status === 'recorded_weights' &&
    Array.isArray(row.set_weights_lb_as_logged) && row.set_weights_lb_as_logged.length === row.set_count &&
    row.set_weights_lb_as_logged.every(weight => Number.isFinite(weight) && weight > 0);
  const validHistory = history.filter(row => dateCounts.get(row.date) === 1 && validSession(row));
  const start = validHistory[0]?.date ?? null;
  const end = validHistory.at(-1)?.date ?? null;
  const span = start && end ? Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86400000) : 0;
  const comparisons = history.slice(1).map((latest, index) => {
    const previous = history[index];
    const duplicate = dateCounts.get(previous.date) > 1 || dateCounts.get(latest.date) > 1;
    const classified = classifyPerformance({ ...group, latest, previous,
      status: duplicate ? 'duplicate_date_needs_review' : 'comparison_available',
      comparison: { previous_date: previous.date, latest_date: latest.date } });
    return { previous_date: previous.date, latest_date: latest.date, category: classified.category,
      set_differences: classified.set_differences };
  });
  const counts = Object.fromEntries(categories.map(category => [category, comparisons.filter(pair => pair.category === category).length]));
  const result = (category, reason) => ({ category, reason,
    scope: 'short_term_within_28_day_history',
    recorded_session_count: history.length, valid_session_count: validHistory.length,
    start_date: start, end_date: end, span_days: span,
    minimum_sessions: 3, minimum_span_days: 14,
    comparison_count: comparisons.length, comparison_counts: counts, comparisons,
    establishes_sustained_trend: false, establishes_plateau: false });
  if (!group.weekly_review_eligible) return result('Insufficient evidence', 'Bodyweight movement excluded from weekly performance analysis.');
  if (!group.training_block) return result('Insufficient evidence', 'Training block is missing; comparability is not confirmed.');
  if ([...dateCounts.values()].some(count => count > 1)) return result('Insufficient evidence', 'Duplicate-date records prevent an unambiguous consecutive-session pattern.');
  if (validHistory.length !== history.length || counts['Insufficient evidence'] > 0)
    return result('Insufficient evidence', 'Unusable external loads prevent a reliable pattern across the recorded sessions.');
  if (validHistory.length < 3 || span < 14) return result('Insufficient evidence', 'At least three valid sessions spanning at least 14 days are required.');
  if (counts['Maintained performance'] === comparisons.length)
    return result('Maintained performance', 'Every consecutive comparison maintained recorded loads, reps, and set structure; this does not establish a plateau or require a program change.');
  if (counts['Clear progress'] >= 2 && counts['Clear progress'] + counts['Maintained performance'] === comparisons.length)
    return result('Repeated progress', 'At least two consecutive-session comparisons show clear progress; all remaining comparisons maintained performance.');
  if (counts['Decline to monitor'] >= 2 && counts['Decline to monitor'] + counts['Maintained performance'] === comparisons.length)
    return result('Repeated declines to monitor', 'At least two consecutive-session comparisons declined; all remaining comparisons maintained performance. Monitor the pattern without inferring a cause or diagnosing a plateau.');
  return result('Mixed pattern', 'The consecutive comparisons do not meet the repeated-progress, all-maintained, or repeated-decline rules. This includes mixed load/rep changes, changed set counts, and isolated improvements or declines.');
}
for (const group of trends) group.short_term_trend = classifyShortTerm(group);

const summary = {
  source_workout_records: review.workout_records.length,
  records_with_valid_reps: trends.reduce((sum, group) => sum + group.history.length, 0),
  exercise_session_block_groups: trends.length,
  groups_with_comparison: trends.filter(group => group.status === 'comparison_available').length,
  groups_needing_more_history: trends.filter(group => group.status === 'insufficient_history').length,
  groups_with_duplicate_dates: trends.filter(group => group.status === 'duplicate_date_needs_review').length,
  flagged_records: new Set(issues.map(issue => issue.id)).size,
  performance_classification_counts: Object.fromEntries(categories.map(category => [category,
    trends.filter(group => group.weekly_review_eligible && group.performance_classification.category === category).length])),
  short_term_trend_counts: Object.fromEntries(trendCategories.map(category => [category,
    trends.filter(group => group.weekly_review_eligible && group.short_term_trend.category === category).length])),
  bodyweight_groups_excluded: trends.filter(group => !group.weekly_review_eligible).length,
};
return [{ json: {
  workout_trends_summary: summary,
  short_term_trend_check: trends.filter(group => group.weekly_review_eligible).map(group => ({
    exercise: group.exercise, session: group.session, training_block: group.training_block,
    latest_session_category: group.performance_classification.category,
    category: group.short_term_trend.category, valid_sessions: group.short_term_trend.valid_session_count,
    start_date: group.short_term_trend.start_date, end_date: group.short_term_trend.end_date,
    span_days: group.short_term_trend.span_days, comparison_counts: group.short_term_trend.comparison_counts })),
  classification_check: categories.map(category => trends.find(group => group.weekly_review_eligible && group.performance_classification.category === category)).filter(Boolean).map(group => ({ exercise: group.exercise, session: group.session,
    training_block: group.training_block, eligible: group.weekly_review_eligible,
    category: group.performance_classification.category, reason: group.performance_classification.reason,
    previous_date: group.previous?.date ?? null, latest_date: group.latest.date,
    previous_loads: group.previous?.set_weights_lb_as_logged ?? null, latest_loads: group.latest.set_weights_lb_as_logged,
    previous_reps: group.previous?.set_reps ?? null, latest_reps: group.latest.set_reps })),
  ...review,
  exercise_trends: trends,
  workout_calculation_issues: issues,
  calculation_rules: {
    comparison: 'Two most recent distinct valid Workout Dates within the 28-day window, matching exercise name, session, and training block.',
    weights: 'Pounds as logged; per-dumbbell weights are not doubled. Assistance is not treated as lifted load.',
    classification: 'Classify matching set positions conservatively. Identical sets are maintained; no load or rep decreases with at least one increase is clear progress; no increases with at least one decrease is decline to monitor; opposing changes or changed set count are mixed; missing or ambiguous evidence is insufficient. Volume load does not determine the label.',
    interpretation: 'performance_classification describes only the latest pair. short_term_trend describes all consecutive pairs in the current 28-day history. Neither establishes a sustained trend, muscle growth, effort, fatigue, causes, automatic program changes, or a plateau.',
    short_term_trend: 'Require at least three valid sessions spanning at least 14 days, with no unresolved comparison evidence. Repeated progress needs at least two clear-progress pairs and otherwise maintained pairs. Repeated declines needs at least two decline pairs and otherwise maintained pairs. All-maintained pairs means maintained performance. Other combinations or changed set structures mean mixed pattern. Missing or ambiguous evidence means insufficient evidence. These are reporting thresholds, not physiological cutoffs.',
  },
} }];