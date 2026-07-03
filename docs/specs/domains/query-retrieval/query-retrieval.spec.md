# Query / Retrieval -- Business Specification

> Version: 1.5.0 | Status: approved | Layer: permanent
> Technical contract: `openapi.yaml`
> Source of truth: `/remember-modelagem-v7.md` (sections 7, 13, 16, 17, 20 + ADRs A2, A3, A4, A15, A16, A21, A22, A23, A24, A25, A26, A28, A29)
> Schema reference: `/migrations/0001_schema.sql`, `/migrations/0002_seed.sql`

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Expose the deterministic full-text + graph retrieval pipeline of section 7 and the cross-layer provenance walk of section 14.3, so the SPA (via REST) and the LLM-as-orchestrator (via MCP) can answer questions with citations, while honoring the temporal model and the permanent ban on embeddings. v1.4.0 adds a narrow, read-only listing endpoint over accepted `information_fragment` rows -- a curator-facing helper consumed by the SPA's `CorrectionForm` DateJustification picker (see UC-10). |
| Core entity | The pipeline itself (no aggregate root); inputs are `RawChunk`, `InformationFragment`, `NodeAlias`, `KnowledgeNode`, `KnowledgeLink`, `NodeAttribute`, `Provenance`, `FragmentSource`, `RawInformation` -- all owned by other domains. This domain is a stateless read facade. |
| Bounded context | (a) Query parsing with `websearch_to_tsquery` on two configurations (`pt_unaccent_v1`, `simple_unaccent_v1`); (b) three-layer scored full-text retrieval (fragment 1.0 / node 0.9 / chunk 0.6); (c) fragment-vs-chunk dedup; (d) graph expansion via the `traverse` service of `knowledge-graph` (depth default 1, max 3, decay 0.5 per hop); (e) temporal filters `as_of` / `in_effect_only` / `include_uncertain`; (f) cross-layer provenance walk to `RawInformation`; (g) accepted-fragment listing by source (UC-10), a read-only helper for the SPA curation flow. |
| Out of scope | Embeddings / semantic similarity / `pgvector` (permanent non-goal, section 20.1 / ADR A24); synonym dictionary plugged into the FTS configs (ADR A4, deferred); system-time travel (query (c), ADR A25); writes; point reads of single graph entities (those live in `knowledge-graph`); curation; compliance deletion execution. See section 8. |

---

## 2. Actors

> Single-owner system per ADR A20 / section 2.3. There is no `User` entity. Authentication exists as a network-access gate (section 2.5 / ADR A29).

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner | The single data owner authenticated via Neon Auth (Stack Auth) -- JWT validated in BFF middleware against the Neon Auth JWKS endpoint, reaching the BFF from the SPA over the network. | Call `searchKnowledge` with any combination of supported parameters; call `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment` for any consolidated row; call `listAcceptedFragments` to enumerate accepted fragments by source. Write operations are NOT exposed by this domain. |
| LLM (orchestrator) | The LLM acting as orchestrator/redactor over the same service layer via the MCP `query` toolset (`search`, `get_provenance`). | Same retrieval permissions as Owner. The JWT is provisioned to the LLM by the Owner's runtime. The LLM does NOT perform retrieval "from memory" -- it MUST call the deterministic tools and cite the returned provenance (sections 2.1, 7, principle 15). `listAcceptedFragments` is REST-only (curator helper) and NOT exposed on the MCP `query` toolset -- the LLM does not need it (it reaches accepted fragments through `search`). |

> Both actors hit the SAME service layer (REST + MCP are facades over a single core, ADR A28). This domain's REST contract is identical to the MCP-side `query` toolset for `search` and `get_provenance`. `listAcceptedFragments` is the only REST-only endpoint in the domain (see §8 / UC-10).

---

## 3. Use Cases

> **Wire envelope (since v1.2.0 / BR-19).** Every 2xx success response in this domain is wrapped as `{ ok: true, result: <Payload> }` -- symmetric with the existing error envelope `{ ok: false, error: { code, message, details? } }` (unchanged). The Use Cases below name the inner `Payload` (`SearchResponse`, `ProvenanceResponse`, `AcceptedFragmentList`); the wrapping is uniform across all five endpoints. The MCP transports render the same logical outcome as MCP 2025-06-18 `content` / `isError`; the `{ ok, result }` wrap is REST-only (see BR-19).

### UC-01 -- Free-text search across all three layers (happy path)

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; the catalog and at least one accepted `InformationFragment` exist. | **Post:** Owner receives a ranked, paginated, deduplicated list of items spanning the three layers, each with a non-empty `provenance[]`.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=reuniao%20implantacao%20apollo`.
2. BFF middleware validates the JWT (section 2.5).
3. Service layer parses `query` with `websearch_to_tsquery('pt_unaccent_v1', query)` for the fragment and chunk layers and `websearch_to_tsquery('simple_unaccent_v1', query)` for the node-alias layer (section 7.1).
4. Service layer runs three parallel SQL queries:
   - `SELECT id, ts_rank_cd(text_search, $tsquery) AS rank FROM information_fragment WHERE status = 'accepted' AND text_search @@ $tsquery` -> score = `rank * 1.0`.
   - `SELECT na.node_id, ts_rank_cd(to_tsvector('simple_unaccent_v1', na.alias), $tsquery) AS rank FROM node_alias na JOIN knowledge_node kn ON kn.id = na.node_id WHERE to_tsvector('simple_unaccent_v1', na.alias) @@ $tsquery AND kn.status NOT IN ('merged', 'deleted')` -> score = `rank * 0.9`.
   - `SELECT id, ts_rank_cd(text_search, $tsquery) AS rank FROM raw_chunk WHERE text_search @@ $tsquery` -> score = `rank * 0.6`.
5. Service layer collapses each chunk hit that supports a fragment already in the result set (`SELECT fragment_id FROM fragment_source WHERE raw_chunk_id IN (...) AND fragment_id IN (<fragments already in result>)`); the chunk excerpt is folded into the fragment's `provenance[]` (BR-04 dedup).
6. Service layer performs graph expansion when `expand=true` (default): for each `node` hit, traverse via the knowledge-graph `traverse` service (`knowledge-graph` UC-06 with `depth = expand_depth`, `direction = both`, `as_of` / `in_effect_only` propagated, `link_types = expand_link_types`); reached `KnowledgeLink` rows enter the result with `kind = "link"`, `hop = h`, `score = 0.5^h * node_score` (BR-06).
7. Service layer assembles `provenance[]` for every item: for `link` -> the `Provenance` rows attached; for `fragment` -> the fragment itself; for `node` -> the union over the matching aliases' provenances. Every item MUST end with `provenance.length >= 1` (BR-13).
8. Service layer sorts by `score` DESC, then `recorded_at` DESC (BR-07), and applies `limit` / `offset`.
9. BFF returns `200` with envelope `{ ok: true, result: SearchResponse }` -- where `SearchResponse = { query, total, limit, offset, items }` (BR-19).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`.
- `3a` `query` is empty (after `btrim`), exceeds 1000 chars, or `websearch_to_tsquery` parses to an empty `tsquery` (only stopwords / only operators) -> 422 `BUSINESS_INVALID_SEARCH_QUERY`.
- `4a` `layers[]` contains a value outside `{fragment, node, chunk}` -> 422 `BUSINESS_INVALID_SEARCH_LAYER`.
- `4b` Full-text returns zero rows in every layer -> 200 with envelope `{ ok: true, result: { total: 0, items: [], ... } }` (NOT an error; covers cenario C11).
- `6a` `expand_depth` outside `[1, 3]` -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH`.
- `6b` `expand_link_types[]` contains a name not in `link_type.name` -> 422 `BUSINESS_UNKNOWN_LINK_TYPE`.
- `8a` `limit` outside `[1, 100]` or `offset` < 0 -> 422 `VALIDATION_OUT_OF_RANGE`.
- `9a` Database connectivity / unexpected error -> 500 `SYSTEM_INTERNAL_ERROR`; database read timeout -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-02 -- Search with valid-time travel (`as_of`)

**Actor:** Owner | **Pre:** Owner is authenticated; `as_of` is a parseable ISO date `YYYY-MM-DD`. | **Post:** Owner sees results where the `link` items satisfy the validity-axis filter at `as_of`, and the expansion step uses the same anchor.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=apollo&as_of=2026-06-15`.
2. BFF middleware validates the JWT.
3. Service layer parses `as_of` and propagates it to:
   - the `link` filters used during expansion (BR-06): `(valid_from IS NULL OR valid_from <= as_of) AND (valid_to IS NULL OR valid_to > as_of)` plus `superseded_at IS NULL` (query (b), section 5.3 / `knowledge-graph` BR-08);
   - the `knowledge-graph traverse` call (passing `as_of` parameter through).
4. Direct full-text hits (`fragment`, `chunk`, `node`) are NOT date-filtered (the full-text data is timeless from the validity-axis perspective; fragments are anchored to documents, not to validity intervals). Their `provenance.received_at` is informational.
5. BFF returns `200` with envelope `{ ok: true, result: SearchResponse }` (BR-19).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `as_of` not parseable as ISO `YYYY-MM-DD` -> 422 `VALIDATION_INVALID_FORMAT`.
- (Remaining errors as UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-03 -- Search restricted to a subset of layers

**Actor:** Owner | **Pre:** Owner is authenticated. | **Post:** Owner sees only items whose `layer` is in the requested subset.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=apollo&layers=fragment&layers=node`.
2. BFF middleware validates the JWT.
3. Service layer skips the chunk SQL query entirely; runs fragment + node queries.
4. Dedup step (UC-01 step 5) still runs against the remaining set; expansion (step 6) still runs from `node` hits when `expand=true`.
5. BFF returns `200` with envelope `{ ok: true, result: SearchResponse }` where every `item.layer` is in the requested subset (BR-19).

**Alternative flows:**
- `3a` `layers[]` contains a value outside `{fragment, node, chunk}` -> 422 `BUSINESS_INVALID_SEARCH_LAYER`.
- (Remaining errors as UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-04 -- Search with `in_effect_only=true` (cenario C12)

**Actor:** Owner | **Pre:** Owner is authenticated. | **Post:** Owner sees only items that are `is_in_effect = true` at `current_date` (or at `as_of` when also provided). Items asserted but with `valid_from > current_date` (future facts) are excluded.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=apollo%20participantes&in_effect_only=true`.
2. BFF middleware validates the JWT.
3. Service layer adds, on the link filters and on the expansion: `is_in_effect = true` (which the views `knowledge_link_resolved` / `node_attribute_resolved` already compute -- section 5.4 / `knowledge-graph` BR-09).
4. Direct full-text hits on `fragment` and `chunk` are NOT filtered (they have no validity axis).
5. BFF returns `200` with envelope `{ ok: true, result: SearchResponse }` (BR-19).

**Alternative flows:**
- (As UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-05 -- Search that produces zero results due to permanent lexical limitation (cenario C11)

**Actor:** Owner | **Pre:** Owner is authenticated; the query has no character overlap with any indexed text. | **Post:** Owner receives `200` with `result.total = 0`, `result.items = []`.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=Iniciativa%20Lunar` while the corpus is the Apollo dataset (cenario C1).
2. BFF middleware validates the JWT.
3. Service layer parses the query. `websearch_to_tsquery` produces a valid (non-empty) `tsquery`; the three SQL queries return zero rows because no character bridge exists between "lunar / iniciativa" and "Apollo / implantacao" / "projeto".
4. BFF returns `200` with envelope `{ ok: true, result: { total: 0, items: [], query, limit, offset } }` (BR-19). THIS IS THE CONTRACT (BR-11 / section 20.1 / ADR A24): synonym / paraphrase without character overlap returns zero. The escape valve is curation (`entity_match`) -- belongs to the `curation` domain.

**Alternative flows:**
- (As UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-06 -- Search surfaces `uncertain` / `low_confidence` / `disputed` via flags (cenario C13)

**Actor:** Owner | **Pre:** Owner is authenticated; the corpus contains at least one row with `status = 'uncertain'` and/or `status = 'disputed'`, and/or one accepted fragment carrying `low_confidence` (corroborated after originally being below 0.40). | **Post:** Owner sees those rows in the ranked list, each with the correct `flags[]` populated.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=apollo` (defaults: `include_uncertain=true`).
2. BFF middleware validates the JWT.
3. Service layer runs the three-layer search and the expansion. For each item:
   - `status = 'uncertain'` -> add `"uncertain"` to `flags[]`.
   - `status = 'disputed'` -> add `"disputed"` to `flags[]` (independent of `include_uncertain`).
   - `kind = 'fragment'` AND the fragment's original `confidence < 0.40` AND it was later promoted via corroboration (cenario C14) -> add `"low_confidence"` to `flags[]`. (ADR A26 / section 7.3.)
4. Rows with `status IN ('superseded', 'deleted')` are NEVER returned by `search` (history walks belong to `knowledge-graph` `getLinkHistory` / `getAttributeHistory` -- BR-08).
5. BFF returns `200` with envelope `{ ok: true, result: SearchResponse }` (BR-19).

**Alternative flow `1a`:** Owner calls with `include_uncertain=false`. Service layer excludes rows with `status = 'uncertain'` entirely; `disputed` rows still appear flagged.

**Alternative flows:**
- (As UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-07 -- Walk the full provenance chain of a `KnowledgeLink`

**Actor:** Owner | **Pre:** Owner is authenticated; `link_id` corresponds to an existing `KnowledgeLink` whose underlying `RawInformation` rows have NOT been tombstoned. | **Post:** Owner sees every fragment that supports the link, with its supporting chunks (offsets + excerpt) and the parent `RawInformation` metadata.

**Main flow:**
1. Owner calls `GET /api/v1/provenance/links/{link_id}`.
2. BFF middleware validates the JWT.
3. Service layer reads `knowledge_link.id`. If absent -> 404.
4. Service layer joins `provenance` (where `link_id = $1`) -> `information_fragment` -> `fragment_source` -> `raw_chunk` -> `raw_information`.
5. Service layer checks each `raw_information.status`: if ANY is `deleted` (compliance_delete tombstone, section 11) -> 410 `BUSINESS_RAW_INFORMATION_DELETED` (BR-11).
6. Service layer computes `excerpt = chunk.text[offset_start:offset_end)` using Unicode code-point indexing (BR-12 / ADR A22).
7. BFF returns `200` with envelope `{ ok: true, result: ProvenanceResponse }` (BR-19).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Link not found -> 404 `RESOURCE_NOT_FOUND`.
- `5a` Underlying `RawInformation` tombstoned -> 410 `BUSINESS_RAW_INFORMATION_DELETED`.
- `7a` Database connectivity / unexpected error -> 500 `SYSTEM_INTERNAL_ERROR`; timeout -> 503.

**Related endpoint:** operationId: `getProvenanceByLink`

---

### UC-08 -- Walk the full provenance chain of a `NodeAttribute`

**Actor:** Owner | **Pre:** Owner is authenticated; `attribute_id` corresponds to an existing `NodeAttribute`. | **Post:** Owner sees the same shape as UC-07 anchored at the attribute.

**Main flow:**
1. Owner calls `GET /api/v1/provenance/attributes/{attribute_id}`.
2. BFF middleware validates the JWT.
3. Service layer joins `provenance` (where `attribute_id = $1`) through the same chain as UC-07 step 4.
4. Steps 5-6 of UC-07 apply identically (raw deletion check, excerpt slicing).
5. BFF returns `200` with envelope `{ ok: true, result: ProvenanceResponse }` (BR-19).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Attribute not found -> 404 `RESOURCE_NOT_FOUND`.
- `5a` Underlying RawInformation tombstoned -> 410 `BUSINESS_RAW_INFORMATION_DELETED`.
- `7a` Database connectivity / unexpected error -> 500; timeout -> 503.

**Related endpoint:** operationId: `getProvenanceByAttribute`

---

### UC-09 -- Walk the chunk/raw chain of an `InformationFragment`

**Actor:** Owner | **Pre:** Owner is authenticated; `fragment_id` corresponds to an existing `InformationFragment` with `status = 'accepted'`. | **Post:** Owner sees the fragment and the chunks (one or more) that anchor it, with each chunk's `RawInformation` metadata.

**Main flow:**
1. Owner calls `GET /api/v1/provenance/fragments/{fragment_id}`.
2. BFF middleware validates the JWT.
3. Service layer reads `information_fragment` by id. If absent -> 404 `RESOURCE_NOT_FOUND`. If present but `status != 'accepted'` -> 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED` (BR-10).
4. Service layer joins `fragment_source` -> `raw_chunk` -> `raw_information`. The result has at least 1 chunk (DB constraint: `propose_fragment` requires `chunk_ids: uuid[] (>= 1)`).
5. Steps 5-6 of UC-07 apply identically (raw deletion check, excerpt slicing).
6. BFF returns `200` with envelope `{ ok: true, result: ProvenanceResponse }` (BR-19).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Fragment not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Fragment exists but `status != 'accepted'` -> 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED`.
- `5a` Underlying RawInformation tombstoned -> 410 `BUSINESS_RAW_INFORMATION_DELETED`.
- `7a` Database connectivity / unexpected error -> 500; timeout -> 503.

**Related endpoint:** operationId: `getProvenanceByFragment`

---

### UC-10 -- List accepted fragments filtered by source (DateJustification picker, additive in v1.4.0)

**Actor:** Owner (via the SPA `CorrectionForm` DateJustification picker) | **Pre:** Owner is authenticated; the curator is filling a `correct_item` form with `corrected.valid_from_source = 'stated'` and needs to point `corrected.valid_from_fragment_id` at an accepted fragment from the errata document (`curation.back.md` BR-15; `curation.spec.md` BR-15; ADR A14 -- "the system NEVER invents dates"). | **Post:** Owner receives a paginated, deduplicated list of accepted `InformationFragment` rows that belong to the chosen source (a specific `RawInformation`, a specific `LLMRun`, or the intersection of both), each entry carrying the fragment text and the FIRST supporting chunk reference so the curator can recognize and pick the right anchor.

**Main flow:**
1. Owner (the SPA picker) calls `GET /api/v1/fragments/accepted?raw_information_id={errata_doc_id}` (the typical call: scope to the errata document).
2. BFF middleware validates the JWT (BR-16).
3. Service layer asserts the filter precondition: at least one of `llm_run_id` / `raw_information_id` was supplied (BR-20). When both are supplied, the filter is the intersection.
4. Service layer parses `limit` / `offset` (defaults 20 / 0; same convention as `searchKnowledge`, BR-18).
5. Service layer runs the read-only join `information_fragment` -> `fragment_source` -> `raw_chunk` -> `raw_information` with:
   - `f.status = 'accepted'` (BR-05; consistent with the partial GIN index of section 7.2);
   - `llm_run_id` filter applied on `f.llm_run_id` when supplied;
   - `raw_information_id` filter applied on `r.id` when supplied;
   - tombstone short-circuit: rows whose `raw_information` was compliance-deleted (section 11) are EXCLUDED -- the picker never offers tombstoned content as evidence for a new `valid_from` (BR-14 spirit, applied as a silent exclusion in a listing context).
6. Service layer deduplicates per `fragment_id` (a fragment may map to multiple `raw_chunk` rows via `fragment_source`): each fragment is returned exactly once, with `source.chunk_index` set to the LOWEST supporting `chunk_index` (deterministic; the full chain remains reachable via `getProvenanceByFragment`).
7. Service layer orders by `raw_information.received_at DESC NULLS LAST`, then `information_fragment.created_at DESC`, then `information_fragment.id ASC` (stable tiebreaker), and applies `limit` / `offset`. `total` is computed BEFORE pagination.
8. BFF returns `200` with envelope `{ ok: true, result: AcceptedFragmentList }` -- where `AcceptedFragmentList = { total, items, limit, offset }` and each item carries `{ fragment_id, text, confidence, llm_run_id, created_at, source: { raw_information_id, chunk_index, source_type, received_at, document_title? } }` (BR-19).

**Alternative flows:**
- `1a` Owner calls with BOTH `llm_run_id` AND `raw_information_id` -> service layer applies the intersection (typical when the curator wants to discriminate between an old run and a re-extraction of the same document).
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`.
- `3a` Both filter parameters absent (neither `llm_run_id` nor `raw_information_id` supplied) -> 422 `VALIDATION_INVALID_FORMAT` with `details.requires_one_of: ["llm_run_id", "raw_information_id"]` (BR-20). The contract is deliberate -- an unbounded enumeration of every accepted fragment in the corpus is not a supported call shape.
- `3b` Either filter parameter is supplied but not a syntactically valid UUID -> 422 `VALIDATION_INVALID_FORMAT` with the offending field in `details`.
- `4a` `limit` outside `[1, 100]` or `offset` < 0 -> 422 `VALIDATION_OUT_OF_RANGE`.
- `5a` Filters match no accepted fragment (e.g. the `raw_information_id` exists but no fragment has been accepted yet, or every matching fragment's source was tombstoned by `compliance_delete`) -> 200 with envelope `{ ok: true, result: { total: 0, items: [], limit, offset } }` (NOT an error; a curator-facing picker simply shows an empty list).
- `5b` Filters reference an entirely unknown `raw_information_id` / `llm_run_id` -> same as `5a` (empty list). This endpoint does NOT validate referential existence -- it is a listing, not a point read; the SPA picker only ever calls it with ids it just received from a prior write (curator already saw the document / run).
- `5c` Every matching fragment's `raw_information` was tombstoned by `compliance_delete` -> rows silently EXCLUDED from results (consistent with `getProvenanceByFragment` 410 `BUSINESS_RAW_INFORMATION_DELETED`; here the listing contract is "what is available to cite", so the rows just don't appear -- the operator does not learn about the tombstone through this endpoint).
- `8a` Database connectivity / unexpected error -> 500 `SYSTEM_INTERNAL_ERROR`; database read timeout -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.

**Related endpoint:** operationId: `listAcceptedFragments`

---

## 4. Business Rules

> Each BR is programmatically testable. All BRs reference at least one UC.

### BR-01 -- Full-text uses two named, versioned configurations (ADR A2 / section 7.1)

`pt_unaccent_v1` (COPY = portuguese, mapping `hword, hword_part, word -> unaccent, portuguese_stem`) for prose -- applied to `raw_chunk.text_search` and `information_fragment.text_search` as STORED `tsvector` columns (DB lines 206-207, 254-255). `simple_unaccent_v1` (COPY = simple, mapping `... -> unaccent, simple`) for entity names -- applied at query time on `node_alias.alias` (DB line 315-316; the alias does NOT carry a STORED tsvector because it is small and re-tokenizing is cheap, and because the canonical comparison path is `alias_norm` via `pg_trgm`). The query string MUST be parsed with `websearch_to_tsquery` on the corresponding config (ADR A15). Switching to a future config (e.g., synonym dictionary -- ADR A4) is a new versioned config + reindex, never an in-place edit.

**Tied to:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06.

### BR-02 -- Layer weights are constants 1.0 / 0.9 / 0.6 (ADR A15)

Direct full-text scores: `fragment` rows -> `ts_rank_cd * 1.0`; `node_alias` rows -> `ts_rank_cd * 0.9`; `raw_chunk` rows -> `ts_rank_cd * 0.6`. These are named constants (ADR A15 / A21) -- calibration is a configuration change, never an algorithm change.

**Tied to:** UC-01, UC-03.

### BR-03 -- `pg_trgm` is the only fuzzy signal, scoped to entity resolution (ADR A3)

`pg_trgm` is wired to `node_alias.alias_norm` (GIN, `gin_trgm_ops`, DB line 313). It is consumed by the `ingestion` domain's entity-resolution pipeline (section 4.2 step 2). `searchKnowledge` itself does NOT issue trigram queries: it parses with `websearch_to_tsquery` only. Levenshtein remains documented as a possible future LEXICAL signal but is not used. Vector / semantic similarity is BANNED (BR-09 / ADR A24).

**Tied to:** UC-01 (negative constraint: trigram is invisible to the search caller).

### BR-04 -- Fragment-chunk dedup: chunk collapses into the fragment it supports (section 7.2 step 2)

When a `raw_chunk` hit `rc` and a `information_fragment` hit `f` co-occur in the result set AND `(f.id, rc.id) IN fragment_source` -> the chunk row is removed; its excerpt is appended to `f.provenance[]` if not already present. Decision policy: fragment always wins (its score weight 1.0 dominates 0.6, but the rule is structural, not score-based -- a chunk that supports a fragment is redundant evidence of the same statement). When a chunk hit has no supporting fragment in the result, it stays as `kind = "fragment"` with `layer = "chunk"`? **No** -- a free-standing chunk hit appears as the chunk itself, surfaced as a `fragment`-kind item only if the chunk anchors an accepted fragment; otherwise the result is dropped (we never surface raw chunk text without the fragment lens, because that would breach the citation principle of section 13). Concretely: `kind = "fragment"` is the only kind that can carry `layer = "chunk"` (the chunk's supporting fragment), and a chunk hit with no accepted fragment supporter is NOT returned.

**Tied to:** UC-01, UC-03.

### BR-05 -- Only `status = 'accepted'` fragments participate in the search index (DB partial GIN)

The DB has `CREATE INDEX information_fragment_fts_idx ON information_fragment USING gin (text_search) WHERE status = 'accepted'` (DB lines 261-262). Non-accepted fragments (`proposed`, `rejected`, `deleted`) are invisible to `search`. This is also why `getProvenanceByFragment` rejects `status != 'accepted'` with `BUSINESS_FRAGMENT_NOT_ACCEPTED`: surfacing a non-accepted fragment via point-read would let callers bypass the index policy. The same `status = 'accepted'` filter is the structural filter of `listAcceptedFragments` (UC-10): the listing is named for that filter.

**Tied to:** UC-01, UC-06, UC-09, UC-10.

### BR-06 -- Graph expansion uses depth in `[1, 3]` and decay `0.5^hop` (ADR A16)

`expand_depth` defaults to 1, max 3. Out of range -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH` (reused from `knowledge-graph` BR-18; same constant ADR A16). Score decay per hop is exactly `0.5`. The expansion is bidirectional via `link_type.inverse_name` (`knowledge-graph` UC-06 / BR-18). Merged endpoints are path-compressed to their survivor (section 4.4); deleted endpoints are skipped.

**Tied to:** UC-01, UC-02, UC-03.

### BR-07 -- Tie-breaker: `recorded_at` DESC (newest first)

When two items share the same composite `score`, the one with the larger `recorded_at` (or, for fragments, `created_at`) wins. This makes the ordering deterministic across calls. It does NOT change ranking semantics; it disambiguates ties.

**Tied to:** UC-01.

### BR-08 -- `search` returns ONLY items whose `status` is in `{active, uncertain, disputed}` for graph rows, and `{accepted}` for fragments

Rows with `status IN ('superseded', 'deleted')` are NEVER returned (the history is reachable via `knowledge-graph getLinkHistory` / `getAttributeHistory` -- `knowledge-graph` BR-08). `uncertain` rows are returned only when `include_uncertain=true` (the default). `disputed` rows are ALWAYS returned with their `disputed` flag (section 7.3). Fragments are filtered by the partial GIN index (BR-05); attempting to bypass via point-read is blocked by BR-05.

**Tied to:** UC-01, UC-06.

### BR-09 -- `as_of` enables valid-time travel (query (b)); system-time travel is DEFERRED (ADR A25)

When `as_of=D` is provided, expansion + link filters become: `superseded_at IS NULL AND (valid_from IS NULL OR valid_from <= D) AND (valid_to IS NULL OR valid_to > D)`. The default is query (a) (`valid_to IS NULL AND superseded_at IS NULL`). This domain does NOT expose query (c) (system-time travel) -- `recorded_at` is stored on every row so the capability can be added later without migration. Activation = adding a `system_time_at` query parameter and the matching SQL filter.

**Tied to:** UC-02.

### BR-10 -- `in_effect_only=true` requires the derived `is_in_effect` (cenario C12)

The flag is wired to the view-derived field `is_in_effect = is_current AND (valid_from IS NULL OR valid_from <= current_date)` (section 5.4, `knowledge-graph` BR-09). When `as_of` is also provided, `current_date` in the formula is replaced by `as_of`. Items asserted with `valid_from > current_date` (future-dated) are excluded.

**Tied to:** UC-04.

### BR-11 -- Lexical retrieval is the final form -- embeddings are PERMANENT non-goal (ADR A24 / section 20.1)

The contract of cenario C11 is binding: "Iniciativa Lunar" returns zero results when the corpus contains "Projeto Apollo". This is a SUCCESS, not a failure. The only escape valves are (a) future synonym dictionary plugged into a versioned FTS config (ADR A4, deferred and out of scope), and (b) curation `entity_match` (`curation` domain). This domain MUST NOT introduce any non-lexical signal. Any future PR adding embeddings, `pgvector`, vector store, ANN index, or "semantic" anything is REJECTED by definition.

**Tied to:** UC-05 (contract-affirming negative test).

### BR-12 -- Provenance excerpts use Unicode code-point indexing (ADR A22 / section 9.2)

`excerpt = raw_chunk.text[offset_start:offset_end)` MUST be computed in Unicode code points -- not bytes, not UTF-16 units. In Node.js, this is `[...raw_chunk.text].slice(offset_start, offset_end).join('')`. Both `offset_start` and `offset_end` are stored on `raw_chunk` and the convention is semi-open `[start, end)` (section 5.2 / ADR A7 / DB CHECK `offset_end > offset_start`, line 208).

**Tied to:** UC-07, UC-08, UC-09 (every excerpt). UC-01, UC-06 (excerpts inside `SearchProvenanceEntry`).

### BR-13 -- Every returned consolidated item MUST have at least one `provenance[]` entry (section 13)

Anti-hallucination invariant (section 13 + principle 10): nothing in the response is allowed to be a bare claim. `searchKnowledge` items: `provenance.length >= 1`. `getProvenance*` endpoints: `fragments.length >= 1` and every fragment has `chunks.length >= 1`. An empty provenance attached to a row that exists is a legacy-data inconsistency that this domain logs as an operational alarm (cross-references `knowledge-graph` BR-19); the operational fix is in the `ingestion` / `curation` domains -- this domain still surfaces the row but flags it in operational logs (the response remains structurally valid because the rule is "MUST have", so the violation is treated as a 500 candidate during reconciliation).

**Tied to:** UC-01, UC-06, UC-07, UC-08, UC-09.

### BR-14 -- `compliance_delete` tombstones short-circuit provenance reads (section 11)

When ANY `raw_information.status = 'deleted'` is encountered while walking the chain, the request returns 410 `BUSINESS_RAW_INFORMATION_DELETED`. We do NOT return partial chains. Rationale: section 11 says tombstoned content MUST NOT recirculate; returning siblings of a tombstoned source would still leak the existence and metadata of the deleted document beyond what `ComplianceDeletion` already audits. For `listAcceptedFragments` (UC-10) the same principle is applied as a SILENT EXCLUSION rather than a 410: the listing contract is "what is available to cite", and a tombstoned document is no longer available -- so the rows simply do not appear, and the existence of the tombstone is not leaked to the picker UI.

**Tied to:** UC-07, UC-08, UC-09, UC-10.

### BR-15 -- Search inputs are clamped and validated server-side

- `query`: `1 <= length(btrim(query)) <= 1000`. Parsed `tsquery` MUST be non-empty. Violations -> 422 `BUSINESS_INVALID_SEARCH_QUERY`.
- `layers[]`: any element MUST be in `{fragment, node, chunk}`. Violations -> 422 `BUSINESS_INVALID_SEARCH_LAYER`.
- `expand_depth`: integer in `[1, 3]`. Violations -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH`.
- `expand_link_types[]`: every element MUST exist in `link_type.name`. Violations -> 422 `BUSINESS_UNKNOWN_LINK_TYPE`.
- `as_of`: parseable as ISO `YYYY-MM-DD`. Violations -> 422 `VALIDATION_INVALID_FORMAT`.
- `limit`: integer in `[1, 100]`; `offset`: integer >= 0. Violations -> 422 `VALIDATION_OUT_OF_RANGE`.

All checks happen BEFORE the DB call (Zod v4 in the BFF, ADR A28). The Postgres driver uses parameterized queries (ADR A6); no string interpolation of user input is permitted (security rule).

**Tied to:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06.

### BR-16 -- All endpoints require a valid Neon Auth JWT (ADR A29 / section 2.5 / cenario C16)

Every endpoint in this domain is closed behind `bearerAuth` (Neon Auth / Stack Auth). The middleware verifies the JWT against the Neon Auth JWKS endpoint (`${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default; cache TTL `NEON_AUTH_JWKS_TTL_S`) BEFORE any database access. Missing / invalid / expired -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`. Database credentials (`DATABASE_URL`) and Neon Auth configuration NEVER appear outside the BFF; Postgres RLS is not used on Neon for this BFF (authorization is centralized in the BFF service layer). Applies to `listAcceptedFragments` (UC-10) identically.

**Tied to:** UC-01 through UC-10.

### BR-17 -- Performance budgets are hard ceilings (section 16)

- `searchKnowledge` p95 < 500 ms.
- `searchKnowledge` with `expand=true` AND `expand_depth = 3` p95 < 1 s (inherits the `traverse(depth <= 3)` budget of section 16).
- `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment` p95 < 200 ms.
- `listAcceptedFragments` p95 < 200 ms (point-listing class -- a single indexed join on `information_fragment.llm_run_id` or `raw_chunk.raw_information_id`, both already covered by the schema indexes; no fan-out, no expansion).

These are sanity ceilings; at the corpus scale of section 16 (10^2-10^3 documents, full DB fits in cache) measured latencies live in the low-ms range. Breaching a ceiling under normal load is an operational alarm. SLOs apply to the BFF-to-client round trip on a warm DB.

**Tied to:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10.

### BR-18 -- Pagination defaults: `limit = 20`, `offset = 0` (ADR A16)

Mirrors the `search` MCP tool contract of section 14.3. Default page is 20 items; max page is 100. The same default is used by `traverseNode` of `knowledge-graph` -- defaults are aligned across the read surface. `listAcceptedFragments` (UC-10) uses the SAME defaults / ceiling -- the SPA picker is a small dropdown and rarely exceeds the first page in practice.

**Tied to:** UC-01, UC-10.

### BR-19 -- REST success responses are wrapped in `{ ok: true, result: <payload> }`

Every 2xx response served by this domain's REST surface MUST be a JSON object of the shape `{ "ok": true, "result": <Payload> }`, where `<Payload>` is the inner shape named by the corresponding UC (`SearchResponse` for UC-01 through UC-06; `ProvenanceResponse` for UC-07 through UC-09; `AcceptedFragmentList` for UC-10). This restores symmetry with the error path -- every 4xx/5xx response is already enveloped as `{ "ok": false, "error": { "code", "message", "details? } }` via the shared `mapErrorToHttpResponse` -- so a single discriminator `body.ok` covers both halves of the contract. Aligns with the CLAUDE.md "Architecture / Backend" wording (*"REST devolve esse envelope direto, com HTTP status"*) and with the chat / conversations / ingestion / knowledge-graph REST modules that already comply. Mirrors the analogous `knowledge-graph.spec.md` BR-21 introduced in the same atomic change (workflow `kg-rest-success-envelope`).

**Scope.** REST-only. The MCP transports (`POST /api/v1/mcp/query` and the stdio mirror) keep the MCP 2025-06-18 `content` / `isError` framing -- they do NOT wrap responses in `{ ok, result }` (see §8 out-of-scope and `back/query-retrieval.back.md` for the per-transport rendering rules). Extending the wrap to MCP would require a v7 amendment and is explicitly out of scope. `listAcceptedFragments` (UC-10) is REST-only -- the envelope rule applies trivially; there is no MCP twin to keep in sync.

**Atomic landing contract.** The SPA's shared `lib/http.ts` parser requires `body.ok === true` on 2xx; the temporary frontend workaround that shipped on 2026-06-22 (`envelope:false` opt-in flag + `getKnowledgeGraph` reader) MUST be reverted in the SAME change that lands this BR -- otherwise the SPA reads the inner `wire.<field>` off the envelope and breaks every QR-driven view. Recorded in CLAUDE.md "Known Gotchas" / `kg-rest-bare-success-envelope` memory; reconciled in `back/query-retrieval.back.md` (mirror BR) and `openapi.yaml` v1.2.0 (same atomic change).

**Cross-reference note (BR numbering).** The companion `openapi.yaml` (v1.1.0+) repeatedly cites *"BR-15"* as the envelope rule in its `description` blocks (Overview, `searchKnowledge` description, each provenance endpoint description, the `SearchResponseEnvelope` / `ProvenanceResponseEnvelope` schema descriptions, and the `OkTrue` / `OkFalse` discriminators). In this spec.md, however, **BR-15 is "Search inputs are clamped and validated server-side"** -- a different, pre-existing rule. The envelope rule in this spec.md is **BR-19** (this rule). The reviewer / Spec Validator MUST treat BR-19 as the authoritative envelope rule for cross-checks; a follow-up edit may align the `openapi.yaml` numbering to BR-19 (mechanical wording-only change, no contract change). Until then, both numbers point at the SAME wire shape; BR-19 is normative, BR-15 in the openapi descriptions is a stale citation. The new `listAcceptedFragments` description in `openapi.yaml` v1.4.0 cites the back-spec ("back-spec BR-26") for its envelope rule -- a different, also harmless cross-domain reference; the authoritative envelope rule for ALL endpoints of this `.spec.md` remains BR-19 here.

**Tied to:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10 (all ten UCs / all five REST endpoints).

### BR-20 -- `listAcceptedFragments` requires at least one of `llm_run_id` / `raw_information_id` (filter precondition)

`GET /api/v1/fragments/accepted` MUST be called with at least one of the two filter parameters: `llm_run_id` (UUID) or `raw_information_id` (UUID). An unbounded enumeration of every accepted fragment in the corpus is NOT a supported call shape -- the SPA picker always knows the source it is anchoring the date to. When BOTH parameters are absent the BFF returns 422 `VALIDATION_INVALID_FORMAT` with `details = { requires_one_of: ["llm_run_id", "raw_information_id"] }`. The check happens at the Zod schema (BFF input validation, ADR A28) BEFORE any database access; the same precondition is restated in the back-spec for the implementation group. When BOTH are supplied, the filter is the INTERSECTION (fragments produced by `llm_run_id` AND anchored to a chunk of `raw_information_id`); this is the canonical "the curator wants to discriminate a re-extraction" call shape.

**Tied to:** UC-10 (main flow precondition + alternative flow `3a`).

---

## 5. State Machine

> The retrieval domain is STATELESS. The lifecycle of its inputs (`InformationFragment.status`, `KnowledgeLink.status`, `NodeAttribute.status`, `KnowledgeNode.status`, `RawInformation.status`) belongs to other domains. See `knowledge-graph.spec.md` section 5 for the lifecycle diagrams of links / attributes / nodes; the `ingestion` domain owns the `InformationFragment` lifecycle (`proposed -> accepted | rejected | deleted`); the `compliance` domain owns the `RawInformation` tombstone transition.

> Section removed per template guidance ("Remove section if not applicable") -- KEPT as an explicit notice because the absence of a state machine in a read domain is a load-bearing decision (no caching, no session, no cursor state held server-side).

---

## 6. Error Behaviors

> Every code below is registered in the global error-codes catalog (`docs/specs/_global/error-codes.md`).

> **Wire envelope (BR-19).** Every error response carries the envelope `{ "ok": false, "error": { "code", "message", "details? } }` -- symmetric with the success envelope `{ "ok": true, "result": <Payload> }` (since v1.2.0). The `error.code` values listed below are the canonical discriminators -- `error.message` is for humans, `error.details` is optional and structured.

> **Canonical taxonomy (P2.1, v1.5.0).** Every `error.code` in the table below belongs to the project-wide NAMESPACED taxonomy elected by amendment P2.1 (see `docs/specs/_global/error-codes.md` "Canonical Taxonomy (P2.1 -- 2026-07-02)"): five prefixes only -- `AUTH_*`, `VALIDATION_*`, `RESOURCE_*`, `BUSINESS_*`, `SYSTEM_*`. The seven §14 short codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are DEPRECATED and are NOT surfaced on ANY transport of this domain (this domain has always emitted namespaced codes; P2.1 formalises the vocabulary and retires the short set). The two MCP tools registered by this domain (`search`, `get_provenance_*` -- back-spec BR-23) and the four REST endpoints surface the SAME `error.code` byte-for-byte on the same business condition; the REST↔MCP parity guard (back-spec BR-25) is the CI contract that keeps the two transports byte-identical (parallel guards live in `compliance-audit.back.md` BR-14, `curation.back.md` BR-32 and `knowledge-graph.back.md` TC-04).

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without `Authorization` header | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (BR-16, cenario C16). |
| JWT malformed | 401 | `AUTH_TOKEN_INVALID` | Decoding fails (BR-16). |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | `exp` claim in the past (BR-16). |
| `link_id` / `attribute_id` / `fragment_id` not in DB | 404 | `RESOURCE_NOT_FOUND` | Standard point-read miss. |
| `fragment_id` exists but `status != 'accepted'` | 404 | `BUSINESS_FRAGMENT_NOT_ACCEPTED` | UC-09 / BR-05. |
| Underlying `RawInformation` tombstoned by `compliance_delete` | 410 | `BUSINESS_RAW_INFORMATION_DELETED` | BR-14 / section 11. (UC-07, UC-08, UC-09 only; UC-10 silently excludes -- see BR-14.) |
| `query` empty after `btrim`; parsed `tsquery` empty; `length > 1000` | 422 | `BUSINESS_INVALID_SEARCH_QUERY` | BR-15. |
| `layers[]` contains a value outside `{fragment, node, chunk}` | 422 | `BUSINESS_INVALID_SEARCH_LAYER` | BR-15. |
| `expand_depth` outside `[1, 3]` | 422 | `BUSINESS_INVALID_TRAVERSE_DEPTH` | BR-06 / BR-15 (reused from `knowledge-graph`, same ADR A16 constant). |
| `expand_link_types[]` contains a name not in catalog | 422 | `BUSINESS_UNKNOWN_LINK_TYPE` | BR-15 (reused from `knowledge-graph`). |
| `as_of` not parseable as ISO `YYYY-MM-DD` | 422 | `VALIDATION_INVALID_FORMAT` | BR-15. |
| `listAcceptedFragments` called with NEITHER `llm_run_id` NOR `raw_information_id` | 422 | `VALIDATION_INVALID_FORMAT` | BR-20 / UC-10. `details = { requires_one_of: ["llm_run_id", "raw_information_id"] }`. |
| `listAcceptedFragments` filter parameter supplied but not a valid UUID | 422 | `VALIDATION_INVALID_FORMAT` | BR-20 / UC-10 (alternative flow `3b`). `details` carries the offending field. |
| `limit` outside `[1, 100]`; `offset` < 0 | 422 | `VALIDATION_OUT_OF_RANGE` | BR-15 (search) / UC-10 (listing). |
| Database connectivity / unexpected error | 500 | `SYSTEM_INTERNAL_ERROR` | Default fallback for unhandled exceptions. |
| Database read timeout against Neon | 503 | `SYSTEM_SERVICE_UNAVAILABLE` | Integration with Neon (managed Postgres) unavailable. |

---

## 7. Cross-Domain Dependencies

> Bidirectional. The peer domains below MUST list `query-retrieval` as their consumer/producer when they are specified.

| Domain | Type | Description |
|--------|------|-------------|
| `ingestion` | consumes | This domain reads `RawInformation`, `RawChunk`, `InformationFragment`, `FragmentSource` rows written by `ingestion`. It also relies on the `text_search` STORED `tsvector` columns and on the partial GIN index `WHERE status = 'accepted'` -- both populated/maintained by ingestion writes. UC-10 (`listAcceptedFragments`) additionally relies on `information_fragment.llm_run_id` being populated by ingestion (it is). |
| `knowledge-graph` | consumes | This domain reads `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink`, `Provenance` rows. Expansion (BR-06) calls the same service layer as `knowledge-graph` `traverseNode` (UC-06 of that domain). Derived fields (`is_current`, `is_in_effect`, `effective_status`) come from the shared views `knowledge_link_resolved` / `node_attribute_resolved`. The REST envelope rule (BR-19) is mirrored from `knowledge-graph.spec.md` BR-21 -- both domains landed the wrap in the same atomic change (workflow `kg-rest-success-envelope`). |
| `curation` | synchronizes + consumes | The lifecycle transitions `uncertain -> active`, `disputed -> active / deleted`, etc. are triggered by curation. This domain READS the post-curation state. The `entity_match` queue is the EXPLICIT escape valve for the lexical limitation surfaced by BR-11 / UC-05. **v1.4.0:** the SPA `CorrectionForm` of the `curation` domain CONSUMES the new `listAcceptedFragments` (UC-10) endpoint to populate the DateJustification picker when the curator submits `correct_item` with `corrected.valid_from_source = 'stated'` -- the curator picks an accepted fragment from the errata document to anchor the new `valid_from` (`curation.back.md` BR-15; `curation.spec.md` BR-15; ADR A14 -- "the system NEVER invents dates"). The dependency is forward (curation -> query-retrieval); `query-retrieval` does NOT call back into `curation`. |
| `compliance` | synchronizes | `compliance_delete` sets `RawInformation.status = 'deleted'` and tombstones content; this domain checks for it on every provenance walk and returns 410 (UC-07/08/09). UC-10 (listing) applies the same tombstone check as a silent EXCLUSION rather than a 410 -- see BR-14. |
| `auth` | synchronizes | Owner authentication via Neon Auth (Stack Auth). The middleware that validates the JWT (JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`) is the same one used by all REST/MCP transports (sections 2.5, A29). This domain consumes the resulting `actor_context = owner` claim. |
| `chat` | produces (read tools) | The `chat` domain (v2.0+) consumes the 4 read tools of this domain (`search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`) as agentic tools inside its tool-use loop. Resolution is via the in-process MCP registry (`mcp.getTool('query', name)`); each invocation opens its own short `BEGIN READ ONLY` transaction (`withReadOnly`). No service-layer change is required on this domain to support chat: the handlers are the same ones consumed by REST / MCP / chat. The chat v2.3 async-ingestion capability (`start_async_ingestion` / `get_ingestion_status`) does NOT touch this domain -- those two tools are resolved on the `ingest` toolset, NOT on `query`. Reverse declaration of `chat.spec.md` §7 / v2.3 ("MUST list `chat` as a downstream consumer in their next revision") is satisfied by this row. The new `listAcceptedFragments` (UC-10) is REST-only and NOT exposed on the MCP `query` toolset -- the chat tool-use loop does NOT see it (intentional; the LLM reaches accepted fragments via `search`). |

---

## 8. Out of Scope

- **Embeddings / `pgvector` / vector store / ANN / semantic similarity** -- PERMANENT non-goal per section 20.1 / ADR A24. Cenario C11 is the contract; the escape valve is curation. This domain will NEVER expose endpoints related to such capability.
- **Synonym dictionary plugged into the FTS configuration (ADR A4)** -- The only "matching meaning" door allowed by the design. Today: NOT implemented. Activation path: new versioned config (`pt_unaccent_v2` with the dictionary) + full reindex of `raw_chunk.text_search` and `information_fragment.text_search` + alias config swap at the query-parse site. Zero schema migration. Not in this version.
- **System-time travel ("what did the system know at instant T", query (c) of section 5.3)** -- DEFERRED per ADR A25. Data preserved (`recorded_at` on every row), no endpoint exposes it. Activation = add `system_time_at` query parameter + matching SQL filter `recorded_at <= T AND (superseded_at IS NULL OR superseded_at > T)`. No migration.
- **Dedicated review queues for `uncertain` / `low_confidence` results** (ADR A26) -- DEFERRED. Today they are display flags returned in `flags[]`. Promotion to a dedicated `list_review_queue` kind is additive in the `curation` domain.
- **Point reads of single graph entities (`getNodeById`, `getLinkById`, `getAttributeById`, `traverseNode`, history walks)** -- owned by the `knowledge-graph` domain. This domain calls the same service layer internally for the expansion step (BR-06) but does NOT expose those endpoints under `/api/v1/search` or `/api/v1/provenance/*`.
- **Writes** -- no write endpoint lives in this domain. The `search` and `get_provenance` MCP tools are pure reads per section 14.3. `listAcceptedFragments` (UC-10) is read-only.
- **Cursor-based pagination, infinite scroll, streaming responses** -- offset/limit only. The corpus scale (section 16) makes cursor pagination unnecessary; revisiting is a future ADR.
- **Multi-user / role-based authorization** -- PERMANENT non-goal in v7 (ADR A20). The `actor_context` is implicit (owner).
- **Free-form regex / SQL injection passthrough** -- the only query language accepted is `websearch_to_tsquery` (which itself supports `"phrase"`, `-exclusion`, `OR`). Raw SQL or regex from the user is rejected at the BFF input layer.
- **Extending the `{ ok, result }` REST envelope to the MCP transports** -- MCP wire framing stays `content` / `isError` per MCP 2025-06-18 (BR-19 scope). A future revision unifying the wire framing would require a v7 amendment and is not in scope.
- **Unbounded enumeration over all accepted fragments** -- explicitly out of scope for UC-10. `listAcceptedFragments` always requires a source filter (`llm_run_id` or `raw_information_id` or both; BR-20). The endpoint is a curator-facing picker helper, NOT a corpus-wide browse. A future global browse capability would belong elsewhere (likely `curation` or a dedicated admin domain) and is not planned.
- **Exposing `listAcceptedFragments` on the MCP `query` toolset** -- intentionally NOT done. The LLM reaches accepted fragments through `search`; the new endpoint is REST-only because its consumer is the SPA picker (UC-10). Promoting it to MCP would require a v7 amendment and a use-case justification, neither of which exists today.

---

## 9. Local Glossary

> Domain-specific terms. Global terms live in `docs/specs/_global/glossary.md`.

| Term | Definition |
|------|-----------|
| `as_of` | Date query parameter that enables valid-time travel (query (b), section 5.3). When omitted, query (a) (current view) is used. |
| `websearch_to_tsquery` | PostgreSQL parser that converts a free-text user query into a `tsquery`. Accepts `"phrase"`, `-exclusion`, `OR`. The ONLY parser used by `searchKnowledge` (BR-01). |
| `ts_rank_cd` | PostgreSQL ranking function (cover-density variant) used for scoring full-text hits. Layer-weighted to produce the composite `score` of `SearchItem`. |
| `pt_unaccent_v1` | Named full-text configuration copied from `portuguese` with `unaccent` prepended to the `hword, hword_part, word` mapping. Used for prose (chunks, fragments). |
| `simple_unaccent_v1` | Named full-text configuration copied from `simple` (no stemming) with `unaccent` prepended. Used for entity names (`node_alias`) so that "Silva" does not stem to "silv-". |
| Layer weight | The constant multiplier applied to a layer's `ts_rank_cd` before composing the final score. Fragment 1.0, node 0.9, chunk 0.6 (ADR A15 / BR-02). |
| Hop decay | The per-expansion-step multiplier applied to scores during graph expansion. `0.5^hop` (ADR A16 / BR-06). |
| Dedup | The collapse of a `raw_chunk` hit into the `information_fragment` it supports via `fragment_source` (BR-04 / section 7.2 step 2). |
| Layer | The pipeline lane that originated a hit: `fragment`, `node`, or `chunk`. Mirrored to the response field `SearchItem.layer`. |
| Kind | The kind of consolidated row returned: `node`, `link`, or `fragment`. `attribute` is NOT a result kind -- attributes are surfaced through provenance only, never as direct search hits. `chunk` is NOT a result kind -- it collapses into the supporting `fragment` via dedup (BR-04). |
| `flags[]` | Display flags surfaced in `SearchItem.flags`: `uncertain` (when `include_uncertain=true`), `disputed` (always), `low_confidence` (ADR A26). |
| Tombstone | The state set by `compliance_delete` on `RawInformation` (section 11). Triggers 410 `BUSINESS_RAW_INFORMATION_DELETED` in provenance walks (BR-14). In `listAcceptedFragments` (UC-10) tombstoned rows are silently excluded instead of triggering 410 -- the listing contract is "what is available to cite". |
| Expansion | The graph traversal step (UC-01 step 6) that grows the result set from `node` hits via `KnowledgeLink` edges, capped by `expand_depth` and decayed by `0.5^hop`. |
| Excerpt | The slice `raw_chunk.text[offset_start:offset_end)` indexed in Unicode code points (BR-12 / ADR A22). Always semi-open `[start, end)`. |
| Envelope (REST) | The uniform JSON wrapper for every 2xx and 4xx/5xx response (BR-19). Success: `{ "ok": true, "result": <Payload> }`. Error: `{ "ok": false, "error": { "code", "message", "details? } }`. A single discriminator `body.ok` lets a consumer branch without inspecting the HTTP status. REST-only -- the MCP transports use `content` / `isError` per MCP 2025-06-18. Mirrors `knowledge-graph.spec.md` "Envelope (REST)" / BR-21. |
| DateJustification picker | SPA UI component inside `CorrectionForm` (consumed by the `curation` domain) that lets the curator pick the accepted `InformationFragment` that anchors a new `valid_from` when submitting `correct_item` with `corrected.valid_from_source = 'stated'`. Backed by `listAcceptedFragments` (UC-10). The picker writes the chosen fragment's id into `corrected.valid_from_fragment_id` (`curation.back.md` BR-15; ADR A14). |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial business spec for the query-retrieval domain. Forward-generated from remember-modelagem-v7.md (sections 7, 13, 16, 17, 20) and migrations/0001_schema.sql + 0002_seed.sql. Covers `searchKnowledge` (section 7.2 pipeline: two FTS configs, three layers with weights 1.0/0.9/0.6, dedup, graph expansion with depth 1-3 and decay 0.5, temporal filters, flags) and the three `getProvenanceBy*` endpoints (cross-layer walk to RawInformation with tombstone short-circuit). Reaffirms the permanent ban on embeddings (ADR A24 / section 20.1) -- cenario C11 is the binding contract. | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | change | Infrastructure migration: replaced Supabase Auth with Neon Auth (Stack Auth) in §2 Owner actor description, UC-01 pre-condition (the only UC that named the auth provider), BR-16 (heading + body -- JWKS endpoint `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA, TTL `NEON_AUTH_JWKS_TTL_S`, `DATABASE_URL` for DB credentials), §6 503 row (now references Neon as the managed Postgres provider) and §7 `auth` cross-domain dependency. Removed mention of Supabase service key and Supabase RLS toggle (replaced by 'Postgres RLS not used on Neon for this BFF'). No use cases, error codes, state transitions, or business invariants changed. Schema and remember-modelagem-v7.md are untouched. | migrate-neon |
| 1.2.0 | 2026-06-22 | Back Spec Agent | change | **REST success-envelope alignment (new BR-19).** Documents the wire-shape change applied atomically across the `knowledge-graph` and `query-retrieval` REST surfaces -- every 2xx success response is now wrapped as `{ ok: true, result: <Payload> }`, symmetric with the existing error envelope `{ ok: false, error: { code, message, details? } }` (unchanged). Reworded every UC main-flow success step to spell out the envelope wrap (UC-01 step 9, UC-02 step 5, UC-03 step 5, UC-04 step 5, UC-05 step 4, UC-06 step 5, UC-07 step 7, UC-08 step 5, UC-09 step 6 -- all four REST endpoints), added a normative §3 lead-in note, added §6 envelope note over the error table, added an "Envelope (REST)" glossary entry, added an explicit §8 out-of-scope bullet clarifying that the MCP transports keep their `content` / `isError` framing per MCP 2025-06-18 (the wrap is REST-only), and added a §7 cross-domain note that BR-19 mirrors `knowledge-graph.spec.md` BR-21. **Cross-check note for the Spec Validator:** the companion `openapi.yaml` (v1.1.0) repeatedly cites *"BR-15"* in its envelope descriptions; in this spec.md BR-15 is the pre-existing input-validation rule. The authoritative envelope rule is **BR-19** -- the `openapi.yaml` citation is stale wording (no contract change), to be aligned in a mechanical follow-up edit. No new use case, no new state transition, no schema change, no new error code, no DDL. Atomic with the frontend reconciliation that drops the `envelope:false` workaround introduced on 2026-06-22 (the temporary frontend patch documented in CLAUDE.md "Known Gotchas" / `kg-rest-bare-success-envelope` memory). Coordinated with `knowledge-graph.spec.md` v1.2.0 (mirror change, same envelope alignment) and `back/query-retrieval.back.md` (mirror BR). | kg-rest-success-envelope |
| 1.3.0 | 2026-06-22 | Spec Writer | minor (additive) | **Chat downstream-consumer reverse declaration (no contract change).** Added `chat` as a downstream consumer of this domain in §7 Cross-Domain Dependencies. Satisfies the reverse-declaration requirement raised by `chat.spec.md` v2.3 §7 (*"`query-retrieval` and `knowledge-graph` MUST list `chat` as a downstream consumer in their next revision"*). Coverage: the chat agentic loop resolves the 4 read tools of this domain (`search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`) via the in-process MCP registry (`mcp.getTool('query', name)`); each invocation opens `BEGIN READ ONLY` (`withReadOnly`). The chat v2.3 async-ingestion tools (`start_async_ingestion` / `get_ingestion_status`) are resolved on the `ingest` toolset and do NOT touch this domain. NO use case, BR, endpoint, schema, error code, or operationId is added or modified. The `openapi.yaml` is UNCHANGED (still v1.2.0). The `back/query-retrieval.back.md` is UNCHANGED (no implementation impact). No new error code. No DDL. No migration. | sdd_query-retrieval_spec-writer |
| 1.4.0 | 2026-06-24 | Spec Writer | minor (additive) | **`listAcceptedFragments` endpoint coverage (new UC-10 + new BR-20).** Spec-side documentation of the `GET /api/v1/fragments/accepted` endpoint added to `openapi.yaml` v1.4.0 -- a read-only listing of `information_fragment` rows with `status = 'accepted'`, filtered by `llm_run_id` and/or `raw_information_id` (at least one required). Consumed by the SPA `CorrectionForm` DateJustification picker so the curator can pick the accepted fragment that anchors a new `valid_from` when submitting `correct_item` with `corrected.valid_from_source = 'stated'` (`curation.back.md` BR-15; `curation.spec.md` BR-15; ADR A14 -- "the system NEVER invents dates"). Changes: (a) added **UC-10** with main flow + 7 alternative flows (intersection, missing JWT, missing filter -> 422, invalid UUID -> 422, range -> 422, empty result, every match tombstoned -> silent exclusion, 500/503); (b) added **BR-20** "filter precondition: at least one of `llm_run_id` / `raw_information_id`" -- 422 `VALIDATION_INVALID_FORMAT` with `details.requires_one_of`; (c) extended BR-05 (accepted filter), BR-14 (silent exclusion in listings), BR-16 (auth applies), BR-17 (p95 < 200 ms), BR-18 (pagination defaults), BR-19 (envelope applies; UC-10 added to the tied-to list); (d) added a row to the §6 error table for the missing-filter 422 case (plus the bad-UUID variant); (e) extended §1 Overview / §2 Actors / §3 envelope note to mention the new endpoint and its REST-only scope; (f) added §7 `curation` `synchronizes + consumes` note (the SPA picker calls UC-10) and a chat-row note that UC-10 is NOT on the MCP `query` toolset; (g) added 2 out-of-scope bullets to §8 (no unbounded enumeration, no MCP twin); (h) added "DateJustification picker" glossary entry and extended the "Tombstone" entry. Companion mechanical fix in `openapi.yaml` v1.4.0: the two citations of `BR-26` inside the `listAcceptedFragments` description and the `AcceptedFragmentListEnvelope` description now read `back-spec BR-26` (explicit cross-domain pointer to the back-spec; the authoritative envelope rule in THIS .spec.md remains BR-19, per the existing v1.2.0 cross-reference note on BR-19). No new error CODE (the missing-filter case reuses `VALIDATION_INVALID_FORMAT`, only the `details.requires_one_of` shape is new). No DDL. No migration. No state-machine change. No MCP-surface change. | sdd_improve_5_spec-back-repair |
| 1.5.0 | 2026-07-02 | Spec Writer | patch (documentation) | **P2.1 canonical taxonomy alignment (documentation-only).** Anchors this domain into the project-wide canonical error-code taxonomy adopted by amendment P2.1 (`docs/specs/_global/error-codes.md` "Canonical Taxonomy (P2.1 -- 2026-07-02)"): NAMESPACED vocabulary only (`AUTH_*`, `VALIDATION_*`, `RESOURCE_*`, `BUSINESS_*`, `SYSTEM_*`); the seven §14 short codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are DEPRECATED and NOT emitted by this domain on any transport. This domain has ALWAYS emitted only namespaced codes -- P2.1 formalises the vocabulary and retires the short set project-wide, so this revision is documentation cross-reference, not a behavior change. Added: §6 Error Behaviors "Canonical taxonomy (P2.1, v1.5.0)" note above the error table; the note declares the five prefixes, lists the seven deprecated short codes explicitly (so a Reviewer grep flags any regression), and points at the parity guards (back-spec BR-25 here; `compliance-audit.back.md` BR-14, `curation.back.md` BR-32, `knowledge-graph.back.md` TC-04 elsewhere). NO use case, NO BR, NO endpoint, NO schema, NO error code, NO operationId, NO HTTP status, NO state transition and NO event added, modified or removed. The `openapi.yaml` v1.5.0 companion adds the same cross-reference in `info.description`; the `back/query-retrieval.back.md` v1.6.0 companion tightens BR-24 / BR-25 language to state byte-identical namespaced parity explicitly. No DDL, no migration -- P2.1 is spec-first (owner decision, 2026-07-02). | sdd_query-retrieval_spec-writer |
