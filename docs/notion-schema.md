# Notion schema

The reusable workflow expects these property names and types. This is a schema guide, not an exported personal database.

## Workout History

One record represents one exercise performed. Comma-separated weights and reps describe its working sets.

| Property | Notion type | Expected n8n simplified key |
|---|---|---|
| Entry | Title | `name` or `property_entry` |
| Completed | Checkbox | `property_completed` |
| Workout Date | Formula returning a date | `property_workout_date.start` |
| Session | Select | `property_session` |
| Training Block | Text | `property_training_block` |
| Set Reps | Text | `property_set_reps` |
| Set Weights | Text | `property_set_weights` |
| Notes | Text | `property_notes` |

Synthetic example: `Set Weights = 100, 110, 110` and `Set Reps = 12, 10, 10`. Values match by position. Loads are pounds as logged; per-dumbbell loads are not doubled. Loaded-performance comparisons require usable matching loads/reps and session/block identity.

The original tracker uses a date-returning formula for **Workout Date**. A simple independent database can use a Date property named **Date**, with a **Workout Date** formula `prop("Date")`. If using a Date-type Workout Date directly, change the reader's filter property type from formula to date and verify the same simplified output key before continuing.

Relations to an exercise library or training plan are optional here. The workflow groups by Entry, Session, and Training Block; keep values consistent. It does not resolve or read training-plan relations.

## Body Metrics

| Property | Notion type | Expected n8n simplified key |
|---|---|---|
| Entry | Title | `name` or `property_entry` |
| Date | Date | `property_date.start` |
| Body Weight | Number | `property_body_weight` |
| Waist | Number, optional | `property_waist` |
| Hips | Number, optional | `property_hips` |
| Arms | Number, optional | `property_arms` |
| Thighs | Number, optional | `property_thighs` |

Weight uses pounds; circumference fields use inches. Optional measurement fields are omitted from the weekly report. A separate monthly circumference report remains future work.

## Review destination

Create a normal parent page, such as **Weekly Progress Reviews**. The writer creates a dated child page with native headings, callouts, columns, and bullets. It does not append database rows or update an existing review.

Give the n8n Notion connection access to both data sources and this parent page. Confirm reader output matches the keys above; property naming and n8n versions can affect mappings.
