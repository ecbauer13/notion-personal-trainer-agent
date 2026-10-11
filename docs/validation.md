# Validation evidence

## Reproducible local checks

The tests run the actual exported calculation and writer code with synthetic records. They require Node.js and no dependencies, credentials, or external requests.

| Suite | Recorded result | Coverage |
|---|---|---|
| `node tests/longer-assessments.cjs` | 40 checks passed | Exact 8-/12-week boundaries, minimum sessions, week distribution, current/early evidence, gaps, block/session separation, duplicates, invalid values, classification thresholds, ranking, window deduplication, payload boundaries, native bullets. |
| `node tests/core-rules.cjs` | 17 checks passed | Weight consistency threshold, minimum days, duplicate weigh-ins, drift and gaps, load/rep tradeoffs, set-count changes, short-term evidence, zero load, duplicates, writer blank/missing/oversized-output guards. |
| `node tests/package-check.cjs` | Package validation passed | Inactive export, removed credentials/instance metadata, placeholder destinations, valid connection references, code/export equality, local documentation links, secret-pattern checks. |

`tests/fixtures/previous-ai-review-input.js` is the previous headline-card preparation code, retained as a regression baseline. It contains calculation logic, not personal data. Tests verify that adding longer assessments preserves weekly evidence and card values when no longer finding qualifies.

## Observed personal deployment

- Manual end-to-end runs retrieved Notion data, calculated evidence, generated AI text, and created formatted review pages.
- The final longer-window update completed an end-to-end manual test in approximately 15.5 seconds and was approved before publication.
- Current real history did not qualify any longer groups. The output correctly omitted 8-/12-week workout commentary while retaining cards and the body-weight callout.
- Published schedule: Sunday 9 a.m. `America/New_York`.

No private pages, execution records, screenshots of actual reviews, credential references, account identifiers, or real fitness measurements are included here.

## What remains unverified

- A successful automatic scheduled run has not been independently observed.
- A real-data AI review with qualifying 8-/12-week findings is not yet available. Those calculation branches and native rendering are verified using synthetic fixtures.
- Import into a separate clean n8n instance has not been tested. The sanitized export has been checked structurally and its code exercised locally.
- Model prose is not validated automatically for every factual statement, duplicate priority, or the 500-word limit. The synthetic sample review is illustrative wording, not a model benchmark.
- External API failure recovery, proactive error alerts, deduplication, monthly cost, and measured time savings remain future work.
