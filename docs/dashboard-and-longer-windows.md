# Review dashboard and longer assessment windows

Updated 2026-10-11. The headline dashboard is approved, tested, and published. The 8- and 12-week eligibility, classification, and reporting rules have also been approved, implemented, tested, and published on 2026-10-11.

## Requested windows

Use weeks consistently:

| Window | Inclusive history | Proposed purpose |
|---|---|---|
| Weekly focus | 7 days | Current activity and recent comparable performance |
| Existing short-term assessment | 4 weeks / 28 days | Recent comparisons and patterns |
| Requested medium-term assessment | 8 weeks / 56 days | Assess whether recent patterns persist across more history |
| Requested longer assessment | 12 weeks / 84 days | Assess the broader direction within comparable training |

For each rolling history, the start date is the review end date minus (window length − 1): 55 days earlier for an inclusive 56-day window, and 83 days earlier for an inclusive 84-day window. All dates use the workflow's configured timezone.

Reaching a calendar age alone does not qualify an exercise for a longer assessment. Evidence must cover enough of the window and contain enough comparable sessions. The approved rules are recorded in longer-trend-eligibility-draft.md, longer-trend-classification-draft.md, and longer-trend-reporting-draft.md. Do not reuse the current three-session/14-day minimum and describe it as an 8- or 12-week trend.

Keep different exercises, session groups, and training blocks separate. A new block starts its own comparison history; older records in a different block cannot fill the new block's evidence requirements. Missing weight weeks still break the consecutive sequence. Longer windows do not authorize conclusions across gaps.

Before a window qualifies, omit its workout assessment entirely. Suppress empty headings, countdowns, and insufficient-history messages for these longer workout windows. Add longer findings only when they change the interpretation or add a distinct useful observation. Do not produce three repetitive analyses of the same exercise.

## Published dashboard

Place a compact “Weekly Snapshot” before the existing Concise Summary, Coaching Analysis, and Practical Priorities. Keep it a dated snapshot in each generated Notion page. A live dashboard across all reviews can be considered separately.

Use four native Notion callout cards in two equal-width rows. Activity cards use blue and performance cards use pink. Two-line labels and footers keep the left and right cards aligned.

| Headline | Implemented definition | Reason |
|---|---|---|
| Training days logged | Count distinct workout dates in the latest seven days with at least one completed exercise record. Include completed bodyweight movements for activity counting, while retaining their exclusion from loaded-performance analysis. | Shows recorded activity without requiring new tracking fields. |
| Active weeks | Count the number of the latest four nonoverlapping seven-day periods containing at least one completed exercise record; display as N/4. | Gives a simple view of activity across weeks without a daily streak. |
| Exercises progressed | Count exercise/session/block groups with a latest session in the weekly focus and a valid latest-pair classification of clear progress. Display X/Y, where Y is the number of comparable groups, including maintained, mixed, and decline results. | Makes the count interpretable and includes all eligible comparisons, not only the two selected coaching examples. |
| Recorded rep bests | Count unique exercise/session/block groups with at least one new rep best in the latest seven days at the same external load, working-set position, and working-set count as prior valid sessions. Compare against all available earlier comparable records within that block, not only the rolling review window. | Provides a conservative, explicitly defined PR metric that avoids calling heavier load with fewer reps an unqualified strength improvement. |

Training days logged do not establish that every planned exercise was completed. Active weeks do not mean adherence to a prescribed schedule. Missing activity records show what was logged, not why activity is absent. Do not criticize rest days or vacation gaps.

For recorded rep bests, require at least one valid earlier comparable session. A first entry establishes a baseline. A tie is not a new record, and multiple qualifying sets or sessions for one group count once. Exclude invalid values, ambiguous duplicate-date evidence, assistance loads, and movements without external loads. If no comparable historical baseline exists, show “Not assessable”; display zero only when eligible comparisons exist and none set a new best. This means best within the available recorded block history, not an all-time or one-repetition-maximum PR. Incomplete or uncertain historical retrieval must not silently become a record claim.

For exercises progressed, show “Not assessable” when Y is zero. A changed set count remains mixed under the existing comparison rule. No score combines these metrics into an invented fitness rating.

Keep body weight in Coaching Analysis exactly once, using the existing maintenance and missing-data rules. The dashboard does not repeat it or add circumference analysis.

## Layout preview

Placeholders below illustrate the layout; they are not actual fitness results.

| Weekly Snapshot | Result |
|---|---|
| Training days logged — last 7 days | N days |
| Active weeks — last 4 weeks | N/4 |
| Exercises progressed — latest comparisons | X/Y comparable exercises |
| Recorded rep bests — last 7 days | N exercises, or Not assessable |

The metrics are calculated and rendered by n8n. The AI explains selected findings but does not generate or alter the headline values. Avoid repeating dashboard counts in the high-level summary unless needed to explain a distinct conclusion.

## Decisions and implementation sequence

The user approved the four headline metrics, recorded-rep-best definition, blue/pink cards, and final real-data test. The headline-card workflow was published on 2026-10-11 for the existing Sunday 9 a.m. America/New_York schedule.

The reader now retrieves all completed workout history through the review end. Coaching input remains limited to 28 days; earlier records support recorded rep-best comparisons and are excluded from the AI payload. Boundary, layout, and payload-separation checks passed, followed by a successful end-to-end Notion review.

The approved longer-window rules passed 40 synthetic eligibility, classification, selection, pipeline, and native-writer checks. An end-to-end draft execution also succeeded and created a correctly structured Notion page. Current real history has no qualifying longer groups, so no longer context is added to the AI evidence. Only a selected aggregate longer finding is added when eligible; historical raw rows remain excluded. Positive longer-window classification and rendering were tested with synthetic fixtures; a real qualifying longer-window AI review remains a future verification point. The user approved the test result and n8n confirmed publication on 2026-10-11; the Sunday 9 a.m. America/New_York schedule is unchanged. Use synthetic fixtures for public portfolio examples.
