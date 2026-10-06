---
target: backend
title: Proof of rules/knowledge-base/extraction-asks-for-other-names
summary: 'One test decides the node: under every held prompt version from v5 on, a single instruction block of the system text sent by one extraction carries the whole ask. A second test checks the judging helper against the two shapes the criterion and the UNDERDETERMINED entry name.'
implementation: sha256:395910d6e37675c2b6648c33ae6638c396e8600f0373f19d564dacacfe42ca2d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-asks-for-other-names-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  name: sends under every held prompt version from v5 on one instruction that asks, with each node, for every other name the text gives that entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  proves: The criterion, quoted. For each held version from v5 on, one extraction is run against stand-ins for the store and the model, and the system text it sends is captured. One instruction block of that text asks for the other names proposed with each node to be names the text itself gives for that same entity. The same block gives an acronym, a short name and another spelling as examples. The same block excludes a pronoun alone and a role alone. The UNDERDETERMINED entry is proved by the "asks for every other name" part, which fails over an instruction asking for at most one other name. Each part is reported under its own key, so a failure names the missing part and the version.
  fails_when: Any of eight parts is missing from the best-matching instruction block of the system text sent under any held version from v5 on. The parts are asking for every (or all) other names, tying the ask to each node, asking for names the text itself gives that entity, the acronym example, the short name example, the another-spelling example, the pronoun-alone exclusion, and the role-alone exclusion. A part that appears only in another block of the prompt does not count. The test also fails if v5 stops being held, if the extraction sends no system text, or if the ask is capped at one other name.
  demonstrates: rules/knowledge-base/extraction-asks-for-other-names
- file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  name: judges a prompt whose pronoun and role exclusions sit in another block than the ask as missing a part of the single instruction
  proves: The criterion's clause "even if the same words appear elsewhere in the prompt". A synthetic prompt has the ask and the three examples in one block and the pronoun and role exclusions in a separate block. The judge reports exactly the pronoun exclusion and the role exclusion as missing. This protects the discriminating power of the first test, which no test over the real prompt can show while the real prompt is correct.
  fails_when: The judge accepts words spread across different blocks as one instruction, or counts the exclusions in the other block towards the block carrying the ask.
- file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  name: judges a prompt asking for at most one other name per node as missing a part of the single instruction
  proves: The UNDERDETERMINED entry. The implementation it names is a prompt reading "With each node you may propose one other name, which must be a name the text itself gives for that entity, such as an acronym, a short name or another spelling, never a pronoun or a role alone". That prompt meets every assertion of the criterion and is refused by the rule. The judge reports exactly "asks for every other name" as missing.
  fails_when: The judge accepts an instruction that asks for one other name where the rule asks for every other name, so that the first test could no longer fail over that implementation.
not_applicable:
- edge_case: Absent or empty input (a document with no chunk, an empty catalog)
  why: The obligation concerns the fixed text of the system prompt, which does not vary with the document. The only input that matters is the prompt version, covered by the held versions.
- edge_case: Prompt versions before v5
  why: The node binds v5 and later. A test that no earlier version asks for other names would assert something no obligation states. The existing v5 spec already holds that and it is not repeated here.
- edge_case: A version above v5 (none is held today)
  why: The test discovers held versions from the registry, so a later version is covered automatically. It is not asserted to exist, because the held set may legitimately grow.
- edge_case: Dependency failure, slowness or concurrent runs
  why: The model and the store are stand-ins that only capture the request. No obligation states behavior of the extraction when they fail.
untested:
- The unit of "a single instruction". Neither the criterion nor the node defines it. The test reads it as one contiguous block of the system text, delimited by blank lines or markdown headings. The implementation spreads the ask, the examples and the exclusions over one heading and three bullets in one block. The ADVISORY in the task's Notes asks the reviewer to confirm this reading. A prompt written as separate blocks per bullet would fail the test even though the rule's words might still hold.
- Whether the model, given this prompt, in fact proposes every other name, and does not propose a pronoun or a role alone. The node states what the extraction asks for, and the test decides the text of the ask only. The model's behavior is not decided by any finite test and needs a real model provider.
- That the "never invent one" and "when the text gives no other name, send no aliases" lines are held. No criterion or node states them; they are the implementation's own and are not pinned.
divergences:
- cites: MNT-03
  file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  departure: The harness that runs one extraction against a stand-in pool and model (row fixtures, the query answerer and the capturing client) repeats the one in src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts.
  why: The proof task allowed only new files and no edit to an existing test file. That file exports no helper, so the only way to share the harness was to edit it. The copy is trimmed to what capturing the system text needs.
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  departure: The file sits in src/__tests__/unit/ingestion/ and does not mirror the unit's path under prompts/.
  why: It follows the neighbouring specs of the same prompts (extraction-prompt-v5.spec.ts and extraction-prompt-held-versions.spec.ts), which all sit there. Moving one file would split the suite across two layouts.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
