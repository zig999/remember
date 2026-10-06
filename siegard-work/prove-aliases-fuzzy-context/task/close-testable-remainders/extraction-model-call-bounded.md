---
title: Proof of extraction-model-call-bounded
summary: A test that decides the fact of constraints/extraction-model-call-bounded as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of constraints/extraction-model-call-bounded stops holding in the delivered code.
criteria:
- 'Input: a chunk extraction call to the run model that gets a retryable error (for example 529 overloaded) on every attempt. Expected: that call is attempted at most three times, meaning it is retried at most twice, counted for that chunk alone.'
implements:
- constraints/extraction-model-call-bounded
stands:
- src/modules/ingestion/service/extraction.service.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for constraints/extraction-model-call-bounded.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The statement of constraints/extraction-model-call-bounded makes two claims: "A call to the language model for extraction waits at most five minutes and is retried at most twice." The task's only criterion tests the retry bound. Nothing tests the five-minute wait bound. The objective says the test must fail whenever "the fact of constraints/extraction-model-call-bounded stops holding", which covers both claims, so the wait bound is a requirement that no criterion checks. The summary limits the test to "the record's remainder". If the wait bound was already proven elsewhere, that record should show it. This binding cannot see it. Passes: Delivered code that calls the language model for extraction with no timeout, or with a timeout longer than five minutes, and retries a call that keeps failing with a retryable error at most twice. It passes the criterion as written, but constraints/extraction-model-call-bounded refuses it.
ADVISORY, from the specification — The criterion's input describes "a chunk extraction call to the run model" and counts attempts "for that chunk alone". The candidate constraints/extraction-model-call-bounded talks only about "a call to the language model for extraction". It never says that extraction makes one call per chunk. That fact comes from nodes outside the candidate set, such as rules/knowledge-base/extraction-reads-chunks-in-order and contracts/knowledge-base/ingestion. The retry bound still holds per call as the candidate states it. But the way the test builds its input depends on a fact this task does not implement against. If the test must rely on per-chunk calls, the epic's claim needs to grow to include those nodes.
Decision, beyond the covers — stand: contracts/knowledge-base/ingestion is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of constraints/extraction-model-call-bounded alone, so the claim does not grow.
