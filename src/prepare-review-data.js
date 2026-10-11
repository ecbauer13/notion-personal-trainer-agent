// Keep both Notion read results together for the review.
const historicalWorkouts = $('Get many database pages').all().map(item => item.json);
const reviewStart = $today.minus({ days: 27 }).toISODate();
const reviewEnd = $today.toISODate();
const workouts = historicalWorkouts.filter(record => {
  const date = record.property_workout_date?.start?.slice(0,10);
  return date && date >= reviewStart && date <= reviewEnd;
});
const bodyMetrics = $input.all().map(item => item.json);

// Flag completed records with no reps; keep them in the source list.
const missingReps = workouts
  .filter(record => record.property_completed === true &&
    String(record.property_set_reps ?? '').trim() === '')
  .map(record => ({
    id: record.id,
    exercise: record.name,
    workout_date: record.property_workout_date?.start ?? null,
    url: record.url,
  }));

return [{ json: {
  review_period: {
    start_date: $today.minus({ days: 27 }).toISODate(),
    end_date: $today.toISODate(),
    days: 28,
    timezone: $today.zoneName,
  },
  record_counts: {
    workout_records: workouts.length,
    body_metric_records: bodyMetrics.length,
    completed_records_missing_reps: missingReps.length,
  },
  data_quality: { completed_records_missing_reps: missingReps },
  workout_records: workouts,
  historical_workout_records: historicalWorkouts,
  workout_history_scope: 'all_completed_through_review_end',
  body_metric_records: bodyMetrics,
} }];