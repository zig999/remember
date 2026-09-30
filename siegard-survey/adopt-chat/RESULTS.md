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
