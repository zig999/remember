# Ingestion -- Business Specification

> Version: 1.0.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml` (REST) + MCP toolset `ingest` (§14.1 of `segundo-cerebro-modelagem-v7.md`)
>
> Normative source: `segundo-cerebro-modelagem-v7.md` (§3.1, §3.2, §3.5, §8, §9, §11, §13, §14.1).
> Schema: `migrations/0001_schema.sql` + `migrations/0002_seed.sql`.

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Receive unstructured documents, persist them immutably, slice them deterministically into chunks, and drive the LLM-driven extraction of structured fragments under full audit. |
| Core entity | `RawInformation` (with `RawChunk`, `InformationFragment`, `LLMRun`, `ToolCall` as its dependent rows). |
| Bounded context | Source layer (§3.1), extraction layer (§3.2) and extraction audit (§3.5). Owns end-to-end ingestion (§9) and the MCP `ingest` toolset (§14.1). |
| Out of scope | Consolidation rules into the graph (`KnowledgeNode`/`KnowledgeLink`/`NodeAttribute`/`Provenance`), retrieval (§7), curation (§10) and compliance deletion (§11). See §8 of this spec. |

---

## 2. Actors

> Single-owner model (§2.3, A20). No `User` entity. Authentication is the access gate (§2.5, A29).

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner (SPA user) | The data owner, authenticated by Supabase Auth. Reads raw documents, chunks, runs and the tool-call audit through the REST endpoints of this domain. | `ingestRawInformation`, `getRawInformationById`, `listRawChunksByRawInformation`, `getLlmRunById`, `listToolCallsByLlmRun`, `retryLlmRun`. |
| LLM (extractor) | The LLM driving extraction inside an active `LLMRun`, addressed via the MCP `ingest` toolset. Cannot touch the database directly (inviolable rule, §2). | MCP tools: `propose_fragment`, `propose_node`, `propose_link`, `propose_attribute` -- only inside the run identified by the ambient `llm_run_id`. |
| BFF (service layer) | Internal — not an external actor. Performs layered validation (§13) and persists. Listed here for clarity: `ingestRawInformation` is typically called by an LLM orchestrator process that has a JWT, then the LLM drives the MCP tools against the opened run. |

> Every REST and MCP call requires a valid Supabase Auth JWT verified in BFF middleware. The Supabase service key never leaves the BFF; PostgreSQL RLS is disabled (A29).

---

## 3. Use Cases

> Each UC: actor, pre/post, main flow + alternative flows, related endpoint.

### UC-01 -- Ingest a new raw document

**Actor:** Owner (typically through the LLM orchestrator process holding a JWT)
**Pre:** Owner is authenticated. `content` is a non-empty UTF-8 string ≤ 10 MiB.
**Post:** `RawInformation` row exists; its chunks (per `chunking_version = 'v1'`) exist; an `LLMRun` is opened in status `running` with `attempts = 1`; the response carries `raw_information_id`, `content_hash`, the new chunk identifiers, `llm_run_id` and `idempotency_key`.

**Main flow:**
1. Owner POSTs the document body, metadata, model identifier and prompt version.
2. BFF validates the request (Zod: structural layer, §13.1).
3. BFF computes `content_hash = sha256(content)` (hex, lowercase, 64 chars).
4. BFF inserts `RawInformation` (relies on the `UNIQUE (content_hash)` to detect collisions).
5. BFF runs the deterministic chunker `v1` (§9.2, BR-04 ... BR-07) and persists every `RawChunk` row in the same transaction as step 4.
6. BFF computes `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` (A18, BR-08).
7. BFF inserts `LLMRun` (`status = 'running'`, `attempts = 1`, `input_raw_information_id`, `idempotency_key`). The `UNIQUE (idempotency_key)` constraint guards against duplicate runs.
8. BFF returns `201 Created` with `outcome = "created"` and the persisted identifiers.

**Alternative flows:**
- `1a` Request misses a required field (`source_type`, `content`, `model` or `prompt_version`) -> BFF returns `422 VALIDATION_REQUIRED_FIELD` (no DB write).
- `1b` `source_type` is not one of the enum members of §3.1 -> BFF returns `422 VALIDATION_INVALID_FORMAT` (no DB write).
- `1c` `content` exceeds 10 MiB -> BFF returns `422 VALIDATION_OUT_OF_RANGE` (no DB write).
- `1d` Request arrives without a valid JWT -> middleware returns `401 AUTH_UNAUTHORIZED` before any DB access (cf. acceptance C16, §17 of v7).
- `4a` A `RawInformation` with the same `content_hash` already exists (UNIQUE violation in step 4) -> BFF aborts the insert, re-reads the existing row, and looks up the existing `LLMRun` by the recomputed `idempotency_key`. If found and not `failed`, returns `200 OK` with `outcome = "noop_existing"` and the existing identifiers; no new chunks or run are created (§8, BR-09). If the existing `LLMRun` is in status `failed`, UC-06 (`retryLlmRun`) is the supported path -- this endpoint still returns `200 noop_existing` with the failed run's identifiers; the caller must invoke retry explicitly.
- `5a` Chunker raises an internal error -> BFF rolls back the entire transaction (no `RawInformation`, no chunks) and returns `500 SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `ingestRawInformation`

---

### UC-02 -- Retrieve a raw document by id

**Actor:** Owner
**Pre:** Owner is authenticated.
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/ingest/raw-information/{rawInformationId}`.
2. BFF returns the row verbatim. If the row was tombstoned by `compliance_delete` (§11), `content` is the literal string `"[REDACTED]"` and `metadata.compliance_deleted` is `true`; `content_hash` is preserved.

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` No row with the given id -> `404 RESOURCE_NOT_FOUND`.

**Related endpoint:** operationId: `getRawInformationById`

---

### UC-03 -- List the chunks of a raw document

**Actor:** Owner
**Pre:** Owner is authenticated; the `RawInformation` exists.
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/ingest/raw-information/{rawInformationId}/chunks`.
2. BFF returns every `RawChunk` of that `RawInformation`, ordered by `chunk_index` ascending.

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` No row with the given id -> `404 RESOURCE_NOT_FOUND`.

**Related endpoint:** operationId: `listRawChunksByRawInformation`

---

### UC-04 -- Inspect an LLM run

**Actor:** Owner
**Pre:** Owner is authenticated; the run exists.
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/ingest/llm-runs/{llmRunId}`.
2. BFF returns the run header plus a per-`validation_outcome` counter `summary` aggregated from its `ToolCall` rows (BR-12).

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` No row with the given id -> `404 RESOURCE_NOT_FOUND`.

**Related endpoint:** operationId: `getLlmRunById`

---

### UC-05 -- List the tool calls of an LLM run

**Actor:** Owner
**Pre:** Owner is authenticated; the run exists.
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/ingest/llm-runs/{llmRunId}/tool-calls?limit=&offset=`.
2. BFF returns the run's `ToolCall` rows ordered by `created_at` ascending, paginated. `limit` defaults to 50, max 100; `offset` defaults to 0.

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` No run with the given id -> `404 RESOURCE_NOT_FOUND`.

**Related endpoint:** operationId: `listToolCallsByLlmRun`

---

### UC-06 -- Retry a failed LLM run

**Actor:** Owner
**Pre:** Owner is authenticated. The target `LLMRun` exists and `status = 'failed'`.
**Post:** Same `LLMRun` row: `status` flipped to `running`, `attempts` incremented by 1, `finished_at = NULL`. Every `InformationFragment` of that run whose `status = 'proposed'` and which has no row in `Provenance` linking it to an accepted link/attribute is moved to `status = 'rejected'` (reason: retry). Consolidated knowledge from the previous attempt is preserved.

**Main flow:**
1. Owner POSTs `/api/v1/ingest/llm-runs/{llmRunId}/retry` (optional `reason`).
2. BFF loads the run; if `status <> 'failed'`, aborts with `409 BUSINESS_RUN_NOT_RETRYABLE`.
3. In a single transaction: BFF marks orphan `proposed` fragments of this run as `rejected`; updates the run row to `status = 'running'`, `attempts = attempts + 1`, `finished_at = NULL`; commits.
4. BFF returns `200 OK` with the updated `LlmRun` payload.

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` Run not found -> `404 RESOURCE_NOT_FOUND`.
- `2b` Run is `running` or `completed` -> `409 BUSINESS_RUN_NOT_RETRYABLE` (no DB write).

**Related endpoint:** operationId: `retryLlmRun`

---

### UC-07 -- Close an LLM run (system action, no public endpoint)

**Actor:** BFF service layer (terminal step of §9.1, not exposed externally — `LLMRun` row is updated directly by the service).
**Pre:** Run is `running`. The LLM has finished its loop or the orchestrator signals end-of-run.
**Post:** Run row: `status = 'completed'` if no fatal failure occurred, else `status = 'failed'`; `finished_at = now()`. The DB CHECK `(status = 'running') = (finished_at IS NULL)` enforces this invariant.

**Main flow:**
1. Service layer receives the close signal from the LLM orchestrator.
2. Service updates the run row in a single transaction.
3. The run's outcome counters become readable via `getLlmRunById` (BR-12).

**Alternative flows:** none (internal-only path).

**Related endpoint:** none (internal). Listed here for completeness because the state machine ST-LR (§5) requires it.

---

### UC-08 -- Propose an atomic fragment (MCP)

**Actor:** LLM (inside an active `LLMRun`).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (run is `running`). All `chunk_ids` belong to the run's `input_raw_information_id`. `text` is non-empty and ≤ 1000 chars (DB CHECK on `information_fragment.text`). `confidence` ∈ [0, 1].
**Post:** A new `InformationFragment` row with `status = 'proposed'`, `confidence` as given, `llm_run_id` set to the ambient run; one `FragmentSource` row per chunk in `chunk_ids`; one `ToolCall` row with `tool_name = 'propose_fragment'`, the verbatim arguments, the result envelope and the resulting `validation_outcome` (`accepted` on success, `rejected` on validation failure, `error` on internal error).

**Main flow:**
1. LLM calls `propose_fragment { text, confidence, chunk_ids }`.
2. Service layer validates structurally (§13.1, BR-13): text length, confidence range, `chunk_ids` non-empty, every chunk exists and belongs to the run's `input_raw_information_id`.
3. Service inserts the fragment and the `FragmentSource` rows in one transaction.
4. Service records the `ToolCall` with `validation_outcome = 'accepted'`.
5. Returns the MCP envelope `{ "ok": true, "result": { fragment_id, status: "proposed" } }`.

**Alternative flows:**
- `1a` No ambient `llm_run_id` (called outside a run) -> MCP error `{ ok: false, error.code: "STRUCTURAL_INVALID" }`; no DB write.
- `2a` `text` > 1000 chars / `confidence` out of [0,1] / `chunk_ids` empty -> MCP error `{ ok: false, error.code: "STRUCTURAL_INVALID" }`; the `ToolCall` is recorded with `validation_outcome = 'rejected'`.
- `2b` Some `chunk_id` does not exist -> MCP error `{ ok: false, error.code: "NOT_FOUND" }`; `ToolCall` recorded with `validation_outcome = 'rejected'`.
- `2c` Some `chunk_id` belongs to a different `RawInformation` than the run's input -> MCP error `{ ok: false, error.code: "STRUCTURAL_INVALID", message: "chunk is not part of this run's source" }`; `ToolCall` recorded with `validation_outcome = 'rejected'`.

**Related endpoint:** MCP tool: `propose_fragment` (§14.1 of v7). MCP-only (does not appear in `openapi.yaml`).

---

### UC-09 -- Propose an entity (MCP)

**Actor:** LLM (inside an active `LLMRun`).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (`running`). `node_type` is one of the 8 seeded `NodeType.name` values (`Person`, `Organization`, `Project`, `Event`, `Role`, `Category`, `Concept`, `Location`); `name` is non-empty.
**Post:** Either an existing `KnowledgeNode` is reused (resolution `matched_existing`), or a new node is created (`created_new` with `status = 'active'`, or `needs_review` with one row per ambiguous candidate in `EntityMatchReview`). `NodeAlias` rows are added for any new alias. One `ToolCall` row records the outcome.

**Main flow:**
1. LLM calls `propose_node { node_type, name, aliases? }`.
2. Service validates structurally and looks up `NodeType` by name (`UNKNOWN_TYPE` on miss).
3. Service runs entity resolution (§4) under `pg_advisory_xact_lock(hash(node_type_id, norm(name)))` (§4.5) and against the `(node_type_id, alias_norm)` index path (§4.2).
4. Decision per the thresholds of §4.3 (A12): exact-match or ≥ 0.85 unique -> reuse; [0.55, 0.85) or ≥ 2 candidates ≥ 0.85 -> create with `status = 'needs_review'` and persist `EntityMatchReview` rows; < 0.55 -> create with `status = 'active'`.
5. Service adds a `NodeAlias` row for every new alias not already present on the node (UNIQUE `(node_id, alias_norm)` guards duplicates).
6. Records the `ToolCall` (`validation_outcome` = `accepted` for `matched_existing`/`created_new`, or `needs_review` for the ambiguous case).
7. Returns `{ ok: true, result: { node_id, resolution } }`.

**Alternative flows:**
- `1a` No ambient `llm_run_id` -> `STRUCTURAL_INVALID`; no DB write.
- `2a` `node_type` not in the seeded catalog -> `UNKNOWN_TYPE`; `ToolCall` `validation_outcome = 'rejected'`.
- `2b` `name` blank or > 500 chars -> `STRUCTURAL_INVALID`; `ToolCall` `validation_outcome = 'rejected'`.

**Related endpoint:** MCP tool: `propose_node` (§14.1 of v7). MCP-only.

---

### UC-10 -- Propose a relation between entities (MCP)

**Actor:** LLM (inside an active `LLMRun`).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (`running`). `source_node_id` and `target_node_id` exist; `link_type` is one of the 10 seeded `LinkType.name` values; `fragment_ids` is non-empty and every fragment belongs to this run. `confidence` ∈ [0, 1]. If `valid_from` is given, `valid_from_basis` must be `stated` or `document` (the BFF supplies `received` as a last-resort fallback). `change_hint` defaults to `none`; `correction` requires textual evidence of an errata (§6.5).
**Post:** Depending on the write-graph decision (§6.5), a new `KnowledgeLink` row is created (`active` if confidence ≥ 0.75, `uncertain` if 0.40–0.74, `disputed` on conflict), or no new row (consolidated re-affirmation -> a new `Provenance` row added to the existing vigent link). When succession applies, the previous vigent link is closed (`valid_to`, `superseded_at`, `status = 'superseded'`) and `supersedes_link_id` chains the new one to the old. One `ToolCall` row records the outcome.

**Main flow:**
1. LLM calls `propose_link { source_node_id, link_type, target_node_id, confidence, fragment_ids, valid_from?, valid_from_basis?, change_hint? }`.
2. Service performs the 5-layer validation (§13, BR-13..BR-17):
   - Structural: all FKs exist, `link_type` known, both nodes resolve, every fragment belongs to this run.
   - Graph rules: an active `LinkTypeRule` row authorises the `(source_node_type, link_type, target_node_type)` triple at the current date.
   - Temporal: if `link_type.requires_valid_from` then `valid_from` is present and has a valid `valid_from_basis`; semi-open `[valid_from, valid_to)`; `change_hint = 'correction'` requires textual signal.
   - Confidence: routes per A13.
   - Anti-hallucination: every fragment in `fragment_ids` is real and belongs to a chunk of this run's `input_raw_information_id`.
3. Service takes `SELECT ... FOR UPDATE` on the vigent equivalents of `(source_node_id, target_node_id, link_type)` and applies the write-graph flow §6.5 (consolidation / succession / correction / conflict).
4. Persists the new `KnowledgeLink` row (if any), `Provenance` rows, and the `ToolCall` with the resulting `validation_outcome`.
5. Returns `{ ok: true, result: { link_id, outcome, superseded_link_id?, reason? } }`.

**Alternative flows:**
- `1a` No ambient `llm_run_id` -> `STRUCTURAL_INVALID`; no DB write.
- `2a` Unknown `link_type` -> `UNKNOWN_TYPE`; `ToolCall.validation_outcome = 'rejected'`.
- `2b` `(source_node_type, link_type, target_node_type)` not authorised by any vigent `LinkTypeRule` -> `RULE_VIOLATION`; `ToolCall.validation_outcome = 'rejected'`.
- `2c` `valid_from` given without `valid_from_basis`, or `valid_from_basis = 'stated'` without a fragment containing the date in the text, or `valid_from ≥ valid_to` -> `TEMPORAL_INCOHERENT`; `ToolCall.validation_outcome = 'rejected'`.
- `2d` `requires_valid_from = true` and `valid_from` not derivable from any of the three bases -> `DATE_UNJUSTIFIED`; `ToolCall.validation_outcome = 'rejected'`.
- `2e` `confidence < 0.40` -> the link is **not** created; the supporting fragments stay `proposed` and are flagged `low_confidence` (§10); `ToolCall.validation_outcome = 'rejected'` with reason `BELOW_CONFIDENCE_FLOOR`.
- `2f` Any `fragment_id` not real or not in this run's source -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.
- `3a` Same source/target/link_type already vigent with same `valid_from` -> consolidation: no new row; existing `Provenance` accumulates the fragments; `ToolCall.validation_outcome = 'consolidated'`.
- `3b` Functional link type (`allows_multiple_current = false`) with different target and a textual succession signal -> succession (flow A of §6.5); `ToolCall.validation_outcome = 'superseded_previous'`.
- `3c` Same period, divergent value, no `change_hint = 'correction'` signal -> conflict (flow C of §6.5): both rows end up `disputed`; `ToolCall.validation_outcome = 'disputed'`.

**Related endpoint:** MCP tool: `propose_link` (§14.1 of v7). MCP-only.

---

### UC-11 -- Propose a literal attribute (MCP)

**Actor:** LLM (inside an active `LLMRun`).
**Pre:** Same as UC-10 plus: `key` is one of the 10 seeded `AttributeKey.key` values scoped by the node's `node_type` (§15.3); `value` is parseable as the key's `value_type` (date / number / text / bool, §3.4, §13.1).
**Post:** Same shape as UC-10 with `NodeAttribute` instead of `KnowledgeLink`. The DB UNIQUE partial index on `(node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL` enforces the duplicate guard (§6.5).

**Main flow:** Mirror of UC-10 with `propose_attribute { node_id, key, value, confidence, fragment_ids, valid_from?, valid_from_basis?, change_hint? }`. The `node`-vs-`key.node_type_id` compatibility check is part of the structural layer (§13.1).

**Alternative flows:** Same as UC-10, plus:
- `2g` `value` does not parse as `key.value_type` (e.g., key is `date` but `value = "tomorrow"`) -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.
- `2h` `key.node_type_id` does not match the node's `node_type_id` -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.

**Related endpoint:** MCP tool: `propose_attribute` (§14.1 of v7). MCP-only.

---

## 4. Business Rules

> Every BR is programmatically testable and references at least one UC.

### BR-01 -- Content hash is the idempotency anchor (UC-01)
`content_hash = sha256(content)` is hex-encoded (lowercase, 64 chars, regex `^[0-9a-f]{64}$`). The DB UNIQUE constraint `raw_information.content_hash` rejects collisions at write time; the BFF maps that into the `outcome = "noop_existing"` 200 response (§8).

### BR-02 -- Source content is immutable (UC-01, UC-02)
After insert, `RawInformation.content`, `metadata` and `received_at` are never modified by any code path of this domain. The only writer that touches `content` is `compliance_delete` (§11), which replaces it with the literal string `"[REDACTED]"`; that path lives in the compliance domain, not here.

### BR-03 -- Chunking is deterministic and versioned (UC-01)
The chunker produces the same chunks for the same `(content, chunking_version)`. `chunking_version` is currently always the literal `'v1'`. Re-chunking requires a new value and is out of scope for v1.0.0.

### BR-04 -- Chunk algorithm constants are fixed (UC-01)
The greedy packer of §9.2 uses, verbatim:
- `CHUNK_TARGET ∈ [1500, 2000]` characters (close at the upper end).
- `CHUNK_HARD_MAX = 4000` characters (never exceeded except by `sentenceSplit` oversize blocks).
- `READING_TAIL = 200` characters (prompt context only — not persisted).

These three constants live in the BFF configuration module (A22).

### BR-05 -- Chunk offsets are 0-based, semi-open, in Unicode code points (UC-01, UC-03)
`offset_start ≥ 0`, `offset_end > offset_start`, both counted in Unicode code points of the original `content`. In JavaScript, iterate via `[...str]` — never `str[i]` (which counts UTF-16 units). DB CHECK `offset_end > offset_start` is enforced by the schema (§9.2 / A22).

### BR-06 -- Hard boundaries close the current chunk (UC-01)
By `source_type`:
- `pdf`: page boundaries always close the current chunk.
- `email`: header↔body boundary and every level of `>` quotation close the current chunk.
- `ata`, `artigo`, `outro`, `chat`, `transcricao`: no hard boundary mandated; chunks close only by `CHUNK_TARGET` / `CHUNK_HARD_MAX`.
- `chat`, `transcricao`: a block (message/turn) is never fused with a block from a different speaker.

The chunker never overlaps chunks (no `READING_TAIL` is persisted).

### BR-07 -- Oversize blocks fall back to sentence split (UC-01)
A single block strictly larger than `CHUNK_HARD_MAX` is split with `Intl.Segmenter('pt', { granularity: 'sentence' })`. Code blocks and tables are exempt: they remain a single chunk even if they exceed `CHUNK_HARD_MAX`, because slicing them would destroy their structure (§9.2).

### BR-08 -- Run idempotency key composition (UC-01)
`idempotency_key = sha256(content_hash || prompt_version || model || chunking_version)`. The four operands are concatenated as UTF-8 strings with no separator. The DB UNIQUE constraint on `llm_run.idempotency_key` rejects duplicates (A18).

### BR-09 -- Re-ingestion is a no-op on the live path (UC-01, alt 4a)
When `content_hash` already exists AND there is already a non-failed `LLMRun` with the recomputed `idempotency_key`, the second ingestion returns `200 noop_existing` with the existing identifiers; no rows are written. Bumping any of `prompt_version`, `model` or `chunking_version` produces a different `idempotency_key`, hence a new `LLMRun` for the same `RawInformation` (§8).

### BR-10 -- Retry reopens the same LLMRun row (UC-06)
Retry is in-place: the same row transitions `failed → running`, `attempts` is incremented by 1, `finished_at` is reset to `NULL`. A new `LLMRun` with the same `idempotency_key` is never created. Orphan `proposed` fragments of the previous attempt (those with no `Provenance` row) are flipped to `rejected` in the same transaction (§8, §9.3).

### BR-11 -- Only failed runs are retryable (UC-06)
`retryLlmRun` is rejected with `409 BUSINESS_RUN_NOT_RETRYABLE` when the target run's `status` is `running` or `completed`. The DB CHECK `(status = 'running') = (finished_at IS NULL)` keeps state and timestamp consistent.

### BR-12 -- Run summary is derived, never stored (UC-04)
`LlmRunSummary` is computed at read time as the eight `validation_outcome` counts of the run's `ToolCall` rows. There is no summary column on `llm_run`. Aligns with the global "state dependent on clock or downstream rows is derived" rule (§5.4, A9).

### BR-13 -- Layered validation order is fixed (UC-08, UC-09, UC-10, UC-11)
Every MCP `ingest` call runs the §13 layers in this exact order — structural -> graph rules -> temporal -> confidence -> anti-hallucination. Failure at any layer returns the matching error code (BR-14..BR-17) and persists the `ToolCall` with `validation_outcome = 'rejected'`. Rejection is **not** an exception — it is a business result.

### BR-14 -- Structural failures map to STRUCTURAL_INVALID / UNKNOWN_TYPE / NOT_FOUND (UC-08..UC-11)
- Missing/typed fields, wrong references inside the run, value not parseable as `value_type` -> `STRUCTURAL_INVALID`.
- `node_type`, `link_type` or `key` not in the seeded catalog -> `UNKNOWN_TYPE`.
- A referenced `chunk_id`/`fragment_id`/`node_id` that resolves to no row -> `NOT_FOUND`.

### BR-15 -- Graph-rule failures map to RULE_VIOLATION (UC-10)
`propose_link` requires a vigent `LinkTypeRule` row matching `(source_node_type, link_type, target_node_type)`. The 22 seeded rules of §15.2 are the v1 set (`migrations/0002_seed.sql`). Any other triple yields `RULE_VIOLATION`.

### BR-16 -- Temporal failures map to TEMPORAL_INCOHERENT / DATE_UNJUSTIFIED (UC-10, UC-11)
- `valid_from >= valid_to`, or `change_hint = 'correction'` without a fragment text containing an errata signal -> `TEMPORAL_INCOHERENT`.
- The type/key requires a `valid_from` and none of `stated` / `document` (`metadata.document_date`) supplies one — and the BFF cannot fall back to `received` because that fallback is reserved for stable cases — -> `DATE_UNJUSTIFIED`.

### BR-17 -- Confidence routing (UC-10, UC-11)
The created assertion's `status` is determined by `confidence` per A13: `≥ 0.75 -> 'active'`; `0.40 ≤ c < 0.75 -> 'uncertain'`; `c < 0.40 -> the link/attribute is NOT created` — the supporting fragments remain `proposed` and are flagged `low_confidence` in retrieval; the `ToolCall` records `validation_outcome = 'rejected'` with reason `BELOW_CONFIDENCE_FLOOR`.

### BR-18 -- Every accepted assertion has provenance (UC-10, UC-11)
Anti-hallucination layer: at the moment the BFF persists a new `KnowledgeLink` or `NodeAttribute` row, at least one `Provenance` row is inserted in the same transaction, pointing to an `InformationFragment` whose `FragmentSource` chain anchors a `RawChunk` of the current run's `input_raw_information_id`. If this invariant cannot be satisfied, the entire transaction is aborted and the `ToolCall` is recorded with `validation_outcome = 'rejected'` and code `STRUCTURAL_INVALID` (§13.5).

### BR-19 -- One transaction per tool call (UC-08..UC-11)
Each MCP `ingest` call runs inside a single database transaction (A19). A run of 50 chunks that fails on chunk 49 keeps the 48 already-accepted units of knowledge; the orphan fragments of the failed call are cleaned up on retry (BR-10).

### BR-20 -- Entity creation is serialised by advisory lock (UC-09)
The BFF wraps the resolve-or-create step in `pg_advisory_xact_lock(hash(node_type_id, norm(name)))` (§4.5). Two concurrent calls proposing the same new entity therefore never create duplicate nodes.

### BR-21 -- MCP `ingest` toolset only operates inside an active LLMRun (UC-08..UC-11)
Every MCP `ingest` call must be addressed at an ambient `llm_run_id` whose `status = 'running'`. The BFF rejects with `STRUCTURAL_INVALID` (and never writes a `ToolCall`) any call without that context. REST endpoints of this domain never expose `propose_*` — they are MCP-only by design (§2, §14).

### BR-22 -- The fragment text is bounded to 1000 characters (UC-08)
`InformationFragment.text` is enforced by `CHECK (char_length(text) <= 1000)` in the schema. Longer assertions must be split into multiple atomic fragments by the LLM (§9.3, rule (a)).

### BR-23 -- ToolCall always records the call (UC-08..UC-11)
Every MCP `ingest` invocation produces exactly one `ToolCall` row, regardless of outcome — including layered-validation rejections. The only case where no `ToolCall` is recorded is "no ambient run" (BR-21), since the call cannot be associated with any run. This is what makes the run summary (BR-12) auditable.

---

## 5. State Machine

> Two state machines live in this domain: `LLMRun` (the central one) and `InformationFragment`. Other state machines (`KnowledgeNode`, `KnowledgeLink`, `NodeAttribute`) live in the consolidation/graph domain (out of scope for this spec — see §8).

### 5.1 ST-LR -- LLMRun lifecycle

```
[running] --close ok--> [completed]
[running] --close err--> [failed]
[failed]  --retry-----> [running]   (attempts += 1, finished_at -> NULL)
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (nothing) | `ingestRawInformation` creates a new run | running | `idempotency_key` not already used by a non-failed run | UC-01 |
| running | close signal, no fatal error | completed | service layer sets `finished_at = now()` | UC-07 |
| running | close signal, fatal error | failed | service layer sets `finished_at = now()` | UC-07 |
| failed  | `retryLlmRun` | running | atomic update: `attempts += 1`, `finished_at = NULL`, orphan `proposed` fragments -> `rejected` | UC-06 |
| completed | — | — | terminal | — |

DB invariant (`CHECK (status = 'running') = (finished_at IS NULL)`) is the single source of truth; the table above must always be consistent with it.

### 5.2 ST-IF -- InformationFragment lifecycle

```
[proposed] --consolidation cites it--> [accepted]
[proposed] --curation rejects / retry orphan--> [rejected]
[accepted] --re-extraction supersedes--> [superseded]
[any]      --compliance_delete--> [deleted]
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (nothing) | `propose_fragment` | proposed | structural layer accepted; row + `FragmentSource` written | UC-08 |
| proposed | `propose_link` / `propose_attribute` cites it and is consolidated/accepted | accepted | a `Provenance` row referencing this fragment is committed | UC-10, UC-11 |
| proposed | curation rejects (out of scope of ingestion) OR `retryLlmRun` finds it as orphan | rejected | reason recorded in `ToolCall` (for retry) or `CurationAction` (for curation) | UC-06 |
| proposed | confidence < 0.40 AND never cited | proposed | stays `proposed`; surfaced via `low_confidence` flag (BR-17) | UC-10, UC-11 |
| accepted | newer run supersedes | superseded | out of scope here (handled by consolidation/curation) | — |
| any | `compliance_delete` of the raw source | deleted | out of scope here (compliance domain) | — |

The transitions inside `accepted` -> `superseded` and any path through `deleted` are owned by other domains; this table lists them only for traceability.

---

## 6. Error Behaviors

> All HTTP statuses >= 400 from REST endpoints, plus the MCP envelope error codes used by `ingest` tools. Every code is registered in the global catalog (`docs/specs/_global/error-codes.md`).

### 6.1 REST errors

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without JWT, or JWT invalid/expired/malformed | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (cf. C16). |
| `RawInformation` or `LLMRun` id not found | 404 | `RESOURCE_NOT_FOUND` | UC-02, UC-03, UC-04, UC-05, UC-06 alt `2a`. |
| Missing required field in `ingestRawInformation` body | 422 | `VALIDATION_REQUIRED_FIELD` | UC-01 alt `1a`. |
| Field with invalid format (non-enum `source_type`, malformed UUID, or other format violation) | 422 | `VALIDATION_INVALID_FORMAT` | UC-01 alt `1b`. |
| `content` exceeds 10 MiB / `prompt_version` empty / out-of-range numeric input | 422 | `VALIDATION_OUT_OF_RANGE` | UC-01 alt `1c`. |
| `retryLlmRun` called against a `running` or `completed` run | 409 | `BUSINESS_RUN_NOT_RETRYABLE` | UC-06 alt `2b`. |
| Unexpected internal failure (chunker error, DB outage, unhandled exception) | 500 | `SYSTEM_INTERNAL_ERROR` | UC-01 alt `5a`. |

### 6.2 MCP `ingest` envelope errors (response is `{ ok: false, error: { code, message, details } }`)

| Situation | MCP error.code | Description |
|-----------|----------------|-------------|
| Required field missing, type mismatch, length/range violation, or cross-table compatibility failure (chunk not in run, key/value type mismatch, chunk does not belong to run's source) | `STRUCTURAL_INVALID` | UC-08..UC-11. |
| `node_type` / `link_type` / `key` not in the seeded catalog | `UNKNOWN_TYPE` | UC-09, UC-10, UC-11. |
| `propose_link` triple not authorised by any vigent `LinkTypeRule` | `RULE_VIOLATION` | UC-10. |
| `valid_from >= valid_to`, or `change_hint = 'correction'` without errata signal | `TEMPORAL_INCOHERENT` | UC-10, UC-11. |
| `requires_valid_from = true` and none of `stated` / `document` supplies a date | `DATE_UNJUSTIFIED` | UC-10, UC-11. |
| Referenced `chunk_id` / `fragment_id` / `node_id` does not exist | `NOT_FOUND` | UC-08..UC-11. |
| Unhandled internal exception in service layer | `INTERNAL` | UC-08..UC-11. |

Auth errors are handled at the BFF middleware layer (same JWT validation as REST, §2.5/A29); they surface to the MCP client as the standard REST `401` response — the MCP envelope is only used for layered-validation outcomes.

> Business outcomes (`consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`) are **not** errors. They are returned in `result.outcome` of the MCP envelope (`{ ok: true, ... }`) and recorded as `validation_outcome` in the corresponding `ToolCall` row (§14, §3.5).

---

## 7. Cross-Domain Dependencies

> Bidirectional — if this domain lists X, X must list this domain back when it is specified.

| Domain | Type | Description |
|--------|------|-------------|
| graph-consolidation (future) | consumes | UC-10 and UC-11 ultimately materialise `KnowledgeNode` / `KnowledgeLink` / `NodeAttribute` / `Provenance` rows; the graph-consolidation domain owns the write-graph rules of §6.5 and the read views `knowledge_link_resolved` / `node_attribute_resolved`. Ingestion calls into the consolidation service inside the same transaction as the `ToolCall`. |
| entity-resolution (future) | consumes | UC-09 delegates the matching pipeline of §4 (norm, trigram, threshold decision, advisory lock) to a dedicated entity-resolution domain. |
| retrieval (future) | produces | The chunks, fragments and runs persisted here become inputs of the retrieval pipeline (§7). |
| curation (future) | produces | `needs_review` nodes (UC-09 alt) feed the `entity_match` queue; `disputed` links/attributes (UC-10/UC-11 alt `3c`) feed the `disputed` queue. The curation domain may also call `compliance_delete` on a `RawInformation` of this domain (§11). |
| compliance (future) | synchronizes | `compliance_delete` is the only writer permitted to mutate a `RawInformation` row of this domain; it overwrites `content` with `"[REDACTED]"` (BR-02 carve-out) and propagates `status = 'deleted'` to chunks/fragments. |

This domain depends on no other domain to function in isolation; the rows it owns (`raw_information`, `raw_chunk`, `information_fragment`, `fragment_source`, `llm_run`, `tool_call`) are self-contained.

---

## 8. Out of Scope

- **Consolidation into the graph (`KnowledgeNode`, `KnowledgeLink`, `NodeAttribute`, `Provenance`).** Owned by a dedicated `graph-consolidation` domain. The MCP `ingest` use cases UC-10/UC-11 call into that domain as part of their flow, but its rules (§6.5: succession / correction / conflict) are not redefined here.
- **Entity resolution algorithm (§4).** Documented at the level of contract (UC-09 outcome) only. The matching pipeline, thresholds (A12), trigram index management and advisory-lock implementation belong to the future `entity-resolution` domain.
- **Retrieval (§7).** `search`, `traverse`, `get_node`, `get_history`, `get_provenance` belong to the future `retrieval` domain.
- **Curation (§10).** `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` belong to the future `curation` domain.
- **Compliance deletion (§11).** `compliance_delete` and `ComplianceDeletion` belong to the future `compliance` domain. Its semantics (tombstone, propagation, audit row) is referenced here only because it is the lone writer permitted to mutate `RawInformation` rows post-creation.
- **System-time travel (consulta (c) of §5.3, A25).** Permanently deferred at this layer: this domain writes `recorded_at` on every row it owns (the schema does), but exposes no endpoint to query "what the system knew at instant T".
- **Embeddings / vector search (§20.1, A24).** Permanent non-goal. No embedding column on `RawChunk`, `InformationFragment` or any other row of this domain, ever.
- **Multi-tenant / `User` entity (§2.3, §20.3, A20).** Permanent non-goal.
- **Free-form schema evolution for the seeded catalog.** New `NodeType` / `LinkType` / `AttributeKey` rows enter through versioned SQL migrations (§12), not through this domain's API.

---

## 9. Local Glossary

> Domain-specific terms not already in the global glossary.

| Term | Definition |
|------|------------|
| RawInformation | The immutable original document, exactly as received (§3.1). Has a unique `content_hash`. |
| RawChunk | A deterministic slice of a `RawInformation`'s `content`, defined by `(chunking_version, chunk_index, offset_start, offset_end)`. Anchors provenance and full-text search (§3.1, §9.2). |
| InformationFragment | An atomic LLM-extracted claim (a complete subject–predicate–object sentence). Carries `confidence` and lives in `status ∈ {proposed, accepted, rejected, superseded, deleted}` (§3.2). |
| LLMRun | A logical extraction session driven by a model + prompt version against one `RawInformation`. Uniquely identified by `idempotency_key`. Retry reopens the same row (§3.5, §8). |
| ToolCall | Audit row of one MCP `ingest` call (`propose_fragment` / `propose_node` / `propose_link` / `propose_attribute`), with verbatim arguments, raw result and `validation_outcome` (§3.5). |
| Idempotency key (of a run) | `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` (A18). Determines whether re-ingestion is a no-op or opens a new run. |
| Chunking version | Tag of the deterministic chunking strategy. Currently always `'v1'` (§9.2). Bumping it requires a new migration and a new ingestion. |
| Content hash | `sha256(content)` of a `RawInformation`, hex-encoded lowercase, 64 chars. The unique anchor of ingestion idempotency (§8). |
| Provenance (relative to ingestion) | The `Provenance` row that pins a future `KnowledgeLink` / `NodeAttribute` to an `InformationFragment` produced inside an `LLMRun`. The ingestion domain enforces that this row exists for every accepted link/attribute (BR-18). |
| Layered validation | The 5-layer pipeline of §13 — structural, graph rules, temporal, confidence, anti-hallucination — applied to every MCP `ingest` call. |
| MCP envelope | `{ ok: true, result }` / `{ ok: false, error: { code, message, details } }` — the common response shape of every MCP tool (§14). |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial ingestion-domain specification: source layer (§3.1), extraction layer (§3.2), audit layer (§3.5), idempotency (§8), end-to-end flow (§9), layered validation (§13) and the MCP `ingest` toolset (§14.1). Aligned with v7 normative source and with `migrations/0001_schema.sql` + `migrations/0002_seed.sql`. | -- |
