# Compliance & Audit -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Supabase Cloud (driver `pg` raw) | Version: 1.0.0 | Status: draft | Layer: permanent
> Business spec: `../compliance-audit.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `segundo-cerebro-modelagem-v7.md` §14.4 (toolset `curation`, tool `compliance_delete` only — every other curation tool is out of scope for this domain)
> Schema: `migrations/0001_schema.sql` lines 185-194 (`raw_information`), 197-212 (`raw_chunk`), 248-262 (`information_fragment`), 264-270 (`fragment_source`), 323-373 (`node_attribute`), 376-411 (`knowledge_link`), 415-432 (`provenance`), 452-462 (`curation_action`), 465-473 (`compliance_deletion`).

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process, second transport over the same service layer. Only one MCP tool is mounted by this domain: `compliance_delete` of toolset `curation` (§14.4). The remaining six curation tools belong to the future `curation` domain and are out of scope here (§8). | CLAUDE.md default |
| ORM | None — raw `pg` driver with parameterized queries (A6, §2.2 of v7). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/`. No new migration is introduced by this domain — `compliance_deletion` and `curation_action` tables are already created by `0001_schema.sql` lines 452-473. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/compliance-audit/`. Three internal layers per module: `routes` (Fastify route handlers + Zod request/response schemas) → `service` (`complianceDelete`, `listComplianceDeletions`, `getComplianceDeletionById`, `listCurationActions`, `getCurationActionById`) → `repository` (parameterized SQL against the writable table `compliance_deletion` + the shared tables it cascades over — `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`, and the read-only `curation_action`). | Aligned with CLAUDE.md "folder_structure: modules". |
| Cross-domain writes | This is the **only** module in the system permitted to issue `UPDATE` statements against `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link` and `node_attribute` rows that already exist. The other domains' repositories own `INSERT` and the status transitions that belong to their own lifecycle; this module owns the tombstone path of UC-01 (BR-02 carve-out of `ingestion.back.md`, BR-12 here). The `compliance-audit.repository` therefore co-owns these tables in a strictly write-after-tombstone capacity. | New (this domain). |
| Validation library | Zod v4 — every REST DTO and the MCP `compliance_delete` input has a Zod schema. Failed Zod parse on REST → 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. Failed Zod parse on MCP → envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (BR-14, BR-15). | CLAUDE.md default |
| Auth | Supabase Auth JWT validated by a Fastify `preHandler` middleware on every route under `/api/v1/compliance/*` and `/api/v1/audit/*` and on every call to the MCP `compliance_delete` tool. The Supabase service key never leaves the BFF. PostgreSQL RLS is disabled (A29). Single-owner — no `User` entity, no role check, no `actor_id` column on audit rows (BR-11). | CLAUDE.md default |
| Logging | `pino` structured JSON. Required fields per request/tool call: `request_id`, `route` or `tool_name`, `raw_information_id?`, `compliance_deletion_id?`, `outcome` (`deleted` / `noop_already_deleted` / error code), `affected.{chunks,fragments,links,attributes}` on success, `latency_ms`. The `reason` text is logged at `info` level (audit-relevant); the `RawInformation.content` body is never logged at any level (CLAUDE.md "Security"). | CLAUDE.md default |
| Observability | `observability_required: true`. Two new operational alarms emitted as `pino` `error` log lines (no separate metrics store): (a) UC-01 alt `4c` "legacy tombstoned raw without ComplianceDeletion row" → alarm key `compliance.legacy_orphan_tombstone`; (b) UC-01 alt `9a` "cascade transaction rollback" → alarm key `compliance.cascade_rollback`. These are read off the structured log by the operator dashboard. | New (this domain). |
| Transaction policy | UC-01 (`complianceDeleteRawInformation`) runs the entire flow (load + tombstone + cascade + `compliance_deletion` insert + `curation_action` insert) in a **single** PostgreSQL transaction at READ COMMITTED isolation, opened by the route handler. The service layer receives the live `client` as its first argument; commit is reached only after BR-08 has written both audit rows. The four read endpoints (UC-02..UC-05) use the pool directly with no explicit `BEGIN` — every read is a single auto-committed `SELECT`. | Extension of CLAUDE.md "Backend / pg raw". |
| Concurrency | UC-01 holds `SELECT ... FOR UPDATE` on the target `raw_information` row from step 4 of the main flow until commit (BR-02). No advisory lock is needed — the row-level lock on the unique `raw_information.id` PK serializes concurrent `complianceDeleteRawInformation` calls against the same target. Concurrent calls against **different** targets proceed in parallel. | Extension of CLAUDE.md "Conventions". |
| Time source | `now()` provided by PostgreSQL — never `Date.now()` in business code. `compliance_deletion.executed_at` and the cascaded `superseded_at` columns are all assigned in a single SQL expression evaluated server-side, so all rows of one cascade share the same timestamp (CLAUDE.md "Conventions", §5.4, A9). | CLAUDE.md default |
| Idempotency primitive | Pre-write read of `raw_information.status` under `FOR UPDATE` (BR-02, BR-03). There is no DB UNIQUE on `compliance_deletion.raw_information_id` (schema lines 465-471 only declare an index for FK lookup); idempotency is enforced by the application after the `FOR UPDATE` read decides which branch (`deleted` vs `noop_already_deleted`) to take. | New (this domain). |
| Body limit | All routes use the Fastify platform default `bodyLimit` (1 MiB). `ComplianceDeleteRequest` is bounded by `reason ≤ 1000 chars` plus a UUID — far below the default. | CLAUDE.md default |
| Hashing | None — this domain neither produces nor verifies `content_hash` (it preserves the value present on the row — BR-04). | CLAUDE.md default |
| Testing | Vitest unit tests on: (a) BR-03 idempotency (second call returns the same `ComplianceDeletion` row, no second `CurationAction` row); (b) BR-06 fragment cascade (cross-source fragments survive); (c) BR-07 link/attribute cascade (cross-source provenance survives); (d) BR-08 (one CurationAction row per `deleted` outcome, zero on `noop_already_deleted`); (e) BR-10 `action` filter enum; (f) BR-13 (no UPDATE/DELETE endpoint reaches audit tables); (g) BR-14 MCP envelope shape parity with REST. Acceptance suite scenario C15 of v7 §17 is the end-to-end test of UC-01. | CLAUDE.md default |

---

## 2. Data Model

> Exact database types as defined in `migrations/0001_schema.sql`. This domain **owns** two tables for writes: `compliance_deletion` (INSERT only — BR-13) and `curation_action` (INSERT only by this domain in v1.0.0; future `curation` domain will also INSERT). It **mutates by status transition** five tables owned by other domains: `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute` — all five mutations happen exclusively inside the UC-01 transaction (BR-12). It **reads** `provenance` and `fragment_source` to compute the cascade scope.

### Table: compliance_deletion

> Append-only audit of every `compliance_delete` execution that produced `outcome = "deleted"` (§11, BR-08, BR-13). Idempotent no-op (`outcome = "noop_already_deleted"`) does NOT write to this table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| raw_information_id | uuid | NOT NULL, FK → `raw_information(id)` | Target of the deletion. The corresponding `raw_information` row has `status = 'deleted'` (BR-05) and `content = '[REDACTED]'` (BR-04). |
| reason | text | NOT NULL | Free-text justification (≤ 1000 chars enforced by Zod at the API layer — BR-01). Source: `ComplianceDeleteRequest.reason`. |
| executed_at | timestamptz | NOT NULL, DEFAULT `now()` | Server-side `now()` at INSERT — equal to the `superseded_at` value cascaded to derived rows in the same transaction. |
| affected | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Shape `{ chunks: int >= 0, fragments: int >= 0, links: int >= 0, attributes: int >= 0 }` — the four cascade counters computed inside the transaction (BR-06, BR-07). Stored verbatim; the API layer re-validates the shape with Zod on read. |

### Table: curation_action

> System-wide audit trail of every curation tool call (§3.5). This domain WRITES one row per `compliance_delete` (`outcome = "deleted"`) — BR-08; the future `curation` domain will write the other six tool actions. This domain READS every row (UC-04, UC-05). Mono-user model — no actor column (BR-11).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| action | text | NOT NULL | Curation tool name. For this domain's writes: always the literal string `'compliance_delete'`. The column is plain `text` (no DB enum or CHECK — schema line 454), so the filter validation of UC-04 lives in the API layer (BR-10). |
| target_kind | text | NOT NULL | Kind of the targeted entity. For this domain's writes: always `'raw_information'`. Future writers will use `'node'`, `'link'`, `'attribute'`, `'fragment'` (§14.4). |
| target_id | uuid | NULL allowed | UUID of the target. For this domain's writes: always the deleted `raw_information.id`. The column is nullable to support future actions that target multiple entities (e.g. `merge_nodes`) where the payload lists them (§3.5, schema comment line 456). |
| payload | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Verbatim arguments of the call. For this domain: `{ reason: <same as ComplianceDeleteRequest.reason>, affected: { chunks, fragments, links, attributes } }`. The duplication of `reason` is intentional (BR-08) — the audit reader filtering by `action` must not have to join to `compliance_deletion`. |
| reason | text | NULL allowed | Free-text reason. NOT NULL for this domain's writes (`compliance_delete` is destructive, §10.2 — BR-01). May be null for future non-destructive curation calls (e.g. `confirm_item` of §14.4). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Server-side `now()` at INSERT. In a UC-01 `deleted` transaction, equal to `compliance_deletion.executed_at` and to the cascaded `superseded_at` (single `now()` per transaction by Postgres semantics inside one statement, and the BFF issues both INSERTs back-to-back inside the same TX). |

### Tables mutated by status transition (owned by other domains)

> No new columns. This domain only writes `(status, superseded_at)` updates inside the UC-01 transaction. The full schema of these tables is documented in `ingestion.back.md` §2 and `knowledge-graph.back.md` §2.

| Table | Column written | Value | Triggered by | Owning BR |
|-------|----------------|-------|--------------|-----------|
| raw_information | content | `'[REDACTED]'` (10-char literal, UTF-8) | UC-01 step 5 | BR-04 |
| raw_information | metadata | jsonb-merged with `{"compliance_deleted": true}` | UC-01 step 5 | BR-04 |
| raw_information | status | `'deleted'` (cast to node_status — schema lines 104-105) | UC-01 step 5 | BR-05 |
| raw_information | superseded_at | `now()` | UC-01 step 5 | BR-05 |
| raw_chunk | status | `'deleted'` | UC-01 step 6 (all chunks of the raw) | BR-06 |
| raw_chunk | superseded_at | `now()` | UC-01 step 6 | BR-06 |
| information_fragment | status | `'deleted'` (fragment_status enum — schema line 102) | UC-01 step 6 (only when ALL `fragment_source` rows of the fragment anchor chunks of the deleted raw) | BR-06 |
| information_fragment | superseded_at | `now()` | UC-01 step 6 | BR-06 |
| knowledge_link | status | `'deleted'` (assertion_status enum — schema line 110) | UC-01 step 6 (only when ALL `provenance` rows of the link reference fragments of the deleted raw) | BR-07 |
| knowledge_link | superseded_at | `now()` | UC-01 step 6 | BR-07 |
| node_attribute | status | `'deleted'` | UC-01 step 6 (same predicate as knowledge_link) | BR-07 |
| node_attribute | superseded_at | `now()` | UC-01 step 6 | BR-07 |

> **`raw_information.status` and `raw_information.superseded_at` are NOT present in `migrations/0001_schema.sql` lines 185-194 as written today.** The schema today has only `id`, `source_type`, `content`, `storage_ref`, `content_hash`, `received_at`, `metadata`. The `status` and `superseded_at` columns of BR-05 are committed in `compliance-audit.spec.md` BR-05 (and in CLAUDE.md "Known Gotchas") but are not yet in the SQL. **This back-spec assumes those two columns will be added in a follow-up migration (see §7 Known Technical Constraints).** Until that migration ships, the implementation MUST add `ALTER TABLE raw_information ADD COLUMN status node_status NOT NULL DEFAULT 'active'; ALTER TABLE raw_information ADD COLUMN superseded_at timestamptz;` as part of the same migration that introduces this module. The implementation group must not ship UC-01 without those columns.

### Tables read but not mutated

| Table | Reason it is read | Read by |
|-------|-------------------|---------|
| provenance | UC-01 BR-07 — walk `link_id` / `attribute_id` ↔ `fragment_id` to decide tombstone scope | UC-01 cascade |
| fragment_source | UC-01 BR-06 — walk `fragment_id` ↔ `raw_chunk_id` to decide which fragments lose ALL their anchors | UC-01 cascade |
| raw_information | UC-01 BR-02 — `FOR UPDATE` lock; BR-04 / BR-05 — UPDATE target. UC-02 — joined into the result via `raw_information_id` already on `compliance_deletion`; UC-04 — joined when `target_kind = 'raw_information'`. | UC-01, UC-02, UC-04 |

### Indexes

> Justify each index with the query it optimizes. Corresponds to predictable queries from the five endpoints. Every FK has its own index (CLAUDE.md "Conventions"). Index names and definitions are taken verbatim from `migrations/0001_schema.sql`.

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| compliance_deletion | id | PK btree (implicit) | UC-03 `getComplianceDeletionById` lookup. |
| compliance_deletion | raw_information_id | btree (`compliance_deletion_raw_idx`, line 473) | (a) UC-01 BR-03 idempotency lookup: "given a `raw_information_id` whose status is `deleted`, find the existing `ComplianceDeletion` row to return verbatim". (b) UC-02 `raw_information_id` filter on `listComplianceDeletions`. By application invariant BR-03 there is at most one row per `raw_information_id`, but the index is plain (not UNIQUE) by schema decision — the BFF is the enforcer (UC-01 alt `4c` exists precisely to log+alarm when this invariant is broken in legacy data). |
| compliance_deletion | executed_at | (no dedicated index) | UC-02 default ordering is `executed_at DESC`. At the §16 scale (rare destructive operations — measured in tens per year), a sequential scan + sort is acceptable; no index is added in v1.0.0. **If the audit volume grows beyond a few hundred rows, add `CREATE INDEX compliance_deletion_executed_idx ON compliance_deletion (executed_at DESC)` in a follow-up migration.** Documented in §7. |
| curation_action | id | PK btree (implicit) | UC-05 `getCurationActionById` lookup. |
| curation_action | (target_kind, target_id) | composite btree (`curation_action_target_idx`, line 462) | UC-04 filter combination `(target_kind=..., target_id=...)` — also covers `(target_kind=...)` alone via prefix-matching. UC-04 alt `3b` / `3c` ranges over these columns; the composite index serves both. |
| curation_action | created_at | (no dedicated index) | UC-04 default ordering is `created_at DESC`. Same rationale as `compliance_deletion.executed_at` — index deferred until volume justifies it. Documented in §7. |
| curation_action | action | (no dedicated index) | UC-04 `action` filter is enum-validated at the API layer (BR-10) to one of 7 strings. At v1 scale a sequential scan filtering by `action = 'compliance_delete'` returns within the §16 budget. **If audit volume justifies it, add `CREATE INDEX curation_action_action_idx ON curation_action (action)`.** Documented in §7. |

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only — never nested objects.

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| compliance_deletion.raw_information_id | raw_information.id | N : 1 | `compliance_deletion_raw_information_id_fkey` | NO ACTION (default) — `raw_information` is never physically deleted (BR-13 mirror of `ingestion.back.md` BR-02); the tombstone is a status transition, not a row delete. Cascade is unnecessary and would defeat audit (BR-13). |
| curation_action.target_id | (no FK) | — | none | The `curation_action.target_id` column is plain `uuid` with **no foreign key** — the column points to one of `node`, `link`, `attribute`, `fragment`, `raw_information` depending on `target_kind` (schema line 456). The integrity guarantee is BFF-enforced: the writer (this domain for `compliance_delete`; future `curation` domain for the other six tools) populates `(target_kind, target_id)` only from a row it has just locked + verified. Read paths handle dangling `target_id` defensively (return the row as-is — the audit log MUST survive even when the targeted entity later changes status). |

**No CASCADE anywhere in this domain.** Audit data is immutable by design (BR-13); compliance deletion is a status transition (BR-04, BR-05, BR-06, BR-07), not a row delete.

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `compliance-audit.spec.md`. This section translates each business rule into the validation layer that enforces it and the error code returned on violation. Rule wording is condensed; canonical wording lives in `compliance-audit.spec.md` §4.

### BR-01 -- Compliance delete requires a non-empty reason
**Related UC:** UC-01
**Where to validate:** controller (Zod schema on `ComplianceDeleteRequest`). `reason: z.string().trim().min(1).max(1000)`. After `btrim`, length must be in `[1, 1000]`. The DB column `compliance_deletion.reason` is `text NOT NULL` (schema line 468) and serves as the safety net.
**Description:** `reason` is required, non-empty after trim, ≤ 1000 chars (§10.2 — destructive operations require a justification).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_REQUIRED_FIELD` (when absent) or `VALIDATION_OUT_OF_RANGE` (when empty-after-trim or > 1000 chars). On MCP: envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (BR-14).

### BR-02 -- Compliance delete runs in a single transaction with FOR UPDATE
**Related UC:** UC-01
**Where to validate:** service (`complianceAudit.service.complianceDelete`). The Fastify route handler opens the transaction (`client.query('BEGIN')`); the service receives the live `client` as its first argument. First DB statement inside the TX: `SELECT id, status FROM raw_information WHERE id = $1 FOR UPDATE`. All subsequent statements of UC-01 steps 5-8 reuse the same `client`. The handler issues `COMMIT` on success and `ROLLBACK` on any thrown exception.
**Description:** Either the entire cascade and both audit rows commit together, or nothing commits. No partial cascade is observable.
**Error returned:** No direct error for the rule itself. A failure within the TX surfaces as UC-01 alt `9a` → HTTP 500 `SYSTEM_INTERNAL_ERROR`.

### BR-03 -- Compliance delete is idempotent on raw_information_id
**Related UC:** UC-01 alt `4b`
**Where to validate:** service. Right after the `FOR UPDATE` of BR-02, inspect `raw_information.status`. If `'deleted'`, run a `SELECT * FROM compliance_deletion WHERE raw_information_id = $1 LIMIT 1`. If exactly one row is found, ROLLBACK the (otherwise still-empty) transaction and return HTTP 200 `{ outcome: "noop_already_deleted", deletion: <row> }`. If zero rows are found, fall through to BR-04 (the legacy-inconsistency path of UC-01 alt `4c`). No new `compliance_deletion` row and no new `curation_action` row are written in the no-op path.
**Description:** The endpoint is safe to retry. There is **no DB UNIQUE** on `compliance_deletion.raw_information_id` — the application enforces "at most one" via the `FOR UPDATE` of BR-02 plus the status check.
**Error returned:** None — this is the HTTP 200 success path.

### BR-04 -- Tombstoned content is the literal string `[REDACTED]`
**Related UC:** UC-01
**Where to validate:** service. The UPDATE statement is:
```sql
UPDATE raw_information
   SET content       = '[REDACTED]',
       metadata      = metadata || jsonb_build_object('compliance_deleted', true),
       status        = 'deleted',
       superseded_at = now()
 WHERE id = $1;
```
`content_hash` is **deliberately left untouched** — it stays as `sha256(<original content>)` so a future `ingestRawInformation` of the same bytes still resolves to this row by `content_hash` UNIQUE and the ingestion layer correctly returns `outcome = "noop_existing"` against the tombstoned row (`ingestion.back.md` BR-09).
**Description:** Exactly 10 UTF-8 characters (`[REDACTED]`), no surrounding whitespace, no quotes. `metadata.compliance_deleted = true` is set via JSON merge — preserves any other metadata keys.
**Error returned:** None directly — failure of the UPDATE surfaces via BR-02 rollback and UC-01 alt `9a` → HTTP 500.

### BR-05 -- The raw becomes status = 'deleted' with superseded_at = now()
**Related UC:** UC-01
**Where to validate:** service — included in the same UPDATE shown in BR-04. Aligns with CLAUDE.md "Known Gotchas": `reject_item` / `compliance_delete` MUST write `superseded_at = now()` to leave the partial-duplicate guard and the `is_current` filter — without it the row stays "current" per the `knowledge_link_resolved` / `node_attribute_resolved` views.
**Description:** After the UPDATE, the row is no longer eligible for `is_current = true` in any resolved view.
**Error returned:** None directly.

### BR-06 -- Fragment cascade ignores cross-source fragments
**Related UC:** UC-01
**Where to validate:** service. After UPDATE-ing `raw_information` and `raw_chunk`, the service issues a single statement to tombstone only the qualifying fragments:
```sql
UPDATE information_fragment AS f
   SET status        = 'deleted',
       superseded_at = now()
 WHERE EXISTS (
         SELECT 1 FROM fragment_source fs
           JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
          WHERE fs.fragment_id = f.id
            AND rc.raw_information_id = $1)
   AND NOT EXISTS (
         SELECT 1 FROM fragment_source fs
           JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
           JOIN raw_information ri ON ri.id = rc.raw_information_id
          WHERE fs.fragment_id = f.id
            AND ri.id <> $1
            AND ri.status <> 'deleted')
   AND f.status <> 'deleted'
RETURNING f.id;
```
The `count(RETURNING)` is the `affected.fragments` value of BR-08.
**Description:** A fragment is tombstoned only when **every** chunk in its `fragment_source` set belongs to the raw being deleted **and** no surviving chunk from a different non-deleted raw is anchored. Mirrors v7 §11.
**Error returned:** None directly.

### BR-07 -- Link/Attribute cascade ignores cross-source provenance
**Related UC:** UC-01
**Where to validate:** service. Two parallel UPDATEs against `knowledge_link` and `node_attribute` (executed sequentially on the same TX), with symmetric predicates:
```sql
UPDATE knowledge_link AS kl
   SET status        = 'deleted',
       superseded_at = now()
 WHERE EXISTS (SELECT 1 FROM provenance p
                 JOIN information_fragment f ON f.id = p.fragment_id
                 JOIN fragment_source fs ON fs.fragment_id = f.id
                 JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                WHERE p.link_id = kl.id
                  AND rc.raw_information_id = $1)
   AND NOT EXISTS (SELECT 1 FROM provenance p
                     JOIN information_fragment f ON f.id = p.fragment_id
                     JOIN fragment_source fs ON fs.fragment_id = f.id
                     JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                     JOIN raw_information ri ON ri.id = rc.raw_information_id
                    WHERE p.link_id = kl.id
                      AND ri.id <> $1
                      AND ri.status <> 'deleted')
   AND kl.status <> 'deleted'
RETURNING kl.id;
```
The same shape applies to `node_attribute` (replace `p.link_id = kl.id` with `p.attribute_id = na.id` and the target column accordingly). `RETURNING` counts feed `affected.links` and `affected.attributes`.
**Description:** A `knowledge_link` / `node_attribute` is tombstoned only when **every** provenance row attached to it points to a fragment whose chain anchors **only** chunks of the raw being deleted. Mirrors v7 §11 and acceptance scenario C15.
**Error returned:** None directly.

### BR-08 -- compliance_delete writes one ComplianceDeletion and one CurationAction
**Related UC:** UC-01
**Where to validate:** service. In the same TX, after BR-06 and BR-07 have produced the four counters, the service issues:
```sql
INSERT INTO compliance_deletion (raw_information_id, reason, affected)
VALUES ($1, $2, jsonb_build_object(
  'chunks', $3, 'fragments', $4, 'links', $5, 'attributes', $6))
RETURNING id, executed_at;
```
followed by:
```sql
INSERT INTO curation_action (action, target_kind, target_id, payload, reason)
VALUES ('compliance_delete', 'raw_information', $1, jsonb_build_object(
  'reason', $2,
  'affected', jsonb_build_object(
    'chunks', $3, 'fragments', $4, 'links', $5, 'attributes', $6)), $2);
```
**Description:** Exactly one row in each audit table per `outcome = "deleted"` response. Zero rows in either table per `outcome = "noop_already_deleted"` response (BR-03).
**Error returned:** None directly. If either INSERT fails, the TX rolls back (BR-02) and UC-01 alt `9a` returns HTTP 500.

### BR-09 -- Audit reads honor the semi-open time-range filters
**Related UC:** UC-02, UC-04
**Where to validate:** repository. `executed_from`/`created_from` is INCLUSIVE; `executed_to`/`created_to` is EXCLUSIVE — mirrors A7 (`[start, end)` project-wide convention).
- `listComplianceDeletions`: SQL fragment `AND executed_at >= $f AND executed_at < $t`, with each bound omitted when the corresponding parameter is `undefined`.
- `listCurationActions`: same shape on `created_at`.
**Description:** When only one bound is provided, the other side is unconstrained.
**Error returned:** None directly. If the API receives `from > to`, the Zod refinement rejects with HTTP 422 `VALIDATION_OUT_OF_RANGE` (UC-02 alt `3c`, UC-04 alt `3d`).

### BR-10 -- listCurationActions validates the action filter
**Related UC:** UC-04
**Where to validate:** controller. Zod schema for query parameter `action`: `z.enum(["resolve_entity_match","merge_nodes","resolve_dispute","confirm_item","reject_item","correct_item","compliance_delete"]).optional()`. Failed parse → HTTP 422 `VALIDATION_INVALID_FORMAT` (UC-04 alt `3a`). The DB column is `text` (schema line 454, no enum/CHECK), so this enum is enforced ONLY at the API layer of this endpoint — rows produced by future versions with new tool names are filtered out by this enum (acceptable, since the enum is the v1.0 contract for the SPA).
**Description:** Only the 7 curation tool names of §14.4 are accepted as filter values.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-11 -- Audit rows record no actor
**Related UC:** UC-01..UC-05
**Where to validate:** repository — `compliance_deletion` and `curation_action` schemas (schema lines 452-473) have no `actor_id` column. Single-owner model (§2.3, A20). The "who" of every audit row is the JWT subject of the request that produced it — and that subject is always the data owner. No INSERT path in this module reads `request.user.id` to populate any column.
**Description:** Multi-tenant support is a permanent non-goal (§20.3).
**Error returned:** Not applicable (schema invariant).

### BR-12 -- Only compliance-audit mutates raw_information after creation
**Related UC:** UC-01
**Where to validate:** code review + module boundary. The `compliance-audit.repository` is the only repository in the BFF that exposes a function emitting `UPDATE raw_information SET ...`. The `ingestion.repository` exposes only `INSERT INTO raw_information ...` (`ingestion.back.md` BR-02). A reviewer who finds an `UPDATE raw_information` in any other module must reject the PR — the BR-12 carve-out is exclusive to UC-01 of this domain.
**Description:** No code path of any other domain modifies `raw_information.{content, metadata, status, superseded_at}`. Mirrors `ingestion.back.md` BR-02 carve-out.
**Error returned:** Not applicable (architectural invariant).

### BR-13 -- Audit rows are append-only and immutable
**Related UC:** UC-01..UC-05
**Where to validate:** repository — `compliance-audit.repository` exposes no `UPDATE compliance_deletion` / `DELETE FROM compliance_deletion` / `UPDATE curation_action` / `DELETE FROM curation_action` function. The five endpoints of `openapi.yaml` are all GET or POST (`compliance_delete` only). No PATCH/PUT/DELETE route exists. There are no DB triggers on either audit table.
**Description:** Once written, an audit row is read-only forever — foundation of principle 1 of §18 ("the original information is never lost — except controlled, audited deletion") applied to the audit log itself.
**Error returned:** Not applicable (architectural invariant).

### BR-14 -- compliance_delete is mirrored as MCP tool with shared service layer
**Related UC:** UC-01
**Where to validate:** code structure. The REST handler `routes/compliance.deletions.post.ts` and the MCP handler `mcp/curation/compliance_delete.ts` both call into the same `complianceAudit.service.complianceDelete(client, { rawInformationId, reason })` function. Inputs are validated with the same Zod schema (`ComplianceDeleteRequestSchema`). The service is transport-agnostic: it returns a discriminated union `{ outcome: 'deleted' | 'noop_already_deleted', deletion: ComplianceDeletion }`. The REST handler maps `'deleted'` to HTTP 201 and `'noop_already_deleted'` to HTTP 200. The MCP handler wraps both into `{ ok: true, result: <union> }`.
**Description:** A single business outcome reaches both transports through identical validation, identical DB writes and identical audit rows (ADR A28). The MCP envelope shape is `{ ok: true, result: { outcome, deletion } }` on success / `{ ok: false, error: { code, message, details } }` on failure (§14).
**Error returned:** No direct error from the rule. See BR-15 for the MCP error code map.

### BR-15 -- MCP error codes for compliance_delete
**Related UC:** UC-01
**Where to validate:** MCP handler. The handler catches the `ValidationFailure` / `NotFoundFailure` / `InternalFailure` types thrown by the shared service and maps them onto the MCP envelope `{ ok: false, error.code }`:
- Zod parse failure on input → `STRUCTURAL_INVALID`.
- `raw_information_id` resolves to no row (UC-01 alt `4a`) → `NOT_FOUND`.
- UC-01 alt `4c` (legacy tombstoned raw without `ComplianceDeletion`) → `INTERNAL`.
- Any unhandled exception in service → `INTERNAL`.
Auth failures (missing/invalid JWT) are NOT MCP envelope errors — they are produced by the BFF middleware **before** the MCP tool dispatch, and they surface to the MCP client as the standard REST 401 (`AUTH_UNAUTHORIZED`). The MCP envelope is only used for service-layer outcomes (cf. `ingestion.spec.md` §6.2, ADR A28).
**Description:** Idempotent no-op is NOT an error — it surfaces as `{ ok: true, result: { outcome: "noop_already_deleted", deletion: ... } }` (the design rule of §14, "business outcomes are not errors").
**Error returned:** `STRUCTURAL_INVALID` | `NOT_FOUND` | `INTERNAL` (per the map above).

### BR-16 -- Cascade counters are computed by RETURNING, not by COUNT
**Related UC:** UC-01
**Where to validate:** service. The four `affected.*` counters of BR-08 are derived from the `RETURNING id` cardinality of the four UPDATE statements of BR-06 (fragments), BR-07 (links and attributes) and the corresponding `UPDATE raw_chunk ... RETURNING id` of step 6 (chunks). The service does NOT issue a separate `SELECT count(*)` — the counters are a byproduct of the same statements that mutate the rows, eliminating a race window between count and update.
**Description:** Counts and mutations are atomic — one statement, one cursor scan, one count.
**Error returned:** Not applicable (correctness invariant).

### BR-17 -- Legacy-inconsistency path emits an operational alarm
**Related UC:** UC-01 alt `4c`
**Where to validate:** service. When BR-03 finds `raw_information.status = 'deleted'` AND zero `compliance_deletion` rows for that `raw_information_id`, the service:
1. Rolls back the transaction.
2. Logs at `error` level with `pino` carrying the key `compliance.legacy_orphan_tombstone`, `raw_information_id`, `request_id`.
3. Throws `InternalFailure('legacy_orphan_tombstone')`.
The route handler maps the throw to HTTP 500 `SYSTEM_INTERNAL_ERROR`. The MCP handler maps it to envelope `{ ok: false, error.code: "INTERNAL" }` (BR-15).
**Description:** Recovery from this state is a manual data-migration task, not an automated rollback — the spec is explicit (§4 BR-03 of `compliance-audit.spec.md`).
**Error returned:** HTTP 500 `SYSTEM_INTERNAL_ERROR` / MCP `INTERNAL`. Always accompanied by the structured log entry above.

---

## 4. State Machine (ST)

> One state machine is owned by this domain: the `RawInformation` tombstone transition driven by `compliance_delete`. The remainder of the `RawInformation` lifecycle (initial INSERT) is owned by `ingestion`.

### ST-RI-DEL -- RawInformation tombstone transition (ST-RI-DEL of `compliance-audit.spec.md` §5.1)

```
       compliance_delete
              |
              v
        [active] ---FOR UPDATE---> read status
              |                            |
              |                            +- 'active'  --tombstone + cascade + audit--> [deleted]
              |                            |
              |                            +- 'deleted' AND ComplianceDeletion exists ---> [deleted]  (no-op)
              |                            |
              |                            +- 'deleted' AND ComplianceDeletion missing ---> error 500
              v
        [deleted]  (terminal — never restored, BR-13 of compliance-audit.spec.md / §8)
```

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| (created by ingestion as `active`) | deleted | first `complianceDeleteRawInformation` | `reason` Zod-validated (BR-01); FOR UPDATE acquires the row; `raw_information.status = 'active'`; transaction commits | UC-01 main |
| deleted | deleted | repeated `complianceDeleteRawInformation` (idempotent no-op) | FOR UPDATE acquires the row; `raw_information.status = 'deleted'` AND `EXISTS (SELECT 1 FROM compliance_deletion WHERE raw_information_id = $1)` | UC-01 alt `4b` |
| deleted | — | repeated `complianceDeleteRawInformation` against legacy inconsistency | FOR UPDATE acquires the row; `raw_information.status = 'deleted'` AND `NOT EXISTS (... compliance_deletion ...)`; transaction rolled back; HTTP 500 `SYSTEM_INTERNAL_ERROR` (BR-17) | UC-01 alt `4c` |

**Invalid transitions:**
- `deleted → active` (restoration): permanently disallowed. There is no UPDATE path in the BFF that sets `raw_information.status` back to `active`. Confirmed by code review per BR-12 + BR-13 + §8 "Restoration / un-deletion ... permanently out of scope".
- `active → active` via `complianceDeleteRawInformation`: impossible — the only path that ends at `active` is the initial `ingestRawInformation` INSERT (owned by `ingestion`).

**This domain does NOT define state machines for `ComplianceDeletion` and `CurationAction`** because they are append-only and have no status column (BR-13). They have exactly one valid state: "written".

---

## 5. Domain Events (EV)

> The Segundo Cérebro architecture does **not** include an event bus. Cross-domain coordination happens through synchronous service calls and through the database (§2.2 "store único"; §13 "audit-first"). The audit substrate is `compliance_deletion` + `curation_action` for this domain (read off the DB by any consumer).

**N/A — no domain events in this version.**

The cross-domain effects of UC-01 (tombstone of `raw_information`, status cascade to `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`) are produced by **direct SQL writes** inside the UC-01 transaction (BR-04..BR-07), not by event dispatch. Consumers (e.g. `query-retrieval` BR-14 which short-circuits with HTTP 410 `BUSINESS_RAW_INFORMATION_DELETED` when it encounters a tombstoned raw) observe the new state by reading the DB in their own transactions — they neither subscribe to nor produce any event.

If a future operator surface (e.g. a Slack/SIEM notifier) needs to react to compliance deletions, it must poll `compliance_deletion` ordered by `executed_at DESC` — the database is the integration boundary, by spec (§2.2). Versioning is not a concern because no event payload exists.

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk — document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Supabase Auth | REST (JWT verify via Supabase JWKS) | Validate the bearer token on every REST call and on the MCP `compliance_delete` invocation (§2.5, A29). Same middleware as `ingestion.back.md` §6. | 2 s per JWKS fetch, JWKS cached in-process for 10 min. | None — without a verifiable JWT, the request is rejected with HTTP 401 `AUTH_UNAUTHORIZED`. Cache miss + network failure → HTTP 503 `SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Supabase Cloud) | TCP (`pg` pool) | Single store of `compliance_deletion`, `curation_action`, and the mutated/read rows of `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`, `provenance`, `fragment_source`. | Statement timeout: 10 s default on read endpoints; 30 s on UC-01 (`complianceDeleteRawInformation`) — covers worst-case cascade size (low at §16 scale but bounded by the size of the document's provenance graph). Pool: shared with the rest of the BFF (min 2, max 10 connections per BFF instance). | None — PostgreSQL is the single store (§2.2). Outage → HTTP 500 `SYSTEM_INTERNAL_ERROR`. Deadlock (`40P01`) on UC-01 is retried up to 3 times with exponential backoff (50 ms / 100 ms / 200 ms); deadlocks should be rare because each transaction locks one `raw_information` row at a time. |
| MCP transport | stdio / WebSocket (per MCP server config) | Surface the `compliance_delete` tool of toolset `curation` (§14.4) to the LLM. | Per-tool-call hard ceiling: 30 s (matches the PostgreSQL statement timeout for UC-01). | None at this layer — a slow tool call surfaces as MCP transport timeout to the LLM; the BFF nevertheless commits or rolls back the UC-01 transaction on its own deadline. |

**No LLM provider integration in this domain.** The LLM lives upstream of the BFF — it calls the MCP `compliance_delete` tool, but the BFF never originates LLM calls (consistent with `ingestion.back.md` §6).

**No external archival / SIEM / S3 integration.** §8 of `compliance-audit.spec.md` makes audit-log export out of scope for v1.0.0.

---

## 7. Known Technical Constraints

- **`raw_information.status` and `raw_information.superseded_at` columns are not yet in the schema as shipped.** `migrations/0001_schema.sql` lines 185-194 declare `raw_information` without those two columns. `compliance-audit.spec.md` BR-05 and CLAUDE.md "Known Gotchas" both commit to their existence. The implementation MUST land a migration `0003_compliance_status.sql` (numbering subject to repo state at the time) adding `status node_status NOT NULL DEFAULT 'active'` and `superseded_at timestamptz` to `raw_information` **before** UC-01 ships. Until that migration is in place, BR-04/BR-05 cannot be implemented. The same migration MUST backfill `status = 'active'` for every existing row.
- **No `compliance_deletion (raw_information_id) UNIQUE` constraint.** The schema declares only a non-UNIQUE index (`compliance_deletion_raw_idx`, line 473). Idempotency (BR-03) is enforced solely by the BFF after the `FOR UPDATE` read. UC-01 alt `4c` exists exactly for the case where this invariant is broken in legacy data. **Consider adding `CREATE UNIQUE INDEX compliance_deletion_raw_uq ON compliance_deletion (raw_information_id)` in a follow-up migration** once the legacy alarm `compliance.legacy_orphan_tombstone` (BR-17) has been silent for a defined retention period.
- **No `curation_action.action` CHECK or enum.** The column is plain `text` (schema line 454). The 7-name vocabulary of BR-10 is enforced only at the API layer. Rows produced by future code paths with new tool names will not be returned by `listCurationActions` filtered by `action`, but they WILL be returned by the same endpoint without the filter. This is a deliberate v1 trade-off — flipping `action` to an enum requires coordinating with the future `curation` domain owners, which are out of scope.
- **`curation_action.target_id` has no foreign key.** The column is plain `uuid` (schema line 456). Dangling `target_id` references must be tolerated by all read paths — the audit log MUST survive even when the targeted entity later changes status. UC-04 / UC-05 return the row as-is; the SPA presents the row without joining to the target.
- **No dedicated index on `compliance_deletion.executed_at` or on `curation_action.created_at` or on `curation_action.action`.** At v1 scale (rare destructive operations) a sequential scan + sort is acceptable per the §16 budget (`get_*` < 200 ms, list endpoints < 1 s implicit). If the audit volume grows beyond a few thousand rows the indexes documented in §2 must be added in a follow-up migration.
- **READ COMMITTED isolation for UC-01.** PostgreSQL's default. With `SELECT ... FOR UPDATE` on `raw_information.id` and no other shared writer of `raw_information` (BR-12), READ COMMITTED is sufficient. Higher isolation (REPEATABLE READ / SERIALIZABLE) is unnecessary and would risk spurious serialization errors under no real contention.
- **`compliance_delete` is irreversible by schema.** Tombstoned `content` is unrecoverable from the DB — only `content_hash` survives (BR-04). The audit row documents the deletion but does not enable restoration. Restoration is permanently out of scope (`compliance-audit.spec.md` §8).
- **Single-instance assumption is unnecessary for this domain.** Unlike `ingestion.back.md` (advisory locks), UC-01 uses only row-level `FOR UPDATE` — multiple BFF instances can safely serve `complianceDeleteRawInformation` against the same DB.
- **The `[REDACTED]` literal is fixed at the byte level.** Any localization or rebranding of this token must be a coordinated migration (rewrite of all existing tombstoned `raw_information.content` values) — adding it as a config knob in v1.0.0 would silently fork audit semantics across deployments. v1.0.0 hardcodes the literal in `complianceAudit.service` and a Vitest unit test pins the value.
- **`metadata` JSON merge uses Postgres `||` operator.** This operator is shallow (top-level keys are overwritten, nested objects are NOT deep-merged). The merge `metadata || jsonb_build_object('compliance_deleted', true)` is safe because `compliance_deleted` is a top-level boolean key with no nested structure. If a future feature requires deep-merging into `metadata`, a `jsonb_set` chain or a `jsonb_strip_nulls` + recursive merge would be needed — out of scope here.

---

## 8. Out of Scope

- **Curation queue operations** (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`). Owned by the future `curation` domain. This module WRITES `curation_action` rows for its own `compliance_delete` operation (BR-08) and READS the full audit log via UC-04 / UC-05.
- **LLM-extraction audit (`LLMRun`, `ToolCall`).** Owned by `ingestion.back.md`. Operations `getLlmRunById`, `listToolCallsByLlmRun`, `retryLlmRun` are not part of this domain.
- **EntityMatchReview rows.** Belong to the future `curation` domain (`entity_match_review` table is cleared upon resolution per §10.1).
- **System-time travel — query (c) of §5.3 ("what the system knew at instant T").** Permanently deferred (ADR A25, §20.2). This domain writes `executed_at` on `compliance_deletion` and `created_at` on `curation_action` (via DB defaults), but exposes no endpoint to query the audit log as-of an arbitrary instant.
- **Restoration / un-deletion of a tombstoned RawInformation.** Permanently out of scope. `compliance_delete` is irreversible by design (§11 of v7) — the redacted `content` is unrecoverable from the DB; only `content_hash` survives. The audit row (`ComplianceDeletion`) documents the deletion but does not enable restoration.
- **Hard-delete (physical DELETE) of any row.** Permanently out of scope. The schema preserves all rows; status transitions are the only path. This protects the audit chain (principle 1, §18).
- **Mutation of audit rows (UPDATE / DELETE on `compliance_deletion` or `curation_action`).** Permanently out of scope (BR-13). No endpoint exposes either, no DB trigger writes either after INSERT.
- **Multi-tenant / `User` entity / role-based authorization** (§2.3, §20.3, A20). Permanent non-goal. No `actor_id` column on either audit table (BR-11).
- **Export of the audit log to external systems** (S3, SIEM, etc.). Not in this version. The two list endpoints (UC-02, UC-04) and the two by-id endpoints (UC-03, UC-05) are the supported interface.
- **Embeddings / vector search.** Permanent non-goal (§20.1, A24, CLAUDE.md "Anti-patterns"). No embedding column, no `pgvector`, ever.
- **Event bus / message queue.** No Kafka, RabbitMQ, Supabase Realtime, etc. The database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota required in v1.0.0. The 30 s PostgreSQL statement timeout is the only back-pressure mechanism on UC-01.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the compliance-and-audit domain. Mirrors `compliance-audit.spec.md` v1.0.0 (14 BRs, 5 UCs, 1 state machine) into a Fastify + raw-`pg` implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source (§2.5, §3.5, §10.2, §11, §13, §14.4, §17 C15, §18 principle 1, ADRs A19, A20, A28, A29). Tables owned for write: `compliance_deletion`, `curation_action` (INSERT only — BR-13). Tables mutated by status transition under BR-12 carve-out: `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`. Single state machine: ST-RI-DEL (`RawInformation` tombstone). No new BUSINESS_ error codes — this domain reuses existing global codes (`AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `SYSTEM_INTERNAL_ERROR`) plus MCP envelope codes (`STRUCTURAL_INVALID`, `NOT_FOUND`, `INTERNAL`). Two new operational alarms documented (`compliance.legacy_orphan_tombstone`, `compliance.cascade_rollback`). One pending schema migration flagged in §7: add `raw_information.status` + `raw_information.superseded_at` before UC-01 ships. | -- |
