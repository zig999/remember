---
contract_version: siegard-reconcile/8
title: Drift item 6 - transport, retrieval errors, curation queue, chat v2 prompt and audit repository
summary: The files named here did not change after the nodes moved; the owner states the behavior is correct.
target: backend
files:
- path: src/mcp/sdk-http-transport.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/prompts/v2.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/curation/mcp/error-envelope.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/curation/service/queue.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/query-retrieval/service/errors.ts
  change: unchanged; read against the nodes as they now stand
nodes:
- node: constraints/mcp-endpoint-serves-only-its-toolset
  conforms: true
  how: 'src/mcp/sdk-http-transport.ts: held at the `handler === undefined` branch inside the CallToolRequestSchema
    handler of buildConfiguredMcpServer (lines 122-131) — if (handler === undefined) { return toCallToolResult({
    ok: false, error: { code: "NOT_FOUND", message: `Tool ''${req.params.name}'' is not available on this
    endpoint.`, }, }); } — toCallToolResult returns isError: true. The tool lookup uses a Map built only
    from opts.tools, so the toolset is closed.'
  encoded_at:
  - src/mcp/sdk-http-transport.ts
- node: contracts/knowledge-base/retrieval
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, InvalidSearchQueryError, the `empty_after_trim`
    reason and its message (lines 4, 8, 14-15), under the fixed `code = "BUSINESS_INVALID_SEARCH_QUERY"`
    (line 3): public readonly code = "BUSINESS_INVALID_SEARCH_QUERY" as const; public readonly reason:
    "empty_after_trim" | "empty_after_parse" | "too_long"; : reason === "empty_after_trim" ? "query is
    empty after trim" — The class lets a blank query (empty after trim) be refused as BUSINESS_INVALID_SEARCH_QUERY.
    The contract answers a blank query with VALIDATION_INVALID_FORMAT (rules/knowledge-base/search-query-not-blank)
    and reserves BUSINESS_INVALID_SEARCH_QUERY for the rule that a query must parse. The error-envelope
    mapper renders whatever code the class carries. A caller that throws this reason would therefore answer
    a blank query with a code the specification gives to a different refusal. In production code only
    `empty_after_parse` is thrown today, and `empty_after_trim` is reached only through the type, so the
    divergence is latent.

    src/modules/query-retrieval/service/errors.ts, InvalidSearchQueryError, the `too_long` reason and
    its message (lines 4, 8, 16), under the fixed `code = "BUSINESS_INVALID_SEARCH_QUERY"` (line 3): public
    readonly code = "BUSINESS_INVALID_SEARCH_QUERY" as const; : "query exceeds 1000 characters" — The
    class lets an over-length query be refused as BUSINESS_INVALID_SEARCH_QUERY with 422. The contract
    answers an over-length query with VALIDATION_INVALID_FORMAT (rules/knowledge-base/search-query-length).
    The error-envelope spec already exercises this path (`new InvalidSearchQueryError("too_long", { length:
    1234 })`) and maps it to the business code. A reader who trusts that mapping would believe the business
    code is the decided answer to over-length queries, when the contract decided otherwise.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at The union type
    on the `status` field of RawInformationLockedRow (line 23), which declares the four values of the
    enumeration for raw_information, in the database''s snake_case spelling. — readonly status: "active"
    | "needs_review" | "merged" | "deleted";'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/chat/chat-prompt-carries-marker
  conforms: true
  how: 'src/modules/chat/prompts/v2.ts: held at the final statement of system(), line 84, where the composed
    prompt is returned with v1''s body first. The marker text itself is declared in "./v1.js", outside
    this file. — const v1Body = v1System(catalog); ... return [v1Body, ...v2Additions].join("\n");  and  export
    { CHAT_PROMPT_MARKER_V1 } from "./v1.js";'
  encoded_at:
  - src/modules/chat/prompts/v2.ts
- node: rules/knowledge-base/curation-action-time-is-recording-time
  conforms: false
  how: 'no named file holds this fact now: src/modules/compliance-audit/repository/compliance-audit.repository.ts
    read `nowhere` — insertCurationAction names no time column: `INSERT INTO curation_action (action,
    target_kind, target_id, payload, reason)`. It reads the time back with `RETURNING id, action, target_kind,
    target_id, payload, reason, created_at`. The file never sets created_at. The value comes from the
    column default in migrations/0001_init.sql (`created_at  timestamptz NOT NULL DEFAULT now()`), which
    is outside this file.'
  observed_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/curation-reason-not-blank
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/mcp/error-envelope.ts read `nowhere` —
    The file only maps already-raised errors to envelopes. Its one touch on reasons is the emitted message
    `case "BUSINESS_REASON_REQUIRED": return "reason is required for the requested operation";`. It has
    no trim, no length test and no schema declaring the reason. The invariant is enforced where the request
    schema is declared, not here.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/deletion-execution-time-is-recording-time
  conforms: false
  how: 'no named file holds this fact now: src/modules/compliance-audit/repository/compliance-audit.repository.ts
    read `nowhere` — insertComplianceDeletion names no time column: `INSERT INTO compliance_deletion (raw_information_id,
    reason, affected)`. It reads the time back with `RETURNING id, raw_information_id, reason, executed_at,
    affected`. The file never sets executed_at. The value comes from the column default in migrations/0001_init.sql
    (`executed_at timestamptz NOT NULL DEFAULT now()`), which is outside this file.'
  observed_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/dispute-resolution-distinct-items
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/mcp/error-envelope.ts read `nowhere` —
    No check of an item count or of duplicate item ids appears in the file. A failure of this rule can
    only reach `mapZodError` as an ordinary issue, and so falls to the default branch `return mapped(422,
    "warn", { code: "VALIDATION_INVALID_FORMAT", message: "Request payload failed validation.", ...`.
    The "at least two, none twice" condition is not stated here.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: true
  how: 'src/modules/curation/service/queue.service.ts: held at the `total` accumulation in listReviewQueueService,
    lines 90-108. The counts are taken by separate count queries that take no limit or offset. — total
    += await countEntityMatchQueue(client); total += await countDisputedLinks(client); total += await
    countDisputedAttributes(client); return { total, limit, offset, items }; The repository counts are
    `SELECT count(*)::text AS total FROM knowledge_node WHERE status = ''needs_review''`, `... FROM knowledge_link
    WHERE status = ''disputed''` and `... FROM node_attribute WHERE status = ''disputed''`. Each disputed
    row is counted once and nothing is cut by the page. The count calls sit inside the same `kind ===
    undefined || kind === ...` guards as the lists, so only the kinds listed are counted.'
  encoded_at:
  - src/modules/curation/service/queue.service.ts
unstated:
- file: src/modules/chat/prompts/v2.ts
  where: the v2Additions array, item 1 of the emitted prompt, lines 66-69
  evidence: '"1. CHAME `start_async_ingestion` SOMENTE quando o dono pedir", "   EXPLICITAMENTE para ingerir
    um documento — sinais tipicos sao", "   frases como \"ingerir\", \"salvar este documento\", \"registrar",
    "   este texto\"."'
  cost: The prompt names three phrases ("ingerir", "salvar este documento", "registrar este texto") as
    typical signals of an explicit request to ingest. No node holds this list for v2. The only node that
    names phrases is the v4 one, and it names four different ones. The list is behavior only this file
    states, so the next reader will not find it in the specification.
- file: src/modules/chat/prompts/v2.ts
  where: the v2Additions array, opening lines of the emitted section, lines 60-64
  evidence: '"Se elas", "nao aparecerem no catalogo, ignore esta secao — significa que a", "capacidade
    de ingestao via chat esta desligada nesta instalacao."'
  cost: The prompt tells the assistant to ignore the whole ingestion section when the ingestion tools
    are absent from the catalog. It also tells it the cause is that ingestion is turned off. No node holds
    either instruction. rules/chat/directed-ingestion-disabled-by-default states the disabled state, not
    this prompt behavior.
restates:
- file: src/mcp/sdk-http-transport.ts
  where: the doc comment of buildConfiguredMcpServer (lines 100-101) and the doc comment of mountMcpEndpoint
    (lines 141-142)
  evidence: "\" *  - `tools/call` looks the name up in the closed set; unknown names yield a\n *    `NOT_FOUND`\
    \ isError result mapped via {@link toMcpToolResult}.\" and\n\" and dispatchable; any other name yields\
    \ a NOT_FOUND isError result.\""
  cost: The rule that a tool outside the endpoint's toolset answers NOT_FOUND is also written as prose
    in two doc comments. The code that holds it is the `handler === undefined` branch in this same file.
    If the node moves, nothing binds the comments, so they can drift without notice. A reader may also
    take them for where the rule was decided.
  node: constraints/mcp-endpoint-serves-only-its-toolset
- file: src/modules/chat/prompts/v2.ts
  where: the header comment and the docstring of system(), lines 1-25 and 40-49
  evidence: '"The marker token is inherited from v1 (planted by `v1System()` at the head of the body)
    — v2 does NOT re-plant it." and "BR-20''s guard is STABLE across prompt versions"'
  cost: The fact that every chat prompt version begins with the one marker is stated a second time in
    prose beside the code that carries it. The next reader may take the comment as where the rule lives,
    and the comment will not follow if the node moves.
  node: rules/chat/chat-prompt-carries-marker
- file: src/modules/curation/service/queue.service.ts
  where: the comment block at the top of groupDisputedLinks, lines 155-168
  evidence: '// Group by the CONFLICT SCOPE, which depends on the link type''s cardinality // (A10, link_type.allows_multiple_current):
    //   - FUNCTIONAL (allows_multiple_current=false, ...): ... so the scope is (source, link_type) —
    target EXCLUDED, scope.target null. //   - MULTI-VALUED (allows_multiple_current=true): ... the target
    is part of the scope.'
  cost: The dispute-scope rule is restated in prose beside the code that implements it (the `functional`
    ternary in `key` and in `target_node_id`). If the node moves, the comment keeps asserting the old
    scope and nothing flags it.
  node: rules/knowledge-base/dispute-scope
- file: src/modules/curation/service/queue.service.ts
  where: the comment block opening the file, lines 1-9
  evidence: '// Two queues are surfaced (ADR A26 / spec §10.1): //   - entity_match: knowledge_node rows
    with status=''needs_review'', //   - disputed:     knowledge_link / node_attribute rows with status=''disputed'',
    //                   grouped by conflict scope.'
  cost: The header says in prose that the disputed queue is grouped by scope. The same fact is held in
    the node and in the code of groupDisputedLinks and groupDisputedAttributes below. A reader looking
    for what the queue holds finds a third statement of it, citing a spec section number that is not a
    node identity.
  node: rules/knowledge-base/dispute-queue-entry
pairs_omitted:
- node: rules/chat/chat-prompt-v2-ingestion-returns-running
  file: src/modules/chat/prompts/v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v2-no-content-echo
  file: src/modules/chat/prompts/v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v2-no-status-polling
  file: src/modules/chat/prompts/v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-filters-match-exactly
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-accepts-open-window
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-order
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-total-before-pagination
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-window-half-open
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-flags-metadata
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-keeps-content-hash
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-propagates
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-one-per-item
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-stated-start-cites-fragment
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-changes-something
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-request-check-order
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-into-requires-target
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-requires-winner
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-reads-are-consistent
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-kind
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/dispute-scope
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-queue-entry
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/review-queue-kinds
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/review-queue-order
  file: src/modules/curation/service/queue.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/empty-provenance-chain-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-layer-outside-set-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-length
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-must-parse
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 6 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-drift-item6.returns/.

  A finding in src/modules/compliance-audit/repository/compliance-audit.repository.ts names rules/knowledge-base/source-status-active-or-deleted,
  which no file of this set is bound to: RawInformationLockedRow, the `status` field of the interface
  (line 23): readonly status: "active" | "needs_review" | "merged" | "deleted"; — The row type that loadRawInformationForUpdate
  returns for a raw_information row admits needs_review and merged. The specification holds that a raw
  information is only ever active or deleted, and its decision log records that typing it with all four
  node statuses was the mistake corrected. A reader of this type sees four states for a source, and a
  branch on "needs_review" or "merged" for a raw would look legitimate here when no node gives either
  state a meaning for a source.. It blocks nothing here; it is owed a route of its own.

  Candidates: 6 opened across 3 of 6 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 2 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 4 place(s) where text in the source restates a node''s fact the code holds, over 3 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-drift-item6.returns/`, which are the evidence behind every entry above.
