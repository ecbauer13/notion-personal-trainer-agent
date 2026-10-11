# Longer-trend reporting — approved rules

Approved by the user on 2026-10-11. Implemented, tested, and published on 2026-10-11. Eligibility and classification have been approved separately.

## Placement and length

Keep the existing headline cards, high-level Concise Summary, Coaching Analysis, and Practical Priorities. Add longer context only in Coaching Analysis. Use at most one exercise/session/block group for longer context per report.

If the selected group already has a weekly coaching bullet, append at most two short sentences to that bullet. Otherwise add one labeled exercise bullet after the weekly exercise findings and before Body weight. Match identity by exercise, session, and training block, not display name alone. Preserve enough session/block context to distinguish groups with the same exercise name.

Keep the existing up-to-two positive and one monitor weekly selection unchanged. Longer context must not erase its current-session or short-term evidence. Do not put exercise-specific longer findings in the summary or turn one selected example into an overall claim about the training program. Keep the entire written review at or below 500 words.

## Which window to show

- Only 8 weeks qualifies: consider its result.
- Only 12 weeks qualifies: consider its result.
- Both qualify with the same category: show 12 weeks only.
- Both qualify with different categories: consider one combined finding that explains the 8-week and 12-week categories distinctly. Do not duplicate the exercise in separate bullets.
- Neither qualifies: omit longer context, empty headings, countdowns, and insufficient-history messages for these workout windows. Existing body-weight missing-data wording remains unchanged.

## Useful findings and deterministic selection

A group becomes a candidate if at least one eligible longer window has repeated progress or repeated declines to monitor, or if eligible windows reveal a category difference from one another or from the group's qualifying 4-week pattern. Map short-term “Mixed pattern” to longer “Mixed or limited change” for category comparison. An insufficient 4-week pattern is unknown and cannot establish a contrast. Identical maintained or mixed categories alone do not create a candidate.

This allows a longer window to confirm repeated progress with additional historical support, but does not add another maintained-performance sentence merely to fill space. Mixed findings must retain their calculated reason; do not imply alternating directions when the result reflects limited directional comparisons or changed set structure.

Choose at most one candidate with these ordered tie-breakers:

1. Any eligible longer window shows repeated declines to monitor.
2. Eligible longer windows differ from each other or from a qualifying 4-week pattern.
3. Otherwise, repeated progress supported by an eligible longer window.
4. A qualifying 12-week assessment before 8-week-only evidence.
5. More usable sessions in the longest eligible window.
6. Longer observed evidence span in that window.
7. More recent latest session.
8. Alphabetical exercise, session, then training block.

The first three items are descending priority tiers, not additive scores. n8n selects the group, windows, and supporting evidence before AI generation. The AI cannot substitute a different exercise or omit a selected window's contrasting category.

## Synthetic wording examples

- Matching 8-/12-week progress: “Recorded sessions also show repeated progress across the 12-week window.” Include it once in the existing exercise bullet.
- Different windows: “The 8-week window shows repeated progress. The 12-week pattern remains mixed because earlier recorded comparisons included declines.” Use the supplied mixed reason; this is only an example.
- No qualifying useful finding: add no longer commentary.

Use “8 weeks” and “12 weeks” in output; do not append day counts. All statements describe recorded comparable performance, not continuous weekly progress, muscle gain, a plateau diagnosis, or a cause. Missing workout weeks remain neutral and must not be filled in or criticized.

## Implementation boundary

The approved longer-workout design passed 40 synthetic checks and a real-data end-to-end Notion test. The user approved the result, and n8n confirmed publication on 2026-10-11 as “Weekly Review — 8 and 12 Week Assessments.” The existing Sunday 9 a.m. America/New_York schedule is preserved. Current data qualifies no longer groups; a real qualifying longer-window AI review remains a future verification point. These files are reference documents, not live workflow configuration.
