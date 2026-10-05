---
target: backend
implementation: sha256:bda4fc50bccab1343068518863e3e471376e6fc8d79d3eedb0b4f4ebe0151a40
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-chunk-prompt-shows-context-suite
title: Proof that each chunk is shown the document context
summary: Five tests in one spec file show that a run holding a document context reads its chunks one at a time in index order, each with the context, the source metadata and the 200-code-point tail, and that content and context are presented as data. They also show that a run holding none shows no context, that the João Silva scenario resolves and anchors as stated, and that a fragment is anchored to the chunk being read whatever chunks the model names.
tests:
- file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  proves: 'Criteria "For a run holding a document context, each chunk''s prompt shows the context''s summary.", "... shows each listed entity with its node type and names.", "... shows the same source metadata the v4 prompt shows.", and "... shows the last 200 characters of the chunk before it.", on a v5 run of 3 chunks whose preliminary reading produced a context. Also the fact of rules/knowledge-base/extraction-reads-chunks-in-order whole: one at a time (no model call overlaps another), in index order, with source type, document date, title, reception time, the last 200 Unicode code points of the chunk before, and the run''s context. It covers UNDERDETERMINED entry 1: the tails are astral characters, so a UTF-16 slice(-200) shows only 100 of them, and the 201st code point from the end is shown to be excluded. It covers UNDERDETERMINED entry 3: the observed read order must be 1, 2, 3 and the largest number of model calls in flight must be 1. The failure diff is an object whose keys name the facet that broke (order, concurrency, a missing needle labelled by chunk, or a tail).'
  fails_when: chunks are read in any order but 1, 2, 3, or two chunks are read at the same time; any chunk's prompt lacks the summary, a node type or any name of a listed entity, the source type, the document date, the title or the reception time; or the tail shown is cut by UTF-16 code units, is shorter or longer than 200 code points, or comes from a chunk other than the one before.
  demonstrates: rules/knowledge-base/extraction-reads-chunks-in-order
- file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  name: presents the document content, each chunk's text and the document context shown with each chunk in the user turn, labelled as data and outside the instructions
  proves: 'Criterion "Each chunk''s prompt presents the document context marked apart from its instructions as data." and UNDERDETERMINED entry 2, which holds the chunk text of the same prompt to the same rule. Also the fact of constraints/document-content-is-data whole: the content in the preliminary reading, the text of each of the 3 chunks and the context shown with each chunk are each carried in a user-turn block that is labelled as data, and none appears in the system prompt. Each presented item carries an injection sentence, so one that sat among the instructions would be found there.'
  fails_when: the content of the preliminary reading, the text of any chunk or the context shown with any chunk is placed in the system prompt, or sits in a user-turn block carrying no data label (for example chunk text inline with instructions, or a context block without a data label).
  demonstrates: constraints/document-content-is-data
- file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  name: shows no document context in any chunk prompt of a run that holds none, whether the prompt version predates v5, the raw information has one chunk or the preliminary reading failed
  proves: 'Criterion "For a run holding no document context, each chunk''s prompt shows no document context." One representative per way a run comes to hold none: a v4 run, a v5 run of one chunk (single-chunk skip) and a v5 run of 3 chunks whose reading failed. The chunk counts read are asserted too, so the test cannot pass because no chunk was read.'
  fails_when: a chunk prompt of a run holding no context mentions a document context (a placeholder or empty block included), or a chunk of any of the three shapes is not read.
- file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  name: resolves a proposal named João Silva made while reading chunk 3 to the knowledge node created while reading chunk 1 and anchors the chunk 3 fragment to chunk 3
  proves: 'Criteria "With a context listing João Silva as also called \"o Diretor\", a proposal named \"João Silva\" made while reading chunk 3 resolves to the knowledge node created while reading chunk 1." and "... the fragment proposed while reading chunk 3 is anchored to chunk 3." Also the scenario scenarios/knowledge-base/context-links-later-mention whole: a v5 run of 3 chunks with that context produced by the reading, João Silva proposed at chunk 1, and João Silva plus an approval fragment proposed at chunk 3. The store stand-in answers only the queries the real entity-resolution and propose-fragment code issues. One node exists (created_new, then matched_existing, same id) and the one fragment is anchored to the chunk 3 id. The scenario resolves by name whether or not the context was shown, as the task''s ADVISORY says, so the presence of the context is proved by the first test and not by this one.'
  fails_when: the chunk 3 proposal creates a second node or resolves to anything other than the chunk 1 node (for example chunk 3 read before chunk 1), or the chunk 3 fragment is anchored to any chunk set other than exactly chunk 3.
  demonstrates: scenarios/knowledge-base/context-links-later-mention
- file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  name: anchors the fragment proposed while reading a chunk to that chunk alone, whether the model names no chunk, a later chunk or two earlier chunks
  proves: 'UNDERDETERMINED entry 4 and the fact of rules/knowledge-base/extraction-anchors-to-read-chunk: "anchored to the raw chunk being read, whatever raw chunks the model names". Representatives: a model naming no chunk at chunk 1, naming a later chunk at chunk 2, and naming two earlier chunks at chunk 3. Each fragment must be anchored to exactly its own chunk.'
  fails_when: an extraction anchors a fragment to the chunks the model names, to the union of the named chunks and the read chunk, to the read chunk only when the model names none, or to anything other than exactly the chunk being read.
  demonstrates: rules/knowledge-base/extraction-anchors-to-read-chunk
not_applicable:
- edge_case: absent or empty summary, a context with no entities, an entity with no names
  why: No criterion and no node states what the prompt shows for these. The implementation renders "- (none listed)" for no entities, which is an inference about emitted text and goes to untested. The preliminary-reading task owns what a produced context may hold.
- edge_case: a previous chunk shorter than 200 code points, and the first chunk having no previous chunk
  why: Neither the criterion nor the node says what the tail is below 200 code points or before the first chunk. Both are behavior of the shared v1 user prompt that this task does not change, and a test would pin a fact no node holds.
- edge_case: one chunk and two chunks, the boundaries of the preliminary reading
  why: Owned by the skip-preliminary-reading and preliminary-reading tasks and already proven in their delivered proofs. Here the one-chunk case appears only as one representative of "a run holding no context".
- edge_case: the model or the store failing, a refusal, a pause_turn or a fatal burst while a chunk is read
  why: The orchestrator's failure handling is not changed by this task and is covered by src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts. No criterion here states behavior on failure.
- edge_case: two extractions of the same run at the same time
  why: No criterion or node of this task states concurrent behavior between runs. The only concurrency obligation, chunks of one run not overlapping, is asserted in the first test.
- edge_case: a name or a summary that contains the closing delimiter or a newline
  why: The criteria require the context to be marked apart as data and say nothing about delimiter collisions. The JSON quoting of names is an arrangement inference of the implementation and is not pinned.
- edge_case: prompt versions after v5
  why: The registry holds v1 to v5 only, so no later version can be exercised.
untested:
- 'domain/knowledge-base/document-context and domain/knowledge-base/document-entity: the shape of both value objects is declared in dto/llm-run.dto.ts, which this task does not change. Both are already demonstrated by the delivered proof proof/document-context/record-document-context.md (reads back whole as recorded). This task only renders the values to the model; a second test would be redundant, and "never a source of knowledge" is a negative no finite test decides.'
- 'domain/knowledge-base/llm-run: an aggregate of many attributes, relationships and three operations. This task only reads its document_context and passes it on. No finite test decides the aggregate whole, and the same node is left untested by the earlier tasks'' proofs.'
- 'Inference, behavior and emitted text: where the context block sits (after the source metadata, before the previous-chunk tail and the chunk text), its headings and wording, the per-entity line format, and "- (none listed)" for an empty entity list. No node decides them, and the tests deliberately assert only that the items are present, not their arrangement. One consequence is that no test ties an entity''s node type to its own names on one line; a prompt that listed node types and names apart would pass.'
- 'Inference, behavior: the data marking is done in the user prompt only, and the v5 system prompt does not name the DOCUMENT CONTEXT delimiters (the implementation''s own deferred item). No node states that the system prompt must name them, so the test asserts only the label on the block holding the context and its absence from the system prompt. It does not assert a closing delimiter.'
- 'UNDERDETERMINED entries 1 to 4 are answered by tests written here: entry 1 and entry 3 by the first test, entry 2 by the second and entry 4 by the fifth. The delivered proof proof/document-context/skip-preliminary-reading.md tests the astral tail and the read order only on the skip paths, which does not answer them for a run holding a context.'
- 'ADVISORY, "same source metadata the v4 prompt shows": the test checks the four items the node names (source type, document date, title, reception time) and does not compare against the v4 prompt. It is therefore not measured against a thing that is not a specification node.'
- The João Silva resolution is decided by name by the existing entity-resolution service. The scenario test does not show that the context caused the match (the task's own ADVISORY), and a test that did would need a model that behaves differently with and without the context, which no node specifies.
contested:
- what: The criterion "each chunk's prompt shows the last 200 characters of the chunk before it" and the node, which says 200 Unicode code points.
  why: The tests state the node (code points). The implementation already cuts the tail by code points, so there is no disagreement with the code. The criterion's wording ("characters") is the underdetermined clause and should be corrected to "code points" in the task.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  departure: The spec sits beside the other ingestion unit specs in src/__tests__/unit/ingestion/ and does not mirror the path of one unit under test.
  why: It exercises runLlmExtraction and the v5 user prompt together, and every ingestion spec of the suite already sits in this directory. Mirroring one source path would split this suite across two layouts.
- cites: TST-07
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  departure: The invariants of extraction-reads-chunks-in-order and extraction-anchors-to-read-chunk have tests that try to violate them but expect the guaranteed behavior, not a refusal.
  why: Neither invariant is a refusal. They state what the extraction does by itself, so the anchoring test feeds a model that names the wrong chunks and expects the right anchoring. No input exists that the invariant refuses.
---

## What it is

Five tests in one spec file show that a run holding a document context reads its chunks one at a time in index order, each with the context, the source metadata and the 200-code-point tail, and that content and context are presented as data. They also show that a run holding none shows no context, that the João Silva scenario resolves and anchors as stated, and that a fragment is anchored to the chunk being read whatever chunks the model names.

## Notes

None.
