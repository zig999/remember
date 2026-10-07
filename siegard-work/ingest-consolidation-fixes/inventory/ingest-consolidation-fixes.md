---
title: Entity-resolution tie-break, directed-ingestion envelope order, ingest_directed description
summary: The backend ingestion module holds the three change sites (exact-match lookup, directed envelope, tool description), and the chat truncation, graph-normalizer, MCP toolset and test files that consume them.
rationale: "Item (1) of the scope was excluded by the planner, so only items (2), (3) and (4) were surveyed. No specification node was found holding the ingest_directed description wording. `specification/contracts/knowledge-base/ingestion.md` holds only its validation error message, and no node was found stating an exact-alias tie-break."
sources:
  - intake/scope.md
area:
  - backend/src/modules/ingestion
  - backend/src/modules/chat
  - backend/src/__tests__/unit/ingestion
  - backend/src/__tests__/unit/chat
  - backend/src/config
modules:
  - name: entity-resolution-service
    path: backend/src/modules/ingestion/service/entity-resolution.service.ts
    role: touched
  - name: directed-ingestion-service
    path: backend/src/modules/ingestion/service/directed-ingestion.service.ts
    role: touched
  - name: ingestion-dto
    path: backend/src/modules/ingestion/dto/index.ts
    role: touched
  - name: ingest-toolset
    path: backend/src/modules/ingestion/mcp/ingest-toolset.ts
    role: depends-on
  - name: directed-ingest-handler
    path: backend/src/modules/ingestion/mcp/directed-ingest.handler.ts
    role: depends-on
  - name: propose-node-service
    path: backend/src/modules/ingestion/service/propose-node.service.ts
    role: depends-on
  - name: chat-agent-service
    path: backend/src/modules/chat/service/chat-agent.service.ts
    role: depends-on
  - name: chat-truncate-tool-result
    path: backend/src/modules/chat/service/truncate-tool-result.ts
    role: depends-on
  - name: chat-graph-normalizer
    path: backend/src/modules/chat/service/graph-normalizer.ts
    role: depends-on
  - name: chat-prompt-v4
    path: backend/src/modules/chat/prompts/v4.ts
    role: adjacent
  - name: chat-tool-catalog
    path: backend/src/modules/chat/service/tool-catalog.ts
    role: adjacent
conventions:
  - statement: "MCP tool descriptions live in one `IngestToolDescriptions` map and are emitted verbatim by the toolset (and over the MCP transport); the chat catalog reuses the same entries."
    seen_at: backend/src/modules/ingestion/dto/index.ts
  - statement: "Directed-ingestion result types are plain readonly interfaces (`DirectedIngestionResult`), and the envelope is built by one literal object at the end of `directedIngestionService`."
    seen_at: backend/src/modules/ingestion/service/directed-ingestion.service.ts
  - statement: "Chat tool results are serialized with `JSON.stringify(toolEnvelope)` and cut by code points at `TOOL_RESULT_MAX_CHARS` (default 8000), with a `[truncated: n chars]` marker appended."
    seen_at: backend/src/modules/chat/service/chat-agent.service.ts
  - statement: "The unit tests for each area sit under `backend/src/__tests__/unit/<area>/`, and a few sit beside their module in `__tests__/`; both use Vitest and mock the pg client or the handlers through test seams."
    seen_at: backend/src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  - statement: "Alias rows carry `created_at` and an `id`, and `UNIQUE (node_id, alias_norm)`. These are the columns available for an ordering tie-break on the exact lookup, which needs no schema change."
    seen_at: migrations/0001_init.sql
must_not_duplicate:
  - what: "The chat truncation helper `truncateToolResult` and the `TOOL_RESULT_MAX_CHARS` env setting. Fix the envelope order rather than adding a second truncation path."
    at: backend/src/modules/chat/service/truncate-tool-result.ts
  - what: "The `buildSummary` helper that computes the directed summary. It is also exported through `__testing__`."
    at: backend/src/modules/ingestion/service/directed-ingestion.service.ts
  - what: "The `IngestToolDescriptions` map, the single source of the ingest_directed description text."
    at: backend/src/modules/ingestion/dto/index.ts
  - what: "The `findExactMatch` function, the only exact-alias lookup. It is called by `resolveOrCreateNode`, which `propose-node.service.ts` uses."
    at: backend/src/modules/ingestion/service/entity-resolution.service.ts
risks:
  - risk: Reordering the envelope keys (summary first) changes the key order of the serialized JSON. Tests or consumers that compare serialized text rather than parsed objects would break, and a truncated tool result is no longer valid JSON, so the chat model sees a cut-off string either way.
    consumers:
      - backend/src/modules/chat/service/chat-agent.service.ts
      - backend/src/__tests__/unit/ingestion/directed-ingest-handler.spec.ts
      - backend/src/__tests__/unit/chat/original-input-chat-integration.spec.ts
      - backend/src/modules/chat/prompts/v4.ts
  - risk: "The chat graph-normalizer reads `result.run.affected_nodes` and `result.report[]` by field name. The envelope is not truncated on that path (the SSE `tool_result` event carries the untruncated result), so it must stay keyed identically, and no field may be renamed or nested differently."
    consumers:
      - backend/src/modules/chat/service/graph-normalizer.ts
      - backend/src/modules/chat/service/__tests__/graph-normalizer.spec.ts
  - risk: "The chat prompt v4 tells the model to read `result.report[]`, `result.summary` and `result.run.affected_nodes`. A change to the envelope's shape or to how the description frames the tool must stay consistent with this prompt, which already says ingest_directed is the only write tool and is called only on the owner's request."
    consumers:
      - backend/src/modules/chat/prompts/v4.ts
      - backend/src/modules/chat/prompts/__tests__/v4.spec.ts
      - backend/src/__tests__/unit/chat/prompts.spec.ts
  - risk: "The ingest_directed description is emitted text. MCP clients (Claude Desktop through mcp-remote, and any standard MCP client) and the chat model see it through the toolset and `tools/list`. The schema test only requires the text to match /no llm|deterministic/, so the rewrite must keep that wording."
    consumers:
      - backend/src/modules/ingestion/mcp/__tests__/ingest-directed-schema.spec.ts
      - backend/src/modules/ingestion/mcp/ingest-toolset.ts
      - backend/src/modules/ingestion/mcp/transport.ts
      - backend/src/modules/chat/service/tool-catalog.ts
      - backend/src/__tests__/integration/ingestion/mcp-endpoint.spec.ts
  - risk: Adding an ORDER BY to the exact alias lookup changes which node a homonym proposal resolves to. Existing tests that mock the query or assert the SQL text, and propose_node outcomes in existing graphs with homonyms, would observe a different matched node.
    consumers:
      - backend/src/__tests__/unit/ingestion/entity-resolution.spec.ts
      - backend/src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
      - backend/src/modules/ingestion/service/propose-node.service.ts
---

## What it is
The survey covers the three change sites in the ingestion module: `findExactMatch` (a `LIMIT 1` with no `ORDER BY`), the result envelope of `directedIngestionService` (order run, report, summary), and the `ingest_directed` entry of `IngestToolDescriptions`.
The description currently says to use the tool "when you already have the structured facts (e.g. you assembled them yourself from prior tool results)", while chat prompt v4 says the tool is the only write tool and is called only after the owner asks.
The chat agent serializes the whole envelope, cuts it at 8000 code points, and gives that to the model, so a late `summary` field is the part that gets lost.
The same chat route also sends the untruncated result to the graph-normalizer, which reads `run.affected_nodes` and `report[]`.

## Notes
No specification node was found holding the `ingest_directed` description wording, and `specification/contracts/knowledge-base/ingestion.md` holds only the validation error message for the tool.
No specification node was found stating a tie-break for exact alias matches; `node_alias` has `created_at` and `id` for ordering, so no database change is needed.
The directed-ingestion service header comments and the `__testing__` export are existing code; the plan's tasks deliver the files they edit under the no-comments rule.
The chat truncation limit is the `TOOL_RESULT_MAX_CHARS` env value (`backend/src/config/env.ts`), which this scope leaves unchanged.
