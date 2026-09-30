# adopt-curation — RESULTS

Runbook: `siegard-survey/RUNBOOK-adopt-context.md`. Plugin root `P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.28.0`.

Start instant: `2026-09-30T20:19:31Z`

## Step 1 — preconditions

```
$ grep "version" /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/.claude-plugin/plugin.json
  "version": "4.28.0"
[exit 0]
$ git status --porcelain -- specification backend siegard-trace.json siegard-reconcile siegard.json
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: /home/siegfriedneto/projects/eternal/standards/backend-node-service.yaml
standard database: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
target database: /home/siegfriedneto/projects/eternal/migrations
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/trace.py --untraced backend
279 tracked file(s) under backend: 88 bound, 191 no binding names
  13 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  178 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
   14  backend/src/modules/chat/service
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    8  backend/src/modules/curation/service
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    6  backend/src/modules/curation/mcp
    5  backend/src/__tests__/integration/ingestion
    5  backend/src/modules/chat/prompts
    5  backend/src/modules/curation/dto
    5  backend/src/shared
    3  backend/src
  (26 more directories; --all lists every file)
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/spec.py specification
specification sound: 61 element(s), 295 rule(s), 8 scenario(s), 3 contract(s), 11 constraint(s) across 2 context(s); 97 decision(s) disclosed, 2 location(s) retired
[exit 0]
```

Result: version 4.28.0; `git status` printed nothing; specification sound. Preconditions hold.

`--untraced` line recorded: `279 tracked file(s) under backend: 88 bound, 191 no binding names` (13 holds-nothing, 0 outside, 178 unsurveyed).

## Step 2 — the survey

Areas (`git ls-files`, tests excluded; every non-test file of the module is in exactly one area — no file outside the areas):

- `service`: src/modules/curation/service/dispute.service.ts src/modules/curation/service/entity-match.service.ts src/modules/curation/service/errors.ts src/modules/curation/service/item.service.ts src/modules/curation/service/merge.service.ts src/modules/curation/service/metrics.service.ts src/modules/curation/service/queue.service.ts src/modules/curation/service/transaction.ts
- `boundary`: src/modules/curation/dto/dispute.dto.ts src/modules/curation/dto/entity-match.dto.ts src/modules/curation/dto/enums.dto.ts src/modules/curation/dto/item.dto.ts src/modules/curation/dto/queue.dto.ts src/modules/curation/index.ts src/modules/curation/mcp/curation-toolset.ts src/modules/curation/mcp/curation-transport.ts src/modules/curation/mcp/error-envelope.ts src/modules/curation/repository/curation.repository.ts src/modules/curation/routes/curation.routes.ts


Delegation: two `siegard:domain-surveyor` agents in parallel (service, boundary). Each was handed the target source root, its area's file list, target `backend`, the digest as a file path (`/tmp/curation-digest.txt`, `spec.py --digest specification`, 45 508 bytes), the request to cite the names a caller reads, and the YAML-string warning for `read_outside_area`. Returns were saved by script from the last assistant message of each agent's `tasks/<id>.output` JSONL (both unfenced; no edit). No surveyor was refused, and none was re-run.

Surveyor usage (from the task notifications): service 112 468 tokens, 22 tool uses, 198 s; boundary 129 297 tokens, 20 tool uses, 242 s.

`--untraced` before this survey: `279 tracked file(s) under backend: 88 bound, 191 no binding names` (13 holds-nothing, 0 outside, 178 unsurveyed).

```
$ python3 -B $P/bin/trace.py --survey siegard-survey/adopt-curation/service.md siegard-survey/adopt-curation/boundary.md
siegard-survey/adopt-curation/service.md: 124 fact line(s) over 8 file(s) — Facts 70, Answers 37, Vocabularies 11, Upstream artifacts 6
siegard-survey/adopt-curation/boundary.md: 140 fact line(s) over 11 file(s) — Facts 86, Answers 26, Vocabularies 12, Upstream artifacts 16
  1 file(s) no fact names: src/modules/curation/index.ts
[exit 0]
```

`src/modules/curation/index.ts` is named by no fact (the boundary surveyor filed it under "Outside the domain" as module wiring). It is carried to the analysis as a finding.

### Observed and not decided here — service

- The review queue groups a dispute on a link type that does not allow multiple current values by source node and link type only, so its sides can have different target nodes: "`functional ? `${r.source_node_id}\x1F${r.link_type_id}``" (`src/modules/curation/service/queue.service.ts`, `groupDisputedLinks`). Resolving a dispute requires every item to share the same target node, and refuses otherwise with 409 `BUSINESS_ITEM_NOT_DISPUTED` (`scope_mismatch`): "`r.target_node_id !== first.target_node_id`" (`src/modules/curation/service/dispute.service.ts`, `assertSameScope`).
- The same code `BUSINESS_INVALID_TARGET_NODE` is answered 422 for survivor/absorbed status and node-type guards (`BusinessError`), and 409 when the absorbed node's status changed under lock (`ConflictError("BUSINESS_INVALID_TARGET_NODE", "Absorbed node status changed under lock")`). Both are in `src/modules/curation/service/merge.service.ts` (`performMerge`).
- An attribute key or link type missing from the catalog is treated as allowing multiple current values when periods are adjusted: "`return ak?.allows_multiple_current ?? true`" (`src/modules/curation/service/dispute.service.ts`, `scopeAllowsMultipleCurrent`). A missing attribute key is refused with 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` when a value is corrected: "`predecessor attribute_key_id does not resolve in the catalog snapshot`" (`src/modules/curation/service/item.service.ts`, `correctItemService`).
- The review queue answers `limit` as requested, but applies that same `limit` and `offset` to up to three separate listings, so `items` can hold more entries than `limit`: "`listEntityMatchQueue(client, limit, offset)` … `listDisputedLinks(client, limit, offset)` … `listDisputedAttributes(client, limit, offset)`" and "`return { total, limit, offset, items }`" (`src/modules/curation/service/queue.service.ts`, `listReviewQueueService`).

### Observed and not decided here — boundary

- The answer to a missing reason depends on the operation. `resolve_entity_match` (`merge_into`) and `resolve_dispute` (`prefer_one`) answer 422 `BUSINESS_REASON_REQUIRED` (`src/modules/curation/dto/entity-match.dto.ts` `ResolveEntityMatchBodySchema.superRefine`; `src/modules/curation/dto/dispute.dto.ts` `superRefine`). `merge_nodes`, `reject_item` and `correct_item` require `reason` through `ReasonRequiredSchema` and answer 422 `VALIDATION_INVALID_FORMAT` (`src/modules/curation/dto/entity-match.dto.ts` `MergeNodesBodySchema`; `src/modules/curation/dto/item.dto.ts` `RejectItemBodySchema`, `CorrectItemBodySchema`).
- `VALIDATION_INVALID_FORMAT` has two shapes of `details`. Body refusals answered by the curation mapper carry `details: { issues: [{ path, message }] }` (`src/modules/curation/mcp/error-envelope.ts` `zodIssuesAsDetails`, reached through `sendError` in `src/modules/curation/routes/curation.routes.ts`). The `GET /queue` query refusal and the `node_id` path refusal are thrown outside `sendError`, so they reach the global handler, which answers `details` as a bare array of `{ path, message }` (`src/modules/curation/routes/curation.routes.ts` `ListReviewQueueQuerySchema.parse`, `NodeIdPathSchema.parse`; handler in `src/middleware/error-handler.ts` `classify`).
- REST and MCP answer success in different shapes. Every REST route answers the bare service result with 200 (`src/modules/curation/routes/curation.routes.ts`, `reply.status(200).send(result)`). Every MCP tool answers `{ ok: true, result }` (`src/modules/curation/mcp/curation-toolset.ts` `makeHandler`). REST errors do use the `{ ok: false, error }` envelope (`sendError`).
- A failure the mapper answers 500 is answered 500 `SYSTEM_INTERNAL_ERROR` by every curation route (`src/modules/curation/routes/curation.routes.ts` `sendError`), but 503 `SYSTEM_SERVICE_UNAVAILABLE` by `GET /metrics` (`degradedStatus`).
- A resolution with `merge_into` sends `target_node_id` into the merge. Neither the request shape nor the MCP input refuses a `target_node_id` equal to the path or input `node_id` (`src/modules/curation/dto/entity-match.dto.ts` `ResolveEntityMatchBodySchema`; `src/modules/curation/mcp/curation-toolset.ts` `ResolveEntityMatchToolInputSchema`). The tool description published to the model says self-merge is refused with `BUSINESS_SELF_MERGE_FORBIDDEN` (`CurationToolDescriptions.resolve_entity_match`). Whether the service refuses it was not read here.
- `disputed_queue_count` groups disputed links by (`source_node_id`, `target_node_id`, `link_type_id`) whatever the link type's cardinality (`src/modules/curation/repository/curation.repository.ts` `aggregateCurationMetrics`). The queue listing groups competing targets of a link type whose `allows_multiple_current` is false into one item (`src/modules/curation/service/queue.service.ts` `groupDisputedLinks`, outside the area). The two counts differ for such disputes.
- The entity-match page takes `LIMIT`/`OFFSET` over node-candidate joined rows (`src/modules/curation/repository/curation.repository.ts` `listEntityMatchQueue`), while its total counts nodes (`countEntityMatchQueue`). The disputed page applies the same `limit`/`offset` separately to links and to attributes (`listDisputedLinks`, `listDisputedAttributes`), while its total adds both counts.

### read_outside_area — service

  - "src/shared/pg-transaction.ts - opened to learn what withTransaction and withReadOnly do (BEGIN/COMMIT with ROLLBACK on any thrown error; BEGIN READ ONLY with unconditional ROLLBACK)"
  - "src/modules/curation/repository/curation.repository.ts - opened to learn which status each repository mutation writes, the guard status of each UPDATE, and the columns of the curation_action insert"
  - "src/modules/curation/dto/enums.dto.ts - opened to learn the values of ItemKind, AssertionStatus and ReviewQueueKind that the services type against"
  - "src/modules/curation/dto/dispute.dto.ts - opened to learn which dispute-body checks run before the service (winner_id membership, periods per item_id)"
  - "specification/domain/knowledge-base/item-kind.md, affected-counts.md, curation-action-kind.md, curation-target-kind.md - opened only to align names with the context so far"

### read_outside_area — boundary

  - src/shared/error-mapping.ts, to resolve what `serviceUnavailableError`, `internalError` and `mapped` answer (status, code, message) when the curation mapper calls them
  - src/middleware/error-handler.ts, to resolve what a ZodError thrown outside the curation mapper (GET /queue query, the node_id path parameter) answers through the global handler
  - src/app.ts, to learn the prefix the curation routes are mounted under (/curation inside the /api/v1 scope) and the tool names handed to the curation MCP transport
  - src/modules/curation/service/queue.service.ts, to see how the queue listing consumes the repository's page and count queries and groups disputed links

### Handoff

`/siegard:analyse` with project root `/home/siegfriedneto/projects/eternal` and material `siegard-survey/adopt-curation/service.md`, `siegard-survey/adopt-curation/boundary.md`.

STOP (Step 2). Material files: `siegard-survey/adopt-curation/service.md`, `siegard-survey/adopt-curation/boundary.md`.

## Step 3 — the analysis

Invoked `/siegard:analyse` with project root `/home/siegfriedneto/projects/eternal` and material `siegard-survey/adopt-curation/service.md`, `siegard-survey/adopt-curation/boundary.md`. The owner's attention point was passed in: the curation action and its closed action-kind and target-kind vocabularies, decided in the compliance-audit adoption, are confronted with curation, which writes most curation actions.

The tree was clean (`git status --porcelain -- specification` printed nothing). The root was sound before the analysis (`61 element(s), 295 rule(s), 8 scenario(s), 3 contract(s), 11 constraint(s)`; 97 decisions). This session's context never read the source: the analysis worked from the material alone. It checked one code detail, the `reject_rate_by_code` filter `payload ? 'error_code'`, to phrase a watch item.

### Confrontation with the curation-action nodes (owner's attention point)

- `curation-action-kind` (7 values) holds every kind curation writes (`resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) plus `compliance-delete`. There is no gap and nothing extra.
- `curation-target-kind` (5 values) holds the three curation writes (`node`, `link`, `attribute`). `fragment` and `raw-information` are the compliance side. There is no gap.
- `curation-action` (action, target_kind, target_id, payload, reason, created_at) matches what curation records. Six new policies (`*-records-curation-action`) state, per operation, the kind, target and payload recorded, in the pattern of `compliance-deletion-records-curation-action`.
- **Conflict decided:** `curation-action-reason-length` (≤ 1000 characters, over every curation action) against curation requests that take a reason of any length. The rule stands for every action. Each curation decision now refuses a longer reason with `VALIDATION_INVALID_FORMAT` (a decision logged at `contracts/knowledge-base/curation.md` `answers`). No fact line states a length, so the ledger does not make that rule a candidate for any curation file. The adoption will not report this breach; it stays with the corrections at the end.
- Watch item: `reject-rate-by-code` reads an error code from a `reject-item` action's payload. `assertion-review-records-curation-action` records that payload empty, so the rate by code is always `{}` today.

### Nodes

Created (84):

- elements (16): `adjusted-period`, `assertion-correction`, `assertion-kind`, `assertion-review`, `corrected-values`, `curation-metrics`, `dispute-decision`, `dispute-resolution`, `dispute-scope`, `entity-match-decision`, `entity-match-resolution`, `merge-counts`, `node-merge`, `reject-rate`, `review-queue-filter`, `review-queue-kind`
- rules (62): `accept-rate`, `adjust-periods-one-per-item`, `adjust-periods-outcome`, `adjusted-periods-single-open`, `assertion-review-check-order`, `assertion-review-records-curation-action`, `confirmation-activates`, `confirmation-requires-uncertain`, `corrected-item-provenance`, `corrected-item-values`, `corrected-stated-start-cites-fragment`, `correction-changes-something`, `correction-check-order`, `correction-fits-assertion-kind`, `correction-fragment-accepted`, `correction-records-curation-action`, `correction-supersedes-item`, `curation-reason-not-blank`, `curation-reason-required`, `curation-refuses-deleted-node`, `curation-request-check-order`, `curation-request-checked-first`, `dispute-entry-time`, `dispute-queue-entry`, `dispute-resolution-check-order`, `dispute-resolution-distinct-items`, `dispute-resolution-records-curation-action`, `dispute-resolution-requires-disputed-items`, `dispute-resolution-single-scope`, `dispute-scope`, `entity-match-queue-entry`, `entity-match-resolution-check-order`, `entity-match-resolution-clears-reviews`, `entity-match-resolution-records-curation-action`, `entity-match-resolution-requires-pending-review`, `keep-disputed-changes-nothing`, `keep-separate-activates-node`, `merge-check-order`, `merge-compresses-paths`, `merge-copies-aliases`, `merge-counts-what-it-changed`, `merge-into-requires-target`, `merge-marks-absorbed-merged`, `merge-repoints-assertions`, `merge-requires-same-node-type`, `merge-survivor-active`, `metrics-assertion-counts`, `metrics-disputed-queue-count`, `metrics-review-counts`, `node-merge-absorbs-active-node`, `node-merge-records-curation-action`, `prefer-one-outcome`, `prefer-one-requires-winner`, `refused-curation-records-nothing`, `reject-rate-by-code`, `rejection-and-correction-require-live-item`, `rejection-deletes`, `review-queue-kinds`, `review-queue-order`, `review-queue-page-windows-entries`, `review-queue-total-before-pagination`, `unused-resolution-fields-ignored`
- contract: `contracts/knowledge-base/curation`
- constraints: `constraints/curation-is-atomic`, `constraints/curation-reads-are-consistent`, `constraints/curation-transports-answer-alike`, `constraints/llm-toolset-omits-curation-metrics`
- scenario: `scenarios/knowledge-base/functional-link-dispute-resolved-by-preference`

Changed:

- `domain/knowledge-base/knowledge-link`, `domain/knowledge-base/node-attribute`: the `llm-run` relationship cardinality goes from `'1'` to `0..1`, because the new item a correction records has no run (decision logged).
- `rules/knowledge-base/page-defaults`: extended to the review queue listing (the material states 20/0).
- `rules/knowledge-base/validity-start-before-end`: extended to adjusted periods and corrections.
- `rules/knowledge-base/stated-start-requires-basis`: extended to corrections.
- `rules/knowledge-base/attribute-value-parses`, `rules/knowledge-base/attribute-value-in-allowed-values`: extended to attribute corrections (the same ingestion checks decide them).
- `decision-log.md` (+10 entries), and the projections were rederived.

Removed: none. No log entry was retired.

Impact set read: `spec.py --impact` over 37 entry nodes (the curation-action trio, entity-match-review, knowledge-node, node-alias, knowledge-link, node-attribute, provenance, node-status, assertion-status, valid-from-basis, page, affected-counts, item-kind, effective-status, merged-node-names-survivor, node-never-merged-into-itself, correction-replaces, conflict-disputes, curation-action-reason-length, curation-action-time-is-recording-time, compliance-deletion-records-curation-action, the three contracts and all 11 constraints). The closure reaches 641 lines and most of the knowledge-base context. The rules whose subject curation touches were read by statement.

### Decisions logged (10)

1. `domain/knowledge-base/knowledge-link.md` `relationships.llm-run.cardinality` = `0..1`. A correction's new link has no run.
2. `domain/knowledge-base/node-attribute.md` `relationships.llm-run.cardinality` = `0..1`. Same reason, for attributes.
3. `rules/knowledge-base/dispute-scope.md` `statement`: links of a single-current link type share a scope by source node and link type, whatever their targets. **This is contrary to the code** (`assertSameScope` requires the same target). Otherwise every reports_to/part_of/located_in dispute could never be resolved. Scenario `functional-link-dispute-resolved-by-preference` pins it.
4. `rules/knowledge-base/metrics-disputed-queue-count.md` `statement`: the count is the number of entries in the disputed queue. **Contrary to the code**, which counts by source, target and type.
5. `rules/knowledge-base/review-queue-page-windows-entries.md` `statement`: the page windows whole entries. **Contrary to the code**, which pages three listings separately and pages node-candidate rows.
6. `rules/knowledge-base/review-queue-total-before-pagination.md` `statement`: the total counts entries. **Contrary to the code**, which counts nodes plus disputed rows.
7. `rules/knowledge-base/dispute-entry-time.md` `statement`: an entry's time is the earliest recording time of its items.
8. `contracts/knowledge-base/curation.md` `answers`: `curation-action-reason-length` stands, and a longer reason is refused with 422 `VALIDATION_INVALID_FORMAT`. **Contrary to the code.**
9. `domain/knowledge-base/dispute-resolution.md` `attributes.item_ids.type` = `string`.
10. `domain/knowledge-base/curation-metrics.md` `attributes.reject_rate_by_code.type` = `reject-rate`, many.

### How the observed-and-not-decided items were settled

- Queue grouping by source+type against resolution requiring the same target: decision 3.
- `BUSINESS_INVALID_TARGET_NODE` 422 (guards) against 409 (race): both recorded as answers under different conditions. No decision was needed.
- Missing catalog type (`?? true` against 422 on correct): left out. Every link and attribute names a catalog type, so the case does not arise (ledger `service.md:62`).
- `items` can exceed `limit`, and the total disagrees with the page: decisions 5 and 6.
- Missing-reason answer by operation (`BUSINESS_REASON_REQUIRED` against `VALIDATION_INVALID_FORMAT`): recorded per operation in `answers` under `curation-reason-required`/`curation-reason-not-blank`.
- Two shapes of `details` for `VALIDATION_INVALID_FORMAT`: recorded in the answers (bare list for the REST query and path, `{ issues }` otherwise).
- REST bare success against MCP `{ ok: true, result }`: recorded in each `accepted`. `curation-transports-answer-alike` holds (same result and same code).
- Metrics 500→503: recorded as the `read-curation-metrics` refusal.
- `merge_into` self-merge not refused by the request shape: the service refuses it (service material). `entity-match-resolution-check-order` states it first.
- `disputed_queue_count` against queue grouping: decision 4.

### Watch items (no concrete case both nodes decide differently)

- `reject-rate-by-code` against `assertion-review-records-curation-action`: the rate reads an error code the rejection never records (empty payload).
- `adjust-periods-outcome`: closed periods that overlap, or overlap with a current non-disputed item, are checked by nothing except the store's uniqueness guard (the answer `BUSINESS_TEMPORAL_INCOHERENT`, "duplicate-guard").
- `corrected-item-values` against `link-validity-ordered`/`attribute-validity-ordered`: a correction that changes only the start can produce a start not before the predecessor's inherited end. `validity-start-before-end` only checks the case where both are stated.
- `curation-request-check-order` (89 words, past p90) was left as is: it is a precedence list, like `attribute-proposal-check-order` (77 words).
- `--shape`: the shared phrases are the specification's idiom (`… is refused at the first check it fails`, `… records one curation action of kind …`). They are not definitions kept twice. No name is held nowhere, and no prose argues.

### `--ledger`

```
$ python3 -B $P/bin/trace.py --ledger siegard-survey/adopt-curation/ledger.md specification
ledger sound: 264 fact line(s) over 2 material file(s) — 246 landed in 104 node(s), 18 left out with a reason
  file set: 19 file(s) the material read; candidates per file:
    src/modules/curation/dto/dispute.dto.ts: 10
    src/modules/curation/dto/entity-match.dto.ts: 7
    src/modules/curation/dto/enums.dto.ts: 9
    src/modules/curation/dto/item.dto.ts: 11
    src/modules/curation/dto/queue.dto.ts: 4
    src/modules/curation/index.ts: 0
    src/modules/curation/mcp/curation-toolset.ts: 3
    src/modules/curation/mcp/curation-transport.ts: 1
    src/modules/curation/mcp/error-envelope.ts: 14
    src/modules/curation/repository/curation.repository.ts: 36
    src/modules/curation/routes/curation.routes.ts: 7
    src/modules/curation/service/dispute.service.ts: 22
    src/modules/curation/service/entity-match.service.ts: 26
    src/modules/curation/service/errors.ts: 1
    src/modules/curation/service/item.service.ts: 25
    src/modules/curation/service/merge.service.ts: 14
    src/modules/curation/service/metrics.service.ts: 3
    src/modules/curation/service/queue.service.ts: 16
    src/modules/curation/service/transaction.ts: 1
  1 file(s) no fact names; an adoption over this ledger hands them no judge and leaves them unbound: src/modules/curation/index.ts
  candidates, all: constraints/curation-is-atomic constraints/curation-reads-are-consistent constraints/curation-transports-answer-alike constraints/llm-toolset-omits-audit-reads constraints/llm-toolset-omits-curation-metrics contracts/knowledge-base/curation domain/knowledge-base/adjusted-period domain/knowledge-base/assertion-correction domain/knowledge-base/assertion-kind domain/knowledge-base/assertion-review domain/knowledge-base/assertion-status domain/knowledge-base/corrected-values domain/knowledge-base/curation-action domain/knowledge-base/curation-action-kind domain/knowledge-base/curation-metrics domain/knowledge-base/curation-target-kind domain/knowledge-base/dispute-decision domain/knowledge-base/dispute-resolution domain/knowledge-base/dispute-scope domain/knowledge-base/entity-match-decision domain/knowledge-base/entity-match-resolution domain/knowledge-base/knowledge-link domain/knowledge-base/merge-counts domain/knowledge-base/node-attribute domain/knowledge-base/node-merge domain/knowledge-base/node-status domain/knowledge-base/review-queue-filter domain/knowledge-base/review-queue-kind domain/knowledge-base/valid-from-basis domain/knowledge-base/value-type rules/knowledge-base/accept-rate rules/knowledge-base/adjust-periods-one-per-item rules/knowledge-base/adjust-periods-outcome rules/knowledge-base/adjusted-periods-single-open rules/knowledge-base/alias-unique-per-node rules/knowledge-base/assertion-review-check-order rules/knowledge-base/assertion-review-records-curation-action rules/knowledge-base/attribute-provenance-once-per-fragment rules/knowledge-base/attribute-value-in-allowed-values rules/knowledge-base/attribute-value-parses rules/knowledge-base/confirmation-activates rules/knowledge-base/confirmation-requires-uncertain rules/knowledge-base/corrected-item-provenance rules/knowledge-base/corrected-item-values rules/knowledge-base/corrected-stated-start-cites-fragment rules/knowledge-base/correction-changes-something rules/knowledge-base/correction-check-order rules/knowledge-base/correction-fits-assertion-kind rules/knowledge-base/correction-fragment-accepted rules/knowledge-base/correction-records-curation-action rules/knowledge-base/correction-supersedes-item rules/knowledge-base/curation-action-time-is-recording-time rules/knowledge-base/curation-reason-not-blank rules/knowledge-base/curation-reason-required rules/knowledge-base/curation-refuses-deleted-node rules/knowledge-base/curation-request-check-order rules/knowledge-base/curation-request-checked-first rules/knowledge-base/dispute-entry-time rules/knowledge-base/dispute-queue-entry rules/knowledge-base/dispute-resolution-check-order rules/knowledge-base/dispute-resolution-distinct-items rules/knowledge-base/dispute-resolution-records-curation-action rules/knowledge-base/dispute-resolution-requires-disputed-items rules/knowledge-base/dispute-resolution-single-scope rules/knowledge-base/dispute-scope rules/knowledge-base/entity-match-queue-entry rules/knowledge-base/entity-match-resolution-check-order rules/knowledge-base/entity-match-resolution-clears-reviews rules/knowledge-base/entity-match-resolution-records-curation-action rules/knowledge-base/entity-match-resolution-requires-pending-review rules/knowledge-base/keep-disputed-changes-nothing rules/knowledge-base/keep-separate-activates-node rules/knowledge-base/link-provenance-once-per-fragment rules/knowledge-base/merge-check-order rules/knowledge-base/merge-compresses-paths rules/knowledge-base/merge-copies-aliases rules/knowledge-base/merge-counts-what-it-changed rules/knowledge-base/merge-into-requires-target rules/knowledge-base/merge-marks-absorbed-merged rules/knowledge-base/merge-repoints-assertions rules/knowledge-base/merge-requires-same-node-type rules/knowledge-base/merge-survivor-active rules/knowledge-base/metrics-assertion-counts rules/knowledge-base/metrics-disputed-queue-count rules/knowledge-base/metrics-review-counts rules/knowledge-base/node-merge-absorbs-active-node rules/knowledge-base/node-merge-records-curation-action rules/knowledge-base/node-never-merged-into-itself rules/knowledge-base/page-defaults rules/knowledge-base/page-limit-bounds rules/knowledge-base/page-offset-non-negative rules/knowledge-base/prefer-one-outcome rules/knowledge-base/prefer-one-requires-winner rules/knowledge-base/refused-curation-records-nothing rules/knowledge-base/reject-rate-by-code rules/knowledge-base/rejection-and-correction-require-live-item rules/knowledge-base/rejection-deletes rules/knowledge-base/review-queue-kinds rules/knowledge-base/review-queue-order rules/knowledge-base/review-queue-page-windows-entries rules/knowledge-base/review-queue-total-before-pagination rules/knowledge-base/stated-start-requires-basis rules/knowledge-base/unused-resolution-fields-ignored rules/knowledge-base/validity-start-before-end
[exit 0]
```

Left out (18), grouped by reason:
- implementation knowledge, storage/locking (`boundary.md` 177, 178, 180–184, 186, 189);
- implementation knowledge, MCP route, registry wiring and published descriptions (`boundary.md` 116, 117, 120);
- a catalog read inside the same context, not an upstream boundary (`service.md` 167, 168; `boundary.md` 191);
- the query that computes the aggregates (`service.md` 172);
- observed and not decided: missing catalog type (`service.md` 62), and an error class no operation raises (`service.md` 151).

The first `--ledger` run passed with no refusal. Two entries were then added (`boundary.md:98` → `knowledge-link`, `boundary.md:99` → `node-attribute`) so that the run-cardinality change is judged, and the command was rerun (output above).

### Validator and projections

```
$ python3 -B $P/bin/spec.py specification
specification sound: 77 element(s), 357 rule(s), 9 scenario(s), 4 contract(s), 15 constraint(s) across 2 context(s); 107 decision(s) disclosed, 2 location(s) retired
$ python3 -B $P/bin/spec.py --project specification
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
```

What this increment may have put the delivered code in breach of: decisions 3–6 and 8 contradict the curation code. The extensions of `attribute-value-*`, `validity-start-before-end`, `stated-start-requires-basis` and `page-defaults`, and the cardinality change, move the hash of nodes bound to ingestion and retrieval files (moved drift, deferred to the end).

Handoff: `/siegard:reconcile` adoption, slug `adopt-curation`, ledger `siegard-survey/adopt-curation/ledger.md` (264 fact lines, 246 landed in 104 nodes, 18 left out; 19 files, `index.ts` with no candidate), outside none, certifications none.

STOP (Step 3). Commit with pathspec `specification siegard-survey/adopt-curation`.

## Step 4 — the adoption

Invoked `/siegard:reconcile` as an adoption: slug `adopt-curation`, ledger `siegard-survey/adopt-curation/ledger.md`, outside none, certifications none. Preconditions held: the curation files and `siegard-trace.json` were clean, the specification was sound, the trace was sound (`336 binding(s), 5 of them decided by a certified test`), and `siegard-reconcile/adopt-curation.md` was free.

Staging line (verbatim):

```
staged adopt-curation: 18 file(s) to judge over 0 node(s); staged as an adoption — 104 candidate node(s) from the ledger, 210 pair(s) over 18 file(s) (36 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 19 file(s) the trace binds nothing to, 18 of them judged over the candidates alone
  manifest and packs at /tmp/tmp.L7XVoqcLZu; candidate index at /tmp/tmp.L7XVoqcLZu/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-curation.returns/<file path with '/' as '__'>.yaml
```

The candidates come from the ledger: 104, over 210 pairs, at most 36 on one file (`curation.repository.ts`). Mechanical tier: none, so step 3b was skipped. Certifications: none. Omitted pairs: 0. `index.ts` is named by no fact, so it got no judge and stays unbound.

Node pack sizes (workspace `/tmp/tmp.L7XVoqcLZu`, not committed):

- `src__modules__curation__dto__dispute.dto.ts.md`: 21009 bytes
- `src__modules__curation__dto__entity-match.dto.ts.md`: 19229 bytes
- `src__modules__curation__dto__enums.dto.ts.md`: 19203 bytes
- `src__modules__curation__dto__item.dto.ts.md`: 21732 bytes
- `src__modules__curation__dto__queue.dto.ts.md`: 2385 bytes
- `src__modules__curation__mcp__curation-toolset.ts.md`: 16613 bytes
- `src__modules__curation__mcp__curation-transport.ts.md`: 1230 bytes
- `src__modules__curation__mcp__error-envelope.ts.md`: 22509 bytes
- `src__modules__curation__repository__curation.repository.ts.md`: 35175 bytes
- `src__modules__curation__routes__curation.routes.ts.md`: 19280 bytes
- `src__modules__curation__service__dispute.service.ts.md`: 28080 bytes
- `src__modules__curation__service__entity-match.service.ts.md`: 30156 bytes
- `src__modules__curation__service__errors.ts.md`: 15768 bytes
- `src__modules__curation__service__item.service.ts.md`: 30342 bytes
- `src__modules__curation__service__merge.service.ts.md`: 22743 bytes
- `src__modules__curation__service__metrics.service.ts.md`: 17229 bytes
- `src__modules__curation__service__queue.service.ts.md`: 23144 bytes
- `src__modules__curation__service__transaction.ts.md`: 15783 bytes

Judges: 18 `siegard:specification-conformance-reviewer` delegations, one per file, all launched in one batch (the harness refused none), plus 1 re-run, for **19 judges**. Each prompt carried absolute paths (the file, the pack and the candidate index as paths), the contract path, and the request for "only the keys the contract defines, at every depth". Returns were saved by script from the last assistant message of each `tasks/<id>.output`, the ```yaml fence stripped and validated against `schemas/conformance-return.json` before being written to `siegard-reconcile/adopt-curation.returns/`. None was retyped.

Returns refused, and why: **1**. The first return for `mcp/curation-toolset.ts` was not valid YAML: a quoted line of code inside a `>-` block started at a shallower indent, and the parser stopped at line 47 on a closing brace ("expected block end"). It was not saved or repaired. A fresh delegation was made with the prompt fixed (every multi-line value as `|-`, every line indented at least as deep as the first), and the second return validated. `--fold` refused nothing.

Premise: title "Adoption of the curation context". The summary says the module is adopted as it stands and did not change. There is one `change` line per file, 19 of them, `index.ts` included.

```
$ python3 -B $P/bin/trace.py --fold backend /tmp/tmp.L7XVoqcLZu /tmp/tmp.L7XVoqcLZu/premise.yaml siegard-reconcile/adopt-curation.md
folded adopt-curation.md: 94 node(s) cleared, 5 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 5 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-curation.md
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-curation.md
adopt-curation.md holds: 19 file(s), 94 node(s) the judgment cleared, 5 it did not, 3 file(s) the trace binds nothing to.
--bind-record will write 94 binding(s) from this record and none for contracts/knowledge-base/curation, domain/knowledge-base/adjusted-period, rules/knowledge-base/dispute-scope, rules/knowledge-base/metrics-disputed-queue-count, rules/knowledge-base/review-queue-page-windows-entries: a node without `encoded_at` is a node this form cannot bind.
$ python3 -B $P/bin/trace.py --bind-record backend specification siegard-reconcile/adopt-curation.md --workspace /tmp/tmp.L7XVoqcLZu
bound constraints/curation-is-atomic to 3 file(s)
bound constraints/curation-reads-are-consistent to 2 file(s)
bound constraints/curation-transports-answer-alike to 3 file(s)
bound constraints/llm-toolset-omits-curation-metrics to 1 file(s)
bound domain/knowledge-base/assertion-correction to 1 file(s)
bound domain/knowledge-base/assertion-kind to 2 file(s)
bound domain/knowledge-base/assertion-review to 1 file(s)
bound domain/knowledge-base/assertion-status to 5 file(s)
bound domain/knowledge-base/corrected-values to 1 file(s)
bound domain/knowledge-base/curation-action to 3 file(s)
bound domain/knowledge-base/curation-metrics to 1 file(s)
bound domain/knowledge-base/curation-target-kind to 2 file(s)
bound domain/knowledge-base/dispute-decision to 2 file(s)
bound domain/knowledge-base/dispute-resolution to 1 file(s)
bound domain/knowledge-base/dispute-scope to 1 file(s)
bound domain/knowledge-base/entity-match-decision to 2 file(s)
bound domain/knowledge-base/entity-match-resolution to 1 file(s)
bound domain/knowledge-base/knowledge-link to 5 file(s)
bound domain/knowledge-base/merge-counts to 1 file(s)
bound domain/knowledge-base/node-attribute to 5 file(s)
bound domain/knowledge-base/node-merge to 1 file(s)
bound domain/knowledge-base/node-status to 6 file(s)
bound domain/knowledge-base/review-queue-filter to 1 file(s)
bound domain/knowledge-base/review-queue-kind to 1 file(s)
bound domain/knowledge-base/valid-from-basis to 9 file(s)
bound domain/knowledge-base/value-type to 6 file(s)
bound rules/knowledge-base/accept-rate to 1 file(s)
bound rules/knowledge-base/adjust-periods-one-per-item to 2 file(s)
bound rules/knowledge-base/adjust-periods-outcome to 2 file(s)
bound rules/knowledge-base/adjusted-periods-single-open to 1 file(s)
bound rules/knowledge-base/alias-unique-per-node to 1 file(s)
bound rules/knowledge-base/assertion-review-check-order to 1 file(s)
bound rules/knowledge-base/assertion-review-records-curation-action to 1 file(s)
bound rules/knowledge-base/attribute-provenance-once-per-fragment to 2 file(s)
bound rules/knowledge-base/attribute-value-in-allowed-values to 4 file(s)
bound rules/knowledge-base/attribute-value-parses to 1 file(s)
bound rules/knowledge-base/confirmation-activates to 2 file(s)
bound rules/knowledge-base/confirmation-requires-uncertain to 2 file(s)
bound rules/knowledge-base/corrected-item-provenance to 2 file(s)
bound rules/knowledge-base/corrected-item-values to 2 file(s)
bound rules/knowledge-base/corrected-stated-start-cites-fragment to 2 file(s)
bound rules/knowledge-base/correction-changes-something to 2 file(s)
bound rules/knowledge-base/correction-check-order to 1 file(s)
bound rules/knowledge-base/correction-fits-assertion-kind to 1 file(s)
bound rules/knowledge-base/correction-fragment-accepted to 1 file(s)
bound rules/knowledge-base/correction-records-curation-action to 1 file(s)
bound rules/knowledge-base/correction-supersedes-item to 2 file(s)
bound rules/knowledge-base/curation-reason-not-blank to 3 file(s)
bound rules/knowledge-base/curation-reason-required to 4 file(s)
bound rules/knowledge-base/curation-refuses-deleted-node to 2 file(s)
bound rules/knowledge-base/curation-request-check-order to 2 file(s)
bound rules/knowledge-base/curation-request-checked-first to 1 file(s)
bound rules/knowledge-base/dispute-resolution-check-order to 1 file(s)
bound rules/knowledge-base/dispute-resolution-distinct-items to 2 file(s)
bound rules/knowledge-base/dispute-resolution-records-curation-action to 1 file(s)
bound rules/knowledge-base/dispute-resolution-requires-disputed-items to 1 file(s)
bound rules/knowledge-base/dispute-resolution-single-scope to 1 file(s)
bound rules/knowledge-base/entity-match-queue-entry to 2 file(s)
bound rules/knowledge-base/entity-match-resolution-check-order to 1 file(s)
bound rules/knowledge-base/entity-match-resolution-clears-reviews to 2 file(s)
bound rules/knowledge-base/entity-match-resolution-records-curation-action to 1 file(s)
bound rules/knowledge-base/entity-match-resolution-requires-pending-review to 2 file(s)
bound rules/knowledge-base/keep-disputed-changes-nothing to 1 file(s)
bound rules/knowledge-base/keep-separate-activates-node to 2 file(s)
bound rules/knowledge-base/link-provenance-once-per-fragment to 2 file(s)
bound rules/knowledge-base/merge-check-order to 1 file(s)
bound rules/knowledge-base/merge-compresses-paths to 2 file(s)
bound rules/knowledge-base/merge-copies-aliases to 1 file(s)
bound rules/knowledge-base/merge-counts-what-it-changed to 1 file(s)
bound rules/knowledge-base/merge-into-requires-target to 3 file(s)
bound rules/knowledge-base/merge-marks-absorbed-merged to 2 file(s)
bound rules/knowledge-base/merge-repoints-assertions to 1 file(s)
bound rules/knowledge-base/merge-requires-same-node-type to 1 file(s)
bound rules/knowledge-base/merge-survivor-active to 1 file(s)
bound rules/knowledge-base/metrics-assertion-counts to 1 file(s)
bound rules/knowledge-base/metrics-review-counts to 1 file(s)
bound rules/knowledge-base/node-merge-absorbs-active-node to 2 file(s)
bound rules/knowledge-base/node-merge-records-curation-action to 1 file(s)
bound rules/knowledge-base/node-never-merged-into-itself to 5 file(s)
bound rules/knowledge-base/page-defaults to 4 file(s)
bound rules/knowledge-base/page-limit-bounds to 4 file(s)
bound rules/knowledge-base/page-offset-non-negative to 6 file(s)
bound rules/knowledge-base/prefer-one-outcome to 2 file(s)
bound rules/knowledge-base/prefer-one-requires-winner to 3 file(s)
bound rules/knowledge-base/refused-curation-records-nothing to 3 file(s)
bound rules/knowledge-base/reject-rate-by-code to 1 file(s)
bound rules/knowledge-base/rejection-and-correction-require-live-item to 2 file(s)
bound rules/knowledge-base/rejection-deletes to 2 file(s)
bound rules/knowledge-base/review-queue-kinds to 1 file(s)
bound rules/knowledge-base/review-queue-order to 2 file(s)
bound rules/knowledge-base/review-queue-total-before-pagination to 2 file(s)
bound rules/knowledge-base/stated-start-requires-basis to 5 file(s)
bound rules/knowledge-base/unused-resolution-fields-ignored to 2 file(s)
bound rules/knowledge-base/validity-start-before-end to 5 file(s)
94 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-curation.md
  5 node(s) of adopt-curation.md the judgment did not clear, and this bind wrote none of them:
    contracts/knowledge-base/curation
    domain/knowledge-base/adjusted-period
    rules/knowledge-base/dispute-scope
    rules/knowledge-base/metrics-disputed-queue-count
    rules/knowledge-base/review-queue-page-windows-entries
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
```

Skill report (summary):
- File set: the 19 non-test files of `src/modules/curation/`. 18 were judged; `index.ts` was not (unbound, no fact names it). `mcp/curation-transport.ts` and `service/transaction.ts` were judged and hold none of their candidates, so they are recorded as unbound too.
- Cleared and bound: **94 nodes**, 94 bindings.
- Not bound: **5 nodes**, all `contradicts`, none collateral:
  - `contracts/knowledge-base/curation`: 3 findings. `dispute.service.ts` emits "decision=prefer_one requires winner_id" and "decision=adjust_periods requires periods[]" without the parenthetical the contract fixes. `errors.ts` `TemporalIncoherentError` carries a message different from the duplicate-guard answer.
  - `domain/knowledge-base/adjusted-period`: `dispute.dto.ts` requires the `valid_from` key (it may be null) and leaves `valid_to` optional; the node declares both optional.
  - `rules/knowledge-base/dispute-scope`: `dispute.service.ts` `assertSameScope` always requires the same target (**decision 3 of the analysis, contrary to the code**).
  - `rules/knowledge-base/metrics-disputed-queue-count`: `curation.repository.ts` counts (source, target, type) (**decision 4, contrary to the code**).
  - `rules/knowledge-base/review-queue-page-windows-entries`: `queue.service.ts` pages each source separately (**decision 5, contrary to the code**).
- `unheld` (5): `constraints/llm-toolset-omits-audit-reads`, `domain/knowledge-base/curation-action-kind`, `rules/knowledge-base/curation-action-time-is-recording-time`, `rules/knowledge-base/dispute-entry-time`, `rules/knowledge-base/dispute-queue-entry`.
- `unstated` (1): `dto/item.dto.ts`, where `corrected.value` has `min(1)` and no node holds it.
- `restates` (51, over 14 files): comments and docstrings citing back-spec BR/UC numbers beside code that holds the fact.
- Candidates opened: 13, across 5 of the 18 delegations.

## Step 5 — what it shows

```
$ trace.py --reconciliation siegard-reconcile/adopt-curation.md
adopt-curation.md holds: 19 file(s), 94 node(s) the judgment cleared, 5 it did not, 3 file(s) the trace binds nothing to.
--bind-record will write 94 binding(s) from this record and none for contracts/knowledge-base/curation, domain/knowledge-base/adjusted-period, rules/knowledge-base/dispute-scope, rules/knowledge-base/metrics-disputed-queue-count, rules/knowledge-base/review-queue-page-windows-entries: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
$ trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts
    rules/knowledge-base/compliance-deletion-tombstones — found against in adopt-compliance-audit.md
    rules/knowledge-base/source-status-active-or-deleted — found against in adopt-compliance-audit.md
  backend/src/modules/compliance-audit/service/compliance-audit.service.ts
    rules/knowledge-base/compliance-deletion-redacts-content — found against in adopt-compliance-audit.md
  backend/src/modules/curation/dto/dispute.dto.ts
    domain/knowledge-base/adjusted-period — found against in adopt-curation.md
  backend/src/modules/curation/repository/curation.repository.ts
    rules/knowledge-base/metrics-disputed-queue-count — found against in adopt-curation.md
  backend/src/modules/curation/service/dispute.service.ts
    contracts/knowledge-base/curation — found against in adopt-curation.md
    rules/knowledge-base/dispute-scope — found against in adopt-curation.md
  backend/src/modules/curation/service/errors.ts
    contracts/knowledge-base/curation — found against in adopt-curation.md
  backend/src/modules/curation/service/queue.service.ts
    rules/knowledge-base/review-queue-page-windows-entries — found against in adopt-curation.md
  backend/src/modules/ingestion/chunker/v1.ts
    rules/knowledge-base/speaker-line — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/index.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-attribute.dto.ts
    domain/knowledge-base/value-type — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-fragment.dto.ts
    rules/knowledge-base/fragment-recorded-proposed — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/propose-fragment.handler.ts
    rules/knowledge-base/tool-call-validation-outcome — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/transport.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v4.ts
    rules/knowledge-base/caller-never-states-received — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/affected-nodes.ts
    rules/knowledge-base/affected-nodes-follow-merges — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/directed-ingestion.service.ts
    domain/knowledge-base/directed-item — found against in adopt-ingestion.md
    rules/knowledge-base/every-proposal-audited — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/graph-consolidation.service.ts
    rules/knowledge-base/reaffirmation-consolidates — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/ingestion.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
    scenarios/knowledge-base/held-content-under-another-model — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/llm-run.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/structural.ts
    rules/knowledge-base/attribute-value-parses — found against in adopt-ingestion.md
    scenarios/knowledge-base/impossible-calendar-date-refused — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/temporal.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/knowledge-graph/dto/enums.dto.ts
    domain/knowledge-base/source-type — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/dto/node.dto.ts
    rules/knowledge-base/page-limit-bounds — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/dto/queries.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/repository/graph.repository.ts
    rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt — found against in adopt-knowledge-graph.md
    rules/knowledge-base/graph-provenance-hides-compliance-deleted — found against in adopt-knowledge-graph.md
    rules/knowledge-base/node-listing-name-prefix — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/service/traversal.service.ts
    rules/knowledge-base/traversal-expands-live-nodes — found against in adopt-knowledge-graph.md
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval-r2.md

45 finding(s) no bind closed, over 34 file(s):
  45 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  45 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

118 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now

125 unstated fact(s) the records name, over 55 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  0001_init.sql — CREATE TABLE attribute_key, column version (line 198): The attribute-key node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE attribute_valid_value, column version (line 217): The allowed-value node lists value, label, sort_order and description, and no version. The catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE link_type, column version (line 169): Same as node_type. The link-type node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE node_type, column version (line 156): A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node lists only name and description. The next reader looks in the specification for what the number means and does not find it. [adopt-database.md]
  0001_init.sql — curation_action.reason comment, line 511: The rule that a reason is required on destructive curation actions is stated only here. The curation-action node declares reason as optional and no rule requires it. The DDL comment is the only place a reader finds it. [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337 and the header line 57: That a merged node must point at an active survivor, with path compression on write, is a domain rule the source states. No node in the specification holds it. The specification has only "names the survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the specification will not look. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_message, line 108: A message's creation time is declared and required here, and the chronological index depends on it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute that orders a conversation's turns is held only in SQL. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_tool_call, line 156: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no such attribute, so the time a tool call was recorded exists only in the table. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.idempotency_key, line 103 (and lines 86-89): The rule that a user message always carries an idempotency key and an assistant message never does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique says only that a conversation holds at most one message per key. The rule about which role carries a key has no home in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.stop_reason, lines 100-102: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one, is stated only in a comment. The column is plain text with no check, and domain/chat/message types stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_tool_call.tool_name, line 138: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string. A reader cannot learn from the specification which tools a chat turn may call. [adopt-database.md]
  0004_chat_persistence.sql — header comment on chat_conversation.title, lines 40-41: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment, which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title as a bare string), and no constraint in this file holds it. The next reader looks for the title's limits in the specification, finds none, and cannot tell whether the BFF or the specification is the authority. [adopt-database.md]
  0006_original_input.sql — Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the database catalog).: The statement says the column is null outside chat. The specification does not say that. The raw-information node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says original_input stays empty for other sources. A reader of the catalog takes this for a decided rule, and the next reader looks for it in the specification and does not find it. [adopt-database.md]
  seeds/0001_seed.sql — section 2, the description column of the 13 link_type rows (lines 43-81): Each link type's required description is catalog text that only this seed holds. The catalog node states label and inverse and stops there, so a reader who looks in the specification finds no description. Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of description names org, projeto and evento as sources, but the rule node also permits Task to Project. The node moving would never reach this text. [adopt-database.md]
  seeds/0001_seed.sql — section 4, the description column of the 16 attribute_key rows (lines 139-170): Attribute key descriptions, including remarks on stability and on how corrections are made, live only in this seed. No node holds them. The event_type description lists three values while the allowed-values node lists nine, so the seed text and the specification already disagree in words nobody governs. [adopt-database.md]
  ... and 110 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

337 place(s) the records name where text in the source restates a node's fact the code holds, over 90 file(s). The pair conforms and none is counted above:
  0001_init.sql — the comment before node_alias_one_canonical_uq, line 371 (rules/knowledge-base/one-canonical-alias) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481 (rules/knowledge-base/attribute-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481, read for links (rules/knowledge-base/link-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment on assertion_status (lines 132-133) and the views banner (lines 529-530) (rules/knowledge-base/effective-status) [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337, and the header line 57 (rules/knowledge-base/merged-node-names-survivor) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_basis_ck, line 402 (rules/knowledge-base/attribute-start-has-basis) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_interval_ck, line 399 (rules/knowledge-base/attribute-validity-ordered) [adopt-database.md]
  0001_init.sql — the header comment lines 58-60 and the comment on raw_information lines 226-228 (rules/knowledge-base/compliance-deletion-tombstones) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — comment above C.3 AttributeKeys, lines 58-60 (rules/knowledge-base/temporal-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count (rules/knowledge-base/catalog-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count (rules/knowledge-base/catalog-node-types) [adopt-database.md]
  seeds/0003_event_type_taxonomy.sql — header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the sort_order note and the totals) (rules/knowledge-base/allowed-event-types) [adopt-database.md]
  src/modules/compliance-audit/dto/compliance-delete.dto.ts — the doc comment above ListComplianceDeletionsQuerySchema, lines 74-79 (rules/knowledge-base/audit-window-ordered) [adopt-compliance-audit.md]
  src/modules/compliance-audit/dto/compliance-delete.dto.ts — the doc comment above ReasonSchema, lines 12-19 (rules/knowledge-base/compliance-deletion-reason-length) [adopt-compliance-audit.md]
  src/modules/compliance-audit/dto/curation-action.dto.ts — the doc comment above CurationActionNameSchema, line 11 (domain/knowledge-base/curation-action-kind) [adopt-compliance-audit.md]
  ... and 322 more; `--all` lists them
  a comment is removed, never refreshed, and the file reconciled after

50 node(s) a refused certification left decided by reading with a testable remainder — the auditor named the assertion that would close each, and a node a certified test decides pays no judge again:
  constraints/ingestion-transports-answer-alike [adopt-ingestion.md]
    would close it: The set of ingestion operations exposed on both transports is finite, and so is the set of refusals each one declares. The remainder is a table: for each shared operation, send one valid input over REST and over MCP and assert the two results are equal. Then, for each refusal that operation declares, send one refusing input over both and assert the two error codes are equal.
    src/modules/ingestion/mcp/propose-link.handler.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/transport.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
    src/modules/ingestion/routes/ingestion.routes.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/affected-nodes-of-a-run [adopt-ingestion.md]
    would close it: Four checks would close the gap: (a) A link proposal whose outcome is that it superseded a previous assertion, and another whose outcome is disputed, each expected to add both linked nodes to the run's list. (b) An attribute proposal whose outcome is that it superseded a previous assertion, expected to add the node it describes. (c) Two proposals whose nodes both lead to the same surviving node, expected to list that node once, where it was first reached. (d) If the fact is meant to include resolving a merged node to the node it was merged into, a merged node expected to appear as that surviving node. Nothing is needed for (d) if the fact is not meant to include that.
    src/modules/ingestion/service/affected-nodes.ts — 4 binding(s) a reading decides on this file
  rules/knowledge-base/attribute-value-in-allowed-values [adopt-ingestion.md]
    would close it: One input against one expected result. Send a proposal, through proposeAttributeService or POST propose-attribute, for a key with allowed values ("proposta", "relatório"). Give it a value that differs from one of them only by case or accent ("Proposta", "relatorio"). Expect a VALIDATION_INVALID_FORMAT refusal with no node_attribute and no provenance written.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/structural.ts — 2 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/below-confidence-floor-records-nothing [adopt-ingestion.md]
    would close it: Three assertions would close it. First, an attribute proposal at a confidence just under 0.40 (e.g. 0.39) comes back rejected and records no node attribute. Second, a link proposal at 0.39 comes back rejected and records no knowledge link. Third, the same proposals at exactly 0.40 are not rejected with BELOW_CONFIDENCE_FLOOR, which pins the floor at 0.40 for both links and attributes.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/validation/confidence.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-excerpt-is-verbatim [adopt-ingestion.md]
    would close it: Feed inputs that take the `email` header/body split, the `chat` speaker split, the `transcricao` turn split and the BR-07 sentence fallback on an oversize block. For every emitted chunk, the expected result is text exactly equal to the code points of the original between offset_start and offset_end. Then store such content as a raw chunk and read it back: the stored excerpt should equal the same slice of the raw content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-index-follows-content [adopt-ingestion.md]
    would close it: One input would close it: content that has several hard-boundary blocks where at least one is over CHUNK_HARD_MAX. The expected result is that the chunks, taken in order of offset_start, carry chunk_index 0, 1, …, n-1 with no gaps. The same check is needed on the raw chunks read back after ingesting that content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/conflict-disputes [adopt-ingestion.md]
    would close it: One input: a proposal on a type that does not allow multiple current assertions, meeting a current assertion (EXISTING_LINK_ID, and separately EXISTING_ATTR_ID) as a dispute. One expected result: the status write sets disputed on that same assertion's id, shown by the UPDATE's bound id and set status or by reading the assertion back, alongside the new disputed row that supersedes nothing.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/consolidation-records-provenance [adopt-ingestion.md]
    would close it: Each open part takes one input and one expected result. First, a taken link proposal that cites two distinct fragments should leave exactly two provenance rows, one per cited fragment, each on the id of the link it landed on. Second, the same check for a taken attribute proposal, with each row on the attribute it landed on. Third, a taken proposal that consolidates onto an existing link or attribute should add one provenance per cited fragment on that existing assertion, not on a new one.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/content-hash-is-sha256 [adopt-ingestion.md]
    would close it: One input against one expected result. Ingest a raw information whose content includes non-ASCII characters, then read it back. Its content_hash should equal a fixed literal: the known 64-character lowercase hexadecimal SHA-256 digest of that content's UTF-8 bytes, computed independently of sha256Hex. A test built this way exists to check the hash and nothing else.
    src/modules/ingestion/dto/ingest-raw-information.dto.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/dto/raw-information.dto.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/hash.ts — 2 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/correction-replaces [adopt-ingestion.md]
    would close it: One input: a proposal with change_hint correction and fragment text with no errata or succession marker, meeting a current assertion. Expected result: the current row closed as superseded, its valid_to untouched, and one new row whose supersedes_*_id is that row's id. Assert this for a link and for an attribute, and if the rule is meant to reach multi-valued types, once for each of those too.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/correction-requires-errata-evidence [adopt-ingestion.md]
    would close it: Each case is one input against one result. A correction whose one cited fragment contains a given word should be accepted, and this should be checked for each of errado, correção, corrigir, correction and correcao. Upper-case and mixed-case forms of at least one word (for example "ERRATA", "Correção") should be accepted. A correction citing several fragments, where exactly one carries a word, should be accepted. A correction citing no fragment should be refused. Each case can be checked at the proposal entry point, so the texts checked are the cited fragments' texts.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/default-prompt-version [adopt-ingestion.md]
    would close it: Input: one document ingestion with no prompt version, with real intake and the extraction orchestrator driven against a fake LLM provider. Expected result: the run it creates records prompt_version "v4", and the system prompt sent to the provider is the v4 system prompt. The same assertion is needed for each other document-ingestion entry point that accepts an omitted prompt version.
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/prompts/index.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/directed-attribute-value-as-text [adopt-ingestion.md]
    would close it: Run directedIngestionService with a directed attribute whose value is the number 30, and a second whose value is the boolean true (and one with false). Expect propose_attribute to receive the value as the strings "30", "true" and "false", checked with a strict type-sensitive equality, not a string interpolation.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dependency-failed [adopt-ingestion.md]
    would close it: Four orchestrator inputs would close it, each with the item reported dependency_failed, its propose handler never called, and the reason naming the expected reference. An attribute whose node and evidence are both missing: the reason names the node. A link whose target is missing and whose source and evidence resolve: the reason names the target. A link whose source, target and evidence are all missing: the reason names the source. A link whose target and evidence are both missing and whose source resolves: the reason names the target. Adding one attribute or link whose reference no item in the payload declares would cover the never-declared case.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dispatch-order [adopt-ingestion.md]
    would close it: Send a directed ingestion with at least two attributes and at least two links, each group in a known order. Expect the attribute proposals, and then the link proposals, in exactly that order. Expect the report to list those attribute and link entries in that same order, after the fragments and nodes. To close the sequencing gap as well, the fragment stubs should settle later than they are called. Then expect that no node proposal starts before every fragment proposal has settled.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  ... and 35 more; `--all` lists them
  each is closed by writing the test named, and the route that writes it is a proof increment: `/deliver-scope`, with an ask naming the proof increment and, per fact to close, the node, the assertion verbatim, the record in brackets and the files above, spelled from the target source root as printed — /plan-work plans one task per fact, /implement-task writes the proof alone, and the review certifies it. Which facts are worth a test is the asker's; name the ones wanted, under a new slug
[exit 1]
$ trace.py --untraced backend
279 tracked file(s) under backend: 103 bound, 176 no binding names
  17 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  159 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
   14  backend/src/modules/chat/service
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    5  backend/src/__tests__/integration/ingestion
    5  backend/src/modules/chat/prompts
    5  backend/src/shared
    3  backend/src
    3  backend/src/__tests__/integration/curation
    3  backend/src/__tests__/integration/knowledge-graph
    3  backend/src/__tests__/unit/compliance-audit
  (21 more directories; --all lists every file)
[exit 0]
$ trace.py --convergence backend specification siegard-work
462 node(s) of specification; 413 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

393 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 13, contract 1, element 62, rule 311, scenario 6
20 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    contract 1, element 10, rule 9
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
49 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 2, element 5, rule 37, scenario 3

files under backend: 279 tracked, 103 bound, 176 no binding names (159 unsurveyed) — `--untraced` lists them

413 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 45 finding(s) past reconciliations left open and no bind closed (45 unseen, 0 covered, 0 reported); 118 pair(s) the records answer both ways; 125 unstated fact(s) the source states and no node holds; 337 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
contracts/knowledge-base/retrieval: bound at sha256:0b56247fe50203561f9d02f09a2c23438a20e28f672cdee5f0fe31ae24eb71c5, now sha256:a7c1c7f87afc4014dd26b0123d83a3f2f8f02b62968a7e1e33928f5620295b67; the specification moved since this bind
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: migrations/0001_init.sql was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: migrations/0001_init.sql was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/curation-action: migrations/0001_init.sql was stamped against sha256:f8a81f093809fc81823674eb275bc00dddf77b03a5b64be86b3682cc61e05802, and the node now reads sha256:7b7ad69429ff158003ea4190e60389bf753ada085b02b81e739fcfeafabecbc3; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/knowledge-graph/dto/link.dto.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: migrations/0001_init.sql was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: migrations/0001_init.sql was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: backend/src/modules/ingestion/mcp/mcp-schemas.ts was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: backend/src/modules/ingestion/service/entity-resolution.service.ts was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: migrations/0001_init.sql was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/knowledge-graph/dto/attribute.dto.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: migrations/0001_init.sql was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: migrations/0001_init.sql was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/validation/structural.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/expansion-depth-bounds: backend/src/modules/query-retrieval/dto/search.dto.ts was stamped against sha256:c90be4b8b02205731105fa5da1f9d4bfb0aea23e554672446187ec7612a22bb2, and the node now reads sha256:4213883f08928cbebf27a3fb3aa4f2b123269baca64f394c90a49de00d6ed8bb; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/expansion-follows-both-directions: bound at sha256:06e75f47f180986db02effb008c7410a3463f65b093581bdd246749309c28179, now sha256:d81793db2914d0f7ab8564178d3f7a7f5735444a3c912ef4ee5da24be48cdc0c; the specification moved since this bind
rules/knowledge-base/expansion-restricted-to-named-link-types: backend/src/modules/query-retrieval/service/search.service.ts was stamped against sha256:df5f24cb388a42206e23cf72c240266adffd178b20c5225c88f35fdc70a31598, and the node now reads sha256:da0037c9836d1c3a27e7a64ade4446bcdb00a7a2ef821118ea20aa1c584565b1; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/name-normalization: backend/src/modules/ingestion/service/entity-resolution.service.ts was stamped against sha256:a8be293bc290dcebf58ed976eca106fca33bfd0e9aaf46e4904bd9ab6fbe6551, and the node now reads sha256:2df4fe9c812499469c011d9fec04df897c6cc4338f11520ca1dc42438a702dfd; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/knowledge-graph/dto/queries.dto.ts was stamped against sha256:09a78d236f2a5770291a5f37b3cb4808421e69ccf89b074f311693c862ccfa8b, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/query-retrieval/dto/fragment.dto.ts was stamped against sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/query-retrieval/dto/search.dto.ts was stamped against sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/validation/temporal.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/unknown-link-type-refused: bound at sha256:b26bdfa836f9b597a12a84d4a1169b114c117a18b0a9a919214be879522c33da, now sha256:d397ade65d61fa6ba1940e735ff39ec423454a3aee415e2fdc17d9cec1cda663; the specification moved since this bind
rules/knowledge-base/validity-start-before-end: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:1a4edaf523b358f51d78aa72212db53a8a16d5ea886f45479fbf19dc10283d60, and the node now reads sha256:1b064abbe915cb2e85132079dea39763dffe669cec6de4a964887a7593aebee3; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/validity-start-before-end: backend/src/modules/ingestion/validation/temporal.ts was stamped against sha256:1a4edaf523b358f51d78aa72212db53a8a16d5ea886f45479fbf19dc10283d60, and the node now reads sha256:1b064abbe915cb2e85132079dea39763dffe669cec6de4a964887a7593aebee3; a later bind restamped the node on other files and nobody read this one against it
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

46 drift finding(s) over 413 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  44 moved: bound to a node whose text moved since the bind, or a file stamped against an earlier text of a node a later bind restamped elsewhere; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

### Count from the record

- **Cleared: 94** (bound). Not cleared: 5.
- **contradicts: 7** findings over 5 nodes (curation contract ×3, adjusted-period, dispute-scope, metrics-disputed-queue-count, review-queue-page-windows-entries). **unstated: 1. restates: 51.**
- **unheld: 5.**

### Where each `unheld` and each `unstated` comes from

- `constraints/llm-toolset-omits-audit-reads` (unheld): **fact outside the areas**. The list of exposed tools, `toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"]`, lives in `src/app.ts` (the `shared` context). Inside the area only a comment states it (`restates`). It is carried to the shared adoption.
- `domain/knowledge-base/curation-action-kind` (unheld): **fact outside the areas**. Curation passes the kinds as literals and declares no enumeration. The closed set lives where the compliance-audit adoption bound it (the audit-listing filter). The ledger lines `service.md:154` and `boundary.md:172` landed there correctly by vocabulary, but no curation file declares the set.
- `rules/knowledge-base/curation-action-time-is-recording-time` (unheld): **fact outside the areas**. The `INSERT` does not set `created_at`; the store's default (migrations, `database` target) produces it.
- `rules/knowledge-base/dispute-entry-time` (unheld): **analysis drop / decision**. The analysis decided "earliest among the items" (decision 7). `queue.service.ts` takes the `recorded_at` of the first row in the group and relies on the repository's order. The judge saw no minimum computed and answered `nowhere`. The code yields the earliest only because rows arrive ordered `recorded_at ASC`, which is in the repository, and the repository's judge was not handed the rule (ledger `service.md:104` only). It is left for the corrections at the end.
- `rules/knowledge-base/dispute-queue-entry` (unheld): **analysis drop**. The ledger attached the rule only to `boundary.md:33/34` (repository, one row per item). The grouping into one entry per scope is in `queue.service.ts` (`service.md:99/100/102`), and those lines went to `dispute-scope` and to the contract, not to this rule. The queue.service judge was therefore not handed it. The fact is in the code (the judge cites `groupDisputedLinks`/`groupDisputedAttributes` under `dispute-scope`).
- `unstated` in `dto/item.dto.ts` (`corrected.value` `min(1)`): **analysis drop**. The survey recorded it (`boundary.md:91`, "`value` (at least 1 character, not trimmed)"), and the ledger landed that line on `domain/knowledge-base/corrected-values`, whose fields do not hold the non-empty requirement. The route is `/analyse`.

Adoption misses not counted as unheld: `curation-action-reason-length` (decision 8, contrary to the code) was not a candidate for any file, so its breach was not judged. The run-cardinality change (`knowledge-link`, `node-attribute`) cleared on the repository.

### Tokens

`telemetry.py --probe --since 2026-09-30T20:19:31Z` reported the transcripts `readable` (1 session). The read was announced (counts, types, tokens, timestamps and command lines, no message text) and the command run; it wrote `siegard-telemetry/20260930T221433Z.json`.

| agent | description | seconds | output tokens | input+cache tokens |
|---|---|---|---|---|
| domain-surveyor | Survey curation service area | 198 | 23102 | 826455 |
| domain-surveyor | Survey curation boundary area | 242 | 21049 | 482744 |
| specification-conformance-reviewer | Judge dispute.dto.ts | 47 | 6314 | 165390 |
| specification-conformance-reviewer | Judge entity-match.dto.ts | 31 | 4382 | 68317 |
| specification-conformance-reviewer | Judge enums.dto.ts | 20 | 2849 | 111100 |
| specification-conformance-reviewer | Judge item.dto.ts | 72 | 10123 | 176214 |
| specification-conformance-reviewer | Judge queue.dto.ts | 16 | 1758 | 168181 |
| specification-conformance-reviewer | Judge curation-toolset.ts | 40 | 5505 | 184126 |
| specification-conformance-reviewer | Judge curation-transport.ts | 15 | 1808 | 129606 |
| specification-conformance-reviewer | Judge error-envelope.ts | 37 | 5890 | 72489 |
| specification-conformance-reviewer | Judge curation.repository.ts | 106 | 17074 | 136767 |
| specification-conformance-reviewer | Judge curation.routes.ts | 27 | 3839 | 72726 |
| specification-conformance-reviewer | Judge dispute.service.ts | 62 | 9457 | 75784 |
| specification-conformance-reviewer | Judge entity-match.service.ts | 55 | 8601 | 75290 |
| specification-conformance-reviewer | Judge errors.ts | 14 | 1676 | 66486 |
| specification-conformance-reviewer | Judge item.service.ts | 59 | 9236 | 132199 |
| specification-conformance-reviewer | Judge merge.service.ts | 48 | 7389 | 71452 |
| specification-conformance-reviewer | Judge metrics.service.ts | 19 | 2533 | 67948 |
| specification-conformance-reviewer | Judge queue.service.ts | 45 | 6458 | 72705 |
| specification-conformance-reviewer | Judge transaction.ts | 7 | 697 | 65597 |
| specification-conformance-reviewer | Re-judge curation-toolset.ts | 37 | 5219 | 184535 |

Judges: 19 delegations over 18 judged files (one re-run). Mean per judged file (sum of all judge delegations / 18): output 6156, input+cache 116495.
Agent totals: {'by_type': {'domain-surveyor': {'invocations': 2, 'with_transcript': 2, 'duration_seconds': 439.874, 'usage': {'input_tokens': 34, 'cache_creation_input_tokens': 201319, 'cache_read_input_tokens': 1107846, 'output_tokens': 44151}}, 'specification-conformance-reviewer': {'invocations': 19, 'with_transcript': 19, 'duration_seconds': 755.912, 'usage': {'input_tokens': 108, 'cache_creation_input_tokens': 748527, 'cache_read_input_tokens': 1348277, 'output_tokens': 110808}}}, 'overall': {'invocations': 21, 'with_transcript': 21, 'duration_seconds': 1195.786, 'usage': {'input_tokens': 142, 'cache_creation_input_tokens': 949846, 'cache_read_input_tokens': 2456123, 'output_tokens': 154959}}}

The analysis (Step 3) ran inline in the orchestrating session with no subagent. Its cost is inside the session's **95 043 output tokens** (the telemetry does not separate it from the orchestration). Surveyors: service 23 102 output tokens and boundary 21 049 (44 151 together). `--untraced` after: `279 tracked file(s) under backend: 103 bound, 176 no binding names` (it was 88 bound).

## Step 6 — stop

STOP (Step 6). Review and commit with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-curation siegard-telemetry`.
