# Ingestion -- Business Specification

> Version: 1.2.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml` (REST) + MCP toolset `ingest` (§14.1 of `remember-modelagem-v7.md`)
>
> Normative source: `remember-modelagem-v7.md` (§3.1, §3.2, §3.5, §4, §6.5, §8, §9, §11, §13, §14.1).
> Schema: `migrations/0001_init.sql`.

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Receive unstructured documents, persist them immutably, slice them deterministically into chunks, drive the LLM-driven extraction of structured fragments end-to-end (LLM orchestration in-process), resolve entities against the existing graph (§4) and consolidate the resulting links/attributes into the graph (§6.5) under full audit. |
| Core entity | `RawInformation` (with `RawChunk`, `InformationFragment`, `LLMRun`, `ToolCall` as its dependent rows). |
| Bounded context | Source layer (§3.1), extraction layer (§3.2), extraction audit (§3.5), entity resolution at write time (§4) and graph consolidation at write time (§6.5). Owns end-to-end ingestion (§9), the in-process extraction orchestrator (UC-12) and the dual-transport `ingest` toolset (REST + MCP, §14.1). |
| Out of scope | Retrieval (§7), curation (§10) and compliance deletion (§11). The catalog merge step of §4.4 (when a curator resolves an `entity_match` review) is owned by the curation domain and consumed via the existing `performMerge` service. See §8 of this spec. |

---

## 2. Actors

> Single-owner model (§2.3, A20). No `User` entity. Authentication is the access gate (§2.5, A29).

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner (SPA user) | The data owner, authenticated by Neon Auth (Stack Auth). Reads raw documents, chunks, runs and the tool-call audit; triggers extraction; may also drive the propose-* surface manually via REST mirrors (for replay/simulation). | `ingestRawInformation`, `getRawInformationById`, `listRawChunksByRawInformation`, `getLlmRunById`, `listToolCallsByLlmRun`, `retryLlmRun`, `runLlmExtraction`, `proposeFragment`, `proposeNode`, `proposeLink`, `proposeAttribute` (the last four are the REST mirrors of the MCP `ingest` tools). |
| LLM (extractor) | The LLM driving extraction inside an active `LLMRun`, addressed via the MCP `ingest` toolset OR via the in-process tool-use loop of the extraction orchestrator (UC-12). Cannot touch the database directly (inviolable rule, §2). | MCP tools: `propose_fragment`, `propose_node`, `propose_link`, `propose_attribute` -- only inside the run identified by the ambient `llm_run_id`. |
| BFF (service layer) | Internal — not an external actor. Performs layered validation (§13), entity resolution (§4) and graph consolidation (§6.5), and persists. The extraction orchestrator (UC-12) is an internal component of the service layer: it iterates the run's chunks, builds the SYSTEM/USER prompts, runs the manual tool-use loop against the Anthropic SDK in-process and invokes the same propose-* service functions used by the MCP and REST transports. |

> Every REST and MCP call requires a valid Neon Auth (Stack Auth) JWT verified in BFF middleware (`requireNeonAuth`, JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default). The `DATABASE_URL`, the Neon Auth credentials and the `ANTHROPIC_API_KEY` never leave the BFF; PostgreSQL RLS is disabled (A29). Single-owner is unchanged — there is still no `User` entity.

---

## 3. Use Cases

> Each UC: actor, pre/post, main flow + alternative flows, related endpoint(s).
> Propose-* use cases (UC-08..UC-11) are dual-transport: their business semantics are identical regardless of transport (MCP tool or REST mirror); the transport-agnostic service layer is the single implementation (BR-21).

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

> The newly opened run is **not** extracted automatically — the caller drives extraction explicitly via UC-12 (or by letting the LLM call the MCP `ingest` tools directly). This keeps `ingestRawInformation` synchronously bounded (no LLM latency on the intake path).

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

**Actor:** BFF service layer — terminal step of UC-12 (and of an externally driven MCP extraction). Not exposed externally; the `LLMRun` row is updated directly by the orchestrator service at the end of its loop.
**Pre:** Run is `running`. The LLM has finished its loop (`stop_reason = "end_turn"` in the orchestrator) or the orchestrator caught a fatal error.
**Post:** Run row: `status = 'completed'` if no fatal failure occurred, else `status = 'failed'`; `finished_at = now()`. The DB CHECK `(status = 'running') = (finished_at IS NULL)` enforces this invariant.

**Main flow:**
1. Orchestrator (UC-12) reaches `end_turn` on the last chunk, OR catches a fatal exception.
2. Service updates the run row in a single transaction (status + `finished_at = now()`).
3. The run's outcome counters become readable via `getLlmRunById` (BR-12).

**Alternative flows:** none (internal-only path).

**Related endpoint:** none (internal). Listed here for completeness because the state machine ST-LR (§5) requires it.

---

### UC-08 -- Propose an atomic fragment (dual-transport)

**Actor:** LLM (inside an active `LLMRun`, via MCP or via the in-process orchestrator of UC-12) OR Owner (via the REST mirror for manual replay/simulation).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (run is `running`). All `chunk_ids` belong to the run's `input_raw_information_id`. `text` is non-empty and ≤ 1000 chars (DB CHECK on `information_fragment.text`). `confidence` ∈ [0, 1].
**Post:** A new `InformationFragment` row with `status = 'proposed'`, `confidence` as given, `llm_run_id` set to the ambient run; one `FragmentSource` row per chunk in `chunk_ids`; one `ToolCall` row with `tool_name = 'propose_fragment'`, the verbatim arguments, the result envelope and the resulting `validation_outcome` (`accepted` on success, `rejected` on validation failure, `error` on internal error).

**Main flow:**
1. Caller invokes `propose_fragment { text, confidence, chunk_ids }` via MCP tool call or REST POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-fragment`. In the in-process orchestrator path (UC-12) the LLM-facing `propose_fragment` tool OMITS `chunk_ids` from its `input_schema`: the orchestrator anchors the fragment to the chunk currently being processed and injects `chunk_ids = [current chunk id]` before calling the service function, so the LLM supplies only `{ text, confidence }` on that path (and alt-flows `2a`/`2c` below can therefore only arise from external MCP/REST callers).
2. Service layer validates structurally (§13.1, BR-13): text length, confidence range, `chunk_ids` non-empty, every chunk exists and belongs to the run's `input_raw_information_id`.
3. Service inserts the fragment and the `FragmentSource` rows in one transaction.
4. Service records the `ToolCall` with `validation_outcome = 'accepted'`.
5. Returns the envelope `{ "ok": true, "result": { fragment_id, status: "proposed" } }`. On the REST mirror, the same envelope is the 200 response body; HTTP status mirrors the MCP semantics (200 for `ok: true`, 200 for `ok: false` business outcomes that are not auth/4xx).

**Alternative flows:**
- `1a` No ambient `llm_run_id` (run not found, or run not `running`) -> error envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`; no DB write. REST mirror returns 409 with `BUSINESS_RUN_NOT_RUNNING` when the run exists but is not `running`, and 404 with `RESOURCE_NOT_FOUND` when the run id does not exist (the propose-* REST mirrors must distinguish these to be useful to a human caller; the MCP transport collapses both into `STRUCTURAL_INVALID` because the LLM only sees its ambient run id).
- `2a` `text` > 1000 chars / `confidence` out of [0,1] / `chunk_ids` empty -> error envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`; the `ToolCall` is recorded with `validation_outcome = 'rejected'`.
- `2b` Some `chunk_id` does not exist -> error envelope `{ ok: false, error.code: "NOT_FOUND" }`; `ToolCall` recorded with `validation_outcome = 'rejected'`.
- `2c` Some `chunk_id` belongs to a different `RawInformation` than the run's input -> error envelope `{ ok: false, error.code: "STRUCTURAL_INVALID", message: "chunk is not part of this run's source" }`; `ToolCall` recorded with `validation_outcome = 'rejected'`.

**Related endpoints:** MCP tool `propose_fragment` (§14.1 of v7) AND REST mirror operationId `proposeFragment` (POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-fragment`). Both transports invoke the same service function `proposeFragmentService(client, runCtx, input)`.

---

### UC-09 -- Propose an entity (dual-transport, with entity resolution)

**Actor:** LLM (inside an active `LLMRun`, via MCP or via UC-12) OR Owner (via REST mirror).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (`running`). `node_type` is one of the 8 seeded `NodeType.name` values (`Person`, `Organization`, `Project`, `Event`, `Role`, `Category`, `Concept`, `Location`); `name` is non-empty.
**Post:** One of three outcomes per the §4 resolution decision (A12):
- **`matched_existing`** — an existing `KnowledgeNode` of the same `node_type_id` was found and reused (exact alias match OR strong trigram match per BR-24). Aliases that were not yet on the node are appended via new `NodeAlias` rows.
- **`created_new`** — no match strong enough; a new `KnowledgeNode` is created with `status = 'active'`.
- **`needs_review`** — the resolution found ambiguous candidates per BR-24; a new `KnowledgeNode` is created with `status = 'needs_review'` plus one `EntityMatchReview` row per ambiguous candidate (carrying the trigram `similarity`), feeding the curation `entity_match` queue.

One `ToolCall` row records the outcome.

**Main flow:**
1. Caller invokes `propose_node { node_type, name, aliases? }`.
2. Service validates structurally and looks up `NodeType` by name (`UNKNOWN_TYPE` on miss).
3. Service runs entity resolution (§4) under `pg_advisory_xact_lock(hash(node_type_id, norm(name)))` (§4.5):
   - **Exact match:** `SELECT n.id FROM node_alias na JOIN knowledge_node n ON n.id = na.node_id WHERE n.node_type_id = $1 AND n.status = 'active' AND na.alias_norm = norm($2)` — score 1.0 → reuse (`matched_existing`).
   - **Trigram candidates:** `SELECT na.node_id, MAX(similarity(na.alias_norm, norm($2))) AS sim FROM node_alias na JOIN knowledge_node n ON n.id = na.node_id WHERE n.node_type_id = $1 AND n.status = 'active' AND na.alias_norm % norm($2) GROUP BY na.node_id ORDER BY sim DESC` — uses the existing `node_alias_norm_trgm_idx`.
   - **Decision (BR-24):** strong (1 candidate ≥ `MATCH_STRONG = 0.85` and no second candidate ≥ `MATCH_FLOOR = 0.55`) → reuse (`matched_existing`); ambiguous (any candidate in `[0.55, 0.85)`, or ≥ 2 candidates ≥ 0.85) → create with `status = 'needs_review'` and persist one `EntityMatchReview` row per candidate (`needs_review`); none (all < 0.55) → create with `status = 'active'` (`created_new`).
4. Service adds a `NodeAlias` row for every new alias not already present on the (reused or new) node (UNIQUE `(node_id, alias_norm)` guards duplicates).
5. Records the `ToolCall` (`validation_outcome` = `accepted` for `matched_existing` / `created_new`, or `needs_review` for the ambiguous case).
6. Returns `{ ok: true, result: { node_id, resolution } }` where `resolution ∈ { matched_existing, created_new, needs_review }`.

**Alternative flows:**
- `1a` No ambient `llm_run_id` -> see UC-08 alt 1a (transport-dependent mapping).
- `2a` `node_type` not in the seeded catalog -> `UNKNOWN_TYPE`; `ToolCall` `validation_outcome = 'rejected'`.
- `2b` `name` blank or > 500 chars -> `STRUCTURAL_INVALID`; `ToolCall` `validation_outcome = 'rejected'`.

**Related endpoints:** MCP tool `propose_node` (§14.1 of v7) AND REST mirror operationId `proposeNode` (POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-node`). Both invoke `proposeNodeService(...)` which in turn calls `resolveOrCreateNode(...)` (the §4 pipeline).

---

### UC-10 -- Propose a relation between entities (dual-transport, with graph consolidation)

**Actor:** LLM (inside an active `LLMRun`, via MCP or via UC-12) OR Owner (via REST mirror).
**Pre:** Caller holds a valid JWT and the ambient `llm_run_id` (`running`). `source_node_id` and `target_node_id` exist; `link_type` is one of the 10 seeded `LinkType.name` values; `fragment_ids` is non-empty and every fragment belongs to this run. `confidence` ∈ [0, 1]. If `valid_from` is given, `valid_from_basis` must be `stated` or `document` (the BFF supplies `received` as a last-resort fallback). `change_hint` defaults to `none`; `correction` requires textual evidence of an errata (§6.5).
**Post:** Depending on the graph-consolidation decision (§6.5, BR-25), one of the following:
- **`accepted`** — no vigent equivalent exists; a new `KnowledgeLink` row is created (`active` if confidence ≥ 0.75, `uncertain` if 0.40 ≤ c < 0.75).
- **`consolidated`** — a vigent row with the same `(source_node_id, link_type_id, target_node_id, valid_from)` already exists; no new row is created; a new `Provenance` row is appended to the existing link, accumulating evidence (§18).
- **`superseded_previous`** — functional link type (`allows_multiple_current = false`) with a different target and a textual succession signal; the previous vigent link is closed (`valid_to = new.valid_from`, `superseded_at = now()`, `status = 'superseded'`) and the new link is chained via `supersedes_link_id`.
- **`disputed`** — same period, divergent value, no `change_hint = 'correction'`; both the previous and the new link are flagged `status = 'disputed'`.
- **`rejected`** — `confidence < 0.40`; nothing is created (see BR-17).

One `ToolCall` row records the outcome.

**Main flow:**
1. Caller invokes `propose_link { source_node_id, link_type, target_node_id, confidence, fragment_ids, valid_from?, valid_from_basis?, change_hint? }`.
2. Service performs the 5-layer validation (§13, BR-13..BR-17):
   - Structural: all FKs exist, `link_type` known, both nodes resolve, every fragment belongs to this run.
   - Graph rules: an active `LinkTypeRule` row authorises the `(source_node_type, link_type, target_node_type)` triple at the current date.
   - Temporal: if `link_type.requires_valid_from` then `valid_from` is present and has a valid `valid_from_basis`; semi-open `[valid_from, valid_to)`; `change_hint = 'correction'` requires textual signal.
   - Confidence: routes per A13.
   - Anti-hallucination: every fragment in `fragment_ids` is real and belongs to a chunk of this run's `input_raw_information_id`.
3. Service runs graph consolidation (§6.5, BR-25):
   - `SELECT ... FOR UPDATE` (A11) on vigent equivalents of `(source_node_id, target_node_id, link_type_id)` and on functional siblings (where applicable).
   - Decides: consolidation (re-affirmation) / succession (closes previous, opens new) / dispute (both flagged) / correction (only with errata signal) / new (creates one row).
4. Persists the resulting `KnowledgeLink` row(s), `Provenance` rows, and the `ToolCall` with the resulting `validation_outcome`.
5. Returns `{ ok: true, result: { link_id, outcome, superseded_link_id?, reason? } }` where `outcome ∈ { accepted, consolidated, superseded_previous, disputed, uncertain, rejected }`.

**Alternative flows:**
- `1a` No ambient `llm_run_id` -> see UC-08 alt 1a.
- `2a` Unknown `link_type` -> `UNKNOWN_TYPE`; `ToolCall.validation_outcome = 'rejected'`.
- `2b` `(source_node_type, link_type, target_node_type)` not authorised by any vigent `LinkTypeRule` -> `RULE_VIOLATION`; `ToolCall.validation_outcome = 'rejected'`.
- `2c` `valid_from` given without `valid_from_basis`, or `valid_from_basis = 'stated'` without a fragment containing the date in the text, or `valid_from ≥ valid_to` -> `TEMPORAL_INCOHERENT`; `ToolCall.validation_outcome = 'rejected'`.
- `2d` `requires_valid_from = true` and `valid_from` not derivable from any of the three bases -> `DATE_UNJUSTIFIED`; `ToolCall.validation_outcome = 'rejected'`.
- `2e` `confidence < 0.40` -> the link is **not** created; the supporting fragments stay `proposed` and are flagged `low_confidence` (§10); `ToolCall.validation_outcome = 'rejected'` with reason `BELOW_CONFIDENCE_FLOOR`.
- `2f` Any `fragment_id` not real or not in this run's source -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.
- `3a` Same source/target/link_type already vigent with same `valid_from` -> consolidation: no new row; existing `Provenance` accumulates the fragments; `ToolCall.validation_outcome = 'consolidated'`.
- `3b` Functional link type (`allows_multiple_current = false`) with different target and a textual succession signal -> succession (flow A of §6.5); `ToolCall.validation_outcome = 'superseded_previous'`.
- `3c` Same period, divergent value, no `change_hint = 'correction'` signal -> conflict (flow C of §6.5): both rows end up `disputed`; `ToolCall.validation_outcome = 'disputed'`.

**Related endpoints:** MCP tool `propose_link` (§14.1 of v7) AND REST mirror operationId `proposeLink` (POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-link`). Both invoke `proposeLinkService(...)` which in turn calls the graph-consolidation service (BR-25).

---

### UC-11 -- Propose a literal attribute (dual-transport, with graph consolidation)

**Actor:** LLM (inside an active `LLMRun`, via MCP or via UC-12) OR Owner (via REST mirror).
**Pre:** Same as UC-10 plus: `key` is one of the 10 seeded `AttributeKey.key` values scoped by the node's `node_type` (§15.3); `value` is parseable as the key's `value_type` (date / number / text / bool, §3.4, §13.1).
**Post:** Same shape as UC-10 with `NodeAttribute` instead of `KnowledgeLink`. The DB UNIQUE partial index on `(node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL` is bypassed by the consolidation path (BR-25): a re-affirmation of the same `(node, key, value)` returns `consolidated` and never attempts a duplicate INSERT.

**Main flow:** Mirror of UC-10 with `propose_attribute { node_id, key, value, confidence, fragment_ids, valid_from?, valid_from_basis?, change_hint? }`. The `node`-vs-`key.node_type_id` compatibility check is part of the structural layer (§13.1).

**Alternative flows:** Same as UC-10, plus:
- `2g` `value` does not parse as `key.value_type` (e.g., key is `date` but `value = "tomorrow"`) -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.
- `2h` `key.node_type_id` does not match the node's `node_type_id` -> `STRUCTURAL_INVALID`; `ToolCall.validation_outcome = 'rejected'`.

**Related endpoints:** MCP tool `propose_attribute` (§14.1 of v7) AND REST mirror operationId `proposeAttribute` (POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-attribute`). Both invoke `proposeAttributeService(...)` which in turn calls the graph-consolidation service (BR-25).

---

### UC-12 -- Trigger LLM-driven extraction for an LLMRun

**Actor:** Owner (synchronous REST trigger). Internally drives the LLM (extractor) via the in-process Anthropic SDK tool-use loop.
**Pre:** Owner is authenticated. Target `LLMRun` exists and `status = 'running'` (the run was just opened by UC-01, or just reopened by UC-06). `ANTHROPIC_API_KEY` is configured on the BFF.
**Post:** Every chunk of the run's `input_raw_information_id` was offered to the LLM in `chunk_index` order; for each chunk the LLM completed a tool-use loop (one or more calls to `propose_fragment`/`propose_node`/`propose_link`/`propose_attribute`) until `stop_reason = "end_turn"`. Each tool invocation produced exactly one `ToolCall` row plus the corresponding fragment/node/link/attribute writes (when accepted) — all through the same transport-agnostic service functions as UC-08..UC-11. The run is closed (UC-07): `status = 'completed'` on a clean finish or `status = 'failed'` on a fatal exception; `finished_at = now()`. The response carries the final run row, including the derived `summary` (BR-12).

**Main flow:**
1. Owner POSTs `/api/v1/ingest/llm-runs/{llmRunId}/run` (optional body: per-chunk overrides reserved for the future, empty in v1.0.0).
2. BFF loads the run; if `status <> 'running'`, aborts with `409 BUSINESS_RUN_NOT_RUNNABLE` (no LLM call is made).
3. Orchestrator reads `model`, `prompt_version` from the run, loads the prompt module matching `prompt_version` (e.g. `extraction.v1.ts`) and a CatalogSnapshot of the §15 seed (8 NodeTypes / 10 LinkTypes + 22 rules / 10 AttributeKeys) into memory (BR-26).
4. For each `RawChunk` of the run's source, in `chunk_index` order:
   1. Build the SYSTEM prompt (extraction contract + catalog) and the USER prompt (document metadata + chunk text framed as data, never instruction; plus `prev_tail` ≈ 200 chars of the previous chunk for continuity — BR-26).
   2. Open an Anthropic SDK message stream (`client.messages.stream(...)`) with the four `ingest` tools (`input_schema` derived from the same Zod schemas used by MCP and REST via `zod-to-json-schema` — BR-21) and `thinking: { type: "adaptive" }`. The `propose_fragment` tool's `input_schema` is presented to the LLM with `chunk_ids` stripped — the orchestrator injects the current chunk's id at dispatch time (see UC-08 step 1), so the model is never asked for an opaque chunk uuid it cannot know.
   3. Run the manual tool-use loop: append every `response.content` (preserving `tool_use` blocks), execute each `tool_use` by invoking the in-process service function with the ambient `runCtx`, return a `tool_result` block carrying the verbatim envelope (`{ ok, result | error }`) and the `validation_outcome` produced by the handler. Repeat until `stop_reason === "end_turn"`. Each tool execution is its own DB transaction (BR-19); the orchestrator does NOT wrap the chunk loop or the run loop in a transaction.
   4. Handle `pause_turn` / `refusal` per the SDK contract: `pause_turn` is resumed once; `refusal` closes the loop for this chunk with the refusal preserved in the next `ToolCall.result` (no fragment/node/link/attribute is written for the refused turn).
5. After the last chunk: orchestrator closes the run (UC-07) with `status = 'completed'` and `finished_at = now()`.
6. BFF returns `200 OK` with the final `LlmRun` payload (including the derived `summary`).

**Alternative flows:**
- `1a` Missing/invalid JWT -> `401 AUTH_UNAUTHORIZED`.
- `2a` Run not found -> `404 RESOURCE_NOT_FOUND`.
- `2b` Run is `completed` or `failed` -> `409 BUSINESS_RUN_NOT_RUNNABLE` (no LLM call is made; for `failed`, the caller must invoke `retryLlmRun` first to flip the run back to `running`).
- `4a` Anthropic SDK transport raises a non-recoverable error (auth, quota, network) mid-chunk -> orchestrator catches, closes the run as `failed` (UC-07), returns `502 SYSTEM_LLM_PROVIDER_UNAVAILABLE` carrying the partial run summary. Already-committed `ToolCall` / fragment / node / link / attribute rows are preserved.
- `4b` Any tool execution raises an uncaught exception inside the service layer (DB outage, schema violation, etc.) -> the inner transaction is rolled back; the `ToolCall` is still written (BR-23) with `validation_outcome = 'error'`; the loop continues to the next `tool_use` (the LLM is informed via the `tool_result` envelope `{ ok: false, error.code: "INTERNAL" }`). A burst of consecutive `'error'` outcomes within one chunk (≥ 3 in a row) is treated as fatal: orchestrator closes the run as `failed` and returns `500 SYSTEM_INTERNAL_ERROR`.
- `4c` LLM produces an `end_turn` without invoking any tool on a given chunk (legitimate — the chunk yielded no extractable knowledge) -> orchestrator records a synthetic `ToolCall` of `tool_name = 'propose_fragment'` with `validation_outcome = 'rejected'` and `result.reason = "NO_EXTRACTION"`? **NO** — this is rejected as a design choice: a no-extraction chunk produces zero `ToolCall` rows for that chunk. The summary aggregator (BR-12) treats absence-of-outcome as zero counts, which is consistent.

**Related endpoint:** operationId: `runLlmExtraction` (POST `/api/v1/ingest/llm-runs/{llmRunId}/run`).

> **Latency note (§16 acceptance):** UC-12 is synchronous and LLM-bound — execution time is dominated by the LLM tool-use loop (minutes per document on typical content). The BFF holds the HTTP connection open for the entire run. This is acceptable for the v1.0.0 single-owner scale; horizontal scaling to a background worker is permanent-future work and is explicitly out of scope (§8).

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

### BR-12 -- Run summary is derived, never stored (UC-04, UC-12)
`LlmRunSummary` is computed at read time as the eight `validation_outcome` counts of the run's `ToolCall` rows. There is no summary column on `llm_run`. Aligns with the global "state dependent on clock or downstream rows is derived" rule (§5.4, A9). UC-12's terminal response uses the same derivation — the orchestrator does not maintain its own counters.

### BR-13 -- Layered validation order is fixed (UC-08, UC-09, UC-10, UC-11)
Every `ingest` propose-* call (MCP, REST mirror or in-process tool-use dispatch from UC-12) runs the §13 layers in this exact order — structural -> graph rules -> temporal -> confidence -> anti-hallucination. Failure at any layer returns the matching error code (BR-14..BR-17) and persists the `ToolCall` with `validation_outcome = 'rejected'`. Rejection is **not** an exception — it is a business result.

### BR-14 -- Structural failures map to STRUCTURAL_INVALID / UNKNOWN_TYPE / NOT_FOUND (UC-08..UC-11)
- Missing/typed fields, wrong references inside the run, value not parseable as `value_type` -> `STRUCTURAL_INVALID`.
- `node_type`, `link_type` or `key` not in the seeded catalog -> `UNKNOWN_TYPE`.
- A referenced `chunk_id`/`fragment_id`/`node_id` that resolves to no row -> `NOT_FOUND`.

### BR-15 -- Graph-rule failures map to RULE_VIOLATION (UC-10)
`propose_link` requires a vigent `LinkTypeRule` row matching `(source_node_type, link_type, target_node_type)`. The 22 seeded rules of §15.2 are the v1 set (seeded by `migrations/0001_init.sql`). Any other triple yields `RULE_VIOLATION`.

### BR-16 -- Temporal failures map to TEMPORAL_INCOHERENT / DATE_UNJUSTIFIED (UC-10, UC-11)
- `valid_from >= valid_to`, or `change_hint = 'correction'` without a fragment text containing an errata signal -> `TEMPORAL_INCOHERENT`.
- The type/key requires a `valid_from` and none of `stated` / `document` (`metadata.document_date`) supplies one — and the BFF cannot fall back to `received` because that fallback is reserved for stable cases — -> `DATE_UNJUSTIFIED`.

### BR-17 -- Confidence routing (UC-10, UC-11)
The created assertion's `status` is determined by `confidence` per A13: `≥ 0.75 -> 'active'`; `0.40 ≤ c < 0.75 -> 'uncertain'`; `c < 0.40 -> the link/attribute is NOT created` — the supporting fragments remain `proposed` and are flagged `low_confidence` in retrieval; the `ToolCall` records `validation_outcome = 'rejected'` with reason `BELOW_CONFIDENCE_FLOOR`.

### BR-18 -- Every accepted assertion has provenance (UC-10, UC-11)
Anti-hallucination layer: at the moment the BFF persists a new `KnowledgeLink` or `NodeAttribute` row (or appends a new `Provenance` row to an existing one on consolidation, BR-25), at least one `Provenance` row is inserted in the same transaction, pointing to an `InformationFragment` whose `FragmentSource` chain anchors a `RawChunk` of the current run's `input_raw_information_id`. If this invariant cannot be satisfied, the entire transaction is aborted and the `ToolCall` is recorded with `validation_outcome = 'rejected'` and code `STRUCTURAL_INVALID` (§13.5).

### BR-19 -- One transaction per tool call (UC-08..UC-11, UC-12)
Each `ingest` propose-* invocation (MCP, REST mirror or in-process tool-use dispatch from UC-12) runs inside a single database transaction (A19). The orchestrator of UC-12 does NOT wrap the per-chunk loop or the run loop in a transaction — each tool call is its own boundary. A run of 50 chunks that fails on chunk 49 keeps the 48 already-accepted units of knowledge; the orphan fragments of the failed call are cleaned up on retry (BR-10).

### BR-20 -- Entity creation is serialised by advisory lock (UC-09)
The BFF wraps the resolve-or-create step in `pg_advisory_xact_lock(hash(node_type_id, norm(name)))` (§4.5). Two concurrent calls proposing the same new entity therefore never create duplicate nodes. The lock guards both the entity-resolution decision (BR-24) and the subsequent INSERT.

### BR-21 -- The `ingest` toolset is dual-transport, transport-agnostic, and only operates inside an active LLMRun (UC-08..UC-12)
The four `ingest` operations (`propose_fragment`, `propose_node`, `propose_link`, `propose_attribute`) are exposed through three equivalent transports:
1. **MCP tool calls** (`@modelcontextprotocol/sdk`, Streamable HTTP) over an MCP session scoped to an ambient `llm_run_id`.
2. **REST mirrors** (POST `/api/v1/ingest/llm-runs/{llmRunId}/propose-*`) for human-driven replay / simulation by the Owner.
3. **In-process tool-use dispatch** from the extraction orchestrator (UC-12) — same service function, no transport hop.

All three transports invoke the same transport-agnostic service function (`proposeFragmentService`, `proposeNodeService`, `proposeLinkService`, `proposeAttributeService`); the Zod input schemas are the single source of truth, with the MCP/JSON-Schema and the REST request schemas derived via `zod-to-json-schema`. Every invocation must be associated with an `LLMRun` whose `status = 'running'`. The BFF rejects calls without that context: REST returns `404 RESOURCE_NOT_FOUND` (run id unknown) or `409 BUSINESS_RUN_NOT_RUNNING` (run exists but is not `running`); MCP returns `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (the LLM only sees its ambient run). This dual-transport design is a deliberate departure from §14 / A28 of v7 (which described `ingest` as MCP-only); the architectural decision is documented in `CLAUDE.md` alongside the Neon deviation.

### BR-22 -- The fragment text is bounded to 1000 characters (UC-08)
`InformationFragment.text` is enforced by `CHECK (char_length(text) <= 1000)` in the schema. Longer assertions must be split into multiple atomic fragments by the LLM (§9.3, rule (a)).

### BR-23 -- ToolCall always records the call (UC-08..UC-11)
Every `ingest` propose-* invocation produces exactly one `ToolCall` row, regardless of outcome — including layered-validation rejections and uncaught service errors (`validation_outcome = 'error'`). The only case where no `ToolCall` is recorded is when the call cannot be associated with any run (BR-21 — no ambient `llm_run_id`), which the transport layer rejects before reaching the handler. This is what makes the run summary (BR-12) auditable.

### BR-24 -- Entity resolution thresholds and decision (UC-09)
The §4 resolution pipeline of `propose_node` uses two named thresholds:
- `MATCH_STRONG = 0.85` — the trigram-similarity ceiling above which a single candidate is taken as a strong match.
- `MATCH_FLOOR = 0.55` — the trigram-similarity floor below which a candidate is ignored entirely.

The decision (A12, per §4.3) is:
- **`matched_existing`** — there is an exact `alias_norm = norm(name)` match (score 1.0), OR there is exactly one candidate with `similarity ≥ MATCH_STRONG` and no second candidate with `similarity ≥ MATCH_FLOOR`. The existing node is reused; any new alias is appended.
- **`needs_review`** — there is any candidate with `similarity ∈ [MATCH_FLOOR, MATCH_STRONG)`, OR there are two or more candidates with `similarity ≥ MATCH_STRONG`. A new `KnowledgeNode` is created with `status = 'needs_review'` and one `EntityMatchReview` row is inserted per candidate (carrying that candidate's `similarity`).
- **`created_new`** — every candidate has `similarity < MATCH_FLOOR` (or there are no candidates). A new `KnowledgeNode` is created with `status = 'active'`.

The two thresholds live in the BFF configuration module — changing either requires a code change, not a runtime knob. The `entity_match_review` rows produced by the `needs_review` branch flow into the existing `entity_match` curation queue and are resolved by the existing `performMerge` service (§4.4) — no curation-side code change is required.

### BR-25 -- Graph consolidation flow for links and attributes (UC-10, UC-11)
`propose_link` and `propose_attribute` do NOT blindly INSERT a new `KnowledgeLink` / `NodeAttribute` row. They invoke the graph-consolidation service, which executes the §6.5 write-graph flow inside the same transaction as the `ToolCall`:

1. **Lookup vigent equivalents** via `SELECT ... FOR UPDATE` (A11):
   - For links: rows with the same `(source_node_id, link_type_id, target_node_id)` that are vigent (`valid_to IS NULL AND superseded_at IS NULL`), PLUS — when `link_type.allows_multiple_current = false` — sibling vigent rows with the same `(source_node_id, link_type_id)` (functional siblings).
   - For attributes: rows with the same `(node_id, attribute_key_id)` that are vigent, PLUS — when `attribute_key.allows_multiple = false` — they collapse to a single sibling.
2. **Decide the outcome:**
   - **`consolidated`** — there is a vigent equivalent with the same value AND the same `valid_from`: no new row; append a new `Provenance` row to the existing row (re-affirmation, §18). Returned `validation_outcome = 'consolidated'`.
   - **`superseded_previous`** — functional cardinality conflict (different target/value, `allows_multiple_current = false`) AND the cited fragments carry a textual succession signal (e.g. "deixou de", "passou a", "novo"): close the previous row (`valid_to = new.valid_from`, `superseded_at = now()`, `status = 'superseded'`) and INSERT the new row chained via `supersedes_link_id` / `supersedes_attribute_id`. Returned `validation_outcome = 'superseded_previous'`.
   - **`correction`** — `change_hint = 'correction'` AND the cited fragments carry an errata signal (e.g. "errata", "correção"): close the previous row with `status = 'corrected'` and INSERT the new row chained via the same supersedes-* FK. Returned `validation_outcome = 'accepted'` (correction is an accepted write; the audit trail lives in the supersedes-* chain). If `change_hint = 'correction'` is set but no errata signal is found in the cited fragments, the call is rejected with `TEMPORAL_INCOHERENT` (BR-16).
   - **`disputed`** — divergent value with overlapping period, no succession signal, no correction signal: BOTH the previous and the new row are updated to `status = 'disputed'` (the new row is INSERTed in that status). Returned `validation_outcome = 'disputed'`.
   - **`accepted`** (default) — no vigent equivalent exists: INSERT a new row with the confidence-routed `status` (BR-17). Returned `validation_outcome = 'accepted'` (`active` or `uncertain` per BR-17).
3. **Always** insert at least one `Provenance` row per cited `fragment_id` pointing to the relevant link/attribute row (BR-18).

The DB partial-unique guards (`knowledge_link_current_dup_guard`, `node_attribute_current_dup_guard`) are no longer reachable in the happy path — consolidation collapses re-affirmations before they become INSERTs. If they ever fire (race with another transaction), the service catches SQLSTATE `23505` on those constraint names and retries the lookup-and-decide step inside the same transaction; on a second failure, the call is rejected with `STRUCTURAL_INVALID` and the `ToolCall` is recorded with `validation_outcome = 'rejected'`.

### BR-26 -- Extraction orchestrator drives the LLM in-process (UC-12)
The extraction orchestrator implements `runLlmExtraction` as a synchronous in-process loop against the Anthropic SDK (`@anthropic-ai/sdk`). It MUST:

1. Read `model`, `prompt_version` from the target `LLMRun` row — these were declared at intake (UC-01) and participate in `idempotency_key` (BR-08). The orchestrator never overrides them.
2. Load a CatalogSnapshot of the §15 seed (8 NodeTypes, 10 LinkTypes + 22 rules, 10 AttributeKeys) in memory at startup; pass it as part of the SYSTEM prompt. The snapshot is invalidated only by a BFF restart (catalog mutation requires a migration — see §8).
3. Iterate the run's `RawChunk` rows in `chunk_index` ascending order. For each chunk: build SYSTEM (extraction contract + catalog) + USER (document metadata + chunk text framed as data per §13 anti-injection + `prev_tail ≈ 200 chars` of the previous chunk for continuity).
4. Run a **manual** tool-use loop (NOT the SDK tool-runner): `client.messages.stream(...)` with the four `ingest` tools (`input_schema` derived from the Zod schemas via `zod-to-json-schema` — same schemas as MCP and REST, BR-21); call `finalMessage()` to obtain the assistant turn; append the full `response.content` to the next request (preserving `tool_use` block identifiers); for each `tool_use`, invoke the in-process service function and feed back a `tool_result` block carrying the verbatim envelope plus the resulting `validation_outcome`. Stop the chunk when `stop_reason === "end_turn"`. Handle `pause_turn` (resume once) and `refusal` (close the chunk loop, preserve the refusal text in the next `ToolCall.result`).
5. Each tool execution is its own transaction (BR-19). The orchestrator does NOT open a transaction around the chunk loop or the run loop.
6. After the last chunk (clean finish), close the run (UC-07) with `status = 'completed'`. On a fatal exception (Anthropic provider auth/quota/network, or ≥ 3 consecutive `'error'` outcomes within one chunk), close the run with `status = 'failed'`.
7. Never override the `prompt_version` declared at intake — bumping the prompt requires a new `LLMRun` (BR-08 / BR-09).

The `ANTHROPIC_API_KEY` is read from the BFF env at startup, validated by the Zod env schema, and never logged or returned in any response (CLAUDE.md "Security").

---

## 5. State Machine

> Two state machines live in this domain: `LLMRun` (the central one) and `InformationFragment`. The `KnowledgeNode` lifecycle is touched by UC-09 (introducing the `needs_review` initial state); the `KnowledgeLink` / `NodeAttribute` lifecycles are touched by UC-10 / UC-11 through the graph-consolidation flow (BR-25). These three are summarised below for traceability — their full lifecycle (including merges and curator-driven resolutions) is owned by the curation domain (§7).

### 5.1 ST-LR -- LLMRun lifecycle

```
[running] --close ok (UC-12 end_turn)--> [completed]
[running] --close err (UC-12 fatal)----> [failed]
[failed]  --retry (UC-06)--------------> [running]   (attempts += 1, finished_at -> NULL)
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (nothing) | `ingestRawInformation` creates a new run | running | `idempotency_key` not already used by a non-failed run | UC-01 |
| running | clean finish of UC-12 extraction loop | completed | service layer sets `finished_at = now()` | UC-07 (driven by UC-12) |
| running | fatal exception inside UC-12 | failed | service layer sets `finished_at = now()` | UC-07 (driven by UC-12) |
| failed  | `retryLlmRun` | running | atomic update: `attempts += 1`, `finished_at = NULL`, orphan `proposed` fragments -> `rejected` | UC-06 |
| running | `runLlmExtraction` | running | no transition — must already be running; `409 BUSINESS_RUN_NOT_RUNNABLE` otherwise | UC-12 |
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
| proposed | `propose_link` / `propose_attribute` cites it and is accepted/consolidated | accepted | a `Provenance` row referencing this fragment is committed | UC-10, UC-11 |
| proposed | curation rejects (out of scope of ingestion) OR `retryLlmRun` finds it as orphan | rejected | reason recorded in `ToolCall` (for retry) or `CurationAction` (for curation) | UC-06 |
| proposed | confidence < 0.40 AND never cited | proposed | stays `proposed`; surfaced via `low_confidence` flag (BR-17) | UC-10, UC-11 |
| accepted | newer run supersedes | superseded | out of scope here (handled by curation) | — |
| any | `compliance_delete` of the raw source | deleted | out of scope here (compliance domain) | — |

### 5.3 ST-KN (partial) -- KnowledgeNode initial state and resolution outcomes (touched by UC-09)

> Full lifecycle (merge, deactivation) lives in the curation domain. Listed here only for the states this domain writes.

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (nothing) | `propose_node` decides `created_new` | active | resolution per BR-24 finds no candidate ≥ `MATCH_FLOOR` | UC-09 |
| (nothing) | `propose_node` decides `needs_review` | needs_review | resolution per BR-24 finds an ambiguous candidate (any in `[0.55, 0.85)` or ≥ 2 ≥ 0.85); one `EntityMatchReview` row per candidate is inserted | UC-09 |
| needs_review | curator resolves the `entity_match` queue via `performMerge` | merged | out of scope here (curation domain owns the transition) | — |
| active | curator merges via `performMerge` | merged | out of scope here (curation domain owns the transition) | — |

### 5.4 ST-KL / ST-NA (partial) -- KnowledgeLink / NodeAttribute outcomes from consolidation (touched by UC-10, UC-11)

> Listed for the outcomes this domain writes through BR-25. Full lifecycle (curation confirm/reject/correct, conflict resolution) lives in the curation domain.

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (nothing) | `propose_link` / `propose_attribute` decides `accepted` (confidence ≥ 0.75) | active | no vigent equivalent; confidence floor cleared | UC-10, UC-11 |
| (nothing) | `propose_link` / `propose_attribute` decides `accepted` (0.40 ≤ confidence < 0.75) | uncertain | no vigent equivalent; confidence below the high floor (BR-17) | UC-10, UC-11 |
| active | functional sibling with succession signal arrives | superseded | BR-25 succession branch — `valid_to` set, `superseded_at = now()`, new row chained | UC-10, UC-11 |
| active | functional sibling with errata signal arrives | corrected | BR-25 correction branch — old row marked `corrected`, new row chained | UC-10, UC-11 |
| active OR uncertain | divergent vigent equivalent arrives without succession/correction signal | disputed | BR-25 dispute branch — both rows flipped to `disputed` | UC-10, UC-11 |
| any vigent | curator runs `confirm_item` / `reject_item` / `resolve_dispute` | (curator-decided) | out of scope here (curation domain) | — |

---

## 6. Error Behaviors

> All HTTP statuses >= 400 from REST endpoints, plus the MCP envelope error codes used by `ingest` tools. Every code is registered in the global catalog (`docs/specs/_global/error-codes.md`).

### 6.1 REST errors

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without JWT, or JWT invalid/expired/malformed | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (cf. C16). |
| `RawInformation` or `LLMRun` id not found | 404 | `RESOURCE_NOT_FOUND` | UC-02, UC-03, UC-04, UC-05, UC-06 alt `2a`, UC-08..UC-11 (REST mirrors), UC-12 alt `2a`. |
| Missing required field in `ingestRawInformation` body (or in a REST propose-* mirror) | 422 | `VALIDATION_REQUIRED_FIELD` | UC-01 alt `1a`, UC-08..UC-11 (REST mirrors). |
| Field with invalid format (non-enum `source_type`, malformed UUID, or other format violation) | 422 | `VALIDATION_INVALID_FORMAT` | UC-01 alt `1b`, UC-08..UC-11 (REST mirrors). |
| `content` exceeds 10 MiB / `prompt_version` empty / out-of-range numeric input | 422 | `VALIDATION_OUT_OF_RANGE` | UC-01 alt `1c`, UC-08..UC-11 (REST mirrors). |
| `retryLlmRun` called against a `running` or `completed` run | 409 | `BUSINESS_RUN_NOT_RETRYABLE` | UC-06 alt `2b`. |
| `runLlmExtraction` called against a `completed` or `failed` run | 409 | `BUSINESS_RUN_NOT_RUNNABLE` | UC-12 alt `2b`. |
| REST propose-* mirror called against a run whose `status <> 'running'` | 409 | `BUSINESS_RUN_NOT_RUNNING` | UC-08..UC-11 alt `1a` (REST branch). |
| Anthropic SDK transport fails non-recoverably during UC-12 | 502 | `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | UC-12 alt `4a`. |
| Unexpected internal failure (chunker error, DB outage, ≥ 3 consecutive tool-call errors in UC-12, unhandled exception) | 500 | `SYSTEM_INTERNAL_ERROR` | UC-01 alt `5a`, UC-12 alt `4b`. |

### 6.2 MCP `ingest` envelope errors (response is `{ ok: false, error: { code, message, details } }`)

| Situation | MCP error.code | Description |
|-----------|----------------|-------------|
| Required field missing, type mismatch, length/range violation, or cross-table compatibility failure (chunk not in run, key/value type mismatch, chunk does not belong to run's source) | `STRUCTURAL_INVALID` | UC-08..UC-11. |
| No ambient `llm_run_id`, or ambient run not `running` (MCP transport collapses these into one) | `STRUCTURAL_INVALID` | UC-08..UC-11 alt `1a` (MCP branch). |
| `node_type` / `link_type` / `key` not in the seeded catalog | `UNKNOWN_TYPE` | UC-09, UC-10, UC-11. |
| `propose_link` triple not authorised by any vigent `LinkTypeRule` | `RULE_VIOLATION` | UC-10. |
| `valid_from >= valid_to`, or `change_hint = 'correction'` without errata signal | `TEMPORAL_INCOHERENT` | UC-10, UC-11. |
| `requires_valid_from = true` and none of `stated` / `document` supplies a date | `DATE_UNJUSTIFIED` | UC-10, UC-11. |
| Referenced `chunk_id` / `fragment_id` / `node_id` does not exist | `NOT_FOUND` | UC-08..UC-11. |
| Unhandled internal exception in service layer | `INTERNAL` | UC-08..UC-11. |

Auth errors are handled at the BFF middleware layer (Neon Auth JWT validation, same path as REST — §2.5 of v7 / A29); they surface to the MCP client as the standard REST `401` response — the MCP envelope is only used for layered-validation outcomes.

> Business outcomes (`consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`) are **not** errors. They are returned in `result.outcome` of the envelope (`{ ok: true, ... }`) and recorded as `validation_outcome` in the corresponding `ToolCall` row (§14, §3.5). This is true for all three transports — MCP, REST mirror and in-process tool-use dispatch from UC-12.

---

## 7. Cross-Domain Dependencies

> Bidirectional — if this domain lists X, X must list this domain back when it is specified.

| Domain | Type | Description |
|--------|------|-------------|
| retrieval (future) | produces | The chunks, fragments, runs, nodes, links and attributes persisted here become inputs of the retrieval pipeline (§7). |
| curation (existing) | produces, consumes | This domain **produces** `entity_match` review work: `propose_node` (UC-09) inserts `KnowledgeNode` rows with `status = 'needs_review'` plus one `EntityMatchReview` row per ambiguous candidate (BR-24), feeding the curator's `entity_match` queue. Disputed `KnowledgeLink` / `NodeAttribute` rows produced by the consolidation flow (BR-25) feed the `disputed` queue. This domain **consumes** the curator's `performMerge` service via the existing `merge_nodes` curation tool — there is no merge logic in this domain; UC-09's `needs_review` outcome relies on the curator to resolve it later. The curation domain may also call `compliance_delete` on a `RawInformation` of this domain (§11). |
| compliance (future) | synchronizes | `compliance_delete` is the only writer permitted to mutate a `RawInformation` row of this domain; it overwrites `content` with `"[REDACTED]"` (BR-02 carve-out) and propagates `status = 'deleted'` to chunks/fragments. |
| Anthropic API (external) | consumes | UC-12's extraction orchestrator calls the Anthropic Messages API via `@anthropic-ai/sdk` (`client.messages.stream(...)`) to drive the per-chunk tool-use loop. The API key (`ANTHROPIC_API_KEY`) and the SDK live entirely on the BFF — no other module in the system originates LLM calls (CLAUDE.md "Security", §2 of v7). |

This domain depends on no other internal domain to function in isolation; the rows it owns or writes (`raw_information`, `raw_chunk`, `information_fragment`, `fragment_source`, `llm_run`, `tool_call`, `knowledge_node`, `node_alias`, `entity_match_review`, `knowledge_link`, `node_attribute`, `provenance`) are self-contained inside one PostgreSQL transaction per tool call.

---

## 8. Out of Scope

- **Retrieval (§7).** `search`, `traverse`, `get_node`, `get_history`, `get_provenance` belong to the future `retrieval` domain.
- **Curation (§10).** `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` belong to the existing `curation` domain. UC-09's `needs_review` outcome is resolved later by that domain's `performMerge` service — there is no merge logic in this domain.
- **Compliance deletion (§11).** `compliance_delete` and `ComplianceDeletion` belong to the future `compliance` domain. Its semantics (tombstone, propagation, audit row) is referenced here only because it is the lone writer permitted to mutate `RawInformation` rows post-creation.
- **System-time travel (consulta (c) of §5.3, A25).** Permanently deferred at this layer: this domain writes `recorded_at` on every row it owns (the schema does), but exposes no endpoint to query "what the system knew at instant T".
- **Embeddings / vector search (§20.1, A24).** Permanent non-goal. No embedding column on `RawChunk`, `InformationFragment` or any other row of this domain, ever.
- **Multi-tenant / `User` entity (§2.3, §20.3, A20).** Permanent non-goal.
- **Free-form schema evolution for the seeded catalog.** New `NodeType` / `LinkType` / `AttributeKey` rows enter through versioned SQL migrations (§12), not through this domain's API. A migration invalidates the in-memory CatalogSnapshot (BR-26) only on a BFF restart.
- **Asynchronous extraction (worker queue).** UC-12 is synchronous and LLM-bound. Horizontal scaling to a background worker is a permanent-future concern at the v1.0.0 scale (single-owner, hundreds of documents) and is not part of this version.
- **Re-chunking of existing documents.** Bumping `chunking_version` requires a new migration and is not exposed at the API in v1.0.0 (BR-03).
- **LLM provider abstraction.** The orchestrator binds to Anthropic via `@anthropic-ai/sdk` directly; swapping providers requires a code change. No provider-neutral abstraction layer.

---

## 9. Local Glossary

> Domain-specific terms not already in the global glossary.

| Term | Definition |
|------|------------|
| RawInformation | The immutable original document, exactly as received (§3.1). Has a unique `content_hash`. |
| RawChunk | A deterministic slice of a `RawInformation`'s `content`, defined by `(chunking_version, chunk_index, offset_start, offset_end)`. Anchors provenance and full-text search (§3.1, §9.2). |
| InformationFragment | An atomic LLM-extracted claim (a complete subject–predicate–object sentence). Carries `confidence` and lives in `status ∈ {proposed, accepted, rejected, superseded, deleted}` (§3.2). |
| LLMRun | A logical extraction session driven by a model + prompt version against one `RawInformation`. Uniquely identified by `idempotency_key`. Retry reopens the same row (§3.5, §8). |
| ToolCall | Audit row of one `ingest` propose-* invocation (MCP, REST mirror or in-process tool-use dispatch), with verbatim arguments, raw result and `validation_outcome` (§3.5). |
| Extraction orchestrator | The in-process service layer of UC-12: iterates the chunks of a running `LLMRun`, drives the Anthropic SDK tool-use loop per chunk, invokes the propose-* service functions through the in-process transport, and closes the run via UC-07. |
| Entity resolution | The §4 pipeline executed inside `propose_node` (UC-09): exact alias match → trigram candidates → A12 decision (BR-24). The advisory lock of BR-20 serialises concurrent calls for the same `(node_type, normalized name)`. |
| Graph consolidation | The §6.5 write-graph flow executed inside `propose_link` / `propose_attribute` (UC-10, UC-11): lookup vigent equivalents under `FOR UPDATE`, then decide between consolidation / succession / correction / dispute / accepted (BR-25). |
| CatalogSnapshot | The in-memory copy of the §15 catalog (NodeType, LinkType, LinkTypeRule, AttributeKey) loaded at BFF startup. Used by both the validation layer (BR-15) and the orchestrator (BR-26). |
| Idempotency key (of a run) | `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` (A18). Determines whether re-ingestion is a no-op or opens a new run. |
| Chunking version | Tag of the deterministic chunking strategy. Currently always `'v1'` (§9.2). Bumping it requires a new migration and a new ingestion. |
| Content hash | `sha256(content)` of a `RawInformation`, hex-encoded lowercase, 64 chars. The unique anchor of ingestion idempotency (§8). |
| Provenance (relative to ingestion) | The `Provenance` row that pins a `KnowledgeLink` / `NodeAttribute` to an `InformationFragment` produced inside an `LLMRun`. The ingestion domain enforces that this row exists for every accepted or consolidated link/attribute (BR-18, BR-25). |
| EntityMatchReview | A row produced by the `needs_review` branch of BR-24, carrying the trigram `similarity` of an ambiguous candidate against the proposed name. Consumed by the curation domain's `entity_match` queue. |
| Layered validation | The 5-layer pipeline of §13 — structural, graph rules, temporal, confidence, anti-hallucination — applied to every `ingest` propose-* call. |
| MCP envelope | `{ ok: true, result }` / `{ ok: false, error: { code, message, details } }` — the common response shape of every `ingest` invocation. The REST mirrors return the same envelope as the body of the HTTP response. |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial ingestion-domain specification: source layer (§3.1), extraction layer (§3.2), audit layer (§3.5), idempotency (§8), end-to-end flow (§9), layered validation (§13) and the MCP `ingest` toolset (§14.1). Aligned with v7 normative source and with `migrations/0001_schema.sql` + `migrations/0002_seed.sql`. | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | update | Auth provider swap (descriptive only — no UC / BR / ST changes): Supabase Auth → Neon Auth (Stack Auth). Updated §2 (Owner actor description references Neon Auth; the single-owner footnote now points to `requireNeonAuth` middleware, the JWKS endpoint `${NEON_AUTH_URL}/.well-known/jwks.json` with EdDSA, and `DATABASE_URL` as the Postgres credential — none of which leave the BFF) and §6.2 (auth-error footnote names Neon Auth). The §2.5 / A29 references to v7 are preserved because the architectural decision (auth-as-gate, RLS off, no `User` entity) is unchanged — only the provider differs. No new error codes; no changes to UC pre/post conditions or alternative flows (the wording "valid JWT" remains provider-neutral by intent). | migrate-neon |
| 1.2.0 | 2026-06-12 | Spec Writer | update | Ingestion extraction pipeline (text → graph) brought in scope. (1) Added **UC-12 `runLlmExtraction`** — a new REST endpoint `POST /api/v1/ingest/llm-runs/{llmRunId}/run` that drives a synchronous, in-process Anthropic SDK tool-use loop over the run's chunks, invoking the same transport-agnostic propose-* service functions used by MCP and REST. (2) Updated UC-08..UC-11 to be **dual-transport** (MCP tool + REST mirror + in-process tool-use dispatch from UC-12) — same business semantics, single service implementation. (3) Updated **BR-21** to remove the MCP-only constraint and document the three transports + the `BUSINESS_RUN_NOT_RUNNING` REST mapping. (4) Promoted **entity resolution (§4)** from "out of scope (future entity-resolution domain)" to in-scope under UC-09; added **BR-24** with the named thresholds `MATCH_STRONG = 0.85`, `MATCH_FLOOR = 0.55` and the three-way decision (matched_existing / needs_review / created_new). (5) Promoted **graph consolidation (§6.5)** from "out of scope (future graph-consolidation domain)" to in-scope under UC-10/UC-11; added **BR-25** with the lookup-and-decide flow (consolidated / superseded_previous / correction / disputed / accepted). (6) Added **BR-26** specifying the extraction orchestrator (model/prompt_version from `LLMRun`, CatalogSnapshot, manual tool-use loop, one-transaction-per-tool-call). (7) Updated §5 with partial state machines ST-KN, ST-KL, ST-NA listing the states this domain writes; full lifecycles remain owned by the curation domain. (8) Updated §6.1 with three new REST error codes: `BUSINESS_RUN_NOT_RUNNABLE` (UC-12 alt 2b), `BUSINESS_RUN_NOT_RUNNING` (UC-08..UC-11 REST mirrors alt 1a), `SYSTEM_LLM_PROVIDER_UNAVAILABLE` (UC-12 alt 4a). (9) Updated §7 cross-domain dependencies — removed the `graph-consolidation (future)` and `entity-resolution (future)` "consumes" rows (now in-scope), retained the `curation` row noting bidirectional dependency on `performMerge` and the `entity_match` queue, and added the Anthropic API external integration row. (10) Updated §8 out-of-scope accordingly. No schema change required — `migrations/0001_init.sql` already supports the full set of writes (catalog seed, `entity_match_review`, partial-unique guards, `pg_trgm` index `node_alias_norm_trgm_idx`). | ingestion-extraction |
