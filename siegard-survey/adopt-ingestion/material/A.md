---
contract_version: siegard-survey/0-prototype
target: backend
files:
  - src/modules/ingestion/hash.ts
  - src/modules/ingestion/index.ts
  - src/modules/ingestion/service/affected-nodes.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
  - src/modules/ingestion/service/entity-resolution.service.ts
  - src/modules/ingestion/service/extraction.service.ts
  - src/modules/ingestion/service/graph-consolidation.service.ts
  - src/modules/ingestion/service/ingestion.service.ts
  - src/modules/ingestion/service/llm-run.service.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/service/propose-fragment.service.ts
  - src/modules/ingestion/service/propose-link.service.ts
  - src/modules/ingestion/service/propose-node.service.ts
  - src/modules/ingestion/service/propose.types.ts
read_outside_area:
  - src/modules/ingestion/validation/structural.ts — to learn the codes and details raised by `assertFound`, `assertKnownType`, `parseAttributeValue` and `assertValueInDomain`, which the propose services call.
  - src/modules/ingestion/validation/confidence.ts — to learn the thresholds behind `routeConfidence`, which propose_link and propose_attribute branch on.
---

## Facts

### Content hash and run idempotency key
- A source's content hash is the SHA-256 of its content encoded as UTF-8, written as 64 lowercase hex characters. `src/modules/ingestion/hash.ts` (`sha256Hex`).
- A run's idempotency key is the SHA-256 (lowercase hex) of the content hash, prompt version, model and chunking version joined in that order with no separator. `src/modules/ingestion/hash.ts` (`composeIdempotencyKey`).

### Ingesting a source (ingestRawInformation)
- It computes the content hash and the idempotency key first. The chunking version is the module constant, not something the caller supplies. `src/modules/ingestion/service/ingestion.service.ts` (`ingestRawInformation`, `CHUNKING_VERSION`).
- It stores the source with its source type, content, content hash, metadata and original input (null when absent). The original input plays no part in the content hash. `src/modules/ingestion/service/ingestion.service.ts` (`insertRawInformation` call).
- If a source with the same content hash already exists, the call writes nothing new and returns the existing source's id and content hash, `chunk_count` equal to the number of chunks already stored for it, an empty `chunks` list, and the run found by the *newly computed* idempotency key. The answer has status 200 and outcome `noop_existing`. `src/modules/ingestion/service/ingestion.service.ts` (`noopExisting`, `countChunks`).
- A new source is split into chunks after it is stored. The chunks are stored, then a run is opened with the model, prompt version, the source's id and the idempotency key. The answer has status 201 and outcome `created`, with the source id, content hash, chunk count, each chunk's `{id, chunk_index, offset_start, offset_end}`, the run id and the idempotency key. `src/modules/ingestion/service/ingestion.service.ts` (`ingestRawInformation`).
- This area has no code path that updates a stored source. `src/modules/ingestion/service/ingestion.service.ts` (whole file).

### Reading a source and its chunks
- Reading a source by id returns the stored source, or refuses when it does not exist. `src/modules/ingestion/service/ingestion.service.ts` (`getRawInformationById`).
- Listing a source's chunks first checks that the source exists, so an unknown source is told apart from a source with no chunks. The answer is `{ total, items }`, where `total` is the number of rows returned (no pagination). `src/modules/ingestion/service/ingestion.service.ts` (`listChunksByRawInformationId`).

### Run lifecycle (llm-run.service)
- Reading a run returns id, model, prompt_version, started_at, finished_at (null while open), status, attempts, input_raw_information_id, idempotency_key and a summary of tool-call outcomes. `src/modules/ingestion/service/llm-run.service.ts` (`getLlmRunById`, `toLlmRunResponse`).
- `affected_nodes` is attached only when the run's status is `completed`. It is taken from the cache or rebuilt from the run's tool calls. If rebuilding fails, the field is left out. An empty list is a valid value and is kept. `src/modules/ingestion/service/llm-run.service.ts` (`getLlmRunById`, `toLlmRunResponse`).
- Listing recent ingestions returns, per source: raw_information_id, source_type, raw_status, received_at, content_preview, and the run's id, status, started_at, finished_at, prompt_version and model. The run fields are nullable. Order and preview length come from the repository, outside this area. `src/modules/ingestion/service/llm-run.service.ts` (`listRecentIngestions`).
- Listing a run's tool calls checks that the run exists, then returns `{ total, limit, offset, items }`. Each item is id, llm_run_id, tool_name, arguments, result, validation_outcome, created_at. `total` is counted separately from the page. `src/modules/ingestion/service/llm-run.service.ts` (`listToolCallsByLlmRun`).
- Only a run in status `failed` can be retried. The run is read first, then updated atomically on condition that it is `failed`. The answer is the updated run with its summary. `src/modules/ingestion/service/llm-run.service.ts` (`retryLlmRun`).
- Closing a run moves it to `completed` or `failed` and returns the run with its summary. `src/modules/ingestion/service/llm-run.service.ts` (`closeLlmRun`).

### Proposing a fragment (proposeFragmentService)
- Every cited chunk must exist and must belong to the source of the current run. When the count of matching chunks is short, the service counts existence alone to tell a missing chunk from one belonging to another source. `src/modules/ingestion/service/propose-fragment.service.ts` (lines 45–76).
- The fragment is stored with the run id, its text, its confidence and its chunk ids, and is returned as `{ fragment_id, status: "proposed" }`. `src/modules/ingestion/service/propose-fragment.service.ts` (lines 79–90).

### Proposing a node (proposeNodeService, resolveOrCreateNode)
- The node type must be in the catalog. It is checked before any resolution. `src/modules/ingestion/service/propose-node.service.ts` (lines 48–53).
- Resolution runs under a transaction-scoped advisory lock keyed on node-type id + `\x1F` + norm(name), taken before any read of aliases. `src/modules/ingestion/service/entity-resolution.service.ts` (lines 119–128).
- Step 1: an alias whose normalized form equals norm(name), on an active node of the same type, reuses that node (`matched_existing`). `src/modules/ingestion/service/entity-resolution.service.ts` (lines 131–151).
- Step 2: up to 10 candidates are taken. Each is an active node of the same type with an alias trigram-similar (`%`) to norm(name). Each node's score is its highest alias similarity, sorted descending with no tie-breaker. `src/modules/ingestion/service/entity-resolution.service.ts` (lines 156–171).
- The decision ignores candidates scoring below 0.55. With none left, a new active node is created (`created_new`). `src/modules/ingestion/service/entity-resolution.service.ts` (`MATCH_FLOOR`, `decideFromCandidates`).
- Exactly one candidate at or above 0.85, with no other at or above 0.55, reuses that node (`matched_existing`). `src/modules/ingestion/service/entity-resolution.service.ts` (`MATCH_STRONG`, `decideFromCandidates`).
- Any other case with at least one candidate at or above 0.55 creates a new node in status `needs_review`. It records one entity-match review row (node, candidate, similarity) per candidate at or above 0.55, ignoring duplicates, and returns `needs_review`. `src/modules/ingestion/service/entity-resolution.service.ts` (lines 186–217).
- A newly created node (active or needs_review) receives its name as alias kind `canonical`, plus every supplied alias as kind `alias`. All are recorded with the run id and duplicates are ignored. `src/modules/ingestion/service/entity-resolution.service.ts` (`attachCanonicalAndAliases`).
- A reused node (exact or strong match) receives only the supplied aliases. The proposed name is not added as an alias. `src/modules/ingestion/service/entity-resolution.service.ts` (lines 143–150, 178–183).
- The answer is `{ node_id, resolution }`. `src/modules/ingestion/service/propose-node.service.ts` (lines 67–71).

### Proposing a link (proposeLinkService)
- The checks run in this order: link type in catalog (line 68) → source node exists (78) → target node exists (87) → every cited fragment exists (109) → every cited fragment belongs to this run (116) → graph rule for the source-type/link-type/target-type triple, evaluated at now (128) → temporal validation (156) → confidence (168) → every fragment anchored to the run's source chunks (181). `src/modules/ingestion/service/propose-link.service.ts`.
- Cited fragments are compared by row count against the length of the list, so a repeated fragment id counts as missing. `src/modules/ingestion/service/propose-link.service.ts` (line 109).
- The temporal layer receives the source's `metadata.document_date` and `received_at`. The link is stored with the valid_from and basis that layer resolves, while valid_to is stored exactly as the caller gave it. `src/modules/ingestion/service/propose-link.service.ts` (lines 143–165, 209–211).
- Confidence of 0.75 or more makes a new row `active`. From 0.40 up to 0.75 makes it `uncertain`. Below 0.40 nothing is written and the answer is `{ ok: true, result: { link_id: null, outcome: "rejected", reason: "BELOW_CONFIDENCE_FLOOR" } }`. This check runs before the anchoring check. `src/modules/ingestion/service/propose-link.service.ts` (lines 168–178); `src/modules/ingestion/validation/confidence.ts`.
- The answer is `{ link_id, outcome }`, plus `superseded_link_id` when consolidation superseded a row. The conflicting row's id from a dispute is not returned. `src/modules/ingestion/service/propose-link.service.ts` (lines 224–232).

### Proposing an attribute (proposeAttributeService)
- The checks run in this order: node exists (line 54) → attribute key known for the node's type (64) → the key's node type matches the node's type (74) → value parses as the key's value type (83) → value is in the key's closed domain, only when the key has one (93–96) → cited fragments exist (108) → fragments belong to this run (115) → temporal (147) → confidence (159) → anchoring (170). `src/modules/ingestion/service/propose-attribute.service.ts`.
- How each value type parses: `date` must match `YYYY-MM-DD` and be a real calendar date. `number` must match `-?\d+(\.\d+)?` and be finite. `bool` must be exactly `true` or `false`. `text` accepts any value. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- The closed-domain check is an exact string match, with no trimming or case folding. `src/modules/ingestion/validation/structural.ts` (`assertValueInDomain`).
- Below 0.40 confidence the answer is `{ ok: true, result: { attribute_id: null, outcome: "rejected", reason: "BELOW_CONFIDENCE_FLOOR" } }`. The active/uncertain split for new rows is the same as for links. `src/modules/ingestion/service/propose-attribute.service.ts` (lines 159–167, 186–187).
- The answer is `{ attribute_id, outcome }`, plus `superseded_attribute_id` when a row was superseded. The conflicting row's id is not returned. `src/modules/ingestion/service/propose-attribute.service.ts` (lines 211–222).

### Graph consolidation (consolidateLink, consolidateAttribute)
- A type is functional when it does not allow multiple current values. `src/modules/ingestion/service/graph-consolidation.service.ts` (`consolidateLinkOnce`, `consolidateAttributeOnce`).
- A row counts as current (vigent) when valid_to is null and superseded_at is null, whatever its status. It is locked FOR UPDATE, and only the first row returned is used, with no ordering. `src/modules/ingestion/service/graph-consolidation.service.ts` (`lockVigent*`).
- Links: a functional link type looks up the current row by (source, link type). A multi-valued one looks up by (source, link type, target). `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 509–523).
- Attributes: a functional key looks up by (node, key). A multi-valued one looks up by (node, key, value). `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 756–770).
- The branches are tried in a fixed order: re-affirmation → correction → succession → dispute → accept as new. `src/modules/ingestion/service/graph-consolidation.service.ts` (`consolidateLinkOnce`, `consolidateAttributeOnce`).
- Link re-affirmation: same target and change_hint `none`, and also the same valid_from when the type is functional. It adds provenance to the current row and returns `consolidated` with that row's id. `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 549–556).
- Attribute re-affirmation: same value, same valid_from and change_hint `none`, whether or not the key is functional. It returns `consolidated`. `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 777–784).
- Correction: change_hint `correction` whenever a current row exists, for functional and multi-valued types alike. The current row gets superseded_at = now and status `superseded`, with valid_to untouched. A new row is inserted pointing back to it through supersedes_*. The outcome is `accepted`, with the superseded id. `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 562–583, 787–805).
- Succession applies to functional types only. It needs a different target (links) or a different value (attributes), and either change_hint `succession` or a succession marker in any cited fragment's text (case-insensitive substring). `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 588–614, 808–831, `hasSuccessionSignal`).
- Succession closes the current row with status `superseded` and valid_to = the new row's valid_from, or today when the new row has none. When the current row's own valid_from is on or after that date, it instead leaves valid_to alone and sets superseded_at = now. A new row pointing back to it is inserted, and the outcome is `superseded_previous`. `src/modules/ingestion/service/graph-consolidation.service.ts` (`closeVigentForSuccession`).
- Dispute is what remains for a functional type with a current row. The current row's status becomes `disputed`, and a new row is inserted with status `disputed` and no back-pointer. The outcome is `disputed`. So a functional link with the same target but a different valid_from, or with change_hint `succession` and the same target, is a dispute. `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 628–649, 834–851).
- Accept as new: a new row with status `active` or `uncertain` (from confidence), no back-pointer, outcome `accepted`. A multi-valued current row that matches no earlier branch also reaches this insert. `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 652–659, 857–863).
- A new link row stores source, target, link type, valid_from, valid_to, status, confidence, valid_from basis, the creating run and supersedes_link_id. An attribute row stores node, key, value type, value, the same temporal fields, status, confidence, basis, run and supersedes_attribute_id. `src/modules/ingestion/service/graph-consolidation.service.ts` (`insertLinkRow`, `insertAttributeRow`).
- Every branch records one provenance row per cited fragment on the row it targets, ignoring duplicates. It then moves those fragments from `proposed` to `accepted`. Fragments in any other status are untouched. `src/modules/ingestion/service/graph-consolidation.service.ts` (`insertLinkProvenance`, `insertAttributeProvenance`, `promoteFragmentsToAccepted`).
- If the insert hits the current-row duplicate guard, the attempt is rolled back to a savepoint and retried once. A second hit refuses. `src/modules/ingestion/service/graph-consolidation.service.ts` (`consolidateLink`, `consolidateAttribute`).

### Affected nodes of a run
- These outcomes add to the list: a successful propose_node (any resolution) adds its node. A successful propose_link with outcome accepted, consolidated, superseded_previous or disputed adds source_node_id and target_node_id, when present in the result. A successful propose_attribute with the same outcomes adds node_id, when present. Refusals, `rejected` outcomes and other tools add nothing. `src/modules/ingestion/service/affected-nodes.ts` (`affectedIdsFromEnvelope`, `isContributingOutcome`).
- Ids are de-duplicated with the first entry kept, in insertion order. `src/modules/ingestion/service/affected-nodes.ts` (`createAffectedNodeCollector`).
- Each id resolves to `{ id, canonical_name, node_type }` in input order. A node merged into another resolves to its survivor, following one hop. Ids not found are skipped silently. The list is de-duplicated again after resolution. `src/modules/ingestion/service/affected-nodes.ts` (`resolveAffectedNodes`).
- Rebuilding the list replays the run's tool calls (created_at, then id ascending). Every call with a non-null result is treated as a success. `src/modules/ingestion/service/affected-nodes.ts` (`deriveAffectedNodes`).

### LLM extraction of a run (runLlmExtraction)
- Before extracting: the run must exist (checked first), its source must exist, and then its status must be `running`. `src/modules/ingestion/service/extraction.service.ts` (`loadRunContext` lines 826–840; status check line 424).
- The prompt module is chosen by the run's prompt version, inside the failure-handling scope. `src/modules/ingestion/service/extraction.service.ts` (line 455).
- Chunks are processed one by one. Each prompt carries source_type, document_date and title (from metadata, where an empty string becomes null), received_at, the chunk text, and the last 200 characters of the previous chunk. `src/modules/ingestion/service/extraction.service.ts` (`loadRunContext`, `PREV_TAIL_CHARS`, lines 492–494).
- The model is offered four tools: propose_fragment, propose_node, propose_link, propose_attribute. `chunk_ids` is removed from the propose_fragment schema, and the orchestrator replaces any chunk ids with the current chunk. `src/modules/ingestion/service/extraction.service.ts` (`buildTools`, `dispatchToolUse`).
- The run's model is used, with adaptive thinking and the prompt module's max_tokens. `src/modules/ingestion/service/extraction.service.ts` (`runChunkLoop` lines 628–635).
- How a chunk ends: `end_turn` finishes it. `refusal` skips it softly. `pause_turn` resends the same messages. A response with no tool use finishes it. After 64 turns it finishes softly. `src/modules/ingestion/service/extraction.service.ts` (`runChunkLoop`).
- Every tool use in a response is dispatched in order, and all results go back as one user turn. A result is marked as an error when the call was refused. `src/modules/ingestion/service/extraction.service.ts` (lines 688–746).
- A tool input that fails schema validation, or an unknown tool name, is answered without calling any propose handler. `src/modules/ingestion/service/extraction.service.ts` (`dispatchToolUse`).
- Within one chunk, three consecutive system-level refusals (`SYSTEM_*`), or ok results whose outcome is `error`, end the run. Any other result resets the count. `src/modules/ingestion/service/extraction.service.ts` (`FATAL_ERROR_BURST`, lines 704–740).
- On success the run is closed `completed`, and the answer is the run with its summary and affected_nodes. If resolving affected nodes fails, the answer carries an empty list. `src/modules/ingestion/service/extraction.service.ts` (lines 524–570, `readFinalRun`).
- On every fatal path the run is closed `failed` before the refusal, and the refusal carries the partial run. A failure to close is swallowed. `src/modules/ingestion/service/extraction.service.ts` (lines 482–521, `closeRunSafe`).

### Directed ingestion (directedIngestionService)
- Input: `fragments` (at least 1; `ref` 1–120 chars, `text` 1–1000). `nodes` (at least 1; `ref`, `node_type` min 1, `name` 1–500, optional `node_id` UUID, optional `aliases` each 1–500). Optional `attributes` and `links`. Optional `source_label` of 1–200 chars. `src/modules/ingestion/service/directed-ingestion.service.ts` (`DirectedIngestionInputSchema` and item schemas).
- Attribute items: `node_ref`, `key`, `value` (a string of 1–2000 chars, a finite number, or a boolean), `evidence_ref`, and optional valid_from/valid_to (`^\d{4}-\d{2}-\d{2}$`), valid_from_basis and change_hint. Link items carry source_ref, link_type, target_ref, evidence_ref and the same optional temporal fields. `src/modules/ingestion/service/directed-ingestion.service.ts` (`DirectedAttributeItemSchema`, `DirectedLinkItemSchema`).
- The source content is built as one line per fragment, `[ref] text`, then `-- source_label=<label>` when a label is given, then `-- directed_at=<ISO> nonce=<uuid>`. Every call therefore gets a unique content hash. `src/modules/ingestion/service/directed-ingestion.service.ts` (`synthesiseContent`).
- The source is stored with source type `chat`, metadata `{directed: true}` plus source_label, conversation_id and message_id when present, and original_input from the chat excerpt (null otherwise). Its run is opened with model `directed` and prompt version `directed-v1`. No LLM is called. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 338–368).
- Items are dispatched grouped by kind, in the order fragments → nodes → attributes → links, each group in input order. The report follows that same grouped order. `src/modules/ingestion/service/directed-ingestion.service.ts` (Step 3).
- Every fragment is proposed with confidence 1.0 and anchored to the first chunk. On success its ref maps to the fragment id and the report status is `accepted`. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 472–494).
- If two items share a ref, the later mapping replaces the earlier one. `src/modules/ingestion/service/directed-ingestion.service.ts` (`refToFragmentId.set`, `refToNodeId.set`).
- A node with `node_id` skips resolution. The node must exist and be `active`. Its node_type, name and aliases are ignored, and its type is not compared with `node_type`. Success is reported `accepted` with resolution `matched_existing`. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 514–555, `verifyNodePin`).
- A node without `node_id` goes through propose_node. It is reported `needs_review` when the resolution is needs_review, and `accepted` otherwise, always with its resolution. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 557–582).
- An attribute or link whose node or evidence ref did not resolve is reported `dependency_failed` with the first missing ref as `reason`, and nothing is dispatched for it. The attribute check order is node_ref, then evidence_ref. The link order is source_ref, target_ref, evidence_ref. `src/modules/ingestion/service/directed-ingestion.service.ts` (`checkCascade`, `checkLinkCascade`).
- Attributes and links are proposed with confidence 1.0. valid_from_basis defaults to `stated` and change_hint to `none`. Attribute values become strings: booleans become `true`/`false`, numbers use `String(n)`. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 628–638, 708–718, `canonicaliseAttributeValue`).
- The report status for an attribute or link is its outcome. A refusal becomes `error` when its code starts with `SYSTEM_` and `rejected` otherwise, and the code, message and details are carried along. `src/modules/ingestion/service/directed-ingestion.service.ts` (`mapLinkOutcomeToStatus`, `classifyEnvelopeFailureStatus`).
- Report keys: an attribute is keyed `<node_ref>.<key>` and a link `<source_ref>-><link_type>-><target_ref>`. `src/modules/ingestion/service/directed-ingestion.service.ts` (`refForAttribute`, `refForLink`).
- The run is always closed `completed`, and a failure to close is swallowed. The answer is `{ outcome: "ingested", raw_information_id, llm_run_id, chunk_count, run{…status:"completed", affected_nodes}, report, summary }`. The summary counts items per kind and per status. `src/modules/ingestion/service/directed-ingestion.service.ts` (Steps 4–6, `buildSummary`).
- If the closed run cannot be read back, started_at and finished_at are the epoch and attempts is 1. `src/modules/ingestion/service/directed-ingestion.service.ts` (`readClosedRunSafe`).
- Report status `uncertain` is never produced: consolidation outcomes are accepted, consolidated, superseded_previous and disputed, and fragments and nodes never map to uncertain. `src/modules/ingestion/service/directed-ingestion.service.ts` (`DirectedItemStatus`); `src/modules/ingestion/service/graph-consolidation.service.ts` (`ConsolidateOutcome`).
- When the call is refused after intake (because the source already existed, or intake produced no chunks), the run opened during intake is not closed. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 405–447).

## Answers
- ingestRawInformation — a source with the same content hash already exists → 200, outcome `noop_existing` (not a refusal). `src/modules/ingestion/service/ingestion.service.ts` (`noopExisting`).
- ingestRawInformation — same content hash but no run matches the new idempotency key (for example, the same content under a different model or prompt version) → internal invariant error; its HTTP mapping is outside this area. `src/modules/ingestion/service/ingestion.service.ts` (`noopExisting` lines 215–222).
- ingestRawInformation — chunking yields no chunks, or the run's idempotency key collides → internal invariant error. `src/modules/ingestion/service/ingestion.service.ts` (lines 140–145, 168–173).
- getRawInformationById / listChunksByRawInformationId — source unknown → 404 `RESOURCE_NOT_FOUND` (entity `raw_information`, id). `src/modules/ingestion/service/ingestion.service.ts` (`ResourceNotFoundError`).
- getLlmRunById / listToolCallsByLlmRun / retryLlmRun / closeLlmRun — run unknown → 404 `RESOURCE_NOT_FOUND` (entity `llm_run`). `src/modules/ingestion/service/llm-run.service.ts`.
- retryLlmRun — run not `failed`, or the status changed between the read and the update → 409 `BUSINESS_RUN_NOT_RETRYABLE` (currentStatus `running` or `completed`; when a racing re-read shows `failed`, it reports `running`). `src/modules/ingestion/service/llm-run.service.ts` (`retryLlmRun`).
- propose-* REST mirrors — run exists but is not running → 409 `BUSINESS_RUN_NOT_RUNNING` (currentStatus `completed` or `failed`). The sentinel is defined here and raised outside this area. `src/modules/ingestion/service/llm-run.service.ts` (`RunNotRunningError`).
- proposeFragmentService — a chunk id does not exist → `RESOURCE_NOT_FOUND` (chunk_ids). `src/modules/ingestion/service/propose-fragment.service.ts` (line 62).
- proposeFragmentService — every chunk exists but one belongs to another source → `VALIDATION_INVALID_FORMAT` (chunk_ids, expected_raw_information_id). `src/modules/ingestion/service/propose-fragment.service.ts` (line 68).
- proposeNodeService — node type not in the catalog → `BUSINESS_UNKNOWN_NODE_TYPE` (kind, name). `src/modules/ingestion/service/propose-node.service.ts`; `src/modules/ingestion/validation/structural.ts` (`assertKnownType`).
- proposeLinkService — link type unknown → `BUSINESS_UNKNOWN_LINK_TYPE` (kind, name), checked first (line 68). `src/modules/ingestion/service/propose-link.service.ts`.
- proposeLinkService — source or target node missing → `RESOURCE_NOT_FOUND` (entity `knowledge_node`, id), source before target. `src/modules/ingestion/service/propose-link.service.ts` (lines 82, 91).
- proposeLinkService / proposeAttributeService — a cited fragment is missing, or an id is repeated → `RESOURCE_NOT_FOUND` (fragment_ids). `src/modules/ingestion/service/propose-link.service.ts` (line 110); `src/modules/ingestion/service/propose-attribute.service.ts` (line 109).
- proposeLinkService / proposeAttributeService — a fragment belongs to another run → `VALIDATION_INVALID_FORMAT` (fragment_id, llm_run_id). `src/modules/ingestion/service/propose-link.service.ts` (line 117); `src/modules/ingestion/service/propose-attribute.service.ts` (line 116).
- proposeLinkService — the graph rule refuses → a code raised in `validateGraphRule`, outside this area. `src/modules/ingestion/service/propose-link.service.ts` (line 128).
- proposeLinkService / proposeAttributeService — the temporal layer refuses → a code raised in `validateTemporal`, outside this area. `src/modules/ingestion/service/propose-link.service.ts` (line 156); `src/modules/ingestion/service/propose-attribute.service.ts` (line 147).
- proposeLinkService / proposeAttributeService — confidence below 0.40 → ok, outcome `rejected`, reason `BELOW_CONFIDENCE_FLOOR`, id null. This comes before the anchoring check. `src/modules/ingestion/service/propose-link.service.ts` (line 169); `src/modules/ingestion/service/propose-attribute.service.ts` (line 160).
- proposeLinkService / proposeAttributeService — fragments not anchored to the run's source → `VALIDATION_INVALID_FORMAT` (fragment_ids, expected_raw_information_id). `src/modules/ingestion/service/propose-link.service.ts` (line 186); `src/modules/ingestion/service/propose-attribute.service.ts` (line 175).
- proposeAttributeService — node missing → `RESOURCE_NOT_FOUND` (entity `knowledge_node`, id), checked first (line 54). `src/modules/ingestion/service/propose-attribute.service.ts`.
- proposeAttributeService — key unknown for the node's type → `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` (kind, name). `src/modules/ingestion/service/propose-attribute.service.ts` (line 64).
- proposeAttributeService — the key's node type differs from the node's → `VALIDATION_INVALID_FORMAT` (node_id, key). `src/modules/ingestion/service/propose-attribute.service.ts` (line 75).
- proposeAttributeService — value does not parse as its type → `VALIDATION_INVALID_FORMAT` (value, value_type; the calendar and finite-number failures give value only). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- proposeAttributeService — value outside a closed domain → `VALIDATION_INVALID_FORMAT` "attribute value not in closed domain" (value, allowed_values sorted). `src/modules/ingestion/validation/structural.ts` (`assertValueInDomain`).
- consolidateLink / consolidateAttribute — the duplicate guard is hit again on the retry → `SYSTEM_INTERNAL_ERROR` (scope `knowledge_link` / `node_attribute`). `src/modules/ingestion/service/graph-consolidation.service.ts` (lines 469, 732).
- runLlmExtraction — run unknown → 404 `RESOURCE_NOT_FOUND`, checked first. `src/modules/ingestion/service/extraction.service.ts` (line 828).
- runLlmExtraction — the run's source is missing → internal invariant error, before the status check. `src/modules/ingestion/service/extraction.service.ts` (line 835).
- runLlmExtraction — run not `running` → 409 `BUSINESS_RUN_NOT_RUNNABLE` (llmRunId, currentStatus). The run is left as it is. `src/modules/ingestion/service/extraction.service.ts` (line 424).
- runLlmExtraction — three consecutive system errors within one chunk → run `failed`, 500 `SYSTEM_INTERNAL_ERROR` (partialRun). `src/modules/ingestion/service/extraction.service.ts` (lines 482–489).
- runLlmExtraction — Anthropic SDK error (name starting "Anthropic", or `__anthropic`) → run `failed`, 502 `SYSTEM_LLM_PROVIDER_UNAVAILABLE` (partialRun). `src/modules/ingestion/service/extraction.service.ts` (lines 499–511).
- runLlmExtraction — any other exception, including an unknown prompt version → run `failed`, 500 `SYSTEM_INTERNAL_ERROR` (partialRun). `src/modules/ingestion/service/extraction.service.ts` (lines 513–520).
- extraction tool dispatch — tool input fails its schema → `VALIDATION_INVALID_FORMAT` "Input failed Zod parse." (issues[{path, message}]), returned to the model. `src/modules/ingestion/service/extraction.service.ts` (`zodErrorEnvelope`).
- extraction tool dispatch — unknown tool name → `VALIDATION_INVALID_FORMAT` (tool_name). `src/modules/ingestion/service/extraction.service.ts` (`dispatchToolUse` default).
- directedIngestionService — input fails its schema → `VALIDATION_INVALID_FORMAT` "Input failed Zod parse." (issues[{path, message}]), before anything is written. `src/modules/ingestion/service/directed-ingestion.service.ts` (line 309).
- directedIngestionService — intake fails with the database unavailable → `SYSTEM_SERVICE_UNAVAILABLE`; any other intake failure → `SYSTEM_INTERNAL_ERROR`. `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 369–391).
- directedIngestionService — intake found an existing source → `SYSTEM_INTERNAL_ERROR` (raw_information_id, llm_run_id). `src/modules/ingestion/service/directed-ingestion.service.ts` (line 405).
- directedIngestionService — intake produced no chunks → `SYSTEM_INTERNAL_ERROR` (raw_information_id, llm_run_id). `src/modules/ingestion/service/directed-ingestion.service.ts` (line 429).
- directedIngestionService, a node given by id that does not exist → report item `rejected`, `RESOURCE_NOT_FOUND` (node_id, reason `not_found`). `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 539–552).
- directedIngestionService, a node given by id that is not active → report item `rejected`, `VALIDATION_INVALID_FORMAT` (node_id, reason `inactive`, current_status). `src/modules/ingestion/service/directed-ingestion.service.ts` (lines 539–552).

## Vocabularies
- Ingest outcome: `created`, `noop_existing`. `src/modules/ingestion/service/ingestion.service.ts`.
- Run status: `running`, `completed`, `failed`. `src/modules/ingestion/service/extraction.service.ts` (`RunNotRunnableError`).
- Node resolution: `matched_existing`, `created_new`, `needs_review`. `src/modules/ingestion/service/entity-resolution.service.ts`.
- Node status written on creation: `active`, `needs_review`. `merged_into` is read when resolving affected nodes. `src/modules/ingestion/service/entity-resolution.service.ts`; `src/modules/ingestion/service/affected-nodes.ts`.
- Alias kind: `canonical`, `alias`. `src/modules/ingestion/service/entity-resolution.service.ts`.
- Consolidation outcome: `accepted`, `consolidated`, `superseded_previous`, `disputed`. Link and attribute proposals can also answer `rejected`. `src/modules/ingestion/service/graph-consolidation.service.ts`; `src/modules/ingestion/service/propose-link.service.ts`.
- Assertion status written: `active`, `uncertain`, `disputed`, `superseded`. `src/modules/ingestion/service/graph-consolidation.service.ts`.
- Fragment status: `proposed` on creation, changed to `accepted`. `src/modules/ingestion/service/propose-fragment.service.ts`; `src/modules/ingestion/service/graph-consolidation.service.ts`.
- change_hint: `none`, `succession`, `correction`. valid_from basis: `stated`, `document`, `received`. `src/modules/ingestion/service/graph-consolidation.service.ts` (`ConsolidateLinkArgs`).
- Attribute value type: `date`, `number`, `text`, `bool`. `src/modules/ingestion/service/graph-consolidation.service.ts`.
- Succession markers: `deixou de`, `passou a`, `novo`, `nova`, `substituiu`, `substituido`, `substituido por`, `succeeded`, `replaced`. `src/modules/ingestion/service/graph-consolidation.service.ts` (`SUCCESSION_MARKERS`).
- Confidence routes: `active` (≥0.75), `uncertain` (0.40 up to 0.75), `below_floor` (<0.40); rejection reason `BELOW_CONFIDENCE_FLOOR`. `src/modules/ingestion/validation/confidence.ts`; `src/modules/ingestion/service/propose-link.service.ts`.
- Directed item kind: `fragment`, `node`, `attribute`, `link`. `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Directed item status: `accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error`, `dependency_failed`. `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Directed sentinels: model `directed`, prompt_version `directed-v1`, directed outcome `ingested`, source type `chat`. `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Pin rejection reasons: `not_found`, `inactive`. `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Refusal codes raised in this area: `VALIDATION_INVALID_FORMAT`, `RESOURCE_NOT_FOUND`, `BUSINESS_UNKNOWN_NODE_TYPE`, `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`, `BUSINESS_RUN_NOT_RUNNABLE`, `BUSINESS_RUN_NOT_RETRYABLE`, `BUSINESS_RUN_NOT_RUNNING`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`, `SYSTEM_LLM_PROVIDER_UNAVAILABLE`. Service files; `src/modules/ingestion/validation/structural.ts`.
- Extraction stop reasons handled: `end_turn`, `refusal`, `pause_turn`, and anything else treated as tool use. `src/modules/ingestion/service/extraction.service.ts`.

## Upstream artifacts
- Tables written: `raw_information`, `raw_chunk`, `llm_run` (via the repository), `information_fragment`, `knowledge_node`, `node_alias`, `entity_match_review`, `knowledge_link`, `node_attribute`, `provenance`. Service files.
- Tables read: `tool_call` (tool_name, result, validation_outcome) and `node_type` (name). `src/modules/ingestion/service/affected-nodes.ts`.
- Source metadata keys read: `document_date`, `title`. Keys written: `directed`, `source_label`, `conversation_id`, `message_id`. `src/modules/ingestion/service/extraction.service.ts`; `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Database function `norm()`, and pg_trgm `similarity` and `%` (the `%` match threshold is set by the database, not by this code). `src/modules/ingestion/service/entity-resolution.service.ts`.
- Postgres SQLSTATE `23505` and the constraint names `knowledge_link_current_dup_guard` and `node_attribute_current_dup_guard`, plus the repository's content-hash and idempotency-key constraints. `src/modules/ingestion/service/graph-consolidation.service.ts`; `src/modules/ingestion/service/ingestion.service.ts`.
- Anthropic Messages API: `stop_reason`, `tool_use` content blocks (id, name, input), `usage`, and SDK error names starting with `Anthropic`. `src/modules/ingestion/service/extraction.service.ts`.
- Catalog snapshot: nodeTypeByName, linkTypeByName, attributeKeyByNodeTypeAndKey, `allows_multiple_current`, `requires_valid_from`, `value_type`, closed domains. `src/modules/ingestion/service/propose-*.service.ts`.

## Outside the domain
- Module re-exports and route/MCP registration wiring. `src/modules/ingestion/index.ts`.
- Envelope type shapes `McpOk`, `McpErr` and `RunContext`. `src/modules/ingestion/service/propose.types.ts`.
- Affected-node LRU cache (capacity 256, process-scoped). `src/modules/ingestion/service/affected-nodes.ts`.
- Anthropic timeout (5 min), maxRetries 2, prompt-cache breakpoint on the system block, per-turn usage logging. `src/modules/ingestion/service/extraction.service.ts`.
- Savepoint names and transaction/connection handling (`withTransaction`, `closeRunSafe`). `src/modules/ingestion/service/graph-consolidation.service.ts`; `src/modules/ingestion/service/directed-ingestion.service.ts`.
- Log event names (`directed_ingestion_*`, `extraction_*`, `run_completed`). Service files.
- Test seams and `__testing__` exports. Service files.

## Observed and not decided here
- Affected nodes from links and attributes: the collector reads `source_node_id`/`target_node_id` and `node_id` from the result (`src/modules/ingestion/service/affected-nodes.ts`, `affectedIdsFromEnvelope`), but the propose_link and propose_attribute results carry none of these fields (`src/modules/ingestion/service/propose-link.service.ts` lines 224–231; `src/modules/ingestion/service/propose-attribute.service.ts` lines 211–221). The directed path adds those ids before recording (`src/modules/ingestion/service/directed-ingestion.service.ts` lines 647–653, 727–736). The extraction path records the raw result (`src/modules/ingestion/service/extraction.service.ts` line 702), and so does rebuilding from tool calls (`affected-nodes.ts`, `deriveAffectedNodes`). So link and attribute endpoints count as affected on the directed path, while on the extraction and rebuilt paths only proposed nodes count. That holds unless stored tool-call results carry the ids, which is outside this area.
- A directed fragment is reported with status `accepted` (`src/modules/ingestion/service/directed-ingestion.service.ts` line 492), but it is stored as `proposed` (`src/modules/ingestion/service/propose-fragment.service.ts` line 88).
- Re-affirmation differs between links and attributes: a multi-valued link consolidates whatever its valid_from (`graph-consolidation.service.ts` lines 549–552), while an attribute always needs the same valid_from (lines 777–781). A multi-valued attribute with the same value and a different valid_from matches no branch and reaches the accept-as-new insert (lines 852–858), which is the path that meets the current-row duplicate guard and ends in `SYSTEM_INTERNAL_ERROR` after one retry (lines 724–736).
- The same content under a different model or prompt version: `ingestRawInformation` takes the existing-source path whenever the content hash exists (`ingestion.service.ts` lines 128–129), then looks up a run by the new key and raises an invariant error when there is none (lines 215–222). No new run is ever opened for an existing source, although the key's composition changes with model and prompt version (`hash.ts`, `composeIdempotencyKey`).
