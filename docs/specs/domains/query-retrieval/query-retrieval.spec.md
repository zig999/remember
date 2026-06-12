# Query / Retrieval -- Business Specification

> Version: 1.1.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml`
> Source of truth: `/segundo-cerebro-modelagem-v7.md` (sections 7, 13, 16, 17, 20 + ADRs A2, A3, A4, A15, A16, A21, A22, A23, A24, A25, A26, A28, A29)
> Schema reference: `/migrations/0001_schema.sql`, `/migrations/0002_seed.sql`

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Expose the deterministic full-text + graph retrieval pipeline of section 7 and the cross-layer provenance walk of section 14.3, so the SPA (via REST) and the LLM-as-orchestrator (via MCP) can answer questions with citations, while honoring the temporal model and the permanent ban on embeddings. |
| Core entity | The pipeline itself (no aggregate root); inputs are `RawChunk`, `InformationFragment`, `NodeAlias`, `KnowledgeNode`, `KnowledgeLink`, `NodeAttribute`, `Provenance`, `FragmentSource`, `RawInformation` -- all owned by other domains. This domain is a stateless read facade. |
| Bounded context | (a) Query parsing with `websearch_to_tsquery` on two configurations (`pt_unaccent_v1`, `simple_unaccent_v1`); (b) three-layer scored full-text retrieval (fragment 1.0 / node 0.9 / chunk 0.6); (c) fragment-vs-chunk dedup; (d) graph expansion via the `traverse` service of `knowledge-graph` (depth default 1, max 3, decay 0.5 per hop); (e) temporal filters `as_of` / `in_effect_only` / `include_uncertain`; (f) cross-layer provenance walk to `RawInformation`. |
| Out of scope | Embeddings / semantic similarity / `pgvector` (permanent non-goal, section 20.1 / ADR A24); synonym dictionary plugged into the FTS configs (ADR A4, deferred); system-time travel (query (c), ADR A25); writes; point reads of single graph entities (those live in `knowledge-graph`); curation; compliance deletion execution. See section 8. |

---

## 2. Actors

> Single-owner system per ADR A20 / section 2.3. There is no `User` entity. Authentication exists as a network-access gate (section 2.5 / ADR A29).

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner | The single data owner authenticated via Neon Auth (Stack Auth) -- JWT validated in BFF middleware against the Neon Auth JWKS endpoint, reaching the BFF from the SPA over the network. | Call `searchKnowledge` with any combination of supported parameters; call `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment` for any consolidated row. Write operations are NOT exposed by this domain. |
| LLM (orchestrator) | The LLM acting as orchestrator/redactor over the same service layer via the MCP `query` toolset (`search`, `get_provenance`). | Same retrieval permissions as Owner. The JWT is provisioned to the LLM by the Owner's runtime. The LLM does NOT perform retrieval "from memory" -- it MUST call the deterministic tools and cite the returned provenance (sections 2.1, 7, principle 15). |

> Both actors hit the SAME service layer (REST + MCP are facades over a single core, ADR A28). This domain's REST contract is identical to the MCP-side `query` toolset for `search` and `get_provenance`.

---

## 3. Use Cases

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
9. BFF returns `200` with `SearchResponse` (echo of `query`, `total`, `limit`, `offset`, `items`).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`.
- `3a` `query` is empty (after `btrim`), exceeds 1000 chars, or `websearch_to_tsquery` parses to an empty `tsquery` (only stopwords / only operators) -> 422 `BUSINESS_INVALID_SEARCH_QUERY`.
- `4a` `layers[]` contains a value outside `{fragment, node, chunk}` -> 422 `BUSINESS_INVALID_SEARCH_LAYER`.
- `4b` Full-text returns zero rows in every layer -> 200 with `total = 0`, `items = []` (NOT an error; covers cenario C11).
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
5. BFF returns `200` with `SearchResponse`.

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
5. BFF returns `200` with `SearchResponse` where every `item.layer` is in the requested subset.

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
5. BFF returns `200` with `SearchResponse`.

**Alternative flows:**
- (As UC-01.)

**Related endpoint:** operationId: `searchKnowledge`

---

### UC-05 -- Search that produces zero results due to permanent lexical limitation (cenario C11)

**Actor:** Owner | **Pre:** Owner is authenticated; the query has no character overlap with any indexed text. | **Post:** Owner receives `200` with `total = 0`, `items = []`.

**Main flow:**
1. Owner calls `GET /api/v1/search?query=Iniciativa%20Lunar` while the corpus is the Apollo dataset (cenario C1).
2. BFF middleware validates the JWT.
3. Service layer parses the query. `websearch_to_tsquery` produces a valid (non-empty) `tsquery`; the three SQL queries return zero rows because no character bridge exists between "lunar / iniciativa" and "Apollo / implantacao" / "projeto".
4. BFF returns `200` with `total = 0`, `items = []`. THIS IS THE CONTRACT (BR-11 / section 20.1 / ADR A24): synonym / paraphrase without character overlap returns zero. The escape valve is curation (`entity_match`) -- belongs to the `curation` domain.

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
5. BFF returns `200`.

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
7. BFF returns `200` with `ProvenanceResponse`.

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
4. Steps 5-7 of UC-07 apply identically.

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
5. Steps 5-7 of UC-07 apply identically (raw deletion check, excerpt slicing, response shape).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Fragment not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Fragment exists but `status != 'accepted'` -> 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED`.
- `5a` Underlying RawInformation tombstoned -> 410 `BUSINESS_RAW_INFORMATION_DELETED`.
- `7a` Database connectivity / unexpected error -> 500; timeout -> 503.

**Related endpoint:** operationId: `getProvenanceByFragment`

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

The DB has `CREATE INDEX information_fragment_fts_idx ON information_fragment USING gin (text_search) WHERE status = 'accepted'` (DB lines 261-262). Non-accepted fragments (`proposed`, `rejected`, `deleted`) are invisible to `search`. This is also why `getProvenanceByFragment` rejects `status != 'accepted'` with `BUSINESS_FRAGMENT_NOT_ACCEPTED`: surfacing a non-accepted fragment via point-read would let callers bypass the index policy.

**Tied to:** UC-01, UC-06, UC-09.

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

When ANY `raw_information.status = 'deleted'` is encountered while walking the chain, the request returns 410 `BUSINESS_RAW_INFORMATION_DELETED`. We do NOT return partial chains. Rationale: section 11 says tombstoned content MUST NOT recirculate; returning siblings of a tombstoned source would still leak the existence and metadata of the deleted document beyond what `ComplianceDeletion` already audits.

**Tied to:** UC-07, UC-08, UC-09.

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

Every endpoint in this domain is closed behind `bearerAuth` (Neon Auth / Stack Auth). The middleware verifies the JWT against the Neon Auth JWKS endpoint (`${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default; cache TTL `NEON_AUTH_JWKS_TTL_S`) BEFORE any database access. Missing / invalid / expired -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`. Database credentials (`DATABASE_URL`) and Neon Auth configuration NEVER appear outside the BFF; Postgres RLS is not used on Neon for this BFF (authorization is centralized in the BFF service layer).

**Tied to:** UC-01 through UC-09.

### BR-17 -- Performance budgets are hard ceilings (section 16)

- `searchKnowledge` p95 < 500 ms.
- `searchKnowledge` with `expand=true` AND `expand_depth = 3` p95 < 1 s (inherits the `traverse(depth <= 3)` budget of section 16).
- `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment` p95 < 200 ms.

These are sanity ceilings; at the corpus scale of section 16 (10^2-10^3 documents, full DB fits in cache) measured latencies live in the low-ms range. Breaching a ceiling under normal load is an operational alarm. SLOs apply to the BFF-to-client round trip on a warm DB.

**Tied to:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09.

### BR-18 -- Pagination defaults: `limit = 20`, `offset = 0` (ADR A16)

Mirrors the `search` MCP tool contract of section 14.3. Default page is 20 items; max page is 100. The same default is used by `traverseNode` of `knowledge-graph` -- defaults are aligned across the read surface.

**Tied to:** UC-01.

---

## 5. State Machine

> The retrieval domain is STATELESS. The lifecycle of its inputs (`InformationFragment.status`, `KnowledgeLink.status`, `NodeAttribute.status`, `KnowledgeNode.status`, `RawInformation.status`) belongs to other domains. See `knowledge-graph.spec.md` section 5 for the lifecycle diagrams of links / attributes / nodes; the `ingestion` domain owns the `InformationFragment` lifecycle (`proposed -> accepted | rejected | deleted`); the `compliance` domain owns the `RawInformation` tombstone transition.

> Section removed per template guidance ("Remove section if not applicable") -- KEPT as an explicit notice because the absence of a state machine in a read domain is a load-bearing decision (no caching, no session, no cursor state held server-side).

---

## 6. Error Behaviors

> Every code below is registered in the global error-codes catalog (`docs/specs/_global/error-codes.md`).

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without `Authorization` header | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (BR-16, cenario C16). |
| JWT malformed | 401 | `AUTH_TOKEN_INVALID` | Decoding fails (BR-16). |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | `exp` claim in the past (BR-16). |
| `link_id` / `attribute_id` / `fragment_id` not in DB | 404 | `RESOURCE_NOT_FOUND` | Standard point-read miss. |
| `fragment_id` exists but `status != 'accepted'` | 404 | `BUSINESS_FRAGMENT_NOT_ACCEPTED` | UC-09 / BR-05. |
| Underlying `RawInformation` tombstoned by `compliance_delete` | 410 | `BUSINESS_RAW_INFORMATION_DELETED` | BR-14 / section 11. |
| `query` empty after `btrim`; parsed `tsquery` empty; `length > 1000` | 422 | `BUSINESS_INVALID_SEARCH_QUERY` | BR-15. |
| `layers[]` contains a value outside `{fragment, node, chunk}` | 422 | `BUSINESS_INVALID_SEARCH_LAYER` | BR-15. |
| `expand_depth` outside `[1, 3]` | 422 | `BUSINESS_INVALID_TRAVERSE_DEPTH` | BR-06 / BR-15 (reused from `knowledge-graph`, same ADR A16 constant). |
| `expand_link_types[]` contains a name not in catalog | 422 | `BUSINESS_UNKNOWN_LINK_TYPE` | BR-15 (reused from `knowledge-graph`). |
| `as_of` not parseable as ISO `YYYY-MM-DD` | 422 | `VALIDATION_INVALID_FORMAT` | BR-15. |
| `limit` outside `[1, 100]`; `offset` < 0 | 422 | `VALIDATION_OUT_OF_RANGE` | BR-15. |
| Database connectivity / unexpected error | 500 | `SYSTEM_INTERNAL_ERROR` | Default fallback for unhandled exceptions. |
| Database read timeout against Neon | 503 | `SYSTEM_SERVICE_UNAVAILABLE` | Integration with Neon (managed Postgres) unavailable. |

---

## 7. Cross-Domain Dependencies

> Bidirectional. The peer domains below MUST list `query-retrieval` as their consumer/producer when they are specified.

| Domain | Type | Description |
|--------|------|-------------|
| `ingestion` | consumes | This domain reads `RawInformation`, `RawChunk`, `InformationFragment`, `FragmentSource` rows written by `ingestion`. It also relies on the `text_search` STORED `tsvector` columns and on the partial GIN index `WHERE status = 'accepted'` -- both populated/maintained by ingestion writes. |
| `knowledge-graph` | consumes | This domain reads `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink`, `Provenance` rows. Expansion (BR-06) calls the same service layer as `knowledge-graph` `traverseNode` (UC-06 of that domain). Derived fields (`is_current`, `is_in_effect`, `effective_status`) come from the shared views `knowledge_link_resolved` / `node_attribute_resolved`. |
| `curation` | synchronizes | The lifecycle transitions `uncertain -> active`, `disputed -> active / deleted`, etc. are triggered by curation. This domain READS the post-curation state. The `entity_match` queue is the EXPLICIT escape valve for the lexical limitation surfaced by BR-11 / UC-05. |
| `compliance` | synchronizes | `compliance_delete` sets `RawInformation.status = 'deleted'` and tombstones content; this domain checks for it on every provenance walk and returns 410. |
| `auth` | synchronizes | Owner authentication via Neon Auth (Stack Auth). The middleware that validates the JWT (JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`) is the same one used by all REST/MCP transports (sections 2.5, A29). This domain consumes the resulting `actor_context = owner` claim. |

---

## 8. Out of Scope

- **Embeddings / `pgvector` / vector store / ANN / semantic similarity** -- PERMANENT non-goal per section 20.1 / ADR A24. Cenario C11 is the contract; the escape valve is curation. This domain will NEVER expose endpoints related to such capability.
- **Synonym dictionary plugged into the FTS configuration (ADR A4)** -- The only "matching meaning" door allowed by the design. Today: NOT implemented. Activation path: new versioned config (`pt_unaccent_v2` with the dictionary) + full reindex of `raw_chunk.text_search` and `information_fragment.text_search` + alias config swap at the query-parse site. Zero schema migration. Not in this version.
- **System-time travel ("what did the system know at instant T", query (c) of section 5.3)** -- DEFERRED per ADR A25. Data preserved (`recorded_at` on every row), no endpoint exposes it. Activation = add `system_time_at` query parameter + matching SQL filter `recorded_at <= T AND (superseded_at IS NULL OR superseded_at > T)`. No migration.
- **Dedicated review queues for `uncertain` / `low_confidence` results** (ADR A26) -- DEFERRED. Today they are display flags returned in `flags[]`. Promotion to a dedicated `list_review_queue` kind is additive in the `curation` domain.
- **Point reads of single graph entities (`getNodeById`, `getLinkById`, `getAttributeById`, `traverseNode`, history walks)** -- owned by the `knowledge-graph` domain. This domain calls the same service layer internally for the expansion step (BR-06) but does NOT expose those endpoints under `/api/v1/search` or `/api/v1/provenance/*`.
- **Writes** -- no write endpoint lives in this domain. The `search` and `get_provenance` MCP tools are pure reads per section 14.3.
- **Cursor-based pagination, infinite scroll, streaming responses** -- offset/limit only. The corpus scale (section 16) makes cursor pagination unnecessary; revisiting is a future ADR.
- **Multi-user / role-based authorization** -- PERMANENT non-goal in v7 (ADR A20). The `actor_context` is implicit (owner).
- **Free-form regex / SQL injection passthrough** -- the only query language accepted is `websearch_to_tsquery` (which itself supports `"phrase"`, `-exclusion`, `OR`). Raw SQL or regex from the user is rejected at the BFF input layer.

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
| Tombstone | The state set by `compliance_delete` on `RawInformation` (section 11). Triggers 410 `BUSINESS_RAW_INFORMATION_DELETED` in provenance walks (BR-14). |
| Expansion | The graph traversal step (UC-01 step 6) that grows the result set from `node` hits via `KnowledgeLink` edges, capped by `expand_depth` and decayed by `0.5^hop`. |
| Excerpt | The slice `raw_chunk.text[offset_start:offset_end)` indexed in Unicode code points (BR-12 / ADR A22). Always semi-open `[start, end)`. |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial business spec for the query-retrieval domain. Forward-generated from segundo-cerebro-modelagem-v7.md (sections 7, 13, 16, 17, 20) and migrations/0001_schema.sql + 0002_seed.sql. Covers `searchKnowledge` (section 7.2 pipeline: two FTS configs, three layers with weights 1.0/0.9/0.6, dedup, graph expansion with depth 1-3 and decay 0.5, temporal filters, flags) and the three `getProvenanceBy*` endpoints (cross-layer walk to RawInformation with tombstone short-circuit). Reaffirms the permanent ban on embeddings (ADR A24 / section 20.1) -- cenario C11 is the binding contract. | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | change | Infrastructure migration: replaced Supabase Auth with Neon Auth (Stack Auth) in §2 Owner actor description, UC-01 pre-condition (the only UC that named the auth provider), BR-16 (heading + body -- JWKS endpoint `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA, TTL `NEON_AUTH_JWKS_TTL_S`, `DATABASE_URL` for DB credentials), §6 503 row (now references Neon as the managed Postgres provider) and §7 `auth` cross-domain dependency. Removed mention of Supabase service key and Supabase RLS toggle (replaced by 'Postgres RLS not used on Neon for this BFF'). No use cases, error codes, state transitions, or business invariants changed. Schema and segundo-cerebro-modelagem-v7.md are untouched. | migrate-neon |
