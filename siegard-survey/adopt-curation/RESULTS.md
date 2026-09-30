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
