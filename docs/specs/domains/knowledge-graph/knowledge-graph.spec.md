# Knowledge Graph -- Business Specification

> Version: 1.1.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml`
> Source of truth: `/remember-modelagem-v7.md` (sections 3, 4, 5, 6, 15 + ADRs A1, A6, A7, A8, A9, A10, A11, A12, A14, A16, A19, A20, A25, A26, A28, A29)
> Schema reference: `/migrations/0001_schema.sql`, `/migrations/0002_seed.sql`

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Own the consolidated knowledge layer of the Remember: entities (`KnowledgeNode`), their aliases (`NodeAlias`), literal temporal values (`NodeAttribute`), and directed temporal relations (`KnowledgeLink`); plus the catalogs (`NodeType`, `LinkType`, `LinkTypeRule`, `AttributeKey`) that govern them. |
| Core entity | `KnowledgeNode` (with `NodeAlias`, `NodeAttribute`, `KnowledgeLink` as its companions) |
| Bounded context | (a) entity resolution (matching/merging by `norm(x)` + trigram, single-owner advisory lock); (b) temporal model on validity axis `[valid_from, valid_to)`; (c) lifecycle and lineage (`status`, `supersedes_*`, `merged_into_node_id`); (d) read-side derivation of `is_current`, `is_in_effect`, `effective_status`; (e) read access to the seed catalog. |
| Out of scope | Ingestion of raw documents and chunking (`ingestion` domain), LLM extraction loop, retrieval pipeline (`retrieval` domain), curation operations (`curation` domain), compliance deletion execution (`compliance` domain). See section 8. |

---

## 2. Actors

> Single-owner system per ADR A20 / section 2.3. There is no `User` entity in the domain. Authentication exists as a network-access gate (section 2.5 / A29): the SPA reaches the BFF over the network.

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner | The single data owner authenticated via Neon Auth (Stack Auth) -- JWT validated in BFF middleware against the Neon Auth JWKS endpoint. | Read any catalog row; read any `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink` regardless of status; walk lineage via `getLinkHistory` / `getAttributeHistory` / `getAttributeKeyHistory`; traverse the graph up to depth 3. Write operations on graph entities are NOT exposed by this domain (they originate from `ingestion` and `curation`). |
| LLM (orchestrator) | The LLM acting as orchestrator/redactor over the same REST surface via the BFF. | Same read permissions as Owner. Uses the same JWT-bearer contract (the JWT is provisioned to the LLM by the Owner's runtime). NOT permitted to bypass the BFF or open a database connection. |

> Both actors hit the SAME service layer (REST + MCP are facades over a single core, ADR A28). This domain's REST contract is identical to the MCP-side `query` toolset, restricted to graph-entity operations (`get_node`, `traverse`, `get_history`).

---

## 3. Use Cases

### UC-01 -- List NodeType catalog

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner has the full list of registered `NodeType` rows.

**Main flow:**
1. Owner calls `GET /api/v1/node-types`.
2. BFF middleware validates the JWT (section 2.5).
3. Service layer reads `node_type` rows (currently 8 per seed §15.1: `Person`, `Organization`, `Project`, `Event`, `Role`, `Category`, `Concept`, `Location`).
4. BFF returns `200` with `total = 8` and the items.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` or `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`.
- `3a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listNodeTypes`

---

### UC-02 -- List LinkType catalog (with optional rules)

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner has the full list of `LinkType` rows, optionally embedding the `LinkTypeRule` rows for each.

**Main flow:**
1. Owner calls `GET /api/v1/link-types?include_rules=true`.
2. BFF middleware validates the JWT.
3. Service layer reads `link_type` rows (10 per seed §15.2) and, when `include_rules=true`, joins `link_type_rule` (22 rules per seed §15.2).
4. BFF returns `200`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listLinkTypes`

---

### UC-03 -- List AttributeKey catalog, filtered by NodeType

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner has the AttributeKeys scoped to a NodeType (or the full catalog).

**Main flow:**
1. Owner calls `GET /api/v1/attribute-keys?node_type=Project`.
2. BFF middleware validates the JWT.
3. Service layer reads `attribute_key` rows joined to `node_type` filtered by name.
4. BFF returns `200` with the matching rows (4 for `Project` per seed §15.3: `deadline`, `start_date`, `status_text`, `budget`).

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `node_type` parameter does not match any row in `node_type.name` -> 422 `BUSINESS_UNKNOWN_NODE_TYPE`.
- `3b` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listAttributeKeys`

---

### UC-04 -- List nodes filtered by NodeType and/or name prefix

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner has a paginated list of `KnowledgeNode` rows matching the filters.

**Main flow:**
1. Owner calls `GET /api/v1/nodes?node_type=Project&name_prefix=Apollo&limit=20&offset=0`.
2. BFF middleware validates the JWT.
3. Service layer joins `knowledge_node` with `node_alias`, applies `alias_norm LIKE norm('Apollo') || '%'` and the `node_type` filter (section 4.2 "always within the same node_type"). Default `status` filter = `active`.
4. BFF returns `200` with `total`, `limit`, `offset`, `items`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `node_type` parameter unknown -> 422 `BUSINESS_UNKNOWN_NODE_TYPE`.
- `3b` `limit` > 100 or < 1, or `offset` < 0 -> 422 `VALIDATION_OUT_OF_RANGE`.
- `3c` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listNodes`

---

### UC-05 -- Get a node with aliases and current attributes

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; the `node_id` corresponds to an existing `KnowledgeNode`. | **Post:** Owner sees the node, all aliases (including canonical), and the attributes resolved by the temporal filter (default: query (a), section 5.3).

**Main flow:**
1. Owner calls `GET /api/v1/nodes/{node_id}` (optionally with `?as_of=YYYY-MM-DD`, `?in_effect_only=true`, `?include_uncertain=true`).
2. BFF middleware validates the JWT.
3. Service layer reads `knowledge_node`. If `status = 'merged'`, response includes `merged_into_node_id` (always points to an active node, section 4.4 invariant) and continues.
4. Service layer reads `node_alias` rows for the node and `node_attribute_resolved` (section 5.4 view) with the filter:
   - default: `WHERE valid_to IS NULL AND superseded_at IS NULL` (query (a));
   - when `as_of` provided: query (b) (section 5.3);
   - when `in_effect_only=true`: requires `is_in_effect`;
   - when `include_uncertain=false`: omit rows with `status = 'uncertain'`.
5. BFF returns `200` with `NodeDetail` payload.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Node not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Node has `status = 'deleted'` (set by `compliance_delete`, section 11) -> 410 `BUSINESS_NODE_DELETED`.
- `4a` `as_of` not parseable as ISO date -> 422 `VALIDATION_INVALID_FORMAT`.
- `5a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getNodeById`

---

### UC-06 -- Traverse the graph from a starting node

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; `node_id` exists and `status != 'deleted'`. | **Post:** Owner has the set of nodes and links reached within `depth` hops, with derived temporal state per link.

**Main flow:**
1. Owner calls `GET /api/v1/nodes/{node_id}/traverse?direction=both&depth=2&link_types=participates_in&link_types=responsible_for&as_of=2026-07-01&in_effect_only=true`.
2. BFF middleware validates the JWT.
3. Service layer validates each `link_types[]` name against the catalog (must exist).
4. Service layer performs BFS from `node_id` over `knowledge_link_resolved` (section 5.4 view) applying:
   - the direction filter (using `link_type.inverse_name` for `in`/`both` per section 14.3);
   - the link_type filter;
   - the temporal filters (`as_of` -> query (b); `in_effect_only` -> requires `is_in_effect`);
   - stop at `depth`.
5. Path-compress merged nodes on read: when a traversed endpoint has `status = 'merged'`, the service substitutes `merged_into_node_id` (section 4.4 invariant, points to an active node).
6. Each link entry receives `hop` = hop number and `score = 0.5^hop` (ADR A16).
7. BFF returns `200` with `TraversalResult`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `link_types[]` contains a name not in the catalog -> 422 `BUSINESS_UNKNOWN_LINK_TYPE`.
- `3b` `depth` outside `[1, 3]` -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH`.
- `3c` `direction` not in `{out, in, both}` -> 422 `VALIDATION_INVALID_FORMAT`.
- `4a` Starting node not found -> 404 `RESOURCE_NOT_FOUND`.
- `4b` `as_of` not parseable -> 422 `VALIDATION_INVALID_FORMAT`.
- `7a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `traverseNode`

---

### UC-07 -- Get a single link by id

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner sees the link with its derived temporal fields and provenance.

**Main flow:**
1. Owner calls `GET /api/v1/links/{link_id}`.
2. BFF middleware validates the JWT.
3. Service layer reads `knowledge_link_resolved` (section 5.4) and joins `provenance` -> `information_fragment` -> `fragment_source` -> `raw_chunk` -> `raw_information` to assemble the `ProvenanceEntry[]`.
4. BFF returns `200` with `LinkDetail`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Link not found -> 404 `RESOURCE_NOT_FOUND`.
- `4a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getLinkById`

---

### UC-08 -- Get a single attribute by id

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT. | **Post:** Owner sees the attribute with its derived temporal fields and provenance.

**Main flow:**
1. Owner calls `GET /api/v1/attributes/{attribute_id}`.
2. BFF middleware validates the JWT.
3. Service layer reads `node_attribute_resolved` (section 5.4) and joins provenance as in UC-07.
4. BFF returns `200` with `AttributeDetail`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Attribute not found -> 404 `RESOURCE_NOT_FOUND`.
- `4a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getAttributeById`

---

### UC-09 -- Walk the lineage chain of a link

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; `link_id` exists. | **Post:** Owner sees every version that is part of the same lineage chain anchored at `link_id`, ordered ASC by `recorded_at`.

**Main flow:**
1. Owner calls `GET /api/v1/links/{link_id}/history`.
2. BFF middleware validates the JWT.
3. Service layer computes the closure of the lineage chain: starting from `link_id`, walk both up (`supersedes_link_id`) and down (rows where `supersedes_link_id = current`); collect all rows.
4. Sort ASC by `recorded_at`.
5. For each version, embed the `ProvenanceEntry[]` as in UC-07.
6. BFF returns `200` with `LinkHistoryResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Link not found -> 404 `RESOURCE_NOT_FOUND`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getLinkHistory`

---

### UC-10 -- Walk the lineage chain of an attribute

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; `attribute_id` exists. | **Post:** Owner sees every version that is part of the same lineage chain anchored at `attribute_id`, ordered ASC by `recorded_at`.

**Main flow:**
1. Owner calls `GET /api/v1/attributes/{attribute_id}/history`.
2. BFF middleware validates the JWT.
3. Service layer walks the chain via `supersedes_attribute_id` (same algorithm as UC-09).
4. Sort ASC by `recorded_at`.
5. Embed provenance.
6. BFF returns `200` with `AttributeHistoryResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Attribute not found -> 404 `RESOURCE_NOT_FOUND`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getAttributeHistory`

---

### UC-11 -- Walk the history of every version on a (node, key) pair

**Actor:** Owner | **Pre:** Owner is authenticated with a valid Neon Auth JWT; `node_id` exists; `key` is registered in the catalog for the node's NodeType. | **Post:** Owner sees every version on that `(node, key)` pair, ordered ASC by `recorded_at`.

**Main flow:**
1. Owner calls `GET /api/v1/nodes/{node_id}/attributes/{key}/history`.
2. BFF middleware validates the JWT.
3. Service layer reads the node to discover its `node_type_id`; looks up the `attribute_key` row for `(node_type_id, key)`.
4. Service layer reads all `node_attribute` rows with `node_id` and `attribute_key_id`, ordered ASC by `recorded_at`.
5. Embed provenance per row.
6. BFF returns `200` with `AttributeHistoryResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Node not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Node deleted -> 410 `BUSINESS_NODE_DELETED`.
- `3c` `key` not registered for the node's NodeType -> 404 `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getAttributeKeyHistory`

---

## 4. Business Rules

> Each BR is programmatically testable. All BRs reference at least one UC.

### BR-01 -- Normalization is the single source of truth for name comparison

`norm(x) = lower(unaccent(collapsed_whitespace(trim(x))))`. Used identically by entity resolution (section 4.1), `node_alias.alias_norm` (DB-generated STORED column), and full-text configurations. Any string comparison performed by this domain MUST apply `norm` to BOTH sides before comparing. Implemented in the DB via the IMMUTABLE function `norm(text)` (migration 0001).

**Tied to:** UC-04 (name prefix filter).

### BR-02 -- Entity-resolution matching is scoped to a single `node_type`

Per section 4.2, a candidate is only considered when the candidate's node and the proposed node share the same `node_type_id`. "Apollo" as a `Person` MUST NOT match "Apollo" as a `Project`. The composite (node_type_id, alias_norm) check is realized at runtime by JOIN between `knowledge_node` and `node_alias` (DB note 5).

**Tied to:** UC-04, UC-05 (and the upstream `ingestion` domain that performs writes against `propose_node`).

### BR-03 -- Trigram fuzzy is the only fuzzy signal

Per ADR A3 / section 4.2, the only fuzzy similarity signal is `pg_trgm` (operator `%`, GIN index on `node_alias.alias_norm`). No vector / semantic signals are admitted. This is a permanent non-goal per section 20.1 / A24. Levenshtein remains documented as a potential future LEXICAL extension only.

**Tied to:** UC-04 (when extended; for now `listNodes` exposes only exact / prefix lookups -- fuzzy matching is the responsibility of the `ingestion` domain's entity resolver).

### BR-04 -- Entity-resolution decision thresholds are fixed (ADR A12)

When the `ingestion` domain proposes a node (read here for context):
- Strong match: exact equality, OR exactly 1 candidate >= 0.85 AND no other >= 0.55.
- Ambiguous: any candidate in `[0.55, 0.85)`, OR >= 2 candidates >= 0.85.
- No match: all candidates < 0.55.

This domain READS the result (`KnowledgeNode.status` is set by the resolver: `active`, `needs_review`, or `merged`).

**Tied to:** UC-05 (a `needs_review` node is returned by `getNodeById` with `status = 'needs_review'`).

### BR-05 -- Validity axis uses `date`; transaction axis uses `timestamptz` UTC

Per ADR A8 / section 5.1. `valid_from`, `valid_to`, and all attribute-derived date columns are `date`. `recorded_at`, `superseded_at`, `created_at`, `updated_at` are `timestamptz` in UTC. Display timezone (`America/Sao_Paulo`) is a presentation-layer concern (not this domain).

**Tied to:** UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11.

### BR-06 -- Validity intervals are semi-open `[valid_from, valid_to)`

Per ADR A7 / section 5.2. `valid_from` is inclusive; `valid_to` is exclusive. Successive versions on a functional `(node, key)` share the boundary literally: `prev.valid_to = next.valid_from`. NULL semantics: `valid_from IS NULL` = "since forever / unknown" (-infinity); `valid_to IS NULL` = "still valid" (+infinity). Period normalization without a day fixes to the first day of the period (e.g., "since March/2026" => `valid_from = 2026-03-01`).

**Tied to:** UC-05, UC-06, UC-09, UC-10, UC-11.

### BR-07 -- Query (a) - current view - is the read default

Per section 5.3. When no `as_of` is provided, every read filters with `valid_to IS NULL AND superseded_at IS NULL`. This selects rows that are: (i) still valid (validity axis) AND (ii) the transaction-axis-current version. Correction (6.5-B) is honored implicitly because the corrected predecessor has `superseded_at` set.

**Tied to:** UC-05, UC-06, UC-07, UC-08.

### BR-08 -- Query (b) - valid-time travel - via `as_of`

Per section 5.3. When `as_of=D` is provided:
- `superseded_at IS NULL` (still the transaction-current row), AND
- `(valid_from IS NULL OR valid_from <= D)` AND
- `(valid_to IS NULL OR valid_to > D)`.

System-time travel (query (c)) is DEFERRED per ADR A25 and not exposed by this domain. `recorded_at` is stored on every row so the capability can be added later without migration or back-fill.

**Tied to:** UC-05, UC-06.

### BR-09 -- Clock-dependent state is derived on read, never stored (ADR A9)

`is_current`, `is_in_effect`, and `effective_status` are computed by the `knowledge_link_resolved` and `node_attribute_resolved` views (section 5.4):
- `is_current ≡ valid_to IS NULL AND superseded_at IS NULL`
- `is_in_effect ≡ is_current AND (valid_from IS NULL OR valid_from <= current_date)`
- `effective_status ≡ CASE WHEN status='active' AND valid_to IS NOT NULL AND valid_to <= current_date THEN 'inactive' ELSE status END`

`inactive` is NEVER persisted; it appears ONLY in `effective_status` on read.

**Tied to:** UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11.

### BR-10 -- Multiplicity is governed exclusively by `allows_multiple_current` (ADR A10)

Functional types (`allows_multiple_current = false`, e.g. `reports_to`, `deadline`) admit a single current version per `(source, link_type)` / `(node, key)`. Multi-valued types (`allows_multiple_current = true`, e.g. `participates_in`, `email`) admit coexisting current versions. The data model carries this flag on `link_type` and `attribute_key`; no other rule overrides it.

**Tied to:** UC-02, UC-03, UC-04 (filter behavior), UC-06 (the same target node appears N times when reached through N coexisting multi-valued links).

### BR-11 -- Duplicate guard: one current row per `(source, target, link_type)` / `(node, key, value)`

Per section 6.5 + DB unique partial indexes (`knowledge_link_current_dup_guard`, `node_attribute_current_dup_guard`). Re-affirmation MUST NOT create duplicate current rows; instead, the `ingestion` domain consolidates by adding `Provenance` rows to the existing item. This read domain returns provenance with N entries when N independent sources have re-affirmed the same fact.

**Tied to:** UC-07, UC-08 (the `provenance[]` array typically has length >= 1 and accumulates).

### BR-12 -- `recorded_at` is written on every row; `superseded_at` is used by succession AND correction

Per section 5.3 + section 6.5-A/6.5-B. Succession (6.5-A) and correction (6.5-B) both set `superseded_at = now()` on the predecessor and create a new row. The DIFFERENCE between the two is encoded by `valid_to`:
- Succession: `prev.valid_to = change_date` AND new row with `valid_from = change_date`;
- Correction: `prev.valid_to` UNCHANGED (the world did not change) AND new row with the corrected period.

This domain READS both -- the `getLinkHistory` and `getAttributeHistory` chains expose both kinds in chronological order.

**Tied to:** UC-09, UC-10, UC-11.

### BR-13 -- Lineage pointer is mandatory on succeeded rows (section 6.3)

Every superseded row MUST have its successor's id in `supersedes_link_id` / `supersedes_attribute_id`. The history walk follows this pointer up; the successor row is found by looking for a row where `supersedes_X = previous.id`.

**Tied to:** UC-09, UC-10, UC-11.

### BR-14 -- `merged_into_node_id` always points to an active node (section 4.4)

Per the path-compression rule. The DB has a CHECK constraint binding `status = 'merged'` to a non-null `merged_into_node_id` and a CHECK forbidding self-merge. On READ: the traversal (UC-06) substitutes the target with its survivor, and `getNodeById` (UC-05) returns the `merged_into_node_id` so the SPA can decide whether to redirect.

**Tied to:** UC-05, UC-06.

### BR-15 -- Stable types carry no validity axis

Per section 6.2 / seed §15.2 / §15.3. For `LinkType`s where `is_temporal = false` (`belongs_to_category`, `related_to`) and `AttributeKey`s where `is_temporal = false` (`birth_date`, `cnpj`), `valid_from` and `valid_to` MUST be NULL. Their transaction axis (`recorded_at`, `superseded_at`) is still used (corrections via 6.5-B remain possible). `is_current` for these rows = `superseded_at IS NULL`.

**Tied to:** UC-05, UC-06, UC-07, UC-08.

### BR-16 -- Status enum is closed and storage-only (section 6.4)

`assertion_status` admits exactly `{active, uncertain, disputed, superseded, deleted}`. `inactive` is derived (BR-09), never written. `node_status` admits exactly `{active, needs_review, merged, deleted}`. Any deviation is a violation of section 6.4.

**Tied to:** UC-04 (status filter), UC-05.

### BR-17 -- Catalog is mutation-by-migration (section 12)

`NodeType`, `LinkType`, `LinkTypeRule`, `AttributeKey` are read-only via REST. New rows enter exclusively by versioned SQL migration. Validation of incoming proposals (in the `ingestion` domain) uses the rule version active at creation time -- versions are NOT invalidated by later migrations.

**Tied to:** UC-01, UC-02, UC-03.

### BR-18 -- Traversal depth is bounded `[1, 3]` (ADR A16)

`depth` parameter MUST be an integer in `[1, 3]`. Default = 1. Out-of-range -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH`. Score decay per hop = `0.5` (ADR A16); the traversal endpoint emits `score = 0.5^hop` for downstream callers.

**Tied to:** UC-06.

### BR-19 -- Provenance returned by read endpoints is the FULL chain to the source (section 13 anti-hallucination)

Every link/attribute included in the read response includes its `provenance[]`, each entry resolving the chain `Provenance -> InformationFragment -> FragmentSource -> RawChunk -> RawInformation`. When no `Provenance` rows are found, the row is by definition invalid (the `ingestion` domain rejects writes without provenance) -- the read returns an empty array only for legacy-data inconsistency, which is logged as a `SYSTEM_INTERNAL_ERROR` candidate (operational alarm). For the curation-created rows (correction via 6.5-B), `created_by_run_id` is NULL whenever the row originates from a curator action (not from an `LLMRun`), but `Provenance` MUST still exist (linked to the fragment(s) referenced by the curation action).

**Tied to:** UC-05, UC-07, UC-08, UC-09, UC-10, UC-11.

### BR-20 -- All endpoints require a valid Neon Auth JWT (ADR A29 / section 2.5)

Every endpoint in this domain is closed behind `bearerAuth` (Neon Auth / Stack Auth). The middleware verifies the JWT against the Neon Auth JWKS endpoint (`${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default; cache TTL `NEON_AUTH_JWKS_TTL_S`) BEFORE any database access. Missing/invalid/expired tokens map to `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (401). Database credentials (`DATABASE_URL`) and Neon Auth configuration NEVER appear outside the BFF; Postgres RLS is not used on Neon for this BFF (authorization is centralized in the BFF service layer).

**Tied to:** UC-01 through UC-11.

---

## 5. State Machine

### KnowledgeNode

```
        +-----------------+   curation: merge_nodes / resolve_entity_match
        |                 |   ----------------------------------------->  [merged]
        |    [active]     |
        |                 |   compliance_delete (section 11)
        |                 |   ----------------------------------------->  [deleted]
        +--------+--------+
                 ^
   curation: keep_separate (entity_match)
                 |
        +--------+--------+   curation: merge_into (entity_match)
        |  [needs_review] | ----------------------------------------->  [merged]
        +--------+--------+
                 |
                 |   compliance_delete
                 v
              [deleted]
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (new) | resolver: no match (< 0.55) | active | section 4.3 | (UC-05 reads result) |
| (new) | resolver: ambiguous match | needs_review | section 4.3 | (UC-05) |
| needs_review | curation `keep_separate` | active | curation domain | (UC-05) |
| needs_review | curation `merge_into` | merged | section 4.4 | (UC-05) |
| active | curation `merge_nodes` (absorbed) | merged | section 4.4 | (UC-05, UC-06) |
| any | `compliance_delete` | deleted | section 11 | (UC-05 returns 410) |

> Path-compression invariant (BR-14): `merged_into_node_id` always points to an ACTIVE node. `[merged]` rows are not navigated by traversal (UC-06 substitutes the survivor on read).

### KnowledgeLink / NodeAttribute

```
                  confidence in [0.40, 0.74) at creation
                          |
                          v
     [creation] -->  [uncertain] -- corroboration (auto) or confirm_item --> [active]
                          |
                          | succession / dispute / rejection
                          v
                                                 +------------ correction (6.5-B) ------+
                                                 |                                      |
                                                 v                                      |
     [creation] -- confidence >= 0.75 -->  [active] -- succession (6.5-A) -->  [superseded]
                                              |   |
                                              |   |  dispute detected (6.5-C)
                                              |   v
                                              | [disputed] -- prefer_one (loser) --> [deleted]
                                              |              -- prefer_one (winner) -> [active]
                                              |              -- adjust_periods -------> [active]
                                              |              -- keep_disputed --------> [disputed]
                                              v
                                            [deleted]  (reject_item / compliance_delete)
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (new) | confidence >= 0.75 | active | section 6.6 | (UC-07, UC-08) |
| (new) | confidence in [0.40, 0.74] | uncertain | section 6.6 | (UC-07, UC-08) |
| (new) | confidence < 0.40 | NOT CREATED (fragment stays `proposed`, flag `low_confidence`) | section 6.6 | (UC-07, UC-08 reads nothing) |
| active | succession (6.5-A) | superseded | section 6.5 | (UC-09, UC-10, UC-11) |
| active | correction (6.5-B) | superseded | section 6.5; `valid_to` UNCHANGED | (UC-09, UC-10, UC-11) |
| active | conflict (6.5-C) | disputed | section 6.5 | (UC-07, UC-08) |
| active | curation `reject_item` or `compliance_delete` | deleted | section 10 / 11 | (UC-07 returns the deleted row) |
| uncertain | corroboration (auto) or `confirm_item` | active | section 6.5 + section 10 | (UC-07, UC-08) |
| uncertain | succession / conflict / rejection | superseded / disputed / deleted | section 6.6 | (UC-09, UC-10, UC-11) |
| disputed | curation `prefer_one` (winner) | active | section 10 | (UC-07, UC-08) |
| disputed | curation `prefer_one` (loser) | deleted | section 10 | (UC-07, UC-08) |
| disputed | curation `adjust_periods` | active | section 10 | (UC-07, UC-08) |
| disputed | curation `keep_disputed` | disputed | section 10 | (UC-07, UC-08) |

> The transitions are TRIGGERED by the `ingestion` and `curation` domains. This domain READS the result and is responsible for surfacing the derived flags (`is_current`, `effective_status`).

### Derived state on read (section 5.4)

| Derived field | Formula | Stored? |
|---------------|---------|---------|
| `is_current` | `valid_to IS NULL AND superseded_at IS NULL` | NO |
| `is_in_effect` | `is_current AND (valid_from IS NULL OR valid_from <= current_date)` | NO |
| `effective_status` | `CASE WHEN status='active' AND valid_to IS NOT NULL AND valid_to <= current_date THEN 'inactive' ELSE status END` | NO |

---

## 6. Error Behaviors

> Every code below is registered in the global error-codes catalog (`docs/specs/_global/error-codes.md`).

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without `Authorization` header | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (section 2.5). |
| JWT malformed | 401 | `AUTH_TOKEN_INVALID` | Decoding fails. |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | `exp` claim in the past. |
| Path id (`{node_id}`, `{link_id}`, `{attribute_id}`) not in DB | 404 | `RESOURCE_NOT_FOUND` | Standard resource lookup miss. |
| `{key}` path segment not registered in `attribute_key` for the node's `node_type_id` | 404 | `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | Catalog miss; new keys arrive by migration only (BR-17). |
| Node has `status = 'deleted'` | 410 | `BUSINESS_NODE_DELETED` | Tombstoned by `compliance_delete` (section 11). |
| `node_type` query parameter not in catalog | 422 | `BUSINESS_UNKNOWN_NODE_TYPE` | Catalog miss. |
| `link_types[]` query element not in catalog | 422 | `BUSINESS_UNKNOWN_LINK_TYPE` | Catalog miss. |
| `depth` out of `[1, 3]` | 422 | `BUSINESS_INVALID_TRAVERSE_DEPTH` | ADR A16. |
| `as_of` not parseable as ISO `YYYY-MM-DD` | 422 | `VALIDATION_INVALID_FORMAT` | Standard format validation. |
| `direction` not in `{out, in, both}` | 422 | `VALIDATION_INVALID_FORMAT` | Enum mismatch. |
| `limit` > 100 or < 1; `offset` < 0 | 422 | `VALIDATION_OUT_OF_RANGE` | Standard range guard. |
| Database connectivity / unexpected error | 500 | `SYSTEM_INTERNAL_ERROR` | Default fallback for unhandled exceptions. |
| Database read timeout against Neon | 503 | `SYSTEM_SERVICE_UNAVAILABLE` | Integration with Neon (managed Postgres) unavailable. |

---

## 7. Cross-Domain Dependencies

> Bidirectional. The peer domains below MUST list `knowledge-graph` as their consumer/producer when they are specified.

| Domain | Type | Description |
|--------|------|-------------|
| `ingestion` | produces | Writes `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink`, `Provenance` rows via the MCP `ingest` toolset (section 14.1, MCP-only). Performs entity resolution (section 4), succession/correction/conflict bookkeeping (section 6.5), and provenance accumulation. This domain consumes the resulting rows for read. |
| `curation` | produces | Mutates the graph via `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` (section 10, REST-mirrored MCP). Causes state transitions in §5. This domain reads the post-curation state. |
| `retrieval` | consumes | Calls the full-text + graph pipeline (section 7.2). Composes results that join fragments / nodes / chunks with provenance. Uses `traverseNode` and `getNodeById` of this domain for the graph-expansion step (`section 7.2 step 3`). |
| `compliance` | produces | Executes `compliance_delete` (section 11). Sets `status = 'deleted'` on `KnowledgeNode`, `KnowledgeLink`, `NodeAttribute` whose ONLY provenance traced back to the deleted `RawInformation`. This domain returns 410 when serving deleted nodes. |
| `auth` | synchronizes | Owner authentication via Neon Auth (Stack Auth). The middleware that validates the JWT (JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`) is the same one used by all REST/MCP transports (sections 2.5, A29). The `auth` domain owns the JWT validation contract; this domain consumes the resulting `actor_context = owner` claim. |

---

## 8. Out of Scope

- Ingestion of raw documents and the MCP `ingest` toolset (section 14.1) -- handled by the `ingestion` domain.
- Full-text retrieval (`search`, `get_provenance`, section 7.2 + 14.3) -- handled by the `retrieval` domain (this domain DOES expose `getLinkById`/`getAttributeById`/`getNodeById` because they are point reads bound to graph entities; the retrieval pipeline that ranks across `fragment` / `node` / `chunk` layers belongs elsewhere).
- Curation operations (`resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`, `compliance_delete`, section 14.4) -- handled by the `curation` and `compliance` domains.
- Embedding-based search, `pgvector`, semantic similarity -- PERMANENT non-goal per section 20.1 / ADR A24. This domain will NEVER expose endpoints related to such capability.
- System-time travel ("what did the system know at instant T", query (c) of section 5.3) -- DEFERRED per ADR A25. Data is preserved (`recorded_at` is stored on every row), but no endpoint exposes this. To activate later: extend `getNodeById`/`traverseNode`/`getLinkHistory` with a `system_time_at` query parameter and the corresponding SQL filter `recorded_at <= T AND (superseded_at IS NULL OR superseded_at > T)`. No migration required.
- Dedicated review queues for `uncertain` / `low_confidence` (ADR A26) -- DEFERRED. Today they are display flags returned in the payloads (`flags[]` in `AttributeDetail` / `LinkDetail`). Promotion to a dedicated `list_review_queue` kind is additive in the `curation` domain.
- Synonym dictionary plug into the full-text configuration (ADR A4) -- not implemented; would live in a future `retrieval` config rev.
- Multi-user / role-based authorization (ADR A20) -- PERMANENT non-goal in v7. The `actor_context` is implicit (owner).
- Synonym/paraphrase matching ("Iniciativa Lunar" vs. "Projeto Apollo") -- by design `listNodes` will not surface such matches (BR-03). The valve is curation (`entity_match` queue), owned by the `curation` domain (acceptance scenario C11).
- Write endpoints for `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink` -- they originate from `ingestion` / `curation`. This domain is READ-ONLY.

---

## 9. Local Glossary

> Domain-specific terms. Global terms live in `docs/specs/_global/glossary.md`.

| Term | Definition |
|------|-----------|
| `alias_norm` | The normalized form of an alias, computed by the IMMUTABLE `norm(text)` function in the DB. STORED column on `node_alias`. |
| `as_of` | A date passed to read endpoints to enable valid-time travel (query (b) of section 5.3). When omitted, query (a) (current view) is used. |
| Canonical alias | The `NodeAlias` row with `kind = 'canonical'`. Exactly one per node (DB partial unique index `node_alias_one_canonical_uq`). Mirrors `knowledge_node.canonical_name`. |
| Confidence band | The three-band assignment of section 6.4: `>= 0.75` -> `active`; `[0.40, 0.74]` -> `uncertain`; `< 0.40` -> no row created. This domain READS the resulting `status`. |
| Consolidation | Re-affirmation of the same `(source, target, link_type)` or `(node, key, value)` triggers accumulation of `Provenance` rows on the existing item, NOT a new row. Performed by the `ingestion` domain; visible here as `provenance[]` with N entries. |
| Correction (6.5-B) | A specific kind of supersession: `superseded_at` is set on the predecessor but `valid_to` is NOT touched (the world did not change; the system recorded incorrectly). Requires an explicit signal (errata or curator action). |
| Effective status | The derived status field computed by the view (BR-09). Maps `active + past valid_to` to `inactive`. |
| `is_current` / `is_in_effect` | Derived booleans per section 5.4 (BR-09). Never stored. |
| Lineage chain | The transitive closure of versions linked by `supersedes_*` pointers. Walked by `getLinkHistory` / `getAttributeHistory` / `getAttributeKeyHistory`. |
| `merged_into_node_id` | The forward pointer used by path compression (section 4.4). Always points to an ACTIVE node. |
| Multi-valued vs. functional | Boolean flag `allows_multiple_current` on `link_type` / `attribute_key` (ADR A10). Functional types admit at most one current row per scope; multi-valued types admit coexistence. |
| `node_attribute_resolved` | The view of section 5.4 that joins `node_attribute` with `attribute_key` and computes `is_current`, `is_in_effect`, `effective_status`. The standard read path for attributes. |
| `knowledge_link_resolved` | The view of section 5.4 that joins `knowledge_link` with `link_type` and computes the same derived fields. The standard read path for links. |
| `norm` | IMMUTABLE DB function: `lower(immutable_unaccent(regexp_replace(btrim(t), '\s+', ' ', 'g')))`. The single normalization policy (section 4.1). |
| Provenance entry | One row in `provenance` (link OR attribute, never both) plus the chain `InformationFragment -> FragmentSource -> RawChunk -> RawInformation` walked at read time. |
| Semi-open interval | The `[start, end)` convention for both temporal axes (ADR A7 / section 5.2). |
| Stable type | A `LinkType` or `AttributeKey` with `is_temporal = false`. Carries no validity axis; supports correction via the transaction axis only. |
| Succession (6.5-A) | A specific kind of supersession: `superseded_at` is set on the predecessor AND `valid_to = change_date`; a new row with `valid_from = change_date` is created. Triggered by a real-world change. |
| `supersedes_*` | Backward pointer on the successor row (`supersedes_link_id` / `supersedes_attribute_id`). Mandatory on rows that succeed or correct a previous version (BR-13). |
| Trigram fuzzy | The `pg_trgm`-based similarity signal used for entity resolution (BR-03). The ONLY fuzzy signal. |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial business spec for the knowledge-graph domain. Forward-generated from remember-modelagem-v7.md (sections 3, 4, 5, 6, 15) and migrations/0001_schema.sql + 0002_seed.sql. Covers KnowledgeNode/NodeAlias/NodeAttribute/KnowledgeLink reads, entity-resolution invariants, semi-open temporal model, lifecycle/lineage, and seed catalog access. | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | change | Infrastructure migration: replaced Supabase Auth with Neon Auth (Stack Auth) in actor descriptions, every UC pre-condition, BR-20 (JWKS endpoint `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA, TTL `NEON_AUTH_JWKS_TTL_S`), §6 503 row (now references Neon as the managed Postgres provider) and §7 `auth` cross-domain dependency. Removed mention of Supabase service key and Supabase RLS toggle (replaced by "Postgres RLS not used on Neon"). No use cases, error codes, state transitions, or business invariants changed. Schema and remember-modelagem-v7.md are untouched. | migrate-neon |
