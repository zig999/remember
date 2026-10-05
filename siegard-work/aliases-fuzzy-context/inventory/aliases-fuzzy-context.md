---
title: Backend territory for aliases in extraction, approximate node search and document context
summary: The ingestion and query-retrieval modules plus the MCP, REST and env wiring where alias admission, trigram node matching and the preliminary document read would land.
rationale: The scope names three behavior changes. Surveying the backend showed they converge on one extraction orchestrator, one propose_node path, one node-alias search query and one llm_run read/write path, so one territory covers them.
sources:
  - intake/scope.md
  - intake/material-aliases-fuzzy-contexto.md
area:
  - src/modules/ingestion
  - src/modules/query-retrieval
  - src/modules/knowledge-graph/service/norm.ts
  - src/modules/chat/service/graph-normalizer.ts
  - src/mcp
  - src/shared
  - src/config/env.ts
  - src/app.ts
  - src/mcp-stdio.ts
  - src/__tests__
modules:
  - name: ingestion-extraction-service
    path: src/modules/ingestion/service/extraction.service.ts
    role: touched
  - name: ingestion-prompts
    path: src/modules/ingestion/prompts
    role: touched
  - name: ingestion-propose-node
    path: src/modules/ingestion/service/propose-node.service.ts
    role: touched
  - name: ingestion-entity-resolution
    path: src/modules/ingestion/service/entity-resolution.service.ts
    role: touched
  - name: ingestion-propose-node-dto
    path: src/modules/ingestion/dto/propose-node.dto.ts
    role: touched
  - name: ingestion-tool-descriptions
    path: src/modules/ingestion/dto/index.ts
    role: touched
  - name: ingestion-llm-run-repository
    path: src/modules/ingestion/repository/llm-run.repository.ts
    role: touched
  - name: ingestion-llm-run-service
    path: src/modules/ingestion/service/llm-run.service.ts
    role: touched
  - name: ingestion-llm-run-dto
    path: src/modules/ingestion/dto/llm-run.dto.ts
    role: touched
  - name: ingestion-mcp-schemas
    path: src/modules/ingestion/mcp/mcp-schemas.ts
    role: touched
  - name: ingestion-ingest-toolset
    path: src/modules/ingestion/mcp/ingest-toolset.ts
    role: touched
  - name: ingestion-propose-node-handler
    path: src/modules/ingestion/mcp/propose-node.handler.ts
    role: touched
  - name: ingestion-routes
    path: src/modules/ingestion/routes/ingestion.routes.ts
    role: touched
  - name: query-retrieval-search-repository
    path: src/modules/query-retrieval/repository/search.repository.ts
    role: touched
  - name: query-retrieval-scoring
    path: src/modules/query-retrieval/repository/scoring.ts
    role: touched
  - name: query-retrieval-search-service
    path: src/modules/query-retrieval/service/search.service.ts
    role: touched
  - name: query-retrieval-response-dto
    path: src/modules/query-retrieval/dto/response.dto.ts
    role: touched
  - name: query-retrieval-query-toolset
    path: src/modules/query-retrieval/mcp/query-toolset.ts
    role: touched
  - name: query-retrieval-routes
    path: src/modules/query-retrieval/routes/query-retrieval.routes.ts
    role: adjacent
  - name: env-config
    path: src/config/env.ts
    role: touched
  - name: app-wiring
    path: src/app.ts
    role: touched
  - name: mcp-stdio-wiring
    path: src/mcp-stdio.ts
    role: touched
  - name: ingestion-directed-ingestion
    path: src/modules/ingestion/service/directed-ingestion.service.ts
    role: adjacent
  - name: ingestion-ingest-document-handler
    path: src/modules/ingestion/mcp/ingest-document.handler.ts
    role: adjacent
  - name: ingestion-affected-nodes
    path: src/modules/ingestion/service/affected-nodes.ts
    role: adjacent
  - name: ingestion-repository
    path: src/modules/ingestion/repository/ingestion.repository.ts
    role: depends-on
  - name: knowledge-graph-traversal
    path: src/modules/knowledge-graph
    role: depends-on
  - name: chat-graph-normalizer
    path: src/modules/chat/service/graph-normalizer.ts
    role: adjacent
  - name: shared-sdk-http-transport
    path: src/mcp/sdk-http-transport.ts
    role: depends-on
  - name: migrations-store-schema
    path: ../migrations
    role: depends-on
conventions:
  - statement: Each prompt version is its own module exporting PROMPT_VERSION, MAX_TOKENS, system() and user(). Later versions compose earlier ones (v4 wraps v3's system and reuses v1's user), and a PromptModule registry maps llm_run.prompt_version to the module. An unknown version fails the run rather than substituting.
    seen_at: src/modules/ingestion/prompts/index.ts
  - statement: The default prompt version is a single exported constant bound to the newest module. It is read by the ingest_document handler when it creates a run.
    seen_at: src/modules/ingestion/prompts/index.ts
  - statement: The orchestrator, not the model, injects the current chunk_id into propose_fragment and strips that field from the schema the model sees. propose_node carries no chunk or fragment reference.
    seen_at: src/modules/ingestion/service/extraction.service.ts
  - statement: The orchestrator never holds a transaction across tool calls. Each dispatch goes through runIngestHandler, which opens one transaction per call and writes the tool_call audit row. Run close and read-back use fresh short connections.
    seen_at: src/modules/ingestion/service/extraction.service.ts
  - statement: Provider failures close the run as failed and throw typed sentinels (LlmProviderFatalError, ExtractionFatalError) carrying a partial run. The extraction call is made through an injectable AnthropicLike factory for tests.
    seen_at: src/modules/ingestion/service/extraction.service.ts
  - statement: Transport-agnostic services take an open PoolClient and return a { ok, result } envelope. MCP handlers and REST mirrors both call the same service, and the handler writes the tool_call row with the derived validation_outcome.
    seen_at: src/modules/ingestion/mcp/propose-node.handler.ts
  - statement: The four propose_* tool descriptions live once in IngestToolDescriptions and are consumed by both the MCP registrar and the in-process extraction loop. JSON Schemas for tool inputs are derived from the Zod schemas via z.toJSONSchema.
    seen_at: src/modules/ingestion/dto/index.ts
  - statement: The MCP wire schema for each ingest tool is the REST input schema plus llm_run_id. The toolset strips llm_run_id before calling the shared handler.
    seen_at: src/modules/ingestion/mcp/ingest-toolset.ts
  - statement: Thresholds and weights are named module-level constants (MATCH_STRONG, MATCH_FLOOR, TRIGRAM_CANDIDATE_LIMIT, LAYER_WEIGHT_*, PER_LAYER_FETCH_LIMIT), and a change to them is a code change rather than a runtime setting.
    seen_at: src/modules/ingestion/service/entity-resolution.service.ts
  - statement: Search runs one parameterized SQL per layer, with the FTS config name and layer weight bound as parameters. Layer hits are merged into IntermediateItem, sorted by score, recorded_at and id, then sliced.
    seen_at: src/modules/query-retrieval/service/search.service.ts
  - statement: Response DTOs for search are plain TypeScript interfaces with no runtime Zod parse. The service builds the wire object directly in toSearchItem.
    seen_at: src/modules/query-retrieval/dto/response.dto.ts
  - statement: Graph expansion starts from each matched node with its own score and gives reached links Math.pow(TRAVERSAL_DECAY, hop) * startScore, keeping the best path per link.
    seen_at: src/modules/query-retrieval/service/search.service.ts
  - statement: Lifecycle rows are read and written through explicit column lists repeated in each query (findLlmRunById, retryLlmRunRow RETURNING, closeLlmRunRow RETURNING) and mapped to the LlmRunRow type.
    seen_at: src/modules/ingestion/repository/llm-run.repository.ts
  - statement: Server model defaults come from env (INGEST_MODEL, default claude-sonnet-4-6) and are passed by app.ts and mcp-stdio.ts into the toolset deps.
    seen_at: src/config/env.ts
  - statement: Unit tests live in src/__tests__/unit/ingestion and unit/query-retrieval and integration tests in src/__tests__/integration. They cover entity resolution, propose services, extraction affected-nodes, MCP JSON schemas and search expansion.
    seen_at: src/__tests__/unit/ingestion/entity-resolution.spec.ts
must_not_duplicate:
  - what: The project normalization policy in TypeScript (trim, NFD strip of combining marks, collapse spaces, lowercase), for comparing an alias to the raw information's text. The database norm() is the authority and entity resolution already calls it in SQL.
    at: src/modules/knowledge-graph/service/norm.ts
  - what: The resolve-or-create pipeline with advisory lock, exact alias match, trigram candidates and the A12 decision. Alias admission belongs in or beside attachAliases, not in a second insertion path.
    at: src/modules/ingestion/service/entity-resolution.service.ts
  - what: Alias insertion with ON CONFLICT DO NOTHING, shared by matched-existing, needs-review and created-new branches (attachAliases and attachCanonicalAndAliases).
    at: src/modules/ingestion/service/entity-resolution.service.ts
  - what: The prompt registry and DEFAULT_PROMPT_VERSION. A v5 is added as a module plus a registry entry, not as a separate selection path.
    at: src/modules/ingestion/prompts/index.ts
  - what: The shared prompt pieces. user() already renders document metadata and the 200-character previous-chunk tail, and system(catalog) is composed by chaining.
    at: src/modules/ingestion/prompts/extraction.v1.ts
  - what: PREV_TAIL_CHARS and the per-chunk loop, including the usage logging, turn cap and fatal-burst handling. The preliminary read should sit beside them and not copy them.
    at: src/modules/ingestion/service/extraction.service.ts
  - what: The injectable AnthropicLike factory, request timeout and retry constants for any new model call.
    at: src/modules/ingestion/service/extraction.service.ts
  - what: The per-tool-call tool_call audit rows and the aggregation of validation_outcome counters. These are the audit surface the new alias result and context failure registration must flow through.
    at: src/modules/ingestion/repository/llm-run.repository.ts
  - what: The run-to-response mapping. toLlmRunResponse in llm-run.service.ts and the inline mapping in readFinalRun (extraction.service.ts) already differ only by affected_nodes handling; a new run field must be added to every copy or the copies unified.
    at: src/modules/ingestion/service/llm-run.service.ts
  - what: The wire shape of get_ingestion_status (GetIngestionStatusOutputSchema) and LlmRunResponseSchema, which mirror each other. A context field recorded with the run surfaces through both.
    at: src/modules/ingestion/mcp/mcp-schemas.ts
  - what: Search layer weights and the shared FTS config names (FTS_NAME_CONFIG, FTS_PROSE_CONFIG).
    at: src/modules/query-retrieval/repository/scoring.ts
  - what: PER_LAYER_FETCH_LIMIT of 200, which the material applies to the node layer with both matching routes summed.
    at: src/modules/query-retrieval/service/search.service.ts
  - what: computeFlags, which carries only assertion signals (uncertain, disputed, low_confidence). The material keeps match mode out of it, so it needs a separate field.
    at: src/modules/query-retrieval/service/search.service.ts
  - what: The graph expansion path (scoreMatchedNodes, collectExpandedLinks, keepBestPath). Approximate nodes enter expansion through scoreMatchedNodes with a lower score and need no separate path.
    at: src/modules/query-retrieval/service/search.service.ts
  - what: The MCP search input reuses SearchQuerySchema verbatim, and the same searchKnowledgeService serves REST and MCP.
    at: src/modules/query-retrieval/mcp/query-toolset.ts
risks:
  - risk: Changing the propose_node result from { node_id, resolution } to include refused aliases and reasons alters the contract that MCP clients and the REST mirror return. The result is also stored verbatim in tool_call.result and echoed back to the extraction model as the tool_result.
    consumers:
      - src/modules/ingestion/mcp/propose-node.handler.ts
      - src/modules/ingestion/routes/ingestion.routes.ts
      - src/modules/ingestion/service/extraction.service.ts
      - src/modules/ingestion/service/affected-nodes.ts
      - src/modules/ingestion/service/directed-ingestion.service.ts
      - src/__tests__/unit/ingestion/propose-service-layer.spec.ts
      - src/__tests__/integration/ingestion/propose-routes.spec.ts
      - src/__tests__/unit/ingestion/mcp-json-schemas.spec.ts
  - risk: The alias check must compare against the run's raw information, but the propose-node path only knows llmRunId and rawInformationId through RunContext. The directed ingestion calls the same service with a synthesized raw text and must stay exempt, so the exemption has to be expressed as a parameter without breaking that caller.
    consumers:
      - src/modules/ingestion/service/directed-ingestion.service.ts
      - src/modules/ingestion/mcp/directed-ingest.handler.ts
      - src/modules/ingestion/mcp/propose-node.handler.ts
      - src/modules/ingestion/routes/ingestion.routes.ts
      - src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  - risk: The TypeScript norm() is a separate implementation from the database norm() that stores alias_norm. If the alias verification uses the TypeScript one, accent or character edge cases could admit or refuse an alias differently from the stored comparison.
    consumers:
      - src/modules/ingestion/service/entity-resolution.service.ts
      - src/modules/knowledge-graph/service/node.service.ts
  - risk: Making v5 the default changes the prompt_version recorded for every new ingest_document run. Anything keyed on the version string or on a registry entry sees a new value.
    consumers:
      - src/modules/ingestion/mcp/ingest-document.handler.ts
      - src/modules/ingestion/service/extraction.service.ts
      - src/modules/ingestion/mcp/mcp-schemas.ts
  - risk: The approximate node match must always rank below every full-text node match, but node scores are ts_rank_cd times 0.9 and can be small. A trigram-derived score is not on the same scale, so the ordering needs an explicit guarantee. Expansion inherits the starting node's score, so it carries the ordering to linked items.
    consumers:
      - src/modules/query-retrieval/service/search.service.ts
      - src/modules/query-retrieval/repository/scoring.ts
      - src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  - risk: Adding a match-mode field to the search item changes the REST and MCP search response. The chat graph normalizer reads search items to hydrate node ids and the frontend search screen consumes the response, so both observe the new field.
    consumers:
      - src/modules/query-retrieval/routes/query-retrieval.routes.ts
      - src/modules/query-retrieval/mcp/query-toolset.ts
      - src/modules/chat/service/graph-normalizer.ts
      - src/__tests__/integration/knowledge-graph/mcp-query-kg.spec.ts
      - frontend search screen (outside this target root)
  - risk: Node hits are dropped when listProvenanceForNodes finds no accepted fragment mentioning the alias. An approximate match whose alias text does not appear in a fragment would be silently dropped, so the approximate route's visible results depend on that lookup unchanged.
    consumers:
      - src/modules/query-retrieval/repository/search.repository.ts
      - src/modules/query-retrieval/service/search.service.ts
  - risk: The approximate match needs word_similarity over node_alias.alias_norm. The existing trigram index node_alias_norm_trgm_idx (referenced in entity-resolution comments) is defined in the migrations, which live outside this target root. Whether it serves the word-similarity operator was not verified here.
    consumers:
      - src/modules/query-retrieval/repository/search.repository.ts
      - src/modules/ingestion/service/entity-resolution.service.ts
      - ../migrations
  - risk: Storing the document context with the run requires a schema change in the migrations directory, which is a separate target and needs explicit approval. The run columns are listed by name in several queries, so a new column must be added to each one that should return it.
    consumers:
      - src/modules/ingestion/repository/llm-run.repository.ts
      - src/modules/ingestion/repository/ingestion.repository.ts
      - src/modules/ingestion/service/llm-run.service.ts
      - src/modules/ingestion/service/extraction.service.ts
      - ../migrations
  - risk: A retry must reuse a stored context and only do the preliminary read when none was produced. retryLlmRunRow resets status and attempts and rejects orphaned fragments but knows nothing about context, and runLlmExtraction loads the run through findLlmRunById, so both must agree on what a stored context means.
    consumers:
      - src/modules/ingestion/repository/llm-run.repository.ts
      - src/modules/ingestion/service/llm-run.service.ts
      - src/modules/ingestion/service/extraction.service.ts
      - src/modules/ingestion/routes/ingestion.routes.ts
  - risk: The preliminary-read model setting must be threaded through every place that builds the orchestrator's env. The REST run route passes only ANTHROPIC_API_KEY, the MCP toolset passes ANTHROPIC_API_KEY and INGEST_MODEL, and the stdio server builds its own env.
    consumers:
      - src/app.ts
      - src/mcp-stdio.ts
      - src/modules/ingestion/mcp/ingest-toolset.ts
      - src/modules/ingestion/routes/ingestion.routes.ts
      - src/config/env.ts
      - src/__tests__/unit/env.spec.ts
  - risk: The MCP tool descriptions are emitted text shown to the model. Changing the propose_node description or the extraction prompt changes model behavior and the tool schemas advertised by tools/list, so it is a contract change, not documentation.
    consumers:
      - src/modules/ingestion/dto/index.ts
      - src/modules/ingestion/service/extraction.service.ts
      - src/modules/ingestion/mcp/ingest-toolset.ts
      - src/__tests__/unit/ingestion/mcp-json-schemas.spec.ts
---
## What it is
The backend survey covers the ingestion module (prompts, extraction orchestrator, propose_node and entity resolution, llm_run repository and service, MCP schemas and REST routes) and the query-retrieval module (node-alias search, scoring, search service, response DTO, query toolset).
It also covers the env, app and stdio wiring that builds the orchestrator's dependencies, and the knowledge-graph, chat and shared pieces those paths read.
The tree is populated, and all three scope items land inside it.

## Notes
The extraction orchestrator reads each chunk with only document metadata and a 200-character tail of the previous chunk, and there is no preliminary document read today.
Prompts exist as v1 through v4, and v4 is the registered default through DEFAULT_PROMPT_VERSION.
No prompt mentions aliases; propose_node has an optional aliases field that is inserted into node_alias without any check against the source text.
propose_node returns only node_id and resolution, and entity resolution compares only the proposed name to alias_norm, exactly then by trigram similarity, with thresholds 0.85 and 0.55.
The node search layer matches by full text over node_alias.alias with the simple_unaccent_v1 configuration and has no trigram route.
The search item has kind, layer, id, score, hop, summary, flags and provenance, with no field for how a hit matched.
llm_run has no column for a context in any query in this root, and the schema lives in /home/siegfriedneto/projects/eternal/migrations, which was not surveyed and is a dependency of the context-recording item.
The read-llm-run surface is GET /llm-runs/:id, getLlmRunById and the get_ingestion_status MCP tool, and the run-extraction surface is POST /llm-runs/:llmRunId/run and the ingest_document handler.
Source in this tree carries many comments, and the survey records that as observed and draws no convention from it.
Whether the existing trigram index supports the word-similarity operator was not checked because the DDL is outside this target.
The measured counts of 4 documents and 16 nodes come from the material and were not re-measured.
