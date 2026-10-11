function calculateLongerAssessments(review, weeklySelection) {
  const norm = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const clean = value => String(value ?? '').trim();
  const keyOf = group => JSON.stringify([norm(group.exercise), norm(group.session), norm(group.training_block)]);
  const end = review.review_period.end_date;
  const endMs = Date.parse(end + 'T00:00:00Z');
  if (!Number.isFinite(endMs)) throw new Error('Invalid longer-assessment date.');
  const dateAt = offset => new Date(endMs - offset * 86400000).toISOString().slice(0,10);
  const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date + 'T00:00:00Z')) &&
    new Date(Date.parse(date + 'T00:00:00Z')).toISOString().slice(0,10) === date;
  const parse = (value, integers) => {
    const parts = clean(value).split(',').map(part => part.trim());
    if (parts.some(part => !/^\d+(?:\.\d+)?$/.test(part))) return null;
    const numbers = parts.map(Number);
    return numbers.every(number => Number.isFinite(number) && number > 0 && (!integers || Number.isInteger(number))) ? numbers : null;
  };
  const labels = ['Clear progress','Maintained performance','Mixed change','Decline to monitor'];
  const pairCategory = (previous, latest) => {
    if (previous.reps.length !== latest.reps.length) return {category:'Mixed change', reason:'changed_set_count'};
    const diffs = latest.reps.flatMap((reps,index) => [reps - previous.reps[index], Math.round((latest.loads[index] - previous.loads[index]) * 100) / 100]);
    if (diffs.every(diff => diff === 0)) return {category:'Maintained performance',reason:'identical_sets'};
    if (diffs.every(diff => diff >= 0)) return {category:'Clear progress',reason:'improved_without_decreases'};
    if (diffs.every(diff => diff <= 0)) return {category:'Decline to monitor',reason:'decreased_without_increases'};
    return {category:'Mixed change',reason:'opposing_load_or_rep_changes'};
  };
  const groups = new Map();
  const complete = review.workout_history_scope === 'all_completed_through_review_end' && Array.isArray(review.historical_workout_records);
  if (complete) for (const row of review.historical_workout_records) {
    if (row.property_completed !== true) continue;
    const identity = {exercise:clean(row.name || row.property_entry),session:clean(row.property_session),training_block:clean(row.property_training_block)};
    if (!identity.exercise || !identity.session || !identity.training_block) continue;
    const date = String(row.property_workout_date?.start ?? '').slice(0,10);
    if (validDate(date) && date > end) continue;
    const reps = parse(row.property_set_reps,true), loads = parse(row.property_set_weights,false);
    const assisted = /\b(assisted|assistance|counterweight)\b/i.test(identity.exercise + ' ' + clean(row.property_notes));
    const key = keyOf(identity);
    if (!groups.has(key)) groups.set(key,{...identity,rows:[]});
    groups.get(key).rows.push({date,reps,loads,valid:validDate(date) && !assisted && Boolean(reps && loads && reps.length === loads.length)});
  }
  const assess = (group,weeks) => {
    const days = weeks * 7, start = dateAt(days - 1), minimum = weeks === 8 ? 6 : 9, threshold = weeks === 8 ? 3 : 4;
    const windowRows = group.rows.filter(row => !validDate(row.date) || (row.date >= start && row.date <= end));
    const dateCounts = new Map();
    for (const row of windowRows) dateCounts.set(row.date,(dateCounts.get(row.date) ?? 0) + 1);
    const history = windowRows.filter(row => row.valid && dateCounts.get(row.date) === 1).sort((a,b) => a.date.localeCompare(b.date));
    const firstValid = group.rows.filter(row => row.valid).map(row=>row.date).sort()[0] ?? null;
    const occupied = new Set(history.map(row => Math.floor((endMs - Date.parse(row.date + 'T00:00:00Z')) / 86400000 / 7)));
    const checks = {
      complete_history:complete,
      mature_recorded_history:Boolean(firstValid && firstValid <= start),
      minimum_sessions:history.length >= minimum,
      minimum_weeks:occupied.size >= minimum,
      early_evidence:history.some(row => row.date <= dateAt(days - 14)),
      current_evidence:history.some(row => row.date >= dateAt(6)),
      unambiguous_evidence:windowRows.every(row => row.valid && dateCounts.get(row.date) === 1)
    };
    const span = history.length ? Math.round((Date.parse(history.at(-1).date+'T00:00:00Z')-Date.parse(history[0].date+'T00:00:00Z'))/86400000) : 0;
    const result = {weeks,window_start:start,window_end:end,category:'Insufficient evidence',eligible:false,
      valid_session_count:history.length,occupied_week_count:occupied.size,first_recorded_date:firstValid,
      observed_start_date:history[0]?.date ?? null,observed_end_date:history.at(-1)?.date ?? null,span_days:span,
      checks,minimum_sessions:minimum,minimum_weeks:minimum,minimum_directional_comparisons:threshold,
      comparison_counts:Object.fromEntries(labels.map(label=>[label,0])),mixed_reasons:[],
      reason:'Eligibility requirements not met.',scope:'recorded_sessions_same_exercise_session_training_block',establishes_plateau:false};
    if (!Object.values(checks).every(Boolean)) return result;
    result.eligible = true;
    const comparisons = history.slice(1).map((latest,index) => pairCategory(history[index],latest));
    result.comparison_counts = Object.fromEntries(labels.map(label => [label,comparisons.filter(pair=>pair.category===label).length]));
    const count = result.comparison_counts, total = comparisons.length;
    if (count['Maintained performance'] === total) {
      result.category = 'Maintained performance'; result.reason = 'All recorded consecutive comparisons maintained performance; this does not diagnose a plateau.';
    } else if (count['Clear progress'] >= threshold && count['Clear progress'] + count['Maintained performance'] === total) {
      result.category = 'Repeated progress'; result.reason = 'Required improving comparisons met; every other recorded comparison maintained performance.';
    } else if (count['Decline to monitor'] >= threshold && count['Decline to monitor'] + count['Maintained performance'] === total) {
      result.category = 'Repeated declines to monitor'; result.reason = 'Required declining comparisons met; every other recorded comparison maintained performance. No cause is established.';
    } else {
      result.category = 'Mixed or limited change';
      if (count['Clear progress'] && count['Decline to monitor']) result.mixed_reasons.push('both_improving_and_declining_pairs');
      for (const reason of ['changed_set_count','opposing_load_or_rep_changes']) if (comparisons.some(pair=>pair.reason===reason)) result.mixed_reasons.push(reason);
      if (!count['Mixed change'] && !(count['Clear progress'] && count['Decline to monitor'])) result.mixed_reasons.push('too_few_directional_comparisons');
      result.reason = 'Recorded comparisons do not meet a repeated-direction or all-maintained rule. Preserve mixed_reasons when explaining.';
    }
    return result;
  };
  const shortGroups = new Map(review.exercise_trends.map(group => [keyOf(group),group]));
  const selectedWeekly = new Set(weeklySelection.selected.map(finding=>keyOf(finding.group)));
  const assessed = [...groups.values()].map(group=>({...group,rows:undefined,windows:[assess(group,8),assess(group,12)]}));
  const shortCategory = category => category === 'Mixed pattern' ? 'Mixed or limited change' : category;
  const candidates = assessed.map(group => {
    const qualified = group.windows.filter(window=>window.eligible);
    if (!qualified.length) return null;
    const shortGroup = shortGroups.get(keyOf(group));
    const short = shortCategory(shortGroup?.short_term_trend?.category ?? 'Insufficient evidence');
    const shortKnown = short !== 'Insufficient evidence';
    const contrast = new Set(qualified.map(window=>window.category)).size > 1 ||
      (shortKnown && qualified.some(window=>window.category !== short));
    const decline = qualified.some(window=>window.category === 'Repeated declines to monitor');
    const progress = qualified.some(window=>window.category === 'Repeated progress');
    if (!decline && !contrast && !progress) return null;
    const longest = qualified.at(-1);
    const shown = qualified.length === 2 && qualified[0].category === qualified[1].category ? [longest] : qualified;
    return {exercise:group.exercise,session:group.session,training_block:group.training_block,
      priority:decline ? 0 : contrast ? 1 : 2,selection_basis:decline ? 'repeated_declines' : contrast ? 'contrasting_windows' : 'repeated_progress',
      longest,windows:shown,already_weekly_selected:selectedWeekly.has(keyOf(group)),
      latest_session_category:shortGroup?.performance_classification?.category ?? 'Insufficient evidence',
      short_term_category:shortGroup?.short_term_trend?.category ?? 'Insufficient evidence'};
  }).filter(Boolean);
  const compareText = (a,b) => a < b ? -1 : a > b ? 1 : 0;
  candidates.sort((a,b) => a.priority-b.priority || b.longest.weeks-a.longest.weeks ||
    b.longest.valid_session_count-a.longest.valid_session_count || b.longest.span_days-a.longest.span_days ||
    compareText(b.longest.observed_end_date,a.longest.observed_end_date) ||
    compareText(norm(a.exercise),norm(b.exercise)) || compareText(norm(a.session),norm(b.session)) || compareText(norm(a.training_block),norm(b.training_block)));
  const summarize = window => ({weeks:window.weeks,category:window.category,reason:window.reason,
    window_start:window.window_start,window_end:window.window_end,observed_start_date:window.observed_start_date,observed_end_date:window.observed_end_date,
    valid_session_count:window.valid_session_count,occupied_week_count:window.occupied_week_count,
    comparison_counts:window.comparison_counts,mixed_reasons:window.mixed_reasons});
  const chosen = candidates[0];
  const selected = chosen ? {exercise:chosen.exercise,session:chosen.session,training_block:chosen.training_block,
    selection_basis:chosen.selection_basis,placement:chosen.already_weekly_selected ? 'append_to_existing_exercise_bullet' : 'one_additional_exercise_bullet_before_body_weight',
    latest_session_category:chosen.latest_session_category,short_term_category:chosen.short_term_category,
    windows:chosen.windows.map(summarize)} : null;
  return {selected,check:{complete_history:complete,assessed_groups:assessed.length,
    eligible_8_week_groups:assessed.filter(group=>group.windows[0].eligible).length,
    eligible_12_week_groups:assessed.filter(group=>group.windows[1].eligible).length,candidates:candidates.length,selected_groups:selected ? 1 : 0,
    groups:assessed.map(({exercise,session,training_block,windows})=>({exercise,session,training_block,windows}))}};
}
