# Proof increment: three facts a finite test decides, held by delivered code, proven by no test

Each fact below was left by a certification the coverage auditor refused with `remainder: testable`, in the record siegard-reconcile/drift-corrections.md (review of the drift-corrections initiative).

## rules/knowledge-base/expansion-decay

Record: siegard-reconcile/drift-corrections.md
File where the fact is held: backend/src/modules/query-retrieval/service/search.service.ts
Assertion, verbatim:

Input: one matched node scored s, a link whose target is that node, and a further link walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times s at hop 2.

## domain/knowledge-base/search-item

Record: siegard-reconcile/drift-corrections.md
File where the fact is held: backend/src/modules/query-retrieval/service/search.service.ts
Assertion, verbatim:

Three assertions would close it. (1) A search whose matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag values, including the expected one. (2) For every item of each kind, each provenance entry should name an information fragment that exists in the world and supports that item. (3) A matched node for which no supporting fragment exists, against the expected result that no item is answered with an empty provenance.

## rules/knowledge-base/extraction-relative-date-falls-back-to-reception

Record: siegard-reconcile/drift-corrections.md
File where the fact is held: backend/src/modules/ingestion/prompts/extraction.v4.ts
Assertion, verbatim:

Two assertions would close it. First, call `selectPromptModule("v4").user` with metadata whose `document_date` is a real date, for example 2026-05-10. Expect the metadata block to contain `- document_date: 2026-05-10`, next to the existing assertion for the null case. Second, take `selectPromptModule("v4").system(snapshot)`, the module a v4 extraction is given. Expect it to contain a directive whose subject is a relative date in the chunk, resolved against `document_date` when present and otherwise against the date portion of `received_at`.
