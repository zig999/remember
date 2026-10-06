---
title: Proof of extraction-prompt-v5-keeps-v4
summary: A test that decides the fact of rules/knowledge-base/extraction-prompt-v5-keeps-v4 as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/extraction-prompt-v5-keeps-v4 stops holding in the delivered code.
criteria:
- 'Run the same line-containment comparison of v4 against v5 over more catalogs, one per catalog shape the current test leaves out: a non-temporal link type, a link type allowing several current values, a link type requiring neither valid_from nor valid_to on change, an attribute key of each other value type, an attribute key with no valid values, a node type without a description, and an empty catalog. For each catalog the expected result is that no v4 instruction line is missing from v5.'
implements:
- rules/knowledge-base/extraction-prompt-v5-keeps-v4
stands:
- src/modules/ingestion/prompts/extraction.v5.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/extraction-prompt-v5-keeps-v4.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The criterion says "the same line-containment comparison" as "the current test", but the delivered suite has two such tests and they compare differently. backend/src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts checks that each trimmed v4 line appears as a whole line of v5. backend/src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts checks that each whitespace-squashed v4 line appears as a substring anywhere in the squashed v5 prompt. The criterion does not say which one it means. Under the substring comparison, a v4 instruction still counts as kept when v5 adds text to the same line that qualifies or reverses it. rules/knowledge-base/extraction-prompt-v5-keeps-v4 states "The extraction system prompt of prompt version v5 contains every instruction that the extraction system prompt of prompt version v4 contains", and that excludes an instruction that has been narrowed. Passes: A v5 system prompt in which a v4 instruction line such as "Never invent a date." becomes "Never invent a date, except when the document gives none.". Run over every listed catalog with the substring comparison, no v4 line is reported missing, because the original text is still a substring of the v5 prompt. The v5 prompt nevertheless no longer contains the v4 instruction.
