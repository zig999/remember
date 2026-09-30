# adopt-chat — RESULTS

Runbook: `siegard-survey/RUNBOOK-adopt-context.md`. Plugin root `P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.28.0`.

Start instant: `2026-09-30T22:23:06Z`

Authorization: the owner said "Siga para o próximo contexto" after curation; this run takes the same terms as the curation invocation — commit at each STOP with the runbook's pathspec, continue through the end of Step 6.

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
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/spec.py specification
specification sound: 77 element(s), 357 rule(s), 9 scenario(s), 4 contract(s), 15 constraint(s) across 2 context(s); 107 decision(s) disclosed, 2 location(s) retired
[exit 0]
```

Result: version 4.28.0; `git status` printed nothing; specification sound. Preconditions hold.

`--untraced` line recorded: `279 tracked file(s) under backend: 103 bound, 176 no binding names` (17 holds-nothing, 0 outside, 159 unsurveyed).


## Step 2 — the survey

Areas (`git ls-files`, tests excluded; every non-test file of the module is in exactly one area — no file outside the areas):

- `service`: src/modules/chat/service/{args-summary,chat-agent.service,context-builder,conversation.service,datetime-block,distillation.service,errors,graph-normalizer,message-sequence,output-guard,tool-catalog,truncate-tool-result,turn-registry,types}.ts (14 files)
- `prompts`: src/modules/chat/prompts/{index,v1,v2,v3,v4}.ts, src/modules/chat/prompts/chat-summary/{index,v1,v2}.ts (8 files)
- `boundary`: src/modules/chat/index.ts, src/modules/chat/repository/chat.repository.ts, src/modules/chat/routes/chat.schemas.ts, src/modules/chat/routes/conversations.routes.ts (4 files)

Delegation: three `siegard:domain-surveyor` agents in parallel. Each was handed the target source root, its area's file list, target `backend`, the digest as a file path (`/tmp/chat-digest.txt`, `spec.py --digest specification`, 55 616 bytes), the request to cite the names a caller reads, and the YAML-string warning for `read_outside_area`. Returns were saved by script (`/tmp/chat/save_survey.py`) from the last assistant message of each agent's `tasks/<id>.output` JSONL (all three unfenced; no edit). No surveyor was refused, and none was re-run.

Surveyor usage (from the task notifications): service 152 512 tokens, 17 tool uses, 226 s; prompts 105 389 tokens, 14 tool uses, 154 s; boundary 143 019 tokens, 17 tool uses, 222 s.

`--untraced` before this survey: `279 tracked file(s) under backend: 103 bound, 176 no binding names` (17 holds-nothing, 0 outside, 159 unsurveyed).

```
$ python3 -B $P/bin/trace.py --survey siegard-survey/adopt-chat/service.md siegard-survey/adopt-chat/prompts.md siegard-survey/adopt-chat/boundary.md
siegard-survey/adopt-chat/service.md: 146 fact line(s) over 14 file(s) — Facts 96, Answers 25, Vocabularies 15, Upstream artifacts 10
siegard-survey/adopt-chat/prompts.md: 83 fact line(s) over 8 file(s) — Facts 69, Answers 2, Vocabularies 5, Upstream artifacts 7
siegard-survey/adopt-chat/boundary.md: 134 fact line(s) over 4 file(s) — Facts 88, Answers 28, Vocabularies 9, Upstream artifacts 9
  1 file(s) no fact names: src/modules/chat/index.ts
[exit 0]
```

`src/modules/chat/index.ts` is named by no fact (the boundary surveyor filed it under "Outside the domain" as the module's re-export surface). It is carried to the analysis as a finding.

### Observed and not decided here (gathered)

service:

- On a malformed tool result, graph projection answers two ways. `traverse`, `get_node`, `list_nodes` and `search` return an empty delta `{ source_tool, nodes: [], links: [] }` (`src/modules/chat/service/graph-normalizer.ts`, `normalizeTraverse`/`normalizeGetNode`/`normalizeListNodes`/`normalizeSearch`). `ingest_directed` returns `null`, which means no delta (`src/modules/chat/service/graph-normalizer.ts`, `normalizeIngestDirected`, `if (!isRecord(result)) return null`).
- The argument summary and the catalog disagree on ingestion tools. The summary formats `start_async_ingestion` (`source_type=… content_len=…`) and `get_ingestion_status` (`llm_run_id=…`) (`src/modules/chat/service/args-summary.ts`, `formatByTool`). The chat catalog offers only `ingest_directed` for ingestion (`src/modules/chat/service/tool-catalog.ts`, `CHAT_INGEST_TOOL_NAMES`), and the summary has no case for it, so it falls to `<n> keys` (`src/modules/chat/service/args-summary.ts`, `default` → `fallbackSummary`).
- "Characters" are counted two ways. The argument summary cap (200) and tool-result truncation (`TOOL_RESULT_MAX_CHARS`) count Unicode code points (`src/modules/chat/service/args-summary.ts`, `clampToMax`; `src/modules/chat/service/truncate-tool-result.ts`, `[...input]`). The rolling-summary cap (2000) and the title cap (80) use the string's `.length`, which counts UTF-16 code units (`src/modules/chat/service/distillation.service.ts`, `summary_new.length > SUMMARY_MAX_CHARS`, `candidate.length > TITLE_MAX_LENGTH`).

prompts:

- The v4 prompt tells the assistant that the ontology block marks temporal items: "a ontologia acima indica `is_temporal: true` ou `requires_valid_from: true`" (`src/modules/chat/prompts/v4.ts`, `BLOCK_4C_DIRECTED_INGESTION` step 3). The ontology block v4 renders prints only `- <name>: <description> [<Source> -> <Target>; ...]` for link types and `- <NodeType>.<key> (<value_type>): <description> [dominio fechado: ...]` for attribute keys, with no temporal or start-requirement marking (`src/modules/chat/prompts/v3.ts`, `renderOntologyBlock`).
- Two rolling summary system texts exist side by side. `selectSummaryPromptModule()` returns the "compactador de conversas" text, identical to rolling summary `v1` (`src/modules/chat/prompts/index.ts`, `selectSummaryPromptModule`; `src/modules/chat/prompts/chat-summary/v1.ts`, `system`). The rolling summary registry defaults to `v2`, the "Sintetizador da conversa do Remember" text with a two-input fold (`src/modules/chat/prompts/chat-summary/index.ts`, `DEFAULT_CHAT_SUMMARY_PROMPT_VERSION`; `src/modules/chat/prompts/chat-summary/v2.ts`, `system`).
- A `tool_result` block without `content` goes through `JSON.stringify(undefined)`, which returns `undefined` rather than a string, and renders as `tool_result(<id>): undefined` (`src/modules/chat/prompts/chat-summary/v2.ts`, `serialiseToolResultContent`). The function's own fallback for content it cannot render is `<unserialisable>` (`src/modules/chat/prompts/chat-summary/v2.ts`, `serialiseToolResultContent`).

boundary:

- A PATCH with neither `title` nor `archived_at` gets two different answers. An empty body answers 422 `VALIDATION_REQUIRED_FIELD` (`src/modules/chat/routes/conversations.routes.ts`, BR-36 step 1 branch). A non-empty body lacking both, such as one with only unknown keys, answers 422 `VALIDATION_INVALID_FORMAT` through the schema refine (`src/modules/chat/routes/chat.schemas.ts`, `UpdateConversationRequest.refine`).
- Message pagination points two ways. The page is the oldest `limit` display messages, ascending (`src/modules/chat/repository/chat.repository.ts`, `listMessagesPaginated` — `ORDER BY created_at ASC ... LIMIT`), so `hasMore` means newer messages exist. But `next_before` is the page's oldest `created_at` and `before` selects strictly older messages (`src/modules/chat/routes/conversations.routes.ts`, `nextBefore`), so following it from the first page returns nothing.
- Archived conversations are treated differently across operations. sendMessage and cancelTurn refuse with 409 `BUSINESS_CONVERSATION_ARCHIVED` (`src/modules/chat/routes/conversations.routes.ts`, steps (5) and cancel). saveConversationGraph, a write, accepts an archived conversation (`src/modules/chat/routes/conversations.routes.ts`, `scoped.put("/:id/graph")`).
- The kill switch has different precedence. On every other operation it comes before any validation (`src/modules/chat/routes/conversations.routes.ts`, `killSwitchTripped` first). On sendMessage a bad `Idempotency-Key`, `:id` or body answers 422 even while chat is disabled (`src/modules/chat/routes/conversations.routes.ts`, steps (1)–(3)).
- "Messages" counts different things. Usage `messages` counts every row, including intermediate tool-use and synthetic tool-result messages (`src/modules/chat/repository/chat.repository.ts`, `getConversationUsage`). The message listing shows only real user turns and terminal answers (`src/modules/chat/repository/chat.repository.ts`, `listMessagesPaginated` — `displayFilter`).
- A failed turn looks different on replay. Live, it ends with an `error` frame (`src/modules/chat/routes/conversations.routes.ts`, `projectSseFrame` `error`) and is stored as `provider_error`/`internal_error`. Replayed under the same key, it streams `done` with `stop_reason: "end_turn"` (`src/modules/chat/routes/conversations.routes.ts`, `mapStoredStopReason`).
- Two cursor faults get different answers. A cursor that is not `{ created_at, id }` answers 422 `VALIDATION_INVALID_FORMAT` with `details.param = "cursor"` (`src/modules/chat/routes/conversations.routes.ts`, `InvalidCursorError` branch). A cursor with that shape but a non-timestamp `created_at` or non-UUID `id` reaches the database cast and answers 500 `SYSTEM_INTERNAL_ERROR` (`src/modules/chat/repository/chat.repository.ts`, `listConversations`).

### read_outside_area (gathered)

service: (none)

prompts:
  - "/home/siegfriedneto/projects/eternal/specification/domain/chat/conversation.md (opened to name the conversation's title and rolling_summary the way the specification does)"
  - "/home/siegfriedneto/projects/eternal/specification/domain/chat/message-role.md (opened to name the message roles user and assistant the way the specification does)"

boundary:
  - "src/modules/chat/service/errors.ts — the HTTP status and code behind each chat sentinel error the routes answer through mapChatError"
  - "src/modules/chat/service/conversation.service.ts — how decodeCursor and encodeCursor build and refuse the listConversations cursor (InvalidCursorError)"
  - "src/middleware/error-handler.ts — what a thrown ZodError, a pg error or any other uncaught error becomes on the wire (classify)"
  - "src/shared/error-mapping.ts — the message text of the SYSTEM_SERVICE_UNAVAILABLE and SYSTEM_INTERNAL_ERROR envelopes"
  - "src/modules/chat/service/types.ts — the DoneStopReason union and the error-event synthetic_stop_reason the route resolves"
  - "src/modules/chat/service/tool-catalog.ts — the CHAT_TOOL_NAMES and CHAT_INGEST_TOOL_NAMES lists index.ts re-exports and the route probes"
  - "src/app.ts — the prefix the chat routes are mounted under (/api/v1 then /conversations)"

Handoff: `/siegard:analyse` with project root `/home/siegfriedneto/projects/eternal`, material `siegard-survey/adopt-chat/service.md`, `siegard-survey/adopt-chat/prompts.md`, `siegard-survey/adopt-chat/boundary.md`.

STOP (Step 2) — material read by the orchestrator; the owner's authorization carries the run on to Step 3.

## Step 3 — the analysis

`/siegard:analyse` run inline in the orchestrating session over the three material files, project root `/home/siegfriedneto/projects/eternal`. Helper scripts: `/tmp/chat/domain.py`, `rules.py`, `contract.py`, `decisions.py`, `ledger.py` (all writes through `lib.py`, YAML-dumped; the decision log appended as text so no existing entry was re-serialized).

Situate: `spec.py specification` sound before writing (77 elements, 357 rules, 4 contracts, 15 constraints, 107 decisions — Step 1). Impact set read: `domain/chat/*` (context, conversation, message, message-role, tool-call, graph-view), `rules/chat/message-idempotency-key-unique`, `rules/chat/tool-call-outlives-its-message`, every `constraints/*` node (15), `rules/knowledge-base/directed-*` (turn-is-original-input, item-status), `rules/knowledge-base/prompt-version-known`, `default-prompt-version`, `domain/knowledge-base/link-type`, `node-status`, `assertion-flag`, `directed-item-status`, `contracts/knowledge-base/curation` (as the shape of an api contract), and the decision-log entries locating `domain/chat/*`.

### Nodes created (92)

- elements (12): `domain/chat/assistant-stop-reason`, `domain/chat/chat-prompt-version`, `domain/chat/conversation-listing`, `domain/chat/conversation-usage`, `domain/chat/graph-delta`, `domain/chat/graph-delta-link`, `domain/chat/graph-delta-node`, `domain/chat/graph-layout`, `domain/chat/message-listing`, `domain/chat/summary-prompt-version`, `domain/chat/turn`, `domain/chat/turn-event-kind`
- rules (76): `rules/chat/archived-conversation-takes-no-turn`, `rules/chat/assistant-answer-recorded`, `rules/chat/assistant-answers-in-portuguese`, `rules/chat/assistant-states-uncertainty`, `rules/chat/assistant-text-withholds-system-prompt`, `rules/chat/assistant-withholds-internals`, `rules/chat/assistant-writes-only-on-owner-request`, `rules/chat/cancel-requires-turn-in-flight`, `rules/chat/chat-prompt-carries-marker`, `rules/chat/chat-prompt-presents-catalog`, `rules/chat/chat-prompt-version-known`, `rules/chat/chat-toolset-requires-every-query-tool`, `rules/chat/conversation-archived`, `rules/chat/conversation-listing-excludes-archived`, `rules/chat/conversation-listing-limit`, `rules/chat/conversation-listing-order`, `rules/chat/conversation-request-check-order`, `rules/chat/conversation-title-length`, `rules/chat/conversation-update-names-a-field`, `rules/chat/conversation-update-partial`, `rules/chat/conversation-usage-counts`, `rules/chat/default-chat-prompt-version`, `rules/chat/default-summary-prompt-version`, `rules/chat/distillation-failure-changes-nothing`, `rules/chat/distillation-follows-live-turn`, `rules/chat/distilled-title-length`, `rules/chat/distilled-title-never-overwrites`, `rules/chat/graph-delta-content`, `rules/chat/graph-delta-directed-links`, `rules/chat/graph-delta-directed-nodes-active`, `rules/chat/graph-delta-drops-incomplete`, `rules/chat/graph-delta-follows-tool-result`, `rules/chat/graph-delta-link-temporal`, `rules/chat/graph-delta-unreadable-result`, `rules/chat/graph-view-replaced-on-save`, `rules/chat/graph-view-snapshot-bounds`, `rules/chat/idempotency-match`, `rules/chat/idempotent-recovery`, `rules/chat/idempotent-replay`, `rules/chat/iteration-recorded`, `rules/chat/message-listing-limit`, `rules/chat/message-listing-pages-backwards`, `rules/chat/message-listing-shows-exchanges`, `rules/chat/model-context-owner-time`, `rules/chat/model-context-rolling-summary`, `rules/chat/model-context-well-formed`, `rules/chat/model-context-window`, `rules/chat/one-turn-in-flight`, `rules/chat/owner-message-recorded-first`, `rules/chat/owner-written-message`, `rules/chat/recording-failure-keeps-stream`, `rules/chat/replay-reports-failure`, `rules/chat/rolling-summary-folds`, `rules/chat/rolling-summary-length`, `rules/chat/rolling-summary-overlap`, `rules/chat/rolling-summary-refresh`, `rules/chat/send-message-check-order`, `rules/chat/summary-prompt-version-known`, `rules/chat/title-distillation`, `rules/chat/tool-call-recorded`, `rules/chat/tool-failure-continues-turn`, `rules/chat/tool-invocation-carries-turn`, `rules/chat/tool-result-truncated`, `rules/chat/tool-start-summary-bounded`, `rules/chat/turn-cancel`, `rules/chat/turn-ending-message`, `rules/chat/turn-ends-once`, `rules/chat/turn-failure-stop-reason`, `rules/chat/turn-limit-before-cancel`, `rules/chat/turn-model-call-limit`, `rules/chat/turn-model-default`, `rules/chat/turn-model-stop-reason`, `rules/chat/turn-one-tool-at-a-time`, `rules/chat/turn-reports-last-model`, `rules/chat/turn-time-limit`, `rules/chat/turn-tokens-summed`
- contract (1): `contracts/chat/conversations` (11 operations: create-conversation, list-conversations, read-conversation, update-conversation, delete-conversation, send-message, list-messages, read-conversation-usage, read-graph-view, save-graph-view, cancel-turn; REST alone)
- constraints (3): `constraints/chat-content-is-data`, `constraints/chat-reads-are-consistent`, `constraints/chat-toolset`

### Nodes changed

- `domain/chat/message`: `stop_reason` typed `assistant-stop-reason` (was string); `created_at` (datetime, required) added — the message listing orders and pages by it.
- `domain/chat/graph-view`: `layout_algorithm` (`graph-layout`) added.
- `decision-log.md`: 9 entries appended. Projections rederived.

No node removed.

### Decisions logged (9)

1. `domain/chat/turn.md` `type` — value-object: a turn is never stored or read as itself; what persists is its messages and tool calls.
2. `rules/chat/send-message-check-order.md` `statement` — **against the code**: a disabled chat is checked first on sending a message too (the code checks header, identity and body first).
3. `contracts/chat/conversations.md` `answers` — **against the code**: every update naming neither title nor archiving time answers VALIDATION_REQUIRED_FIELD (the code answers VALIDATION_INVALID_FORMAT when the body holds only other keys).
4. `contracts/chat/conversations.md` `answers` — **against the code**: a cursor with a non-timestamp creation time or non-identifier identity answers 422 VALIDATION_INVALID_FORMAT `details: { param: "cursor" }` (the code reaches the store and answers 500).
5. `rules/chat/replay-reports-failure.md` `statement` — **against the code**: replaying a turn recorded as provider-error/internal-error ends in the error event the live turn ended in (the code replays `done` with `end_turn`).
6. `rules/chat/message-listing-pages-backwards.md` `statement` — **against the code**: a page holds the most recent messages before its moment (the code answers the oldest page, so `next_before` finds nothing).
7. `rules/chat/graph-delta-unreadable-result.md` `statement` — **against the code for directed ingestion only**: an unreadable result yields an empty graph delta for every tool (the code answers no delta for `ingest_directed`).
8. `rules/chat/archived-conversation-takes-no-turn.md` `statement` — archiving stops turns only; rename, un-archive, delete and graph-view save stay allowed (as the code does).
9. `rules/chat/conversation-usage-counts.md` `statement` — usage counts every message, tool requests and tool results included (as the code does).

### Watch items (tensions with no case decided)

- `send-message` streams a `graph_delta` only when the knowledge-graph catalog snapshot is loaded; `rules/chat/graph-delta-follows-tool-result` states no such condition. A deployment without the snapshot is an installation fault, not a case the domain decides.
- The v4 chat prompt tells the assistant the ontology block marks temporal items, and the block marks none (prompt text, not held).
- Character counts: the tool-start summary and tool-result truncation count code points; the rolling-summary (2000) and distilled-title (80) bounds count UTF-16 units. The nodes say "characters".
- The tool-start summary formats `start_async_ingestion` and `get_ingestion_status`, which the chat toolset does not hold, and has no format for `ingest_directed` (display formatting, not held).
- A second rolling-summary text (`selectSummaryPromptModule`) sits beside the summary registry (prompt text, not held).
- `rules/chat/recording-failure-keeps-stream` keeps the owner's stream intact when recording fails; the failure is only logged.

`--shape --of` (the 94 nodes written or changed): `constraints/chat-toolset` (47w) and `rules/chat/send-message-check-order` (58w) are at or past their class p90 — both enumerate a closed list (the toolset, the check order), and splitting either would scatter one list over several nodes; left standing. Shared phrases: "is refused at the first check it fails" (the check-order idiom of the whole root), "least one and at most … characters once trimmed" (rolling-summary and distilled-title length: two bounds on two attributes), "message resent under an idempotency key whose turn" (replay and recovery: two outcomes of one case, split by whether the turn ended), "per page and … when it names no limit" (two listings' limits). No `statement` over one sentence.

Cross-check: `conversation-request-check-order` × `send-message-check-order` (consistent: send-message is a conversation operation, disabled chat first, format before existence); `archived-conversation-takes-no-turn` × `idempotent-replay` (a resend to an archived conversation is refused before the key is looked up, as the check order states); `conversation-title-length` × `distilled-title-length` (1–200 for the owner, 1–80 for a distilled title: nested, no conflict); `turn-ends-once` × `replay-reports-failure` (one terminal event either way); `message-listing-shows-exchanges` × `conversation-usage-counts` (decided, entry 9). No further case decided.

### What this increment may have put the code in breach of

Decisions 2–7 are written against the code on purpose; the reconciliation is expected to report them as `contradicts`. Beyond them, this step never read the target, so any node here can state an obligation the code violates.

### `--ledger` (verbatim)

```
$ python3 -B $P/bin/trace.py --ledger siegard-survey/adopt-chat/ledger.md specification
ledger sound: 363 fact line(s) over 3 material file(s) — 276 landed in 99 node(s), 87 left out with a reason
  file set: 26 file(s) the material read; candidates per file:
    src/modules/chat/index.ts: 0
    src/modules/chat/prompts/chat-summary/index.ts: 4
    src/modules/chat/prompts/chat-summary/v1.ts: 1
    src/modules/chat/prompts/chat-summary/v2.ts: 3
    src/modules/chat/prompts/index.ts: 6
    src/modules/chat/prompts/v1.ts: 8
    src/modules/chat/prompts/v2.ts: 4
    src/modules/chat/prompts/v3.ts: 4
    src/modules/chat/prompts/v4.ts: 5
    src/modules/chat/repository/chat.repository.ts: 27
    src/modules/chat/routes/chat.schemas.ts: 15
    src/modules/chat/routes/conversations.routes.ts: 38
    src/modules/chat/service/args-summary.ts: 1
    src/modules/chat/service/chat-agent.service.ts: 19
    src/modules/chat/service/context-builder.ts: 6
    src/modules/chat/service/conversation.service.ts: 7
    src/modules/chat/service/datetime-block.ts: 1
    src/modules/chat/service/distillation.service.ts: 8
    src/modules/chat/service/errors.ts: 1
    src/modules/chat/service/graph-normalizer.ts: 11
    src/modules/chat/service/message-sequence.ts: 2
    src/modules/chat/service/output-guard.ts: 1
    src/modules/chat/service/tool-catalog.ts: 2
    src/modules/chat/service/truncate-tool-result.ts: 1
    src/modules/chat/service/turn-registry.ts: 1
    src/modules/chat/service/types.ts: 6
  1 file(s) no fact names; an adoption over this ledger hands them no judge and leaves them unbound: src/modules/chat/index.ts
  candidates, all: constraints/chat-content-is-data constraints/chat-reads-are-consistent constraints/chat-toolset contracts/chat/conversations domain/chat/assistant-stop-reason domain/chat/chat-prompt-version domain/chat/conversation domain/chat/conversation-listing domain/chat/conversation-usage domain/chat/graph-delta domain/chat/graph-delta-link domain/chat/graph-delta-node domain/chat/graph-layout domain/chat/graph-view domain/chat/message domain/chat/message-listing domain/chat/message-role domain/chat/summary-prompt-version domain/chat/tool-call domain/chat/turn domain/chat/turn-event-kind domain/knowledge-base/link-type rules/chat/archived-conversation-takes-no-turn rules/chat/assistant-answer-recorded rules/chat/assistant-answers-in-portuguese rules/chat/assistant-states-uncertainty rules/chat/assistant-text-withholds-system-prompt rules/chat/assistant-withholds-internals rules/chat/assistant-writes-only-on-owner-request rules/chat/cancel-requires-turn-in-flight rules/chat/chat-prompt-carries-marker rules/chat/chat-prompt-presents-catalog rules/chat/chat-prompt-version-known rules/chat/chat-toolset-requires-every-query-tool rules/chat/conversation-archived rules/chat/conversation-listing-excludes-archived rules/chat/conversation-listing-limit rules/chat/conversation-listing-order rules/chat/conversation-request-check-order rules/chat/conversation-title-length rules/chat/conversation-update-names-a-field rules/chat/conversation-update-partial rules/chat/conversation-usage-counts rules/chat/default-chat-prompt-version rules/chat/default-summary-prompt-version rules/chat/distillation-failure-changes-nothing rules/chat/distillation-follows-live-turn rules/chat/distilled-title-length rules/chat/distilled-title-never-overwrites rules/chat/graph-delta-content rules/chat/graph-delta-directed-links rules/chat/graph-delta-directed-nodes-active rules/chat/graph-delta-drops-incomplete rules/chat/graph-delta-follows-tool-result rules/chat/graph-delta-link-temporal rules/chat/graph-delta-unreadable-result rules/chat/graph-view-replaced-on-save rules/chat/graph-view-snapshot-bounds rules/chat/idempotency-match rules/chat/idempotent-recovery rules/chat/idempotent-replay rules/chat/iteration-recorded rules/chat/message-idempotency-key-unique rules/chat/message-listing-limit rules/chat/message-listing-pages-backwards rules/chat/message-listing-shows-exchanges rules/chat/model-context-owner-time rules/chat/model-context-rolling-summary rules/chat/model-context-well-formed rules/chat/model-context-window rules/chat/one-turn-in-flight rules/chat/owner-message-recorded-first rules/chat/owner-written-message rules/chat/recording-failure-keeps-stream rules/chat/replay-reports-failure rules/chat/rolling-summary-folds rules/chat/rolling-summary-length rules/chat/rolling-summary-overlap rules/chat/rolling-summary-refresh rules/chat/send-message-check-order rules/chat/summary-prompt-version-known rules/chat/title-distillation rules/chat/tool-call-recorded rules/chat/tool-failure-continues-turn rules/chat/tool-invocation-carries-turn rules/chat/tool-result-truncated rules/chat/tool-start-summary-bounded rules/chat/turn-cancel rules/chat/turn-ending-message rules/chat/turn-ends-once rules/chat/turn-failure-stop-reason rules/chat/turn-limit-before-cancel rules/chat/turn-model-call-limit rules/chat/turn-model-default rules/chat/turn-model-stop-reason rules/chat/turn-one-tool-at-a-time rules/chat/turn-reports-last-model rules/chat/turn-time-limit rules/chat/turn-tokens-summed
[exit 0]
```

First run refused 26 fact lines (boundary.md:150–175, the whole Answers block of the send/update/list refusals, which the first ledger script omitted); each was landed on `contracts/chat/conversations` and, where one holds the condition, on its rule. A check of the written nodes against the ledger then found two rules held by no fact line — `rules/chat/graph-delta-unreadable-result` (its case is in the survey's "Observed" section only) and `rules/chat/replay-reports-failure` — and each was landed on the lines stating the behavior it decides (service.md:131 and 136; boundary.md:106), so a judge reads them. Rerun sound as above.

Left out (87), grouped by reason:

- 16 × prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- 11 × layout of a prompt text, not a fact of the domain
- 9 × guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- 8 × display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- 4 × implementation knowledge: how the chat is wired or computed, not a fact of the domain
- 4 × this system's own store layout, which its implementation chose; persistence is not domain knowledge
- 3 × the model provider SDK is a vendor boundary; the specification names no third-party vendor
- 3 × a shape another increment owns: the retrieval and ingestion contracts hold the tool envelopes and results
- 2 × configuration names, not facts of the domain; the limits they set are held by the rules that name the configured values
- 2 × restates the directed ingestion payload the ingestion contract holds; prompt text
- 2 × the v1 summary text, which the default version does not use; prompt text, not held
- 1 × how tools are described to the model provider; implementation
- 1 × the model provider's signal for a tool request; implementation of the loop
- 1 × an adapter for tools that answer without the envelope; implementation
- 1 × per-turn statistics kept for logging; observability, not domain
- 1 × normalization of the offset the platform formatter prints; implementation
- 1 × the encoding of a cursor the contract declares opaque; implementation
- 1 × a configuration value declared and read nowhere; nothing of the domain
- 1 × the mechanics of the in-process registry of turns in flight; implementation
- 1 × a programming error of an internal call, not reachable by any caller; implementation
- 1 × the registry other modules put their tools in; wiring
- 1 × the repository's call surface; implementation
- 1 × the prompt modules the service imports; wiring
- 1 × the store signal for a reused key; the uniqueness is held by rules/chat/message-idempotency-key-unique
- 1 × the model provider's content-block shape, carried whole as a message's content text
- 1 × restates directed node pinning, which rules/knowledge-base/directed-pinned-node holds; prompt text
- 1 × the v1 composer, which the default version does not use; implementation
- 1 × observed and not decided: a second summary text kept beside the registry; prompt text, not held
- 1 × the utility prompts are not chat prompt versions, which alone carry the marker; prompt text
- 1 × restates the directed item statuses domain/knowledge-base/directed-item-status holds; prompt text
- 1 × restates the start-date bases domain/knowledge-base/valid-from-basis holds; prompt text
- 1 × tools the chat toolset does not hold, named by prompt text
- 1 × restates the directed ingestion payload and envelope the ingestion contract holds
- 1 × catalog flags domain/knowledge-base/link-type holds, named by prompt text

### Validator and projections

```
$ python3 -B $P/bin/spec.py specification
specification sound: 89 element(s), 433 rule(s), 9 scenario(s), 5 contract(s), 18 constraint(s) across 2 context(s); 116 decision(s) disclosed, 2 location(s) retired
[exit 0]
$ python3 -B $P/bin/spec.py --project specification
specification sound: 89 element(s), 433 rule(s), 9 scenario(s), 5 contract(s), 18 constraint(s) across 2 context(s); 116 decision(s) disclosed, 2 location(s) retired
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
[exit 0]
```

### Candidates for the adoption

`constraints/chat-content-is-data`, `constraints/chat-reads-are-consistent`, `constraints/chat-toolset`, `contracts/chat/conversations`, `domain/chat/assistant-stop-reason`, `domain/chat/chat-prompt-version`, `domain/chat/conversation-listing`, `domain/chat/conversation-usage`, `domain/chat/graph-delta`, `domain/chat/graph-delta-link`, `domain/chat/graph-delta-node`, `domain/chat/graph-layout`, `domain/chat/message-listing`, `domain/chat/summary-prompt-version`, `domain/chat/turn`, `domain/chat/turn-event-kind`, `rules/chat/archived-conversation-takes-no-turn`, `rules/chat/assistant-answer-recorded`, `rules/chat/assistant-answers-in-portuguese`, `rules/chat/assistant-states-uncertainty`, `rules/chat/assistant-text-withholds-system-prompt`, `rules/chat/assistant-withholds-internals`, `rules/chat/assistant-writes-only-on-owner-request`, `rules/chat/cancel-requires-turn-in-flight`, `rules/chat/chat-prompt-carries-marker`, `rules/chat/chat-prompt-presents-catalog`, `rules/chat/chat-prompt-version-known`, `rules/chat/chat-toolset-requires-every-query-tool`, `rules/chat/conversation-archived`, `rules/chat/conversation-listing-excludes-archived`, `rules/chat/conversation-listing-limit`, `rules/chat/conversation-listing-order`, `rules/chat/conversation-request-check-order`, `rules/chat/conversation-title-length`, `rules/chat/conversation-update-names-a-field`, `rules/chat/conversation-update-partial`, `rules/chat/conversation-usage-counts`, `rules/chat/default-chat-prompt-version`, `rules/chat/default-summary-prompt-version`, `rules/chat/distillation-failure-changes-nothing`, `rules/chat/distillation-follows-live-turn`, `rules/chat/distilled-title-length`, `rules/chat/distilled-title-never-overwrites`, `rules/chat/graph-delta-content`, `rules/chat/graph-delta-directed-links`, `rules/chat/graph-delta-directed-nodes-active`, `rules/chat/graph-delta-drops-incomplete`, `rules/chat/graph-delta-follows-tool-result`, `rules/chat/graph-delta-link-temporal`, `rules/chat/graph-delta-unreadable-result`, `rules/chat/graph-view-replaced-on-save`, `rules/chat/graph-view-snapshot-bounds`, `rules/chat/idempotency-match`, `rules/chat/idempotent-recovery`, `rules/chat/idempotent-replay`, `rules/chat/iteration-recorded`, `rules/chat/message-listing-limit`, `rules/chat/message-listing-pages-backwards`, `rules/chat/message-listing-shows-exchanges`, `rules/chat/model-context-owner-time`, `rules/chat/model-context-rolling-summary`, `rules/chat/model-context-well-formed`, `rules/chat/model-context-window`, `rules/chat/one-turn-in-flight`, `rules/chat/owner-message-recorded-first`, `rules/chat/owner-written-message`, `rules/chat/recording-failure-keeps-stream`, `rules/chat/replay-reports-failure`, `rules/chat/rolling-summary-folds`, `rules/chat/rolling-summary-length`, `rules/chat/rolling-summary-overlap`, `rules/chat/rolling-summary-refresh`, `rules/chat/send-message-check-order`, `rules/chat/summary-prompt-version-known`, `rules/chat/title-distillation`, `rules/chat/tool-call-recorded`, `rules/chat/tool-failure-continues-turn`, `rules/chat/tool-invocation-carries-turn`, `rules/chat/tool-result-truncated`, `rules/chat/tool-start-summary-bounded`, `rules/chat/turn-cancel`, `rules/chat/turn-ending-message`, `rules/chat/turn-ends-once`, `rules/chat/turn-failure-stop-reason`, `rules/chat/turn-limit-before-cancel`, `rules/chat/turn-model-call-limit`, `rules/chat/turn-model-default`, `rules/chat/turn-model-stop-reason`, `rules/chat/turn-one-tool-at-a-time`, `rules/chat/turn-reports-last-model`, `rules/chat/turn-time-limit`, `rules/chat/turn-tokens-summed`, plus the changed `domain/chat/message` and `domain/chat/graph-view` (the ledger's candidate list is the complete set the staging reads).

Handoff: `/siegard:reconcile` as an adoption — slug `adopt-chat`, ledger `siegard-survey/adopt-chat/ledger.md`, outside none, certifications none.

STOP (Step 3) — committed with pathspec `specification siegard-survey/adopt-chat`.

## Step 4 — the adoption

Invoked `/siegard:reconcile` as an adoption: slug `adopt-chat`, ledger `siegard-survey/adopt-chat/ledger.md`, outside none, certifications none. Preconditions held: the chat files and `siegard-trace.json` were clean, the specification was sound, the trace was sound (`413 binding(s), 5 of them decided by a certified test`), and `siegard-reconcile/adopt-chat.md` was free.

Staging line (verbatim):

```
staged adopt-chat: 25 file(s) to judge over 0 node(s); staged as an adoption — 99 candidate node(s) from the ledger, 182 pair(s) over 25 file(s) (38 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 26 file(s) the trace binds nothing to, 25 of them judged over the candidates alone
  manifest and packs at /tmp/tmp.PV4VvuZteF; candidate index at /tmp/tmp.PV4VvuZteF/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-chat.returns/<file path with '/' as '__'>.yaml
```

Candidates from the ledger: 99, over 182 pairs, at most 38 on one file (`conversations.routes.ts`). Mechanical tier: none. Certifications: none. Omitted pairs: 0. `index.ts` is named by no fact, so it got no judge and stays unbound.

Node pack sizes (workspace `/tmp/tmp.PV4VvuZteF`, not committed):

- `src__modules__chat__prompts__chat-summary__index.ts.md`: 2503 bytes
- `src__modules__chat__prompts__chat-summary__v1.ts.md`: 1182 bytes
- `src__modules__chat__prompts__chat-summary__v2.ts.md`: 1923 bytes
- `src__modules__chat__prompts__index.ts.md`: 3066 bytes
- `src__modules__chat__prompts__v1.ts.md`: 3905 bytes
- `src__modules__chat__prompts__v2.ts.md`: 2777 bytes
- `src__modules__chat__prompts__v3.ts.md`: 2450 bytes
- `src__modules__chat__prompts__v4.ts.md`: 2780 bytes
- `src__modules__chat__repository__chat.repository.ts.md`: 24744 bytes
- `src__modules__chat__routes__chat.schemas.ts.md`: 18202 bytes
- `src__modules__chat__routes__conversations.routes.ts.md`: 28818 bytes
- `src__modules__chat__service__args-summary.ts.md`: 1257 bytes
- `src__modules__chat__service__chat-agent.service.ts.md`: 19422 bytes
- `src__modules__chat__service__context-builder.ts.md`: 3482 bytes
- `src__modules__chat__service__conversation.service.ts.md`: 15340 bytes
- `src__modules__chat__service__datetime-block.ts.md`: 1235 bytes
- `src__modules__chat__service__distillation.service.ts.md`: 4258 bytes
- `src__modules__chat__service__errors.ts.md`: 12060 bytes
- `src__modules__chat__service__graph-normalizer.ts.md`: 6969 bytes
- `src__modules__chat__service__message-sequence.ts.md`: 1689 bytes
- `src__modules__chat__service__output-guard.ts.md`: 1232 bytes
- `src__modules__chat__service__tool-catalog.ts.md`: 1679 bytes
- `src__modules__chat__service__truncate-tool-result.ts.md`: 1240 bytes
- `src__modules__chat__service__turn-registry.ts.md`: 1157 bytes
- `src__modules__chat__service__types.ts.md`: 14848 bytes

Judges: 25 `siegard:specification-conformance-reviewer` delegations, one per file, all launched in one batch (the harness refused none); **25 judges**, none re-run. Each prompt carried absolute paths (the file, the pack and the candidate index as paths), the contract path, the request for "only the keys the contract defines, at every depth", and the `|-` block-scalar instruction. Returns were saved by script (`/tmp/chat/save_judges.py`) from the last assistant message of each `tasks/<id>.output`, a ```yaml fence stripped where present (12 of 25), and validated against `schemas/conformance-return.json` before being written to `siegard-reconcile/adopt-chat.returns/`. None was retyped.

Returns refused, and why: **0**. `--fold` refused nothing.

Premise: title "Adoption of the chat context"; the summary says the module is adopted as it stands and did not change; one `change` line per file, 26, `index.ts` included.

```
$ python3 -B $P/bin/trace.py --fold backend /tmp/tmp.PV4VvuZteF /tmp/tmp.PV4VvuZteF/premise.yaml siegard-reconcile/adopt-chat.md
folded adopt-chat.md: 88 node(s) cleared, 9 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 2 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-chat.md
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-chat.md
adopt-chat.md holds: 26 file(s), 88 node(s) the judgment cleared, 9 it did not, 2 file(s) the trace binds nothing to.
--bind-record will write 88 binding(s) from this record and none for constraints/chat-toolset, contracts/chat/conversations, rules/chat/graph-delta-follows-tool-result, rules/chat/graph-delta-unreadable-result, rules/chat/message-listing-pages-backwards, rules/chat/model-context-well-formed, rules/chat/replay-reports-failure, rules/chat/rolling-summary-folds, rules/chat/send-message-check-order: a node without `encoded_at` is a node this form cannot bind.
$ python3 -B $P/bin/trace.py --bind-record backend specification siegard-reconcile/adopt-chat.md --workspace /tmp/tmp.PV4VvuZteF
bound constraints/chat-content-is-data to 2 file(s)
bound constraints/chat-reads-are-consistent to 2 file(s)
bound domain/chat/assistant-stop-reason to 2 file(s)
bound domain/chat/chat-prompt-version to 1 file(s)
bound domain/chat/conversation to 1 file(s)
bound domain/chat/conversation-listing to 2 file(s)
bound domain/chat/conversation-usage to 1 file(s)
bound domain/chat/graph-delta to 1 file(s)
bound domain/chat/graph-delta-link to 1 file(s)
bound domain/chat/graph-delta-node to 1 file(s)
bound domain/chat/graph-layout to 1 file(s)
bound domain/chat/graph-view to 2 file(s)
bound domain/chat/message to 2 file(s)
bound domain/chat/message-listing to 2 file(s)
bound domain/chat/message-role to 3 file(s)
bound domain/chat/summary-prompt-version to 1 file(s)
bound domain/chat/tool-call to 2 file(s)
bound domain/chat/turn to 1 file(s)
bound domain/chat/turn-event-kind to 1 file(s)
bound rules/chat/archived-conversation-takes-no-turn to 1 file(s)
bound rules/chat/assistant-answer-recorded to 2 file(s)
bound rules/chat/assistant-answers-in-portuguese to 1 file(s)
bound rules/chat/assistant-states-uncertainty to 1 file(s)
bound rules/chat/assistant-text-withholds-system-prompt to 2 file(s)
bound rules/chat/assistant-withholds-internals to 1 file(s)
bound rules/chat/assistant-writes-only-on-owner-request to 1 file(s)
bound rules/chat/cancel-requires-turn-in-flight to 1 file(s)
bound rules/chat/chat-prompt-carries-marker to 4 file(s)
bound rules/chat/chat-prompt-presents-catalog to 2 file(s)
bound rules/chat/chat-prompt-version-known to 1 file(s)
bound rules/chat/chat-toolset-requires-every-query-tool to 2 file(s)
bound rules/chat/conversation-archived to 1 file(s)
bound rules/chat/conversation-listing-excludes-archived to 2 file(s)
bound rules/chat/conversation-listing-limit to 1 file(s)
bound rules/chat/conversation-listing-order to 2 file(s)
bound rules/chat/conversation-request-check-order to 2 file(s)
bound rules/chat/conversation-title-length to 1 file(s)
bound rules/chat/conversation-update-names-a-field to 2 file(s)
bound rules/chat/conversation-update-partial to 2 file(s)
bound rules/chat/conversation-usage-counts to 1 file(s)
bound rules/chat/default-chat-prompt-version to 1 file(s)
bound rules/chat/default-summary-prompt-version to 1 file(s)
bound rules/chat/distillation-failure-changes-nothing to 1 file(s)
bound rules/chat/distillation-follows-live-turn to 1 file(s)
bound rules/chat/distilled-title-length to 2 file(s)
bound rules/chat/distilled-title-never-overwrites to 2 file(s)
bound rules/chat/graph-delta-content to 1 file(s)
bound rules/chat/graph-delta-directed-links to 1 file(s)
bound rules/chat/graph-delta-directed-nodes-active to 1 file(s)
bound rules/chat/graph-delta-drops-incomplete to 1 file(s)
bound rules/chat/graph-delta-link-temporal to 1 file(s)
bound rules/chat/graph-view-replaced-on-save to 1 file(s)
bound rules/chat/graph-view-snapshot-bounds to 1 file(s)
bound rules/chat/idempotency-match to 1 file(s)
bound rules/chat/idempotent-recovery to 1 file(s)
bound rules/chat/idempotent-replay to 1 file(s)
bound rules/chat/iteration-recorded to 2 file(s)
bound rules/chat/message-listing-limit to 1 file(s)
bound rules/chat/message-listing-shows-exchanges to 1 file(s)
bound rules/chat/model-context-owner-time to 2 file(s)
bound rules/chat/model-context-rolling-summary to 1 file(s)
bound rules/chat/model-context-window to 1 file(s)
bound rules/chat/one-turn-in-flight to 2 file(s)
bound rules/chat/owner-message-recorded-first to 2 file(s)
bound rules/chat/owner-written-message to 1 file(s)
bound rules/chat/recording-failure-keeps-stream to 1 file(s)
bound rules/chat/rolling-summary-length to 1 file(s)
bound rules/chat/rolling-summary-overlap to 2 file(s)
bound rules/chat/rolling-summary-refresh to 2 file(s)
bound rules/chat/summary-prompt-version-known to 1 file(s)
bound rules/chat/title-distillation to 2 file(s)
bound rules/chat/tool-call-recorded to 3 file(s)
bound rules/chat/tool-failure-continues-turn to 1 file(s)
bound rules/chat/tool-invocation-carries-turn to 1 file(s)
bound rules/chat/tool-result-truncated to 2 file(s)
bound rules/chat/tool-start-summary-bounded to 1 file(s)
bound rules/chat/turn-cancel to 2 file(s)
bound rules/chat/turn-ending-message to 1 file(s)
bound rules/chat/turn-ends-once to 1 file(s)
bound rules/chat/turn-failure-stop-reason to 2 file(s)
bound rules/chat/turn-limit-before-cancel to 1 file(s)
bound rules/chat/turn-model-call-limit to 1 file(s)
bound rules/chat/turn-model-default to 1 file(s)
bound rules/chat/turn-model-stop-reason to 2 file(s)
bound rules/chat/turn-one-tool-at-a-time to 1 file(s)
bound rules/chat/turn-reports-last-model to 1 file(s)
bound rules/chat/turn-time-limit to 1 file(s)
bound rules/chat/turn-tokens-summed to 1 file(s)
88 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-chat.md
  9 node(s) of adopt-chat.md the judgment did not clear, and this bind wrote none of them:
    constraints/chat-toolset
    contracts/chat/conversations
    rules/chat/graph-delta-follows-tool-result
    rules/chat/graph-delta-unreadable-result
    rules/chat/message-listing-pages-backwards
    rules/chat/model-context-well-formed
    rules/chat/replay-reports-failure
    rules/chat/rolling-summary-folds
    rules/chat/send-message-check-order
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
[exit 0]
```

## Step 5 — what it shows

```
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-chat.md
adopt-chat.md holds: 26 file(s), 88 node(s) the judgment cleared, 9 it did not, 2 file(s) the trace binds nothing to.
--bind-record will write 88 binding(s) from this record and none for constraints/chat-toolset, contracts/chat/conversations, rules/chat/graph-delta-follows-tool-result, rules/chat/graph-delta-unreadable-result, rules/chat/message-listing-pages-backwards, rules/chat/model-context-well-formed, rules/chat/replay-reports-failure, rules/chat/rolling-summary-folds, rules/chat/send-message-check-order: a node without `encoded_at` is a node this form cannot bind.
$ python3 -B $P/bin/trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/chat/prompts/chat-summary/v1.ts
    rules/chat/rolling-summary-folds — found against in adopt-chat.md
  backend/src/modules/chat/prompts/v3.ts
    constraints/chat-toolset — found against in adopt-chat.md
  backend/src/modules/chat/repository/chat.repository.ts
    rules/chat/message-listing-pages-backwards — found against in adopt-chat.md
  backend/src/modules/chat/routes/chat.schemas.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/routes/conversations.routes.ts
    rules/chat/graph-delta-follows-tool-result — found against in adopt-chat.md
    rules/chat/replay-reports-failure — found against in adopt-chat.md
    rules/chat/send-message-check-order — found against in adopt-chat.md
  backend/src/modules/chat/service/conversation.service.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/service/errors.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/service/graph-normalizer.ts
    rules/chat/graph-delta-follows-tool-result — found against in adopt-chat.md
    rules/chat/graph-delta-unreadable-result — found against in adopt-chat.md
  backend/src/modules/chat/service/message-sequence.ts
    rules/chat/model-context-well-formed — found against in adopt-chat.md
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

57 finding(s) no bind closed, over 43 file(s):
  57 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  57 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

118 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now

159 unstated fact(s) the records name, over 68 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
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
  ... and 144 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

388 place(s) the records name where text in the source restates a node's fact the code holds, over 107 file(s). The pair conforms and none is counted above:
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
  src/modules/chat/prompts/chat-summary/index.ts — the header comment point 2, lines 14-19, and the docblock above selectChatSummaryPromptModule, lines 86-90 (rules/chat/summary-prompt-version-known) [adopt-chat.md]
  src/modules/chat/prompts/chat-summary/index.ts — the header comment, lines 21-23, and the docblock above DEFAULT_CHAT_SUMMARY_PROMPT_VERSION, lines 56-61 (rules/chat/default-summary-prompt-version) [adopt-chat.md]
  src/modules/chat/prompts/v1.ts — docstring of CHAT_PROMPT_MARKER_V1, lines 24-29 (rules/chat/chat-prompt-carries-marker) [adopt-chat.md]
  ... and 373 more; `--all` lists them
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
$ python3 -B $P/bin/trace.py --untraced backend
279 tracked file(s) under backend: 124 bound, 155 no binding names
  22 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  133 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    5  backend/src/__tests__/integration/ingestion
    5  backend/src/shared
    3  backend/src
    3  backend/src/__tests__/integration/curation
    3  backend/src/__tests__/integration/knowledge-graph
    3  backend/src/__tests__/unit/compliance-audit
    3  backend/src/config
    3  backend/src/mcp
  (15 more directories; --all lists every file)
[exit 0]
$ python3 -B $P/bin/trace.py --convergence backend specification siegard-work
554 node(s) of specification; 497 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

475 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 15, contract 1, element 73, rule 380, scenario 6
22 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    contract 1, element 12, rule 9
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
57 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 3, contract 3, element 4, rule 44, scenario 3

files under backend: 279 tracked, 124 bound, 155 no binding names (133 unsurveyed) — `--untraced` lists them

497 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 57 finding(s) past reconciliations left open and no bind closed (57 unseen, 0 covered, 0 reported); 118 pair(s) the records answer both ways; 159 unstated fact(s) the source states and no node holds; 388 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ python3 -B $P/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
contracts/knowledge-base/retrieval: bound at sha256:0b56247fe50203561f9d02f09a2c23438a20e28f672cdee5f0fe31ae24eb71c5, now sha256:a7c1c7f87afc4014dd26b0123d83a3f2f8f02b62968a7e1e33928f5620295b67; the specification moved since this bind
domain/chat/graph-view: migrations/0005_chat_graph_view.sql was stamped against sha256:8d4e6c2480dbeb47d09284a37ac6d1abe5ddcb779bb5627b3dff00ff7e95c913, and the node now reads sha256:0e2fa6725c82a0a7d00511c818f8a83e74c0d0022c4c22c82b2cf1ff4cf31caf; a later bind restamped the node on other files and nobody read this one against it
domain/chat/message: migrations/0004_chat_persistence.sql was stamped against sha256:d64aab2749774f99a3422a09a79f23913501e701ad6ef16ed25f2e68bc0240de, and the node now reads sha256:7ee73e120a1ab06a13cd259e2e84c84a0c533bb4d6c8eb90626f6183461c6b48; a later bind restamped the node on other files and nobody read this one against it
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

48 drift finding(s) over 497 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  46 moved: bound to a node whose text moved since the bind, or a file stamped against an earlier text of a node a later bind restamped elsewhere; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

### Counts from the record

- cleared: **88** nodes (bound); blocked: **9**, none collateral.
- `contradicts`: **12**; `unstated`: **34**; `restates`: **51**; `unheld`: **2**.

`contradicts` (file → node):

- `prompts/chat-summary/v1.ts` → `rules/chat/rolling-summary-folds`
- `prompts/v3.ts` → `constraints/chat-toolset`
- `repository/chat.repository.ts` → `rules/chat/message-listing-pages-backwards`
- `routes/chat.schemas.ts` → `contracts/chat/conversations`
- `routes/conversations.routes.ts` → `rules/chat/send-message-check-order`
- `routes/conversations.routes.ts` → `rules/chat/graph-delta-follows-tool-result`
- `routes/conversations.routes.ts` → `rules/chat/replay-reports-failure`
- `service/conversation.service.ts` → `contracts/chat/conversations`
- `service/errors.ts` → `contracts/chat/conversations`
- `service/graph-normalizer.ts` → `rules/chat/graph-delta-unreadable-result`
- `service/graph-normalizer.ts` → `rules/chat/graph-delta-follows-tool-result`
- `service/message-sequence.ts` → `rules/chat/model-context-well-formed`

Of the 12, seven are the decisions logged against the code in Step 3 (send-message check order; update naming neither field, in `chat.schemas.ts`; the cursor 422, in `conversation.service.ts`; replay of a failed turn; message paging backwards; the unreadable directed result, reported twice in `graph-normalizer.ts`). The other five are new:
- `errors.ts`: the not-found message is "conversation <id> not found" with no `details`, while the contract (read from the route's `sendNotFound`) answers "conversation not found" with `details: { id }`. The ledger landed the service's not-found lines (service.md:158–161) on the contract, so the judge read the service text against the route's answer.
- `conversations.routes.ts` → `graph-delta-follows-tool-result`: no graph delta when the catalog snapshot is absent or normalization throws (Step 3 watch item 1).
- `prompts/v3.ts` → `constraints/chat-toolset`: the v3 prompt names `start_async_ingestion` and `get_ingestion_status`, which the toolset does not hold.
- `message-sequence.ts` → `model-context-well-formed`: a non-empty string `content` counts as no content.
- `prompts/chat-summary/v1.ts` → `rolling-summary-folds`: v1 ignores the previous summary.

### unheld (2)

- `domain/knowledge-base/link-type` — **analysis attribution**: landed from service.md:193 (the catalog snapshot the graph delta reads), which names the catalog's fields but whose file (`graph-normalizer.ts`) only reads them; the fact is declared in the knowledge-graph catalog, outside the areas.
- `rules/chat/message-idempotency-key-unique` — **fact outside the areas**: landed from boundary.md:111; the uniqueness is the store's (migration `0004_chat_persistence.sql`), which the route only reacts to.

### unstated (34), by source

Per file: `prompts/chat-summary/v1.ts` 2, `prompts/chat-summary/v2.ts` 3, `prompts/index.ts` 2, `prompts/v1.ts` 3, `prompts/v2.ts` 3, `prompts/v3.ts` 3, `prompts/v4.ts` 6, `repository/chat.repository.ts` 2, `routes/chat.schemas.ts` 1, `routes/conversations.routes.ts` 2, `service/args-summary.ts` 2, `service/chat-agent.service.ts` 3, `service/datetime-block.ts` 2.

- **Prompt text the analysis left out as "prompt guidance, not held"** (analysis drop, prompts.md:34–39, 42–47, 57–62, 67–78, 88, 111; reason `prompt guidance addressed to the model, not a fact of the domain`): 22 findings over `prompts/v1.ts` (never invent ids, cite the source, temporal axes), `prompts/v2.ts` (async-ingestion guidance ×3, the toolset gap), `prompts/v3.ts` (search semantics, listing filter, post-ingestion procedure), `prompts/v4.ts` (search discipline, trigger phrases, ask for a date, record only what the owner stated, one call per command, post-ingestion recipe), `prompts/index.ts` (summary preserve-list and 8-sentence cap, title form), `prompts/chat-summary/v1.ts` and `v2.ts` (8-sentence cap, prose form, `pendente:` marker, the 200-character tool-argument cut). The ingestion adoption made the same call on its prompts; these judges read it differently.
- **Display formatting left out** (analysis drop, service.md:65–73, reason `display formatting of a progress label`): 2 findings on `args-summary.ts` (the 60-character search-query cut, the per-tool formats).
- **Implementation left out** (analysis drop): `datetime-block.ts` ×2 (the label and zone id; the `+00:00` fallback — service.md:88 left out as implementation); `chat-agent.service.ts` ×3 (the 4096 output-token cap — left out by the surveyor under "Outside the domain"; the failure codes handed to the model — left out by the analysis; the error-closing content filter — service.md:58, landed on the contract only).
- **Survey gap / dead surface**: `chat.repository.ts` ×2 (`listRecentMessages`, `listOlderMessagesForSummary` — the boundary surveyor filed them as unused row-count windows under "Outside the domain"); `chat.schemas.ts` ×1 (the v1 `buildChatTurnRequestSchema`, filed as dead surface); `conversations.routes.ts` ×2 (boot and per-turn log records — filed as logging).

### Tokens

`telemetry.py --probe --since 2026-09-30T22:23:06Z .` announced one session, agent types, descriptions, token counts, timestamps and command lines, no message text; then run:

```
$ python3 -B $P/bin/telemetry.py --since 2026-09-30T22:23:06Z .
window: 2026-09-30T22:23:06.000Z .. 2026-09-30T22:41:04.645Z (since named)
framework: 4.28.0 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 1 session(s) overlap the window
agents: 28 spawned (0 of them by another agent), 28 with a transcript, 212736 output tokens, 1614.776s
sessions: 1 orchestrating, 87198 output tokens — never a subagent's, which the line above already carries
commands: 23 invoking this framework's scripts, 0 exiting non-zero
runs: 0 captured
commits: 1; uncommitted: 15
decisions added: 9 (baseline: commit aa0fd8f0fa4fa009762b0ea833b1dd3bdb138e18)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T224104Z.json
```

| agent | type | output tokens | input+cache tokens | seconds |
|---|---|---|---|---|
| Survey chat service area | domain-surveyor | 28357 | 343201 | 226 |
| Survey chat prompts area | domain-surveyor | 18731 | 347195 | 154 |
| Survey chat boundary area | domain-surveyor | 26271 | 678239 | 222 |
| Judge prompts/chat-summary/index.ts | specification-conformance-reviewer | 2722 | 61797 | 20 |
| Judge prompts/chat-summary/v1.ts | specification-conformance-reviewer | 3709 | 131996 | 31 |
| Judge prompts/chat-summary/v2.ts | specification-conformance-reviewer | 4423 | 265400 | 36 |
| Judge prompts/index.ts | specification-conformance-reviewer | 4735 | 195277 | 36 |
| Judge prompts/v1.ts | specification-conformance-reviewer | 8289 | 209749 | 62 |
| Judge prompts/v2.ts | specification-conformance-reviewer | 4989 | 219674 | 45 |
| Judge prompts/v3.ts | specification-conformance-reviewer | 6641 | 308421 | 49 |
| Judge prompts/v4.ts | specification-conformance-reviewer | 8129 | 429991 | 60 |
| Judge repository/chat.repository.ts | specification-conformance-reviewer | 12012 | 158505 | 75 |
| Judge routes/chat.schemas.ts | specification-conformance-reviewer | 7031 | 120769 | 48 |
| Judge routes/conversations.routes.ts | specification-conformance-reviewer | 14115 | 267116 | 93 |
| Judge service/args-summary.ts | specification-conformance-reviewer | 3603 | 176905 | 27 |
| Judge service/chat-agent.service.ts | specification-conformance-reviewer | 16601 | 305128 | 109 |
| Judge service/context-builder.ts | specification-conformance-reviewer | 5264 | 148499 | 38 |
| Judge service/conversation.service.ts | specification-conformance-reviewer | 3500 | 69518 | 25 |
| Judge service/datetime-block.ts | specification-conformance-reviewer | 2496 | 142809 | 22 |
| Judge service/distillation.service.ts | specification-conformance-reviewer | 5854 | 69790 | 39 |
| Judge service/errors.ts | specification-conformance-reviewer | 2234 | 67543 | 17 |
| Judge service/graph-normalizer.ts | specification-conformance-reviewer | 7931 | 277392 | 56 |
| Judge service/message-sequence.ts | specification-conformance-reviewer | 2575 | 61158 | 22 |
| Judge service/output-guard.ts | specification-conformance-reviewer | 2376 | 96125 | 20 |
| Judge service/tool-catalog.ts | specification-conformance-reviewer | 2615 | 63679 | 19 |
| Judge service/truncate-tool-result.ts | specification-conformance-reviewer | 1686 | 94265 | 15 |
| Judge service/turn-registry.ts | specification-conformance-reviewer | 1484 | 60659 | 13 |
| Judge service/types.ts | specification-conformance-reviewer | 4363 | 172890 | 34 |

- surveyors: 73 359 output tokens (3).
- judges: 139 377 output tokens over 25 judged files; mean per judged file 5 575 output and 167 002 input+cache tokens.
- orchestrating session: 87 198 output tokens, which includes the inline analysis (the telemetry does not separate it).

## Step 6 — stop

Committed with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-chat siegard-telemetry`.
