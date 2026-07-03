# Compliance & Audit -- Business Specification

> Version: 1.2.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml` (REST) + MCP toolset `curation` (`compliance_delete` only — §14.4 of `remember-modelagem-v7.md`)
>
> Normative source: `remember-modelagem-v7.md` (§2.3, §2.5, §3.5, §10.2, §11, §13, §14.4, §17 C15, §18 principle 1, ADRs A20, A28, A29).
> Schema reference: `migrations/0001_init.sql` lines 452-462 (`curation_action`), 465-473 (`compliance_deletion`). `migrations/0001_seed.sql` (no seed in this domain).

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Enforce the controlled tombstone of raw documents under LGPD or owner request (§11), and expose the system-wide curation audit log as a read surface (§3.5). |
| Core entity | `ComplianceDeletion` (audit of the tombstone) + `CurationAction` (audit of every curation operation). The `RawInformation` row being tombstoned is owned by the `ingestion` domain — this domain is the only writer permitted to mutate it after creation. |
| Bounded context | (a) `compliance_delete` execution: tombstone of `RawInformation.content` to the literal `"[REDACTED]"`, cascade of `status = 'deleted'` to derived rows whose **only** provenance was the deleted source, single audit row with affected-counts payload; (b) read-only access to `ComplianceDeletion`; (c) read-only access to `CurationAction` (the system-wide audit trail of every curation tool call). |
| Out of scope | Curation queue operations (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) — future `curation` domain. LLM-extraction audit (`LLMRun`, `ToolCall`) — owned by `ingestion`. System-time travel (query (c) of §5.3, ADR A25) — permanently deferred. See §8. |

---

## 2. Actors

> Single-owner system per ADR A20 / §2.3. There is no `User` entity. Authentication exists as a network-access gate (§2.5 / ADR A29): the SPA reaches the BFF over the network.

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner (SPA user) | The single data owner, authenticated by Neon Auth (Stack Auth) — JWT validated in BFF middleware (`requireNeonAuth`) against the JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`. Operates from the SPA. | `complianceDeleteRawInformation`, `listComplianceDeletions`, `getComplianceDeletionById`, `listCurationActions`, `getCurationActionById`. |
| LLM (orchestrator) | The LLM acting as orchestrator over the MCP `curation` toolset (§14.4). Issues `compliance_delete` calls. Has read access to the audit log through the same JWT path used by the SPA (REST). | MCP tool: `compliance_delete`. REST (with the JWT provisioned by the Owner's runtime): the four read endpoints. |
| BFF (service layer) | Internal — not an external actor. Performs Zod validation (§13.1), executes the cascade transaction (§11), writes the audit row. Listed here for clarity. |

> Every REST and MCP call requires a valid Neon Auth JWT verified in BFF middleware (§2.5, A29). Neon Auth is the OIDC/JWT verifier — no service key is held by the BFF; PostgreSQL RLS is disabled. The actor of every `ComplianceDeletion` and `CurationAction` row is the implicit single-owner — no `actor_id` column exists in either table (§2.3, A20).

---

## 3. Use Cases

> Each UC: actor, pre/post, main flow + alternative flows, related operationId. Alternative flows cover ALL endpoint errors.

### UC-01 -- Tombstone a RawInformation (compliance_delete)

**Actor:** Owner (REST from the SPA) or LLM (MCP via `compliance_delete`)
**Pre:** Caller holds a valid Neon Auth JWT. The target `RawInformation` exists. `reason` is a non-empty string ≤ 1000 chars.
**Post:** Either the raw is tombstoned and one `ComplianceDeletion` row is inserted (HTTP 201, `outcome = "deleted"`), or the raw was already tombstoned and the existing audit row is returned (HTTP 200, `outcome = "noop_already_deleted"`). On HTTP 201 the cascade is applied within the SAME transaction (§11, ADR A19).

**Main flow:**
1. Owner POSTs `/api/v1/compliance/deletions` with `{ raw_information_id, reason }`.
2. BFF middleware (`requireNeonAuth`) validates the JWT against the Neon Auth JWKS (§2.5, A29).
3. BFF validates the request structurally (Zod, §13.1): both fields present, types and ranges (BR-01).
4. BFF opens a single SQL transaction (ADR A19). Inside it:
   - `SELECT ... FOR UPDATE` of `raw_information` for `raw_information_id` (BR-02).
   - If the row does not exist: rollback, return 404 `RESOURCE_NOT_FOUND`.
   - If the row already has `status = 'deleted'`: read the existing `ComplianceDeletion` row (UNIQUE by `raw_information_id` is upheld by the application — there is no DB UNIQUE on `compliance_deletion.raw_information_id`; the BFF enforces it via UC-01 alt `4b` below), rollback the transaction (no-op), return 200 with `outcome = "noop_already_deleted"` and the existing audit row (BR-03).
5. BFF replaces `raw_information.content` with the literal string `"[REDACTED]"` and merges `metadata` with `{"compliance_deleted": true}`. `content_hash` is preserved (BR-04). Sets `raw_information.status = 'deleted'` and `raw_information.superseded_at = now()` (BR-05).
6. BFF cascades `status = 'deleted'` and `superseded_at = now()`:
   - to every `raw_chunk` whose `raw_information_id` matches;
   - to every `information_fragment` whose `FragmentSource` set consists ONLY of chunks of this raw (the fragment lost ALL its anchors — BR-06);
   - to every `knowledge_link` and `node_attribute` whose `Provenance` set referenced ONLY fragments of this raw (BR-07). Rows with at least one surviving `Provenance` referencing a fragment of a DIFFERENT, non-deleted raw remain untouched.
7. BFF counts the affected rows per kind (`chunks`, `fragments`, `links`, `attributes`) and inserts one `compliance_deletion` row with `{ raw_information_id, reason, executed_at = now(), affected: { chunks, fragments, links, attributes } }`.
8. BFF inserts one `curation_action` row with `action = 'compliance_delete'`, `target_kind = 'raw_information'`, `target_id = raw_information_id`, `reason`, and `payload = { affected: { ... } }` (BR-08).
9. BFF commits and returns 201 with `{ outcome: "deleted", deletion: { ... } }`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED`. No DB write.
- `3a` `raw_information_id` missing or malformed UUID -> 422 `VALIDATION_REQUIRED_FIELD` (when absent) or `VALIDATION_INVALID_FORMAT` (when malformed). No DB write.
- `3b` `reason` missing -> 422 `VALIDATION_REQUIRED_FIELD`. No DB write.
- `3c` `reason` empty after `btrim` or > 1000 chars -> 422 `VALIDATION_OUT_OF_RANGE`. No DB write.
- `4a` `raw_information_id` does not exist -> 404 `RESOURCE_NOT_FOUND`. Transaction rolled back; no audit row.
- `4b` `raw_information.status = 'deleted'` already AND a `ComplianceDeletion` row already exists for this `raw_information_id` -> 200 `noop_already_deleted` with the existing audit row. No new row, no new cascade.
- `4c` `raw_information.status = 'deleted'` AND NO `ComplianceDeletion` row exists (legacy / inconsistent state) -> 500 `SYSTEM_INTERNAL_ERROR`, transaction rolled back. This is logged as an operational alarm; the recovery path is a manual migration (see §4 BR-03).
- `9a` Any unhandled exception in the cascade (DB connectivity, transaction conflict) -> 500 `SYSTEM_INTERNAL_ERROR`. Transaction rolled back; no partial cascade.

**Related endpoint:** operationId: `complianceDeleteRawInformation`. Also exposed as MCP tool `compliance_delete` (§14.4) — same service layer, same audit (ADR A28).

---

### UC-02 -- List ComplianceDeletion audit rows

**Actor:** Owner
**Pre:** Owner is authenticated (Neon Auth JWT validated by `requireNeonAuth`).
**Post:** No state change. Owner receives a paginated list ordered by `executed_at` DESC.

**Main flow:**
1. Owner GETs `/api/v1/compliance/deletions` with optional `raw_information_id`, `executed_from`, `executed_to`, `limit`, `offset`.
2. BFF middleware validates the JWT.
3. BFF validates parameters (Zod): UUID format, RFC 3339 timestamps, integer ranges (BR-09).
4. BFF builds the SQL: `SELECT ... FROM compliance_deletion WHERE [filters] ORDER BY executed_at DESC LIMIT $1 OFFSET $2`. `total` is `SELECT count(*)` on the same WHERE.
5. BFF returns 200 with `{ total, limit, offset, items }`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED`.
- `3a` `raw_information_id` malformed UUID -> 422 `VALIDATION_INVALID_FORMAT`.
- `3b` `executed_from` or `executed_to` not parseable as RFC 3339 -> 422 `VALIDATION_INVALID_FORMAT`.
- `3c` `executed_from > executed_to` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `3d` `limit < 1` or `> 100` or `offset < 0` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `5a` Database connectivity or unhandled exception -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listComplianceDeletions`

---

### UC-03 -- Get a ComplianceDeletion by id

**Actor:** Owner
**Pre:** Owner is authenticated (Neon Auth JWT validated by `requireNeonAuth`).
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/compliance/deletions/{complianceDeletionId}`.
2. BFF middleware validates the JWT.
3. BFF reads `compliance_deletion` by primary key.
4. BFF returns 200 with the row.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED`.
- `3a` No row with the given id -> 404 `RESOURCE_NOT_FOUND`.
- `4a` Database connectivity or unhandled exception -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getComplianceDeletionById`

---

### UC-04 -- List CurationAction audit rows

**Actor:** Owner
**Pre:** Owner is authenticated (Neon Auth JWT validated by `requireNeonAuth`).
**Post:** No state change. Owner receives a paginated list ordered by `created_at` DESC.

**Main flow:**
1. Owner GETs `/api/v1/audit/curation-actions` with optional `action`, `target_kind`, `target_id`, `created_from`, `created_to`, `limit`, `offset`.
2. BFF middleware validates the JWT.
3. BFF validates parameters (Zod): `action` must be one of the 7 enum values of BR-10, `target_kind` one of `{node, link, attribute, fragment, raw_information}`, `target_id` UUID, RFC 3339 timestamps, integer ranges.
4. BFF builds the SQL: `SELECT ... FROM curation_action WHERE [filters] ORDER BY created_at DESC LIMIT $1 OFFSET $2`. The composite index `curation_action_target_idx (target_kind, target_id)` is used when both filters are present (schema line 462).
5. BFF returns 200 with `{ total, limit, offset, items }`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED`.
- `3a` `action` not in the enum of BR-10 -> 422 `VALIDATION_INVALID_FORMAT`.
- `3b` `target_kind` not in the enum -> 422 `VALIDATION_INVALID_FORMAT`.
- `3c` `target_id` malformed UUID -> 422 `VALIDATION_INVALID_FORMAT`.
- `3d` `created_from > created_to` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `3e` `limit < 1` or `> 100` or `offset < 0` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `5a` Database connectivity or unhandled exception -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listCurationActions`

---

### UC-05 -- Get a CurationAction by id

**Actor:** Owner
**Pre:** Owner is authenticated (Neon Auth JWT validated by `requireNeonAuth`).
**Post:** No state change.

**Main flow:**
1. Owner GETs `/api/v1/audit/curation-actions/{curationActionId}`.
2. BFF middleware validates the JWT.
3. BFF reads `curation_action` by primary key.
4. BFF returns 200 with the row.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED`.
- `3a` No row with the given id -> 404 `RESOURCE_NOT_FOUND`.
- `4a` Database connectivity or unhandled exception -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `getCurationActionById`

---

## 4. Business Rules

> Every BR is programmatically testable and references at least one UC.

### BR-01 -- Compliance delete requires a non-empty reason (UC-01)
The `reason` field of `complianceDeleteRawInformation` is required, `btrim`-non-empty and ≤ 1000 chars. The BFF enforces this with Zod at the structural layer (§13.1, §10.2 — destructive operations require `reason`). The DB column `compliance_deletion.reason` is `text NOT NULL` (schema line 468) and `curation_action.reason` is `text` — the BFF guarantees non-null at this endpoint.

### BR-02 -- Compliance delete is one transaction (UC-01)
The entire flow of UC-01 step 4-9 runs in a SINGLE PostgreSQL transaction with `SELECT ... FOR UPDATE` on `raw_information` (ADR A19, §11). On any failure the cascade is fully rolled back: no `compliance_deletion` row is written, no derived row is mutated, the `raw_information.content` is unchanged.

### BR-03 -- Compliance delete is idempotent on raw_information_id (UC-01, alt `4b`)
Calling `complianceDeleteRawInformation` a second time with the same `raw_information_id` returns 200 `noop_already_deleted` and the existing `ComplianceDeletion` row. No new `ComplianceDeletion` or `CurationAction` row is written; the cascade does not run again. There is NO DB UNIQUE constraint on `compliance_deletion.raw_information_id` (schema lines 465-471) — idempotency is enforced by the application after the `FOR UPDATE` read of `raw_information.status` (BR-02). When `raw_information.status = 'deleted'` but no `ComplianceDeletion` row exists (legacy inconsistency), the endpoint returns 500 `SYSTEM_INTERNAL_ERROR` and the operational alarm is logged — UC-01 alt `4c`.

### BR-04 -- The tombstoned content is the literal string `"[REDACTED]"` (UC-01)
After UC-01 step 5, `raw_information.content` is exactly the 10-character UTF-8 string `[REDACTED]` (no quotes, no whitespace) and `metadata.compliance_deleted = true`. `content_hash` is preserved (it remains the original `sha256(content)`) — this is what makes future ingestion attempts of the same document still resolve to this raw and still be tombstoned (`ingestion` BR-09 path applies: re-ingestion is a no-op, returns the tombstoned row, NOT a re-ingestion).

### BR-05 -- The raw becomes status = 'deleted' with superseded_at = now() (UC-01)
After UC-01 step 5, `raw_information.status = 'deleted'` and `raw_information.superseded_at = current_timestamp` (UTC). The schema allows this transition — `raw_information` has the `status` column from the `node_status`-mirror enum and `superseded_at`/`recorded_at` audit columns (see the §5.4/§6.4 gotcha called out in CLAUDE.md "Known Gotchas": `reject_item` / `compliance_delete` MUST write `superseded_at = now()` to leave the partial-duplicate guard and the `is_current` filter).

### BR-06 -- Fragment cascade ignores cross-source fragments (UC-01)
A fragment is tombstoned ONLY when EVERY chunk in its `FragmentSource` set belongs to the raw being deleted. A fragment with at least one `FragmentSource` row pointing to a chunk of a DIFFERENT raw (which must still exist and be `status <> 'deleted'`) remains `accepted`/`proposed`. SQL test: `EXISTS (SELECT 1 FROM fragment_source fs JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id JOIN raw_information ri ON ri.id = rc.raw_information_id WHERE fs.fragment_id = information_fragment.id AND ri.id <> $1 AND ri.status <> 'deleted')` — when the EXISTS is true, do NOT tombstone (§11 "items with remaining provenance from other sources remain").

### BR-07 -- Link/Attribute cascade ignores cross-source provenance (UC-01)
A `knowledge_link` or `node_attribute` is tombstoned ONLY when EVERY `Provenance` row attached to it points to a fragment whose `FragmentSource` chain anchors ONLY chunks of the raw being deleted. A row with at least one surviving `Provenance` chain referencing a fragment of a different, non-deleted raw remains in its current `status`. Mirrors §11 and is the contract of cenario C15.

### BR-08 -- compliance_delete writes one CurationAction row (UC-01)
In addition to the `ComplianceDeletion` row (BR-02), the BFF writes one `curation_action` row in the same transaction with `action = 'compliance_delete'`, `target_kind = 'raw_information'`, `target_id = raw_information_id`, `reason = <same reason>`, `payload = { affected: { chunks, fragments, links, attributes } }`. This guarantees `listCurationActions(action='compliance_delete', target_id=…)` returns exactly one row per executed compliance delete (BR-03 idempotency excludes the no-op case from this count).

### BR-09 -- Audit reads honor the time-range filters strictly (UC-02, UC-04)
For `listComplianceDeletions`: `executed_from` is INCLUSIVE, `executed_to` is EXCLUSIVE (`executed_from <= executed_at AND executed_at < executed_to`). For `listCurationActions`: same semantics on `created_at`. Mirrors the project-wide semi-open `[start, end)` convention (ADR A7). When only one bound is provided, the other side is unconstrained.

### BR-10 -- listCurationActions validates the action filter (UC-04)
The `action` query parameter must be one of `{ resolve_entity_match, merge_nodes, resolve_dispute, confirm_item, reject_item, correct_item, compliance_delete }` — the 7 curation tool names of §14.4 that produce a `CurationAction` row. (`list_review_queue` is read-only and does NOT audit.) The DB column is plain `text` (schema line 454, no enum or CHECK), so the validation is enforced by Zod at this endpoint, NOT by the DB. Rows produced by curation calls that pre-date this validation can have arbitrary `action` strings — they are filtered out by this enum (acceptable, since the enum is the v1.0 contract for the SPA).

### BR-11 -- The actor of every audit row is the implicit single-owner (UC-01..UC-05)
No table in this domain carries an `actor_id` column (single-owner model, §2.3, A20). Audit rows do NOT record "who" because there is only one owner. The "who" of every `ComplianceDeletion` and `CurationAction` row is, by construction, the JWT subject of the request that produced it — and that subject is always the data owner. Multi-tenant support is a permanent non-goal (§20.3).

### BR-12 -- Compliance-delete is the only mutator of an existing RawInformation (UC-01)
After the initial `ingestRawInformation` write (`ingestion` UC-01), no code path mutates `raw_information.content`, `metadata`, `received_at` or `status` EXCEPT `complianceDeleteRawInformation` (this UC-01). This is the BR-02 carve-out called out by `ingestion.spec.md` BR-02. The `ingestion` domain enforces it on its side; this domain enforces it on its side by being the only writer of UPDATE statements against `raw_information`.

### BR-13 -- Audit rows are append-only and immutable (UC-01..UC-05)
There are NO endpoints in this domain that UPDATE or DELETE a `compliance_deletion` or `curation_action` row. The DB has no triggers either. Once written, an audit row is read-only forever — this is the foundation of principle 1 of §18 ("the original information is never lost — except controlled, audited deletion") applied to the audit log itself.

### BR-14 -- compliance_delete is mirrored as MCP tool with byte-identical error codes (UC-01, transport)
The REST endpoint `complianceDeleteRawInformation` and the MCP tool `compliance_delete` of toolset `curation` (§14.4) call the SAME service-layer function with identical Zod-validated inputs (ADR A28). They produce ONE `compliance_deletion` row and ONE `curation_action` row regardless of transport. The MCP envelope shape (`{ ok: true, result: { outcome, deletion } }` / `{ ok: false, error: { code, message, details } }`) wraps the same payload returned by the REST endpoint.

**Under P2.1 (canonical taxonomy — see `docs/specs/_global/error-codes.md` "Canonical Taxonomy").** The `error.code` value is byte-identical between REST and MCP for every business condition — the previous asymmetry that surfaced the §14 short codes (`STRUCTURAL_INVALID`, `NOT_FOUND`, `INTERNAL`) on MCP while REST surfaced the namespaced set is retired. Both transports now emit the namespaced codes of §6.1 (`VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE` / `RESOURCE_NOT_FOUND` / `SYSTEM_INTERNAL_ERROR`). The transport difference is limited to the wire wrapping: REST returns the envelope with a real HTTP status (401/404/422/500); MCP returns `content` + `isError: true` at HTTP 200 (MCP 2025-06-18) carrying the same `{ ok:false, error: { code, message, details } }` payload. Authentication errors continue to surface as the standard REST 401 (issued by the `requireNeonAuth` middleware BEFORE MCP tool dispatch) on both transports — never as an MCP envelope error. See §6.2 for the exhaustive REST↔MCP code mapping.

---

## 5. State Machine

> One state machine lives in this domain: `RawInformation` status transition driven by `compliance_delete`. The full `RawInformation` lifecycle is owned by `ingestion`; this section lists ONLY the transition this domain triggers.

### 5.1 ST-RI-DEL -- RawInformation tombstone transition

```
[active] --compliance_delete--> [deleted]    (content <- "[REDACTED]"; superseded_at = now())
[deleted] --compliance_delete (idempotent)--> [deleted]    (no-op; returns existing audit row)
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| (created by ingestion) | first `complianceDeleteRawInformation` | deleted | `reason` non-empty; row exists; transaction commits | UC-01 main |
| deleted | repeated `complianceDeleteRawInformation` | deleted | `compliance_deletion` row already exists | UC-01 alt `4b` (no DB write, returns 200 noop_already_deleted) |

This domain does NOT define state machines for `ComplianceDeletion` and `CurationAction` because they are append-only (BR-13).

---

## 6. Error Behaviors

> All HTTP statuses >= 400 from the REST endpoints, plus the MCP envelope error codes used by `compliance_delete`. Every code is registered in the global catalog (`docs/specs/_global/error-codes.md`).

### 6.1 REST errors

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without JWT, or JWT invalid/expired/malformed | 401 | `AUTH_UNAUTHORIZED` | The `requireNeonAuth` middleware rejects before any DB access (cf. C16, §2.5, A29). |
| `raw_information_id` / `complianceDeletionId` / `curationActionId` not found | 404 | `RESOURCE_NOT_FOUND` | UC-01 alt `4a`, UC-03 alt `3a`, UC-05 alt `3a`. |
| Required field missing in request body (`raw_information_id` or `reason` on `complianceDeleteRawInformation`) | 422 | `VALIDATION_REQUIRED_FIELD` | UC-01 alt `3a`, `3b`. |
| Field with invalid format (malformed UUID, malformed RFC 3339 timestamp, non-enum `action`/`target_kind`) | 422 | `VALIDATION_INVALID_FORMAT` | UC-01 alt `3a`; UC-02 alt `3a`, `3b`; UC-04 alt `3a`, `3b`, `3c`. |
| `reason` empty after `btrim` or > 1000 chars; `limit` outside `[1, 100]`; `offset < 0`; `executed_from > executed_to` or `created_from > created_to` | 422 | `VALIDATION_OUT_OF_RANGE` | UC-01 alt `3c`; UC-02 alt `3c`, `3d`; UC-04 alt `3d`, `3e`. |
| Unexpected internal failure (DB outage, transaction conflict, legacy inconsistent state of UC-01 alt `4c`) | 500 | `SYSTEM_INTERNAL_ERROR` | UC-01 alt `4c`, `9a`; UC-02 alt `5a`; UC-03 alt `4a`; UC-04 alt `5a`; UC-05 alt `4a`. |

### 6.2 MCP envelope errors for `compliance_delete` (response is `{ ok: false, error: { code, message, details } }`)

Under P2.1 (canonical taxonomy) the MCP envelope carries the **same namespaced code** as REST for every situation of §6.1 — there is no §14 short-code alternative any more. The mapping below is a rendering guide (transport wrapping only), NOT a distinct code vocabulary. The `error.code` value is byte-identical to the REST 6.1 row for the same business condition.

| Situation | REST HTTP | MCP wire | error.code (both transports) |
|-----------|-----------|----------|-------------------------------|
| Required field missing in request body | 422 | `content` + `isError:true` at HTTP 200 | `VALIDATION_REQUIRED_FIELD` |
| Field with invalid format (malformed UUID) | 422 | `content` + `isError:true` at HTTP 200 | `VALIDATION_INVALID_FORMAT` |
| `reason` empty after `btrim` or > 1000 chars | 422 | `content` + `isError:true` at HTTP 200 | `VALIDATION_OUT_OF_RANGE` |
| `raw_information_id` resolves to no row | 404 | `content` + `isError:true` at HTTP 200 | `RESOURCE_NOT_FOUND` |
| Unhandled internal exception in service layer (incl. UC-01 alt `4c` legacy inconsistency) | 500 | `content` + `isError:true` at HTTP 200 | `SYSTEM_INTERNAL_ERROR` |

Auth errors are handled by the BFF middleware (same Neon Auth JWT validation as REST, §2.5/A29); they surface to the MCP client as the standard REST 401 (`AUTH_UNAUTHORIZED`) BEFORE tool dispatch on both transports — never as an MCP envelope error (cf. `ingestion.spec.md` §6.2, ADR A28).

**Deprecated pre-P2.1 short codes.** Any prior reference to the §14 short codes `STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL` in downstream MCP clients maps as follows: `STRUCTURAL_INVALID` → one of the three `VALIDATION_*` codes (Zod-discriminated as in REST); `NOT_FOUND` → `RESOURCE_NOT_FOUND`; `INTERNAL` → `SYSTEM_INTERNAL_ERROR`. See `docs/specs/_global/error-codes.md` "§14 short-code → namespaced mapping (deprecation table)" for the exhaustive registry.

> **Idempotent no-op is NOT an error.** The 200 `noop_already_deleted` result is a successful business outcome — the response envelope is `{ ok: true, result: { outcome: "noop_already_deleted", deletion: { ... } } }` on MCP and HTTP 200 on REST. Mirrors the design rule of §14: "business outcomes are not errors".

---

## 7. Cross-Domain Dependencies

> Bidirectional — if this domain lists X, X must list this domain back when it is specified.

| Domain | Type | Description |
|--------|------|-------------|
| `ingestion` | synchronizes | This domain is the only writer permitted to mutate a `RawInformation` row after its initial insertion (`ingestion.spec.md` BR-02 carve-out, BR-12 here). It tombstones `content`, propagates `status = 'deleted'` to chunks and (via BR-06) to fragments. `ingestion`'s `getRawInformationById` (UC-02) is the read counterpart that surfaces the redacted content (§3.1: `metadata.compliance_deleted = true`). |
| `knowledge-graph` | synchronizes | UC-01 cascades `status = 'deleted'` to `knowledge_link` and `node_attribute` rows whose only provenance referenced the deleted raw (BR-07). `knowledge-graph` reads (`getNodeById`, `getLinkById`, `getAttributeById`, `traverseNode`, `getAttributeKeyHistory`) honor this via the existing tombstone error code `BUSINESS_NODE_DELETED` (knowledge-graph error catalog) when applicable. |
| `query-retrieval` | synchronizes | The provenance-walk endpoints of `query-retrieval` (`getProvenanceByLink`, `getProvenanceByAttribute`, `getProvenanceByFragment`) short-circuit with 410 `BUSINESS_RAW_INFORMATION_DELETED` when they encounter a tombstoned raw (`query-retrieval` BR-14). This domain is the writer of that tombstone. |
| `curation` (future) | produces | Every curation tool of §14.4 — `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` — writes a `CurationAction` row using the same audit table that this domain exposes via `listCurationActions` / `getCurationActionById`. This domain does NOT define those tools; it only reads the audit log they produce. |

This domain has no upstream dependencies for the read endpoints (UC-02..UC-05). UC-01 (`complianceDeleteRawInformation`) coordinates the cross-domain cascade in a single transaction; it does NOT call any other domain's endpoints — it operates directly on the relational tables shared by all domains (the BFF is the sole database client per §2.5/A29).

---

## 8. Out of Scope

- **Curation queue operations (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`).** Owned by the future `curation` domain. This domain only WRITES `CurationAction` rows for its own `compliance_delete` operation (BR-08) and READS the full audit log (UC-04, UC-05).
- **LLM-extraction audit (`LLMRun`, `ToolCall`).** Owned by `ingestion` (operationIds `getLlmRunById`, `listToolCallsByLlmRun`, `retryLlmRun`). They live in §3.5 but are NOT exposed here because their lifecycle is tied to ingestion (close, retry).
- **EntityMatchReview rows.** Belong to the future `curation` domain (cleared upon resolution per §10.1).
- **System-time travel — query (c) of §5.3 ("what the system knew at instant T").** Permanently deferred (ADR A25, §20.2). This domain writes `recorded_at` on every audit row it owns (via DB defaults), but exposes no endpoint to query the audit log as-of an arbitrary instant.
- **Restoration / un-deletion of a tombstoned RawInformation.** Permanently out of scope. `compliance_delete` is irreversible by design (§11) — the redacted `content` is unrecoverable from the DB; only `content_hash` survives. The audit row (`ComplianceDeletion`) documents the deletion but does not enable restoration.
- **Hard-delete (physical DELETE) of any row.** Permanently out of scope. The schema preserves all rows; status transitions are the only path. This protects the audit chain (principle 1, §18).
- **Mutation of audit rows (UPDATE / DELETE on `compliance_deletion` or `curation_action`).** Permanently out of scope (BR-13).
- **Multi-tenant / `User` entity / role-based authorization** (§2.3, §20.3, A20). Permanent non-goal.
- **Export of the audit log to external systems** (S3 buckets, SIEM platforms, or event-streaming services). Not in this version. The two read endpoints (UC-02, UC-04) are the supported interface.

---

## 9. Local Glossary

> Domain-specific terms not already in the global glossary.

| Term | Definition |
|------|------------|
| Tombstone | The state set by `compliance_delete` on a `RawInformation`: `status = 'deleted'`, `content = "[REDACTED]"`, `metadata.compliance_deleted = true`, `content_hash` preserved (§11). |
| Compliance deletion | The full operation triggered by `complianceDeleteRawInformation` or MCP `compliance_delete`: tombstone of the raw + cascade to derived rows + audit row. |
| Cascade (compliance) | The transitive `status = 'deleted'` propagation from the tombstoned `RawInformation` to its chunks, fragments (BR-06) and downstream links/attributes (BR-07). Rows with provenance from other live sources are spared. |
| Affected counters | The four-integer payload (`chunks`, `fragments`, `links`, `attributes`) attached to `ComplianceDeletion.affected` and to the `CurationAction.payload` of the corresponding row. Reports the cascade size. |
| Audit row | An immutable row of `compliance_deletion` or `curation_action`. Append-only (BR-13); no UPDATE/DELETE endpoint exists. |
| Curation tool name | One of the 7 strings of BR-10 — the `action` column of a `CurationAction` row. |
| Idempotent no-op (compliance) | The 200 response of UC-01 when the raw is already tombstoned (BR-03). Returns the existing audit row, writes nothing. |
| Implicit owner | The actor of every audit row, by construction. Equal to the JWT subject of the request that produced the row. Not stored as a column (BR-11). |
| MCP envelope (this domain) | `{ ok: true, result: { outcome, deletion } }` / `{ ok: false, error: { code, message, details } }` — the same shape used by all MCP tools (§14, ADR A28). Under P2.1 the `error.code` value is byte-identical to the REST rendering (no separate §14 short code vocabulary). |
| Neon Auth (Stack Auth) | The OIDC JWT issuer that replaces Supabase Auth at the BFF middleware boundary. JWKS published at `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default); validated by the `requireNeonAuth` Fastify `preHandler` middleware. Single-owner contract of §2.5 / A29 is unchanged. |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial compliance-and-audit-domain specification: controlled tombstone of `RawInformation` with cascade (§11), audit log read endpoints for `ComplianceDeletion` and `CurationAction` (§3.5). Aligned with v7 normative source (§2.5, §3.5, §10.2, §11, §13, §14.4, §17 C15, §18 principle 1, ADRs A20, A28, A29) and with `migrations/0001_schema.sql` lines 217-243 and 439-473. Five new BUSINESS_ error codes registered in the global catalog (none — this domain reuses only existing global codes: `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `SYSTEM_INTERNAL_ERROR`). | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | update | Auth-provider migration: replaced "Supabase Auth" with "Neon Auth (Stack Auth)" in the Actors table, in every UC `Pre:` clause (UC-01..UC-05) and in the UC `Main flow` middleware step. The middleware name is now `requireNeonAuth`, verifying tokens against the JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json`. The §2 trailing note on JWT validation, the §6.1 401-row description, and the §6.2 MCP-errors note all now reference Neon Auth instead of Supabase. A new glossary entry "Neon Auth (Stack Auth)" was added. No change to BRs, UCs, state machine, error codes, schema, or business semantics — the single-owner contract of §2.5 / A29 is preserved end-to-end. | migrate-neon |
| 1.2.0 | 2026-07-02 | Spec Writer | update | P2.1 canonical error-code taxonomy. §6.2 rewrite: the "MCP envelope errors" table now renders each situation as the SAME namespaced code as REST §6.1, with the transport wrapping (REST HTTP status vs MCP `content`/`isError:true` at HTTP 200) as the only difference. BR-14 rewritten to make the byte-identical parity contract explicit and to drop the §14 short-code vocabulary (`STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL`) for this domain's MCP tool. Glossary "MCP envelope (this domain)" reworded to state the byte-identical rule. Deprecated §14 short codes and their replacements are registered in `docs/specs/_global/error-codes.md` "Deprecated Codes" section (2026-07-02). No new BUSINESS_ codes for this domain — the mapping uses only the existing global namespaced codes already declared in §6.1 (`AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `SYSTEM_INTERNAL_ERROR`). No change to UCs, business rules other than BR-14, state machine, schema, dependencies, out-of-scope. The `compliance-audit.back.md` v1.4.0 spec-writer run is the paired update; the code consequence (removal of the `code/mcpCode` pair in `compliance-audit/service/errors.ts` + centralisation of the REST/MCP mapping in `backend/src/shared/error-mapping.ts`) lands in a follow-up dev-phase task. No migration / DB change. | P2.1 |
