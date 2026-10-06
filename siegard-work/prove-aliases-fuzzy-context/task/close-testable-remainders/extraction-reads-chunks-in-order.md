---
title: Proof of extraction-reads-chunks-in-order
summary: A test that decides the fact of rules/knowledge-base/extraction-reads-chunks-in-order as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/extraction-reads-chunks-in-order stops holding in the delivered code.
criteria:
- An extraction over raw information whose received_at differs from the run's started_at shows received_at, and not started_at, in every chunk prompt.
- An extraction of a multi-chunk run that holds no document context (a v4 run, or one whose preliminary reading failed) never has two chunk model calls in flight at the same time.
implements:
- rules/knowledge-base/extraction-reads-chunks-in-order
stands:
- src/modules/ingestion/prompts/extraction.v1.ts
- src/modules/ingestion/prompts/extraction.v5.ts
- src/modules/ingestion/service/extraction.service.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/extraction-reads-chunks-in-order.
The implementation stands in the files under `stands` and is not changed.

## Notes
REMAINDER, from the specification — Most clauses of the statement in rules/knowledge-base/extraction-reads-chunks-in-order reach neither criterion. Those clauses are: reading the chunks in index order; reading them one at a time when the run holds a document context; showing each chunk the source's type, document date and title; showing the last 200 Unicode code points of the chunk before it; and showing the run's document context when the run holds one. The criteria cover only two clauses: the reception time, and reading one at a time when the run holds no document context. The other clauses are already proved by an existing test, which a recorded certification marks partial. If they are dropped from that proof, a sequential reverse-order reading, or a prompt missing the title or the tail, would satisfy both criteria here. Belongs: The existing proof certified (state partial) in siegard-reconcile/aliases-fuzzy-context-3.md: test "reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one" in src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
ADVISORY, from the specification — The first criterion names the fields received_at and started_at. The candidate rules/knowledge-base/extraction-reads-chunks-in-order says only "reception time". The fields are declared in domain/knowledge-base/raw-information (received_at) and in domain/knowledge-base/llm-run (started_at). The rule constrains domain/knowledge-base/llm-run. Neither node is in the candidate set. The criterion equates "reception time" with raw-information's received_at and sets it against the run's started_at. That equation can be checked only against nodes outside the candidates. If the epic's claim should hold them, the caller can grow it.
Decision, beyond the covers — stand: domain/knowledge-base/llm-run is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/extraction-reads-chunks-in-order alone, so the claim does not grow.
Decision, beyond the covers — stand: domain/knowledge-base/raw-information is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/extraction-reads-chunks-in-order alone, so the claim does not grow.
