---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/compliance-audit/service/compliance-audit.service.ts
  - src/modules/compliance-audit/service/errors.ts
  - src/modules/compliance-audit/service/transaction.ts
read_outside_area:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts — to see what the functions the service calls do (the lock, the tombstone updates, the cascade, the audit inserts, the list queries); none of its facts are listed here
  - src/shared/pg-transaction.ts — to see what the `withTransaction` that transaction.ts re-exports does; none of its facts are listed here
---

## Facts
### Compliance deletion (deleting a source)
- A compliance deletion names the source by its raw information id and gives a reason. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `body.raw_information_id`, `body.reason`).
- The first thing a compliance deletion does is load the source it names. Every later decision depends on that load. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `loadRawInformationForUpdate`).
- Checks run in this order: the source must exist; then, if the source is already deleted, the deletion looks for an earlier compliance deletion of it; only a source that is not deleted goes on to the tombstone. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `if (!raw)` then `if (raw.status === "deleted")`).
- The only status the deletion checks for is `deleted`. A source in any other status is deleted. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `raw.status === "deleted"`).
- Deleting a source that is already deleted, and has an earlier compliance deletion on record, changes nothing. The answer is the outcome `noop_already_deleted` together with that earlier compliance deletion. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `findComplianceDeletionByRawId`, `outcome: "noop_already_deleted"`).
- Deleting a source that is already deleted but has no compliance deletion on record is refused as an internal failure with the reason `legacy_orphan_tombstone`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `new InternalFailure("legacy_orphan_tombstone", …)`).
- On the main path the source is tombstoned first. If that tombstone reaches any number of sources other than exactly one, the deletion is refused as an internal failure with the reason `raw_tombstone_mismatch`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `tombstoneRawInformation`, `rawTombstoned !== 1`).
- After the source, the deletion reaches four kinds of record, in this order: the source's chunks, then the information fragments, then the knowledge links, then the node attributes. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `tombstoneRawChunksOfRaw`, `tombstoneCascadedFragments`, `tombstoneCascadedLinks`, `tombstoneCascadedAttributes`).
- The number of records reached in each kind is kept as the affected counts `chunks`, `fragments`, `links` and `attributes`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `const affected = { chunks, fragments, links, attributes }`).
- After the cascade, one compliance deletion is recorded with the source id, the reason and the affected counts. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `insertComplianceDeletion`).
- After the compliance deletion, one curation action is recorded:
  - action `compliance_delete`
  - target kind `raw_information`
  - target id is the source id
  - payload holds the reason and the affected counts
  - reason is the deletion's reason

  `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `insertCurationAction`).
- A deletion that runs the main path answers with the outcome `deleted` and the compliance deletion it just recorded. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `outcome: "deleted"`).
- Nothing is written on the no-op path or on either refusal path, as far as this service's own statements go. On the `raw_tombstone_mismatch` path the tombstone update has already run. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`).
- Every statement of a compliance deletion runs on the one database client the caller passes in. The service opens, commits and rolls back nothing itself. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, parameter `client: PoolClient`).
- The redaction marker is the literal `[REDACTED]`. The service exports it as a named constant but does not use it inside this file. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`REDACTED_LITERAL`).

### A compliance deletion as answered
- An answered compliance deletion carries:
  - its id
  - the raw information id
  - the reason
  - the time it was carried out, as an ISO-8601 timestamp
  - the affected counts `chunks`, `fragments`, `links`, `attributes`

  `src/modules/compliance-audit/service/compliance-audit.service.ts` (`rowToDto`, `toIso`).
- When a stored compliance deletion is read back, each affected count becomes a non-negative whole number:
  - a finite number of zero or more is truncated to an integer
  - a string holding a finite number of zero or more is parsed and truncated
  - a missing, negative or non-numeric count reads as `0`

  `src/modules/compliance-audit/service/compliance-audit.service.ts` (`rowToDto`, `coerceNonNegativeInt`).

### Listing compliance deletions
- A listing of compliance deletions accepts these filters: raw information id, a start of execution time (`executed_from`), an end of execution time (`executed_to`), a limit and an offset. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`listComplianceDeletions`).
- The listing answers the total, the limit and offset exactly as requested, and the items. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`listComplianceDeletions`, return `{ total, limit: query.limit, offset: query.offset, items }`).

### Reading one compliance deletion
- A compliance deletion is read by its id. If no compliance deletion has that id, the read is refused as not found. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`getComplianceDeletionById`, `findComplianceDeletionById`).

### Listing curation actions
- A listing of curation actions accepts these filters: action, target kind, target id, a start of creation time (`created_from`), an end of creation time (`created_to`), a limit and an offset. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`listCurationActions`).
- The listing answers the total, the limit and offset exactly as requested, and the items. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`listCurationActions`, return `{ total, limit: query.limit, offset: query.offset, items }`).

### Reading one curation action
- A curation action is read by its id. If no curation action has that id, the read is refused as not found. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`getCurationActionById`, `findCurationActionById`).
- An answered curation action carries its id, action, target kind, target id, payload, reason, and creation time as an ISO-8601 timestamp. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`curationRowToDto`, `toIso`).
- A curation action with no stored payload is answered with an empty payload object. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`curationRowToDto`, `row.payload ?? {}`).

### Refusal families
- A not-found refusal answers status 404 with code `RESOURCE_NOT_FOUND`. `src/modules/compliance-audit/service/errors.ts` (`ResourceNotFoundError`).
- A validation refusal answers status 422. Its code is chosen by whoever raises it. No operation in this area raises it. `src/modules/compliance-audit/service/errors.ts` (`ValidationFailure`).
- An internal failure answers status 500 with code `SYSTEM_INTERNAL_ERROR` and the fixed message "Unexpected internal error.". The reason travels on its own field, apart from the details. `src/modules/compliance-audit/service/errors.ts` (`InternalFailure`, `this.reason`).
- A refusal raised without details carries an empty details object. `src/modules/compliance-audit/service/errors.ts` (`ComplianceAuditError` constructor, `details = {}`).

## Answers
- Compliance deletion — no source has the given raw information id → 404 `RESOURCE_NOT_FOUND` (message "RawInformation &lt;id&gt; not found."; details `entity: "raw_information"`, `id`). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `ResourceNotFoundError`); `src/modules/compliance-audit/service/errors.ts` (`ResourceNotFoundError`).
- Compliance deletion — the source is already deleted and a compliance deletion of it is on record → outcome `noop_already_deleted` with that compliance deletion (not a refusal). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`).
- Compliance deletion — the source is already deleted and no compliance deletion of it is on record → 500 `SYSTEM_INTERNAL_ERROR` ("Unexpected internal error."; reason `legacy_orphan_tombstone`; details `raw_information_id`). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `InternalFailure`); `src/modules/compliance-audit/service/errors.ts` (`InternalFailure`).
- Compliance deletion — the tombstone reaches a number of sources other than exactly one → 500 `SYSTEM_INTERNAL_ERROR` ("Unexpected internal error."; reason `raw_tombstone_mismatch`; details `raw_information_id`, `rows_updated`). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `rawTombstoned !== 1`); `src/modules/compliance-audit/service/errors.ts` (`InternalFailure`).
- Compliance deletion — the source is deleted on the main path → outcome `deleted` with the new compliance deletion (not a refusal). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`).
- Reading one compliance deletion — no compliance deletion has the id → 404 `RESOURCE_NOT_FOUND` (message "ComplianceDeletion &lt;id&gt; not found."; details `entity: "compliance_deletion"`, `id`). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`getComplianceDeletionById`); `src/modules/compliance-audit/service/errors.ts` (`ResourceNotFoundError`).
- Reading one curation action — no curation action has the id → 404 `RESOURCE_NOT_FOUND` (message "CurationAction &lt;id&gt; not found."; details `entity: "curation_action"`, `id`). `src/modules/compliance-audit/service/compliance-audit.service.ts` (`getCurationActionById`); `src/modules/compliance-audit/service/errors.ts` (`ResourceNotFoundError`).
- Any operation raising a validation refusal → 422 with the code set by the raiser (message and details as given). `src/modules/compliance-audit/service/errors.ts` (`ValidationFailure`).

## Vocabularies
- Compliance deletion outcome: `deleted`, `noop_already_deleted`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete` return values).
- Error codes raised in this area: `RESOURCE_NOT_FOUND`, `SYSTEM_INTERNAL_ERROR`. `src/modules/compliance-audit/service/errors.ts` (`ResourceNotFoundError.code`, `InternalFailure.code`).
- Internal failure reasons: `legacy_orphan_tombstone`, `raw_tombstone_mismatch`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `new InternalFailure(...)`).
- Entity named in a not-found refusal: `raw_information`, `compliance_deletion`, `curation_action`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`ResourceNotFoundError` details `entity`).
- Affected count keys of a compliance deletion: `chunks`, `fragments`, `links`, `attributes`. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete` `affected`, `rowToDto`).

## Upstream artifacts
- The source's status, which this area reads and compares against `deleted`. The source is written by ingestion. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`complianceDelete`, `raw.status`).
- The request and answer shapes this area consumes and produces are defined in the module's dto layer, outside this area:
  - the deletion request (`raw_information_id`, `reason`)
  - the compliance deletion list query (`raw_information_id`, `executed_from`, `executed_to`, `limit`, `offset`)
  - the curation action list query (`action`, `target_kind`, `target_id`, `created_from`, `created_to`, `limit`, `offset`)

  `src/modules/compliance-audit/service/compliance-audit.service.ts` (imports from `../dto/compliance-delete.dto.js`, `../dto/curation-action.dto.js`).
- The curation action this area records carries action `compliance_delete` and target kind `raw_information`. The curation-action vocabulary it writes into is not closed in this area. `src/modules/compliance-audit/service/compliance-audit.service.ts` (`insertCurationAction` call).

## Outside the domain
- Structured log events `compliance_delete_ok`, `compliance_delete_noop` and `compliance_legacy_orphan_tombstone`, plus the alarm tag `compliance.legacy_orphan_tombstone` (logging). `src/modules/compliance-audit/service/compliance-audit.service.ts`.
- Taking a pooled connection and releasing it in `finally` for the four read operations (wiring). `src/modules/compliance-audit/service/compliance-audit.service.ts`.
- Dependency bag `ComplianceAuditServiceDeps` carrying the logger (wiring). `src/modules/compliance-audit/service/compliance-audit.service.ts`.
- Timestamp conversion from Date or string (`toIso`) (serialization). `src/modules/compliance-audit/service/compliance-audit.service.ts`.
- Error `name` set to the constructor name, and the abstract base `ComplianceAuditError` (framework). `src/modules/compliance-audit/service/errors.ts`.
- Re-export of the shared transaction wrapper `withTransaction` (wiring). `src/modules/compliance-audit/service/transaction.ts`.

## Observed and not decided here
None.
