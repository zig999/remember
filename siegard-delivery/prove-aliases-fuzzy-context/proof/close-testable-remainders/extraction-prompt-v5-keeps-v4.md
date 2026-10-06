---
target: backend
title: Proof that the v5 extraction prompt keeps every v4 instruction line over the remaining catalog shapes
summary: One new spec file compares each trimmed v4 system-prompt line with the whole lines of the v5 system prompt over seven catalogs, each of a shape the existing rich-catalog test leaves out. Whole-line comparison is chosen, which settles the underdetermined entry.
implementation: sha256:0007844da020f40f187861e17473bdb1af0d6d8025ee27e74decd067dfdaa06d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-prompt-v5-keeps-v4-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
  name: keeps every instruction line of the v4 system prompt as a whole, unaltered line of the v5 system prompt, over a catalog of each shape the rich-catalog comparison leaves out
  proves: 'The task criterion, quoted: "Run the same line-containment comparison of v4 against v5 over more catalogs, one per catalog shape the current test leaves out: a non-temporal link type, a link type allowing several current values, a link type requiring neither valid_from nor valid_to on change, an attribute key of each other value type, an attribute key with no valid values, a node type without a description, and an empty catalog. For each catalog the expected result is that no v4 instruction line is missing from v5." The result is a record keyed by shape, so a failure names the catalog shape that lost a line. It also proves the UNDERDETERMINED entry: the comparison is by whole trimmed line, not by substring. A v5 prompt that turns a v4 line such as "Never invent a date." into "Never invent a date, except when the document gives none." is therefore reported missing. The test also fails when the v4 prompt yields no lines, so it cannot pass vacuously over an empty v4 prompt.'
  fails_when: For any of the seven catalogs, v5's system() leaves out, rewrites, narrows or extends within the line any non-blank line of v4's system() for that catalog. Examples are v5 no longer composing the v4 system prompt, or a v4 instruction line gaining a qualifying clause on the same line. The test also fails if v4's system() returns no lines for one of the catalogs.
  demonstrates: rules/knowledge-base/extraction-prompt-v5-keeps-v4
not_applicable:
- edge_case: absent catalog (null or undefined) passed to system()
  why: The catalog parameter is typed non-optional, and no criterion or node states behavior for an absent one. A test would assert a refusal nobody specified.
- edge_case: duplicate catalog names (two node types, link types or keys with one name)
  why: Neither the criterion nor the node mentions uniqueness. buildSnapshot collapses duplicates before the prompt sees them, so the prompt keeps v4's lines whatever the duplicates.
- edge_case: a dependency that fails or is slow, and concurrent calls
  why: system() is a pure string builder over an in-memory snapshot, with no dependency and no state.
- edge_case: boundaries of a stated range
  why: The criterion states no range. The catalog shapes it names are classes of input, each given one representative.
- edge_case: v4 instruction lines in the user prompt
  why: The node and the criterion speak of the extraction system prompt only.
untested:
- The fact of rules/knowledge-base/extraction-prompt-v5-keeps-v4 is stated over every catalog and none enumerates them. The test decides the seven shapes the remainder names. Together with the existing rich-catalog and two-type catalog tests, that is every shape the task lists. A catalog outside them is not enumerated, and the part of the node's fact beyond them is not decided by any finite test.
- A catalog loaded from a real Postgres through loadCatalog is not exercised. The instruction forbids connecting to a database. The tests build catalogs with buildSnapshot, which is the same snapshot type loadCatalog returns.
- The implementation record states no behavior inference, so none is left unproven.
contested:
- what: The criterion says "the same line-containment comparison" as "the current test", but the delivered suite has two comparisons that differ. extraction-prompt-v5.spec.ts checks whitespace-squashed v4 lines as substrings of v5, and extraction-prompt-v5-keeps-v4's sibling extraction-prompt-held-versions.spec.ts checks trimmed v4 lines as whole lines of v5.
  why: This is the underdetermined entry. I wrote the whole-line comparison, because the node ("contains every instruction ... v4 contains") excludes a narrowed instruction and the substring comparison lets one pass. The existing substring test in extraction-prompt-v5.spec.ts therefore protects less than the node states. I did not touch that file. I record the disagreement and do not resolve it.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
  departure: The file sits flat in src/__tests__/unit/ingestion/, beside the existing prompt specs, and does not mirror src/modules/ingestion/prompts/extraction.v5.ts under a prompts subdirectory.
  why: Every existing prompt spec sits in that flat directory. A mirrored subdirectory for one file would split the prompt suite across two layouts.
- cites: TST-07
  file: src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
  departure: The test checks the invariant by confirming it holds. It does not violate the invariant and expect a refusal.
  why: Violating it needs a stand-in v5 prompt that drops a line. That would reimplement the rule inside the suite, which TST-03 forbids. The invariant states a containment, not a refusal, so no violating implementation exists to run against.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
