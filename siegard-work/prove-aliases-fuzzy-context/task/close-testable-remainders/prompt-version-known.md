---
title: Proof of prompt-version-known
summary: A test that decides the fact of rules/knowledge-base/prompt-version-known as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/prompt-version-known stops holding in the delivered code.
criteria:
- One input, one expected result. Start an extraction run with a prompt version the system does not hold, through whatever path creates the run. Expect a refusal, and expect no LLM run to be recorded with that version.
implements:
- rules/knowledge-base/prompt-version-known
stands:
- src/modules/ingestion/prompts/index.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/prompt-version-known.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The criterion tests one creation path ("through whatever path creates the run"). rules/knowledge-base/prompt-version-known states, with no qualification by path, "An extraction's prompt version MUST be one of the prompt versions the system holds." The criterion has one input and one expected result, so a test that exercises a single path cannot show that every path which creates or sets an extraction's prompt version enforces the invariant. Passes: An implementation where the tested path to start an extraction run refuses a prompt version the system does not hold and records no LLM run, while a second path records an LLM run with that same unheld prompt version. One example of a second path is a one-shot ingestion that creates its run on the server. Another is any operation that sets or changes a run's prompt version after the run is created.
UNDERDETERMINED, from the specification — Under the criterion as written, a refused attempt can still leave an LLM run recorded with no prompt version, or with a different one. The criterion only excludes a run recorded with the unheld version. rules/knowledge-base/prompt-version-known requires every extraction's prompt version to be one the system holds, so it also refuses a run whose prompt version is missing or was swapped. Passes: An implementation that refuses the start request but still persists an LLM run whose prompt version is null, or is replaced by a default, so no recorded run carries the unheld version.
