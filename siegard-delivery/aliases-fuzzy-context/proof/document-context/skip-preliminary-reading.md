---
target: backend
implementation: sha256:0d73332ff3f812676c7104910a970af18945d9abaec231e64fb2773c4b806c98
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-skip-preliminary-reading-suite-2
title: Proof for skipping the preliminary reading and recording why
summary: Tests that a v5 extraction over one chunk or over more than 100000 UTF-16 code units makes no preliminary reading, records single-chunk or too-long, still reads every chunk in order with its metadata and previous-chunk tail, and that v1 to v4 record nothing.
tests:
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes no preliminary reading and records the document context status single-chunk for a v5 raw information of 1 chunk
  proves: '"Under v5, an extraction over a raw information of 1 chunk makes no preliminary reading." and "Under v5, an extraction over a raw information of 1 chunk records the document context status single-chunk." Both are in this one scenario, and the outcome object shows which half failed.'
  fails_when: a v5 run over 1 chunk makes a model call to read the whole document, or leaves document_context_status as anything but single-chunk (null, produced, too-long, failed).
  demonstrates: scenarios/knowledge-base/single-chunk-document-has-no-context
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: reads the one chunk of a v5 raw information of 1 chunk
  proves: 'UNDERDETERMINED entry 2: the single-chunk path "reads its chunks as before", so the one chunk is shown to the model.'
  fails_when: the implementation records single-chunk and makes no preliminary reading but never reads the chunk, so it proposes nothing.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes no preliminary reading of a v5 raw information of 3 chunks whose content is 100001 characters
  proves: '"Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading." The content is one unit past the limit.'
  fails_when: a v5 run over several chunks makes a preliminary reading when its content is 100001 UTF-16 code units, for example because the limit check is >= instead of >, or the too-long path is gone.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
  proves: '"Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long." Also the fact of rules/knowledge-base/document-context-status-recorded whole, over every runnable combination. One chunk within the limit and one chunk past it both give single-chunk. Three chunks at exactly 100000 units give produced, and one unit past gives too-long. Three chunks of 100001 UTF-16 code units but only 50017 code points give too-long (UNDERDETERMINED entry 1). A failing reading gives failed.'
  fails_when: any row gets another status. That includes single-chunk losing precedence over length, an off-by-one at the limit, the limit counted in Unicode code points instead of UTF-16 code units, too-long not recorded, or the produced or failed status dropped.
  demonstrates: rules/knowledge-base/document-context-status-recorded
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: reads every chunk of a v5 raw information whose content exceeds 100000 characters, whether it holds 3 chunks or 1
  proves: '"Under v5, an extraction whose content exceeds 100000 characters reads every chunk." Both the several-chunk and the one-chunk class are covered.'
  fails_when: the skip path returns early or stops the chunk loop, so any chunk of an over-the-limit content is never shown to the model.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: reads the chunks of a v5 raw information past 100000 characters in index order
  proves: 'UNDERDETERMINED entry 3, order part: rules/knowledge-base/extraction-reads-chunks-in-order, "one at a time in index order", on the too-long path.'
  fails_when: the too-long path reads the chunks in an order other than 1, 2, 3, for example 1, 3, 2, or reads two of them at the same time.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: shows every chunk the source's type, document date, title and reception time on a v5 run that skipped its preliminary reading
  proves: 'UNDERDETERMINED entry 3, metadata part: each chunk is shown the source''s type, document date, title and reception time, on both skip paths (single-chunk and too-long).'
  fails_when: on either skip path, any chunk's prompt lacks the source type, the document date, the title or the reception time.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: shows the second chunk of a v5 run past 100000 characters the last 200 characters of the first chunk and no more
  proves: 'UNDERDETERMINED entry 3, tail part: the chunk before is shown as its last 200 characters, on the too-long path. The 201st character from the end is shown not to be included.'
  fails_when: the too-long path shows no previous-chunk tail, a tail shorter than 200, or one longer than 200.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: shows the second chunk of a v5 run past 100000 characters the last 200 Unicode code points of the first chunk when they are astral
  proves: 'UNDERDETERMINED entry 3, tail part, as rules/knowledge-base/extraction-reads-chunks-in-order states the unit: "the last 200 Unicode code points of the chunk before it". The boundary where code points and UTF-16 units differ is exercised.'
  fails_when: the tail is cut by UTF-16 code units, so a chunk ending in astral characters shows the next chunk only 100 of its last 200 code points. It is red today (see contested).
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes no preliminary reading and records no document context and no status under v1 to v4 whatever the chunk count and content length
  proves: '"Under v4, an extraction records no document context status." Also the fact of rules/knowledge-base/no-document-context-before-v5 whole (UNDERDETERMINED entry 4): under v1, v2, v3 and v4 and for 1 chunk, 3 chunks within the limit and 3 chunks past it, no reading, no document context and no status.'
  fails_when: under any prompt version before v5 a preliminary reading is made, a document context is stored, or a status is recorded. That includes single-chunk or too-long recorded because the skip branch lost its version guard.
  demonstrates: rules/knowledge-base/no-document-context-before-v5
not_applicable:
- edge_case: absent or empty content of the raw information
  why: no criterion and no node states behavior for an empty content. The skip decision reads only the chunk count, the content length and the prompt version, and an empty content is one more value inside the "at most 100000 units" class.
- edge_case: two extractions of one run at the same time
  why: no criterion or node states concurrent behavior for the skip paths. The single-run guard (run.status must be running) belongs to the run lifecycle, not to this task.
- edge_case: the model or the store failing on the skip paths
  why: the skip paths make no model call. A failing status write is an inference of the implementation, listed under untested.
- edge_case: a duplicate status write
  why: no node states uniqueness of a status write. The retry and re-run behavior is an inference, listed under untested.
untested:
- 'domain/knowledge-base/llm-run: the aggregate''s shape (attributes, relationships, operations) is declared by earlier tasks. This task only writes one attribute through an existing repository function and changes no shape. No finite test of this task decides the aggregate whole.'
- 'domain/knowledge-base/document-context-status: the enumeration (produced, single-chunk, too-long, failed) is already decided whole by the existing test "accepts produced, single-chunk, too-long and failed and nothing else" in src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts, written for task/document-context/record-document-context. A second test over the same four values would be redundant, so no demonstrates is claimed here.'
- 'rules/knowledge-base/document-context-read-first: its complement, a multi-chunk content of at most 100000 units read once before the first chunk, is delivered and tested by the preliminary-reading task''s existing tests in the same spec file. This task adds no reading. Its boundary row (3 chunks at exactly 100000 units gives produced) is exercised only indirectly, in the status table. No demonstrates is claimed, to avoid a second test of the same fact.'
- 'rules/knowledge-base/extraction-reads-chunks-in-order: the order, metadata and tail clauses are tested on the skip paths above. The clause "the run''s document context when it holds one" belongs to task/document-context/chunk-prompt-shows-context and retry-reuses-document-context. No single finite test here decides the fact whole, so no demonstrates is claimed. The entry-3 check against that task found its criteria cover only runs holding a context, and its own UNDERDETERMINED note says the chunk order is pinned by nothing. Neither answers the skip path, so these tests were written here.'
- 'REMAINDER of the task: the read-once-before-the-first-chunk clause and the reach of both rules to versions after v5. No prompt version after v5 is registered (the prompt registry holds v1 to v5), so "v5 and later" cannot be exercised beyond v5. The ADVISORY on branching by equality with v5 versus major >= 5 is unobservable today and is left without a test. The produced and failed clauses are exercised only as rows of the status table.'
- 'Inference, behavior: a raw information of zero chunks records no status under v5. No node decides zero chunks, so no test pins it.'
- 'Inference, behavior: re-running a skipped extraction rewrites the same status, and a run already holding a document context keeps its stored status. Nothing in the nodes states retry behavior for the skip paths (retry-reuses-document-context owns it), so no test pins it.'
- 'Inference, behavior: a failure while writing the skipped status fails the extraction. No node states tolerance or intolerance for that write, so no test pins it.'
- 'Inference, arrangement and emitted text: the log event name document_context_reading_skipped and its fields. Names and log lines are arrangement, so no test pins them.'
contested:
- what: src/modules/ingestion/service/extraction.service.ts builds the previous-chunk tail with chunk.text.slice(-PREV_TAIL_CHARS), which counts 200 UTF-16 code units.
  why: rules/knowledge-base/extraction-reads-chunks-in-order says "the last 200 Unicode code points of the chunk before it". For a chunk ending in astral characters the implementation shows 100 of them where the node requires 200. The test "shows the second chunk of a v5 run past 100000 characters the last 200 Unicode code points of the first chunk when they are astral" states the node and is expected to fail until the tail is cut by code points. The code is untouched by this task, and the chunk-prompt-shows-context task states the same measure as "200 characters".
---

## What it is

Tests that a v5 extraction over one chunk or over more than 100000 UTF-16 code units makes no preliminary reading, records single-chunk or too-long, still reads every chunk in order with its metadata and previous-chunk tail, and that v1 to v4 record nothing.

## Notes

Red run run/document-context-skip-preliminary-reading-suite failed on the astral previous-chunk tail test; the diagnosis read cause code and the implementer cut the tail by code points; green on suite-2.
