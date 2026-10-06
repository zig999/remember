---
title: Proof of extraction-asks-for-other-names
summary: A test that decides the fact of rules/knowledge-base/extraction-asks-for-other-names as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/extraction-asks-for-other-names stops holding in the delivered code.
criteria:
- For each held version from v5 on, run one extraction and capture the system text it sends. Assert that a single instruction does all of the following. It asks for the other names proposed with each node to be names the text itself gives for that same entity. It gives an acronym, a short name and another spelling as examples of such names. It excludes a pronoun alone and a role alone from them. The test should fail when any one of these is missing from that instruction, even if the same words appear elsewhere in the prompt.
implements:
- rules/knowledge-base/extraction-asks-for-other-names
stands:
- src/modules/ingestion/prompts/extraction.v5.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/extraction-asks-for-other-names.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/extraction-asks-for-other-names says the extraction asks the model to propose "every other name the text gives the same entity". The criterion checks only that the proposed names must be names the text gives for that entity. It never checks that the instruction asks for every such name. The "every" clause therefore reaches no assertion. Passes: A v5+ extraction prompt with one instruction like "with each node you may propose one other name, which must be a name the text itself gives for that entity, such as an acronym, a short name or another spelling, never a pronoun or a role alone". It meets every assertion of the criterion. The rule refuses it, because the rule asks for every other name and this prompt asks for at most one.
ADVISORY, from the specification — The criterion requires the request, the examples and the exclusion to sit in one instruction. It also requires the test to fail when the same words are spread across the prompt. rules/knowledge-base/extraction-asks-for-other-names does not say "one instruction". It states the fact as one sentence, one ask carrying its examples and its exclusion, which supports the criterion's reading. A prompt that splits the ask across adjacent sentences would fail this proof, even though one could argue the rule's words still hold for it. The reviewer should confirm that this reading of the statement is what is intended.
ADVISORY, from the specification — The criterion runs "for each held version from v5 on". Which prompt versions are held, and how they are ordered, is not stated by the candidate. It belongs to domain/knowledge-base/prompt-version (and the run to domain/knowledge-base/llm-run), which the rule constrains but which are not in the candidate set. If the executor needs either one to list the versions, the epic's claim has to grow to include it.
Decision, beyond the covers — stand: domain/knowledge-base/llm-run is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/extraction-asks-for-other-names alone, so the claim does not grow.
Decision, beyond the covers — stand: domain/knowledge-base/prompt-version is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/extraction-asks-for-other-names alone, so the claim does not grow.
