---
type: invariant
statement: An extraction hands back to the model each proposal call whose arguments parse with the answer the published ingestion contract gives that proposal, a node proposal's answer carrying each proposed alias that was not admitted and its reason.
constrains:
- domain/knowledge-base/llm-run
---

## Description

Governs what the language model is told, within an extraction, about each fragment, node, link and attribute proposal it makes whose arguments parse.
What each proposal answers on acceptance and refusal is stated by contracts/knowledge-base/ingestion; a proposal call whose arguments do not parse is governed by rules/knowledge-base/extraction-malformed-arguments-refused, and a call to a tool outside the four proposals by rules/knowledge-base/extraction-unknown-tool-refused.
