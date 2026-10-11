# Setup

## Requirements

- An n8n instance with Notion, Code, Basic LLM Chain, OpenRouter Chat Model, Manual Trigger, and Schedule Trigger nodes.
- A Notion connection that can read two data sources and create child pages under your review destination.
- An OpenRouter credential and a model available to your account.
- The [expected Notion properties](notion-schema.md).

## Import and configure

1. Download `workflows/weekly-fitness-review.json` and import it in n8n. The template is inactive and contains no credential references. See [n8n's JSON import guide](https://docs.n8n.io/build/manage-workflows/export-and-import.md).
2. In **Get many database pages**, select your Notion credential and Workout History data source, replacing `REPLACE_WITH_WORKOUT_HISTORY_DATA_SOURCE_ID`. Keep Return All enabled and Completed/date filters. Execute this reader alone and inspect a few records.
3. In **Read Body Metrics**, select your Notion credential and Body Metrics data source, replacing `REPLACE_WITH_BODY_METRICS_DATA_SOURCE_ID`. Verify date filters and simplified property names.
4. In **Create Weekly Fitness Review**, select the Notion credential and replace `REPLACE_WITH_REVIEW_PARENT_PAGE_ID` with your parent page. It must allow child-page creation.
5. In **OpenRouter Chat Model**, select your credential. The export retains the deployment's model identifier, `google/gemini-3.8-flash`; verify availability and choose an available model if necessary. The output limit is 10,000 tokens. Total usage includes input/model tokens and can exceed the output limit. Store secrets in n8n credentials, never in this repository or code nodes.
6. Check workflow timezone and Schedule Trigger. The template uses Sunday 9 a.m. `America/New_York`; change these deliberately for your location. Daylight saving follows the named timezone.

## Test before scheduling

Start with readers and calculation nodes, checking loads, reps, dates, session groups, and training blocks. Then run the manual path end to end. This sends selected fitness evidence to OpenRouter/the chosen model provider and creates a new Notion review page.

The AI input includes selected recent exercise evidence, aggregate findings, body-weight evidence, and data-quality context. Earlier raw workout history remains inside n8n; only an optional selected aggregate longer finding is added to the model input. Card values are calculated independently of AI.

Verify the cards, high-level summary, coaching bullets, weight statement, and destination. With insufficient longer history, expect no 8-/12-week workout commentary. Missing weight data can still produce its separately defined evidence message.

Publish/activate after verifying a manual run. The imported JSON has been structurally checked and its code tested locally; a fresh-instance import has not been tested in a separate n8n environment.

Every successful run creates a new page. Repeated tests can create duplicates; this template has no deduplication guard or failure notification workflow.
