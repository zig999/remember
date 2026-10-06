---
target: backend
title: Proof of extraction-anchors-to-read-chunk
summary: Three tests show that a propose_fragment call dispatched while reading chunk 2 reaches the proposal handler anchored to chunk 2 alone, however the model names chunks or fails to name any.
implementation: sha256:2f7a3c42f5ab105035784196ae60a4170d43a27af252463809ae03cfc8062d46
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-anchors-to-read-chunk-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  name: anchors each of two fragments to the chunk being read alone, whether the model names that chunk and another of the same raw information or only a chunk of a different raw information
  proves: 'The criterion, quoted. "Two fragments, each proposed while reading chunk 2. One names chunk 2 and chunk 3. The other names a chunk of a different raw information. Expected result: each fragment is anchored to chunk 2 alone, [[chunk 2], [chunk 2]]." The test dispatches both fragments through the extraction dispatch with chunk 2 as the chunk being read and asserts that the chunk ids handed on to the proposal handler are exactly [[chunk 2], [chunk 2]].'
  fails_when: Any chunk id the model named reaches the proposal handler. That covers chunk 3 added beside chunk 2, the other raw information's chunk kept or substituted, or a fragment anchored to anything other than chunk 2 alone.
  demonstrates: rules/knowledge-base/extraction-anchors-to-read-chunk
- file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  name: anchors a fragment that names only another chunk of the same raw information to the chunk being read
  proves: UNDERDETERMINED entry 1. A fragment naming only chunk 3, which belongs to the raw information being read, while chunk 2 is read is anchored to chunk 2, not to chunk 3.
  fails_when: The implementation anchors each fragment to the first named chunk that belongs to the raw information being read, and falls back to the chunk being read only when none does. That implementation hands [chunk 3] on for this input, and the criterion's own two fragments never expose it.
- file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  name: anchors a fragment that names no chunk to the chunk being read
  proves: UNDERDETERMINED entry 2. A fragment for which the model names no chunk at all is still anchored to the chunk being read.
  fails_when: The implementation anchors to the chunk being read only when the model names at least one chunk. For this input it would hand on no anchor, or a refusal for a missing chunk_ids, instead of [chunk 2].
not_applicable:
- edge_case: The model names the same chunk twice, or an empty chunk_ids list.
  why: They sit in the same class as the cases already covered, since whatever the model names is replaced by the chunk being read. A second representative of that class proves the same thing and would only duplicate the evidence.
- edge_case: A chunk id that is not a valid UUID.
  why: The rule decides what the anchor is whatever the model names, and a malformed id is named and overwritten like any other. Refusal of malformed input belongs to the Zod parse of the DTO, which this task does not implement.
- edge_case: Concurrent fragments proposed while reading the same chunk.
  why: The rule states a per-fragment anchor and no node or criterion states concurrent behavior. A test would assert a guarantee nobody made.
- edge_case: The proposal handler's store write failing, or the run not being in running status.
  why: Those are behaviors of the handler and the store, not of the anchoring rule, and neither the criterion nor the node reaches them. The test replaces the handler, which is the persistence boundary, so no test connects to a database.
untested:
- That the schema shown to the model omits chunk_ids, which buildTool does. The implementation record cites it as part of how the node is held. It is a way of achieving the rule, and no criterion or node states that the model is not shown the field. The node's fact is that the anchor holds whatever the model names, and the tests decide that at the dispatch. A test on the schema would pin the arrangement.
- That the persisted fragment's provenance row carries the chunk being read. The tests decide the anchoring at the boundary where the extraction hands the chunk ids to the proposal handler. They do not reach what the handler writes into the store. Closing that needs a real Postgres, so it is not faked by reimplementing the rule.
- 'That the node''s fact holds over every possible set of chunk ids a model could name. No finite test enumerates that set. The tests state three representatives: chunk 2 with chunk 3, a chunk of another raw information, chunk 3 alone, and nothing named. The node stays demonstrated by the criterion''s own test on the strength of the remainder''s assertion, and the other two tests rule out the two named accidents.'
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
