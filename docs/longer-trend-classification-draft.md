# Longer-trend classification — approved rules

Approved by the user on 2026-10-11. Implemented, tested, and published on 2026-10-11. Eligibility is separately approved in longer-trend-eligibility-draft.md. These classification thresholds are conservative reporting decisions, not physiological cutoffs.

## Calculate before explaining

For each eligible exercise/session/training-block window, sort usable sessions by date and classify every consecutive pair using the existing session rules. Corresponding working-set positions are compared. Changed working-set count is mixed change. Unresolved invalid or duplicate-date evidence means insufficient evidence, not a clean pattern after silently dropping inconvenient rows.

Use only sessions inside the relevant rolling window. Do not include a comparison against a session before its start. Missing weeks are permitted only under the approved eligibility requirements. Any inference describes recorded sessions, not continuous performance in unobserved weeks.

## Approved categories

| Category | 8-week rule | 12-week rule |
|---|---|---|
| Repeated progress | At least three clear-progress pairs; every remaining pair is maintained | At least four clear-progress pairs; every remaining pair is maintained |
| Maintained performance | Every pair is maintained | Every pair is maintained |
| Repeated declines to monitor | At least three decline-to-monitor pairs; every remaining pair is maintained | At least four decline-to-monitor pairs; every remaining pair is maintained |
| Mixed or limited change | Any other valid combination | Any other valid combination |
| Insufficient evidence | Eligibility fails or required comparisons are unresolved | Eligibility fails or required comparisons are unresolved |

Mixed or limited change includes opposing directions, mixed load/rep tradeoffs, changed set structure, or too few directional pairs to meet the repeated-pattern threshold. Preserve the reason so the prose can distinguish a single improvement among maintained sessions from alternating improvements and declines. Do not label every such result as unstable.

The repeated-direction thresholds are more demanding than the existing short-term two-pair rule. All remaining pairs must be maintained so opposing evidence cannot be hidden by a positive or negative majority. This deliberately prioritizes conservative, repeatable claims over finding a long-term trend in every eligible window.

## Interpretation safeguards

- Maintained performance is not a plateau diagnosis and does not automatically warrant intervention.
- Repeated declines describe performance evidence, not fatigue, regression, or a cause.
- More load with fewer reps remains mixed; volume load cannot override the classification.
- Do not infer muscle growth, body composition, or a training prescription from these categories.
- Calculate each window independently. An 8-week result must not be copied into the 12-week result.
- Preserve the latest-session and short-term findings when they differ from the longer result. A longer classification cannot erase a recent change.
- n8n calculates eligibility, pair counts, categories, and reasons. The AI explains these supplied facts without recomputing or upgrading them.

## Illustrative output

Synthetic example with six eligible sessions and pair categories progress, maintained, progress, maintained, progress:

“Leg press: Recorded sessions show repeated progress across the 8-week window.”

Synthetic example with one progress pair and all other pairs maintained:

“Leg press: Most comparable sessions were maintained, with one improvement; evidence does not meet the repeated-progress rule.”

These examples illustrate permitted interpretation, not the final report selection or layout. Report selection and deduplication were subsequently approved and implemented; synthetic checks and a real-data end-to-end test passed before publication.
