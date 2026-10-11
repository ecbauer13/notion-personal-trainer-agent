const review = $input.first().json;
const records = review.body_metric_records ?? [];
const period = review.review_period;
const issues = [];
const round = n => n === null ? null : Math.round((n + Number.EPSILON) * 100) / 100;
const shift = (date, days) => {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const latestStart = shift(period.end_date, -6);
const previousEnd = shift(period.end_date, -7);
const previousStart = shift(period.end_date, -13);
const fields = ['body_weight', 'waist', 'hips', 'arms', 'thighs'];
const grouped = Object.fromEntries(fields.map(f => [f, new Map()]));
for (const r of records) {
  const date = r.property_date?.start?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < period.start_date || date > period.end_date) {
    issues.push({id:r.id, issue:'Missing date or outside review period'});
    continue;
  }
  for (const field of fields) {
    const raw = r['property_' + field];
    if (raw === null || raw === undefined || String(raw).trim() === '') continue;
    const text = String(raw).trim();
    const value = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
    if (!Number.isFinite(value) || value <= 0) {
      issues.push({id:r.id, date, field, issue:'Invalid measurement; excluded from calculation'});
      continue;
    }
    if (!grouped[field].has(date)) grouped[field].set(date, []);
    grouped[field].get(date).push({id:r.id, value});
  }
}
const series = field => [...grouped[field]].sort(([a],[b]) => a.localeCompare(b)).map(([date, entries]) => {
  if (entries.length > 1) issues.push({date, field, issue:'Multiple entries on this date; used their daily average', record_ids:entries.map(e => e.id)});
  return {date, value:entries.reduce((s,e) => s + e.value, 0) / entries.length, entry_count:entries.length};
});
const weightHistory = series('body_weight');
function assessBodyWeightWeeks(weightHistory, endDate) {
  const round = n => n === null ? null : Math.round((n + Number.EPSILON) * 100) / 100;
  const shift = (date, days) => {const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10);};
  const minimumDays = 3;
  const threshold = 1;
  const rawWeeks = [3,2,1,0].map(offset => {
    const end = shift(endDate, -7 * offset), start = shift(end, -6);
    const days = weightHistory.filter(p => p.date >= start && p.date <= end);
    return {start_date:start, end_date:end, recorded_days:days.length, weigh_in_count:days.reduce((s,p)=>s+p.entry_count,0), average_lb:days.length ? days.reduce((s,p)=>s+p.value,0)/days.length : null, reliable:days.length >= minimumDays, daily_values:days.map(p=>({...p,value:round(p.value)}))};
  });
  const publicWeek = w => ({...w,average_lb:round(w.average_lb)});
  const latest = rawWeeks.at(-1), previous = rawWeeks.at(-2);
  const canCompare = latest.reliable && previous.reliable;
  const rawChange = canCompare ? latest.average_lb - previous.average_lb : null;
  const change = round(rawChange);
  const consistent = canCompare && Math.abs(rawChange) <= threshold + 1e-9;
  const weeklyAssessment = {
    category:!canCompare ? 'insufficient_data' : (consistent ? 'consistent' : 'outside_consistency_range'),
    minimum_recorded_days_per_week:minimumDays, consistency_threshold_lb:threshold,
    direction:!canCompare || consistent ? null : (rawChange > 0 ? 'up' : 'down'),
    report_text:!canCompare ? 'Not enough weigh-ins to assess weekly weight consistency.' : (consistent ? 'Weight stayed consistent.' : 'Weekly average weight ' + (rawChange>0?'rose':'fell') + ' by ' + Math.abs(change) + ' lb, outside the chosen 1 lb consistency range.'),
    reason:canCompare ? 'Both adjacent seven-day periods have at least three distinct recorded days.' : 'One or both adjacent seven-day periods have fewer than three distinct recorded days.'
  };
  const consecutive = [];
  for (let i=rawWeeks.length-1;i>=0;i--) {if(!rawWeeks[i].reliable) break; consecutive.unshift(rawWeeks[i]);}
  const changes = consecutive.slice(1).map((w,i)=>w.average_lb-consecutive[i].average_lb);
  const positive = changes.filter(n=>n>1e-9).length, negative=changes.filter(n=>n< -1e-9).length;
  const total = consecutive.length ? consecutive.at(-1).average_lb-consecutive[0].average_lb : null;
  const direction = positive>=2 && negative===0 ? 'up' : (negative>=2 && positive===0 ? 'down' : null);
  const detected = consecutive.length>=3 && direction!==null && Math.abs(total)>threshold+1e-9;
  const drift = {
    status:consecutive.length<3 ? 'insufficient_consecutive_weeks' : (detected?'detected':'not_detected'),
    direction:detected?direction:null, consecutive_reliable_weeks:consecutive.length,
    minimum_consecutive_weeks:3, minimum_directional_changes:2, minimum_recorded_days_per_week:minimumDays,
    overall_change_must_exceed_lb:threshold, gaps_bridged:false,
    start_date:consecutive.length?consecutive[0].start_date:null, end_date:consecutive.length?consecutive.at(-1).end_date:null,
    first_week_average_lb:consecutive.length?round(consecutive[0].average_lb):null,
    latest_week_average_lb:consecutive.length?round(consecutive.at(-1).average_lb):null,
    overall_average_change_lb:detected?round(total):null,
    weekly_averages:consecutive.map(w=>({start_date:w.start_date,end_date:w.end_date,recorded_days:w.recorded_days,average_lb:round(w.average_lb)})),
    reason:consecutive.length<3 ? 'Fewer than three consecutive sufficiently tracked weeks ending with the latest week; missing or insufficient weeks break the trend.' : (detected?'At least two changes in one direction, no changes in the opposite direction, and the total change exceeds 1 lb.' : 'The consecutive averages do not meet all gradual-drift rules.')
  };
  return {latestWeek:publicWeek(latest),previousWeek:publicWeek(previous),weeks:rawWeeks.map(publicWeek),canCompare,weightChange:change,weeklyAssessment,drift};
}
const weightAssessment = assessBodyWeightWeeks(weightHistory, period.end_date);
const {latestWeek, previousWeek, canCompare, weightChange} = weightAssessment;
const bodyWeight = {
  unit:"lb", status:canCompare ? "comparison_available" : "more_data_needed",
  latest_7_days:latestWeek, previous_7_days:previousWeek, weekly_periods:weightAssessment.weeks,
  weekly_average_change_lb:weightChange, weekly_assessment:weightAssessment.weeklyAssessment, gradual_drift:weightAssessment.drift,
  first_in_review:weightHistory.length ? {...weightHistory[0], value:round(weightHistory[0].value)} : null,
  latest_in_review:weightHistory.length ? {...weightHistory.at(-1), value:round(weightHistory.at(-1).value)} : null,
  first_to_latest_change_lb:weightHistory.length >= 2 ? round(weightHistory.at(-1).value - weightHistory[0].value) : null,
  cautions:canCompare ? [] : ["A weekly comparison needs at least three distinct recorded days in both adjacent seven-day periods. Missing data is neutral; no catch-up is required."],
  history:weightHistory.map(p => ({...p, value:round(p.value)}))
};
const measurements = fields.filter(f => f !== 'body_weight').map(field => {
  const history = series(field);
  const latest = history.at(-1) ?? null;
  const previous = history.length >= 2 ? history.at(-2) : null;
  return {measurement:field, unit:'inches', recorded_days:history.length,
    entry_count:history.reduce((s,p) => s + p.entry_count, 0),
    status:previous ? 'comparison_available' : (latest ? 'more_data_needed' : 'no_data'),
    latest:latest ? {...latest, value:round(latest.value)} : null,
    previous:previous ? {...previous, value:round(previous.value)} : null,
    latest_change_inches:previous ? round(latest.value - previous.value) : null,
    first_to_latest_change_inches:previous ? round(latest.value - history[0].value) : null,
    history:history.map(p => ({...p, value:round(p.value)}))};
});
return [{json:{
  body_trends_summary:{source_body_records:records.length,
    latest_week_average_lb:latestWeek.average_lb, latest_week_weigh_ins:latestWeek.weigh_in_count,
    previous_week_average_lb:previousWeek.average_lb, previous_week_weigh_ins:previousWeek.weigh_in_count,
    weekly_average_change_lb:weightChange,
    latest_week_recorded_days:latestWeek.recorded_days, previous_week_recorded_days:previousWeek.recorded_days,
    weekly_weight_assessment:weightAssessment.weeklyAssessment.category, gradual_weight_drift:weightAssessment.drift.status,
    circumference_comparisons:measurements.filter(m => m.status === 'comparison_available').length,
    circumferences_needing_more_data:measurements.filter(m => m.status === 'more_data_needed').length,
    circumferences_without_data:measurements.filter(m => m.status === 'no_data').length,
    calculation_issues:issues.length},
  body_weight_trend:bodyWeight, measurement_trends:measurements,
  body_calculation_issues:issues,
  body_calculation_rules:{weight:'Average distinct recorded days in nonoverlapping seven-day periods anchored on the review end date; duplicate entries on a day are averaged first. Missing days are not zero. Both adjacent periods need at least three distinct recorded days for weekly comparison.',
    weight_consistency:'An absolute weekly average change of at most 1 lb is consistent. Classify using averages before display rounding.',
    weight_drift:'At least three consecutive sufficiently tracked weeks ending with the latest week, at least two same-direction changes, no opposing change, and an overall average change strictly greater than 1 lb. Unchanged weeks are allowed. Never bridge a missing or insufficient week.',
    weight_gaps:'Missing weigh-ins are neutral data gaps. Do not infer weight change, assume a cause, criticize tracking, recommend catch-up, or manufacture a trend.',
    circumferences:'Compare the two latest distinct dates within the 28-day review; one measurement is insufficient for change.',
    rounding:'Display values rounded to 2 decimals; changes calculated before rounding.',
    interpretation:'Descriptive changes only; no body-fat estimate or cause inferred.'},
  ...review
}}];