---
contract_version: siegard-reconcile/8
title: Adopt the architecture-constraint homes against the test-intent constraints
summary: The configuration, application bootstrap, MCP transport, logging, curation, ingestion and chat-agent
  source named here is adopted as it stands and did not change; the candidates are the 14 constraints
  the test-intent analysis wrote or amended, whose homes this file set holds.
target: backend
files:
- path: src/app.ts
  change: adopted as it stands; unchanged
- path: src/config/env.ts
  change: adopted as it stands; unchanged
- path: src/config/logger.ts
  change: adopted as it stands; unchanged
- path: src/mcp-stdio.ts
  change: adopted as it stands; unchanged
- path: src/mcp/sdk-http-transport.ts
  change: adopted as it stands; unchanged
- path: src/mcp/server.ts
  change: adopted as it stands; unchanged
- path: src/mcp/stdio-tools.ts
  change: adopted as it stands; unchanged
- path: src/middleware/auth.ts
  change: adopted as it stands; unchanged
- path: src/middleware/error-handler.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/routes/conversations.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/chat-agent.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/tool-catalog.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/mcp/curation-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/mcp/curation-transport.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/routes/curation.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/ingest-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/transport.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/extraction.service.ts
  change: adopted as it stands; unchanged
- path: src/server.ts
  change: adopted as it stands; unchanged
nodes:
- node: constraints/answers-carry-allowed-origin
  conforms: true
  how: "src/app.ts: held at the fastifyCors registration, lines 117-120, which hands the allowed origin\
    \ list to the plugin that sets the header on answers, refusals included — await app.register(fastifyCors,\
    \ {\n    origin: corsOrigins,\n    methods: [\"GET\", \"POST\", \"PUT\", \"PATCH\", \"DELETE\", \"\
    OPTIONS\"],\n  });\nsrc/modules/chat/routes/conversations.routes.ts: held at writeSseHeaders(), lines\
    \ 1318-1334. It copies the allowed-origin header onto the hijacked reply and sets none when the reply\
    \ carries none. — const acao = reply.getHeader(\"access-control-allow-origin\");\n...\n...(acao !==\
    \ undefined ? { \"Access-Control-Allow-Origin\": String(acao) } : {}),"
  encoded_at:
  - src/app.ts
  - src/modules/chat/routes/conversations.routes.ts
- node: constraints/anthropic-key-required
  conforms: true
  how: 'src/config/env.ts: held at the ANTHROPIC_API_KEY entry of envSchema (lines 83-85), with loadEnv
    throwing EnvValidationError on a failed parse (lines 225-228) — ANTHROPIC_API_KEY: z.string().min(1,
    "ANTHROPIC_API_KEY is required (Anthropic SDK secret; BR-29)."),  and  if (!parsed.success) { throw
    new EnvValidationError(parsed.error); }'
  encoded_at:
  - src/config/env.ts
- node: constraints/curation-mcp-needs-no-run-identity
  conforms: true
  how: 'src/modules/curation/mcp/curation-toolset.ts: held at makeHandler and the seven registerTool calls
    in registerCurationToolset. No handler reads a run identity, and the toolset is registered under "curation"
    with no run-bound step. — `return async (rawInput: unknown): Promise<McpEnvelopeJson> => { try { const
    parsed = schema.parse(rawInput) as z.output<S>; const result = await run(parsed);`. The services are
    called with `{ pool }` or `{ pool, logger }` and the parsed input, and no llm_run_id is passed.

    src/modules/curation/mcp/curation-transport.ts: held at the `getTools` mapping in the mountMcpEndpoint
    call, lines 45-56 — handler: t.handler as (input: unknown) => Promise<McpEnvelope> The wrapper hands
    each curation tool a handler that takes only the tool input. It reads no run identity and asks for
    none.'
  encoded_at:
  - src/modules/curation/mcp/curation-toolset.ts
  - src/modules/curation/mcp/curation-transport.ts
- node: constraints/curation-write-failure-logged
  conforms: true
  how: 'src/modules/curation/routes/curation.routes.ts: held at sendError, lines 94-105, the `logLevel
    === "error"` branch. It is used by the write routes (resolve, merge, dispute, confirm, reject, correct).
    — if (logLevel === "error") { logger.error({ route: ..., method: reply.request.method, error_code:
    envelope.error.code, cause_message: err instanceof Error ? err.message : String(err), cause_name:
    ... }, "curation_request_failed"); }'
  encoded_at:
  - src/modules/curation/routes/curation.routes.ts
- node: constraints/expected-refusals-not-logged-as-errors
  conforms: false
  how: "src/modules/chat/service/chat-agent.service.ts, the createChatAgentService factory-failure branch\
    \ of getClient(), lines 80-88: deps.logger.error(\n  { event: \"chat.provider_factory_failed\", error:\
    \ serializeError(err) },\n  \"chat anthropic factory failed\"\n); throw new ChatProviderUnavailableError();\
    \ — The failure is logged at error level and then refused with the chat provider unavailable error.\
    \ The contract answers that case with the business code BUSINESS_CHAT_PROVIDER_UNAVAILABLE (\"The\
    \ model provider cannot be reached when the turn starts\"). The node says a refusal for a business\
    \ cause is never logged at error level. The same refusal during streaming is logged at warn, in this\
    \ file as \"chat.provider_stream_error\". The two paths therefore disagree on the level for one business\
    \ refusal, and error-level alerts fire on a refusal the specification classes as expected."
  observed_at:
  - src/modules/chat/service/chat-agent.service.ts
- node: constraints/extraction-model-call-bounded
  conforms: true
  how: 'src/modules/ingestion/service/extraction.service.ts: held at the constants ANTHROPIC_REQUEST_TIMEOUT_MS
    and ANTHROPIC_MAX_RETRIES (lines 200-201), passed to the client in defaultAnthropicFactory (lines
    204-209) — "const ANTHROPIC_REQUEST_TIMEOUT_MS = 5 * 60 * 1000; const ANTHROPIC_MAX_RETRIES = 2;"
    and "new AnthropicClient({ apiKey, timeout: ANTHROPIC_REQUEST_TIMEOUT_MS, maxRetries: ANTHROPIC_MAX_RETRIES
    })"'
  encoded_at:
  - src/modules/ingestion/service/extraction.service.ts
- node: constraints/ingest-toolset-offers-no-async-ingestion
  conforms: true
  how: "src/app.ts: held at the toolNames whitelist of the ingest transport, lines 194-201, which lists\
    \ no tool that starts an ingestion and returns before it completes — toolNames: [\n      ...INGEST_TOOL_NAMES,\n\
    \      \"ingest_document\",\n      \"ingest_directed\",\n      \"health\",\n      \"get_ingestion_status\"\
    ,\n      \"list_recent_ingestions\",\n    ],\nsrc/mcp-stdio.ts: held at toolCoordinates, lines 226-232,\
    \ the list of ingest tools the process advertises — ...INGEST_TOOL_NAMES.map((name) => ({ toolset:\
    \ \"ingest\" as const, name })),\n  { toolset: \"ingest\" as const, name: \"ingest_document\" },\n\
    \  { toolset: \"ingest\" as const, name: \"ingest_directed\" },\nThe closed set names no start_async_ingestion\
    \ or other tool that returns before the ingestion completes.\nsrc/modules/ingestion/mcp/ingest-toolset.ts:\
    \ held at the set of registerTool(\"ingest\", ...) calls in registerIngestToolset (lines 138-369)\
    \ — The tools registered are `name: \"propose_fragment\"`, `\"propose_node\"`, `\"propose_link\"`,\
    \ `\"propose_attribute\"`, `\"ingest_document\"`, `\"ingest_directed\"`, `\"health\"`, `\"get_ingestion_status\"\
    ` and `\"list_recent_ingestions\"`. No registration of start_async_ingestion remains, and every ingesting\
    \ tool awaits its handler: `return await ingestDocumentHandler(parsed.data, {`."
  encoded_at:
  - src/app.ts
  - src/mcp-stdio.ts
  - src/modules/ingestion/mcp/ingest-toolset.ts
- node: constraints/local-operator-token-minimum-length
  conforms: true
  how: 'src/config/env.ts: held at the LOCAL_OPERATOR_TOKEN entry of envSchema, lines 74-77 — LOCAL_OPERATOR_TOKEN:
    z.string().min(16, "LOCAL_OPERATOR_TOKEN must be at least 16 characters.").optional(),'
  encoded_at:
  - src/config/env.ts
- node: constraints/local-operator-token-needs-explicit-development
  conforms: true
  how: 'src/config/env.ts: held at the guard in loadEnv, lines 236-249 — if (parsed.data.LOCAL_OPERATOR_TOKEN
    !== undefined && source.NODE_ENV !== "development") { throw new EnvValidationError([...'
  encoded_at:
  - src/config/env.ts
- node: constraints/logs-redact-text-fields
  conforms: false
  how: "src/config/logger.ts, REDACT_PATHS, lines 21-39 (the \"*.content\", \"*.text\" and \"*.value\"\
    \ entries), as passed to pino at lines 57-61: \"content\", \"text\", \"value\", \"*.content\", \"\
    *.text\", \"*.value\", \"req.body.content\", \"req.body.text\", \"req.body.value\", \"*.req.body.content\"\
    , \"*.req.body.text\", \"*.req.body.value\" — The node says nested fields are redacted. This list\
    \ covers the top level, one wildcard level, and the fixed req.body paths. Under pino's path syntax\
    \ a single \"*\" matches exactly one key. So a content, text or value field two or more levels down\
    \ (for example { a: { b: { content } } }) is not covered and would be logged in clear. That is the\
    \ raw document text and attribute values the node exists to keep out of logs. The next reader would\
    \ trust the node and the comment, and would not look for the gap in this list.\nsrc/config/logger.ts,\
    \ REDACT_PATHS, lines 34-38 (the authorization header entries): \"req.headers.authorization\",\n \
    \ \"*.req.headers.authorization\",\n  \"headers.authorization\", — The node says every field other\
    \ than content, text and value is shown as it is. The code also redacts the authorization header.\
    \ That is a redaction rule no node holds, and it contradicts the node's \"every other field as it\
    \ is\". Anyone reading the node would expect an authorization field in a logged object to appear in\
    \ clear. The only place the rule lives is this list.\nsrc/mcp-stdio.ts, REDACT_PATHS, lines 78-94,\
    \ handed to pino as redact.paths at lines 112-116: \"req.headers.authorization\",\n  \"*.req.headers.authorization\"\
    ,\n  \"headers.authorization\",\n... redact: { paths: [...REDACT_PATHS], censor: \"[REDACTED]\", remove:\
    \ false } — The node says logs redact the content, text and value fields and show every other field\
    \ as it is. This logger also censors authorization header fields, so the code redacts a field the\
    \ node says is shown as it is. A reader who takes the node as the redaction rule will not expect these\
    \ three paths, and nothing in the specification says why they are redacted."
  observed_at:
  - src/config/logger.ts
  - src/mcp-stdio.ts
- node: constraints/mcp-endpoint-serves-only-its-toolset
  conforms: true
  how: 'src/app.ts: held at the toolNames arrays given to the query, curation and ingest MCP transports,
    which fix the closed set each endpoint serves (lines 194-201, 228, 260). The refusal itself, a tool
    error with code NOT_FOUND, is not in this file. — toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"],
    toolNames: [...QUERY_TOOL_NAMES, ...QUERY_RETRIEVAL_TOOL_NAMES],

    src/mcp/sdk-http-transport.ts: held at the CallToolRequestSchema handler in buildConfiguredMcpServer
    (lines 121-134), via the handlers map built from the closed tool set (line 114) — const handler =
    handlers.get(req.params.name); if (handler === undefined) { return toCallToolResult({ ok: false, error:
    { code: "NOT_FOUND", message: `Tool ''${req.params.name}'' is not available on this endpoint.`, },
    }); } — toCallToolResult then returns `isError: true`.'
  encoded_at:
  - src/app.ts
  - src/mcp/sdk-http-transport.ts
- node: constraints/owner-time-zone-must-be-known
  conforms: true
  how: 'src/config/env.ts: held at the try/catch in loadEnv, lines 258-262 — try { new Intl.DateTimeFormat(undefined,
    { timeZone: parsed.data.OWNER_TZ }); } catch (err) { throw new InvalidOwnerTimezoneError(parsed.data.OWNER_TZ,
    err); }'
  encoded_at:
  - src/config/env.ts
- node: constraints/preflight-needs-no-authentication
  conforms: true
  how: 'src/app.ts: held at the CORS registration at the root app (line 117), before the auth-protected
    /api/v1 scope whose preHandler is added at line 136 — await app.register(fastifyCors, { origin: corsOrigins,
    ... }); ... scoped.addHook("preHandler", auth.preHandler);'
  encoded_at:
  - src/app.ts
- node: rules/chat/tool-call-recorded
  conforms: false
  how: 'no named file holds this fact now: src/modules/chat/service/chat-agent.service.ts read `nowhere`
    — The file only emits the data as events and persists nothing. `yield { type: "tool_result", tool:
    toolName, ok: toolEnvelope.ok, arguments: block.input, result: ..., is_error: isError, error_message:
    errMsg, duration_ms: durationMs }` and `yield { type: "iteration_end", iteration, assistant_content:
    iterationBlocks.slice(), tool_results: toolResultBlocks.slice() }`. No call records a tool call against
    a conversation or names an assistant message.'
  observed_at:
  - src/modules/chat/service/chat-agent.service.ts
unstated:
- file: src/app.ts
  where: the BODY_LIMIT_BYTES constant and the bodyLimit option of Fastify(), lines 90-99
  evidence: 'const BODY_LIMIT_BYTES = 11 * 1024 * 1024; ... bodyLimit: BODY_LIMIT_BYTES,'
  cost: The largest request body the system accepts (11 MiB) lives only in this file. The specification
    states a 10,485,760 UTF-16 code unit limit on a raw information's content, and states nothing about
    the transport body ceiling above it. A reader who looks in the specification for what size of request
    is refused does not find it. A body above the ceiling is refused by the framework before any operation's
    own contract answers it.
- file: src/app.ts
  where: the GET /health handler, lines 127-130
  evidence: 'return reply.status(health.ok ? 200 : 503).send(health);'
  cost: The read-health operation's node states the report body and that `ok` is true exactly when the
    store answered. It does not say that an unhealthy report is answered with HTTP 503 and a healthy one
    with 200. That status mapping, which probes and containers act on, is held only here.
- file: src/app.ts
  where: the corsOrigins default and the fastifyCors registration, lines 113-120
  evidence: "const corsOrigins = env.CORS_ORIGINS ?? [\n    \"http://localhost:5173\",\n    \"http://127.0.0.1:5173\"\
    ,\n  ];\nawait app.register(fastifyCors, {\n    origin: corsOrigins,\n    methods: [\"GET\", \"POST\"\
    , \"PUT\", \"PATCH\", \"DELETE\", \"OPTIONS\"],\n  });"
  cost: Which origins count as allowed when none is configured, and which methods a cross-origin caller
    may use, are decided here. The constraints say only that an allowed origin is echoed and any other
    gets none, and neither names the allowed set or the methods. The default origins name port 5173, which
    the project's CLAUDE.md says belongs to another application (the frontend uses 5273). The code is
    therefore the only place the allowed set exists, and it is not the set the project documents.
- file: src/app.ts
  where: the sentinel route registered in the /api/v1 scope, lines 140-143
  evidence: "scoped.get(\"/_self\", async (request) => ({\n      ok: true,\n      result: { user_id: request.user?.id\
    \ ?? null },\n    }));"
  cost: The system serves an authenticated operation, GET /api/v1/_self, that returns the owner's identity
    or null. No node holds this operation or its answer. The next reader looking in the specification
    for what the system exposes will not find it.
- file: src/config/env.ts
  where: line 143, MAX_HISTORY_MESSAGES in envSchema
  evidence: 'MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).default(40),'
  cost: A configuration value with a default of 40 is declared and accepted, and no node holds it. The
    adjacent comment calls it legacy. A deployment can set a bound that the specification never mentions.
- file: src/config/env.ts
  where: line 185, CHAT_SUMMARY_OVERLAP_M in envSchema
  evidence: 'CHAT_SUMMARY_OVERLAP_M: z.coerce.number().int().min(1).default(40),'
  cost: rules/chat/rolling-summary-overlap says "at most the configured overlap of messages" and gives
    no value for the unconfigured case. The 40 that applies when nothing is configured is decided only
    here. Sibling nodes (turn-model-call-limit, turn-time-limit) state their defaults.
- file: src/config/env.ts
  where: line 25, the PORT entry of envSchema
  evidence: 'PORT: z.coerce.number().int().min(1).max(65535).default(3000),'
  cost: The port the system listens on when none is configured lives only here. No node holds it, so the
    next reader has nowhere in the specification to find it.
- file: src/config/env.ts
  where: line 65, NEON_AUTH_JWKS_TTL_S in envSchema
  evidence: 'NEON_AUTH_JWKS_TTL_S: z.coerce.number().int().min(60).default(600),'
  cost: The lifetime of the cached signing keys (600 s by default, never below 60 s) is decided only here.
    It bounds how long a revoked key keeps being accepted. No node holds that, so the next reader looks
    for it in the specification and does not find it.
- file: src/config/env.ts
  where: lines 168-177, CHAT_SUMMARY_AFTER_TURNS in envSchema
  evidence: 'CHAT_SUMMARY_AFTER_TURNS: z.coerce.number().int().min(1).default(20),'
  cost: A threshold of 20 turns for the rolling summary is declared and accepted, and no node holds it.
    rules/chat/rolling-summary-refresh states the refresh gate as owner-written messages older than the
    recent window, with no turn count. The variable is validated and defaulted but described as ignored
    at runtime, so it reads as a decided threshold that decides nothing.
- file: src/config/env.ts
  where: lines 29-43, the CORS_ORIGINS entry of envSchema
  evidence: 'CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173").transform((v)
    => v.split(",").map((s) => s.trim()).filter(Boolean))'
  cost: The origins the system allows when nothing is configured are decided only here. The two constraints
    on allowed origins (answers-carry-allowed-origin, preflight-needs-no-authentication) say what is done
    with an allowed origin, not which origins are allowed. A reader looking in the specification for who
    may call the system from a browser finds no answer.
- file: src/config/env.ts
  where: lines 53-55, PG_POOL_MIN, PG_POOL_MAX and PG_STATEMENT_TIMEOUT_MS of envSchema
  evidence: "PG_POOL_MIN: z.coerce.number().int().min(0).default(2),\n  PG_POOL_MAX: z.coerce.number().int().min(1).default(10),\n\
    \  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(0).default(10_000),"
  cost: The point at which a statement counts as timed out is decided only in this file. constraints/unreachable-store-answers-unavailable
    says that "whose statement times out" answers that a backing service is unavailable, but no node says
    after how long. Whoever tunes the pool or the timeout changes observable refusals without touching
    any node.
- file: src/mcp-stdio.ts
  where: 'Step 5 and Step 6, lines 194-233: the registry, the three toolset registrations and toolCoordinates.
    Nothing in main() authenticates a caller.'
  evidence: "const registry = buildMcpServer(logger);\n  registerQueryToolset({ mcp: registry, pool, logger,\
    \ catalog: kgCatalog });\n  ...\n  registerIngestToolset({\n...\n  { toolset: \"ingest\" as const,\
    \ name: \"ingest_document\" },\n  { toolset: \"ingest\" as const, name: \"ingest_directed\" },"
  cost: This process serves the query and ingest toolsets over a local stdio transport with no authentication
    at all. It serves them as one combined endpoint and leaves the curation toolset out. No node holds
    an unauthenticated stdio transport, a combined query and ingest endpoint, or the exclusion of curation.
    The specification's only statement about access (an absent or malformed Authorization header answers
    401) concerns HTTP. The next reader looking for who may call these tools, or which toolsets stdio
    offers, will find nothing in the specification and will find the answer only in this file.
- file: src/mcp/sdk-http-transport.ts
  where: buildConfiguredMcpServer, the CallToolRequestSchema handler, the branch for a name not in the
    closed tool set (lines 123-130)
  evidence: 'message: `Tool ''${req.params.name}'' is not available on this endpoint.`,'
  cost: The node fixes the answer as a tool error with code NOT_FOUND on the curation endpoint and says
    nothing of its message. The wording a client reads is therefore decided only in this file, so a reader
    who looks for it in the specification will not find it.
- file: src/mcp/sdk-http-transport.ts
  where: mountMcpEndpoint, the catch block of the POST route (lines 174-187)
  evidence: 'opts.logger.error({ component: "mcp.transport", path: opts.path, cause_message: err instanceof
    Error ? err.message : "unknown", }, "mcp_transport_internal_error"); if (!reply.raw.headersSent) {
    reply.raw.statusCode = 500; reply.raw.end(); }'
  cost: What the system does when an MCP transport fails is decided only here. The failure is logged at
    error level as mcp_transport_internal_error with the cause message. When no headers have been sent,
    the answer is an empty HTTP 500. No node held in the specification states either behavior. The node
    that does state an internal-error message over MCP, "Internal error in MCP handler.", concerns handler
    failures and is not this path.
- file: src/middleware/auth.ts
  where: buildJwksUrl(), lines 85-88
  evidence: return new URL(`${base}/.well-known/jwks.json`);
  cost: The fixed location of the auth provider's key set, which every token verification depends on,
    lives only in this function and in project instructions. A reader looking in the specification for
    where the signing keys come from finds no node. The comment calls the path "part of the spec's trust
    boundary", but no node says so.
- file: src/middleware/auth.ts
  where: buildNeonAuth(), createRemoteJWKSet options, lines 105-108
  evidence: "createRemoteJWKSet(buildJwksUrl(env.NEON_AUTH_URL), {\n      cacheMaxAge: env.NEON_AUTH_JWKS_TTL_S\
    \ * 1000,\n      cooldownDuration: 30_000,\n    });"
  cost: The 30-second wait between key-set refetches is a value the code applies and no node states. It
    decides how soon a rotated signing key is accepted, but a reader looks for it in the specification
    and finds nothing. The comments name "10 min" and "30 s" as "the spec" and cite knowledge-graph.back.md.
    No node in the specification root holds either figure.
- file: src/middleware/error-handler.ts
  where: The logger call in errorHandler, lines 54-65, with the log levels assigned in classify() (warn
    for auth, validation and framework 4xx failures; error for framework 5xx failures).
  evidence: "logger[logLevel](\n  {\n    request_id: request.id,\n    route: request.routeOptions?.url\
    \ ?? request.url,\n    method: request.method,\n    error_code: envelope.error.code,\n    cause_message:\
    \ err.message,\n    cause_name: err.name,\n  },\n  \"request_failed\"\n);"
  cost: The log event name request_failed, its fields, and the choice of level per cause (a 5xx framework
    failure at error, every 4xx at warn) are emitted behavior that no node holds. The only logging nodes
    are constraints/expected-refusals-not-logged-as-errors, which bounds business and validation refusals,
    and constraints/curation-write-failure-logged, which names a different event, curation_request_failed.
    The generic failure log lives only here, and an operator tuning alerts would find it in the code and
    not in the specification.
- file: src/modules/chat/routes/conversations.routes.ts
  where: emitChatBootLog(), the block at lines 1295-1304 that logs chat.deprecated_env
  evidence: "if (process.env.CHAT_SUMMARY_AFTER_TURNS !== undefined) {\n  deps.logger.info(\n    {\n \
    \     event: \"chat.deprecated_env\",\n      name: \"CHAT_SUMMARY_AFTER_TURNS\",\n      reason: \"\
    retired_as_gate_v2_9\",\n    },\n    \"chat deprecated env var detected (BR-33 v2.9 — retired as gate)\"\
    \n  );\n}"
  cost: The log line tells the operator that the turn-count gate for the rolling summary is retired and
    that the setting is ignored. A search of the specification for CHAT_SUMMARY_AFTER_TURNS finds no node
    that holds this. The only record of that decision is a log message, so a reader checking the specification
    for the refresh trigger will not find that the setting was retired.
- file: src/modules/chat/routes/conversations.routes.ts
  where: emitTurnLog(), lines 1583-1611 (the aborted classification and the chat_turn_total counter)
  evidence: "const aborted =\n  args.stopReason === \"cancelled\" || args.stopReason === \"turn_timeout\"\
    ;\n...\naborted,\nidempotent_replay: args.idempotentReplay,\ncounter: {\n  name: \"chat_turn_total\"\
    ,\n  labels: { stop_reason: args.stopReason },\n  value: 1,\n},"
  cost: The classification of cancelled and turn_timeout as the stop reasons that count as aborted, and
    the metric chat_turn_total labelled by stop reason, are defined only in this logging helper. A search
    of the specification for aborted, chat_turn_total, idempotent_replay and chat.turn finds no node that
    holds them. Anyone calibrating or auditing chat turns will look in the specification for what counts
    as an aborted turn and will not find it.
- file: src/modules/chat/service/chat-agent.service.ts
  where: the MAX_TOKENS_PER_ITERATION constant (line 53) and its use in the model request (line 255)
  evidence: 'const MAX_TOKENS_PER_ITERATION = 4096; ... max_tokens: MAX_TOKENS_PER_ITERATION,'
  cost: A cap of 4096 output tokens on every model call of a turn decides when the model's answer is cut
    and the turn ends as max-tokens. No node holds the value (a search of the specification found no 4096
    and no per-call output limit). The next reader looks for the limit in the specification and finds
    only the model-call count limit.
- file: src/modules/chat/service/chat-agent.service.ts
  where: 'the failure envelopes handed to the model: unknown tool (lines 416-423), tool timeout (lines
    634-639), tool handler throw (lines 672-679)'
  evidence: 'error: { code: "VALIDATION_INVALID_FORMAT", message: "unknown tool name" } ... code: "SYSTEM_SERVICE_UNAVAILABLE",
    message: "tool timeout" ... code: "SYSTEM_INTERNAL_ERROR", message: errMessage(err) ?? "tool handler
    threw"'
  cost: 'rules/chat/tool-failure-continues-turn says only that a failed tool call "hands its failure to
    the assistant". The error codes and messages the assistant is told are decided here: VALIDATION_INVALID_FORMAT
    for an unknown tool, SYSTEM_SERVICE_UNAVAILABLE for a timeout, and the thrown error''s own message
    for a handler that threw. No node holds them. This text is sent to the model and also surfaces in
    the tool_result error_message events. The next reader looks for it in the specification and finds
    only the continuation rule.'
- file: src/modules/chat/service/tool-catalog.ts
  where: buildChatToolCatalog, the missingIngest.length > 0 branch (lines 173-186)
  evidence: 'logger?.error({ event: "chat.tool_catalog_partial_resolution", requested, resolved: Object.keys(resolvedIngest),
    missing: missingIngest, }, "chat ingestion tool portion partially resolved — falling back to 13-tool
    catalog (BR-44 step 6)")'
  cost: The code emits an error-level log named chat.tool_catalog_partial_resolution when directed ingestion
    is enabled but not registered, and it then serves the catalog without that tool. No node in the specification
    states that event or that error-level log. The nearest nodes, constraints/chat-toolset and rules/chat/chat-toolset-requires-every-query-tool,
    cover the toolset's content and the requirement that every query tool is available. They do not cover
    this log or its event name. The specification already gives a comparable logged event its own node
    (constraints/curation-write-failure-logged), so a reader looking there for this event will not find
    it. Anyone who monitors or alerts on this event name depends on a name that only the code holds.
- file: src/modules/curation/mcp/curation-transport.ts
  where: the `path` option of the mountMcpEndpoint call, line 41
  evidence: 'path: "/mcp/curation",'
  cost: The address clients use to reach the curation toolset exists only here. No node in the specification
    states the endpoint's path. Searching the specification for `mcp/curation` found nothing, and the
    candidate index has no match. A reader who looks in the specification for where the curation endpoint
    is served will not find it, and the code becomes the place that decision lives.
- file: src/modules/curation/routes/curation.routes.ts
  where: the warn log line in the GET /metrics catch block, lines 169-186
  evidence: "deps.logger.warn(\n  { route: \"GET /api/v1/curation/metrics\", operation: \"getCurationMetrics\"\
    , transport: \"rest\", original_status: statusCode, outcome: degradedStatus, error_code: degradedEnvelope.error.code,\
    \ error_class: ..., cause_message: ... },\n  \"curation_metrics_degraded\"\n);"
  cost: The system emits a log event, a level, a trigger (a 500, or an error-level mapping) and a set
    of fields for a degraded metrics read. No node I read or searched for holds any of them. The sibling
    constraint curation-write-failure-logged shows that this project specifies such log events. A reader
    looking in the specification for what is logged when the metrics read degrades finds nothing, and
    the file becomes the only place that behaviour lives.
- file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: the ingest_document handler's Zod-failure branch, lines 254-268
  evidence: "message: \"ingest_document arguments failed validation.\", details: {\n  issues: parsed.error.issues.map((i)\
    \ => ({"
  cost: The wording the tool sends back for a malformed ingest_document request lives only in this file.
    The contract fixes the sibling message "ingest_directed arguments failed validation." and its log
    records that decision. For ingest-document it says only "listing each failing field with its path
    and message". A reader looking in the specification finds no wording, and the next edit of the string
    changes what callers see without any node moving.
- file: src/modules/ingestion/service/extraction.service.ts
  where: MAX_TURNS_PER_CHUNK and the exit after the for loop in runChunkLoop, lines 625-627 and 749-755
  evidence: '"const MAX_TURNS_PER_CHUNK = 64;" and "input.logger.warn({ llm_run_id: input.llmRunId, turns:
    MAX_TURNS_PER_CHUNK }, \"extraction_chunk_turn_cap_reached\"); return { kind: \"completed\" };"'
  cost: A chunk that has not reached end_turn after 64 model turns is closed as completed and the run
    goes on. No node in the specification holds the figure or the rule. I searched the extraction rules
    (extraction-reads-chunks-in-order, extraction-turn-token-ceiling, extraction-fails-on-repeated-system-errors,
    extraction-closes-its-run) and the ingestion contract. The next reader will look for it in the specification
    and will not find it. The code then decides when an unfinished chunk counts as done.
restates:
- file: src/config/env.ts
  where: lines 206-211 and 251-257, the comments above OWNER_TZ and above the Intl.DateTimeFormat check
  evidence: "an invalid / unknown zone -> the BFF refuses to start\n  //   (`InvalidOwnerTimezoneError`,\
    \ fail-closed)."
  cost: The rule that an unknown zone stops startup is also prose in two places beside the try/catch that
    enforces it, so it has to be kept in step with the node by hand.
  node: constraints/owner-time-zone-must-be-known
- file: src/config/env.ts
  where: lines 230-235, the comment above the NODE_ENV guard in loadEnv
  evidence: "The static bearer must NEVER be honored outside\n  // development. ... an absent or non-development\n\
    \  // `NODE_ENV` with a token present refuses startup rather than fail open."
  cost: The refusal rule is also prose in a second place beside the branch that enforces it, so the two
    can drift unnoticed.
  node: constraints/local-operator-token-needs-explicit-development
- file: src/config/env.ts
  where: lines 67-73, the comment above LOCAL_OPERATOR_TOKEN
  evidence: "Ignored entirely\n  // outside development, so it can never weaken a production deployment.\
    \ Min\n  // length 16 so it is not trivially guessable."
  cost: The 16-character minimum is also written as prose beside the schema line that enforces it. Prose
    in a second place has to be kept in step with the node by hand.
  node: constraints/local-operator-token-minimum-length
- file: src/config/env.ts
  where: lines 79-82, the comment above ANTHROPIC_API_KEY
  evidence: "Missing key at boot is a fatal config error; absence\n  // here causes the process to refuse\
    \ to start (acceptance criterion of\n  // TC-12)."
  cost: The start-refusal rule is also prose beside the required schema line, so it has to be kept in
    step with the node by hand.
  node: constraints/anthropic-key-required
- file: src/config/logger.ts
  where: header comment, lines 7-9, and the docstring above REDACT_PATHS, lines 15-20
  evidence: '// PII rule (CLAUDE.md "Security"): the `content`, `text`, and `value` fields // of any logged
    object are redacted at every nesting depth'
  cost: The comment restates the node's rule as a second home, outside behavior, and claims full-depth
    coverage that the paths do not deliver. A reader who trusts the comment will not look for the one-level
    limit in the code.
  node: constraints/logs-redact-text-fields
- file: src/mcp/server.ts
  where: the doc comment on McpServer.getTool, line 111
  evidence: "Returns `undefined` for unknown\n   * keys; the transport layer turns that into a `NOT_FOUND`\
    \ envelope."
  cost: The refusal code for a tool outside an endpoint's toolset is stated in prose here as well as in
    the transport that emits it. A reader of getTool takes this comment as where NOT_FOUND is decided,
    and it can drift from the transport without anything flagging it. This file's code holds none of it,
    since getTool only returns undefined.
  node: constraints/mcp-endpoint-serves-only-its-toolset
- file: src/middleware/auth.ts
  where: comments at lines 110-113 and 132-136 above and inside the local operator bypass
  evidence: '// DEV-ONLY local operator bypass (see config/env.ts LOCAL_OPERATOR_TOKEN). // Resolved once
    at build time: enabled only when running in development AND a // token is configured. In any other
    mode this is `null` and the bypass branch // below is dead — production never trusts a static bearer.'
  cost: The development-only admission rule is stated again in prose. The code holds it in `env.NODE_ENV
    === "development"` and `constantTimeEqual`. A second statement of the rule could be changed or read
    without the node.
  node: constraints/local-operator-token-development-only
- file: src/middleware/auth.ts
  where: the file header comment, lines 9-12 ("Error mapping (registered in docs/specs/_global/error-codes.md)")
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md): //   - Missing/malformed
    `Authorization` header     -> 401 AUTH_UNAUTHORIZED //   - Token expired (exp <= now)                   ->
    401 AUTH_TOKEN_EXPIRED //   - Bad signature / wrong issuer / not a JWT     -> 401 AUTH_TOKEN_INVALID'
  cost: The refusal mapping is written a second time in prose, with a registry path outside the specification
    as its stated authority. The next reader trusts the comment or that registry instead of the contract,
    and the comment already differs from it. It says "wrong issuer", but the code sets no issuer check.
    It leaves out the missing-`sub` refusal.
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: The comment above the logger call in errorHandler, lines 52-53.
  evidence: '// Log every failure with full context — but never the request body // (PII rule: pino redaction
    handles `req.body.content/text/value`).'
  cost: 'The comment states that content, text and value fields are redacted from logs. This file only
    logs request_id, route, method, error_code, cause_message and cause_name, and does nothing to redact.
    The redaction is held by REDACT_PATHS and `censor: "[REDACTED]"` in src/config/logger.ts. A reader
    of this file would look for the redaction here, not find it, and have no pointer to where it lives.'
  node: constraints/logs-redact-text-fields
- file: src/middleware/error-handler.ts
  where: The header comment, lines 11-19 ("Error mapping" and the 500-path paragraph), and the comment
    inside the framework-HTTP-error branch of classify(), lines 140-142.
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md): //   - AuthError                    ->
    401 (code from AuthError.code) //   - ZodError                     -> 422 VALIDATION_INVALID_FORMAT
    //   - pg error: ECONNREFUSED / ETIMEDOUT / 57P03 / 57014 -> 503 SYSTEM_SERVICE_UNAVAILABLE //   -
    Any other unhandled error    -> 500 SYSTEM_INTERNAL_ERROR // The handler MUST NOT leak internal messages
    on the 500 path and "// Never leak an internal message on a 5xx path (the file contract):"'
  cost: The status and error-code mapping and the withheld cause are written a second time as prose. Code
    holds them in classify() in this file and in internalError(), serviceUnavailableError() and isPgUnavailable()
    in src/shared/error-mapping.ts. When the access contract moves, nothing ties this prose to it, and
    a reader can take the comment for the decision. The comment also names docs/specs/_global/error-codes.md
    as the registry, which is not the specification.
  node: contracts/knowledge-base/access
- file: src/modules/curation/mcp/curation-transport.ts
  where: the header comment, lines 8-11, above the imports
  evidence: // `curation` toolset key on the shared registry). NO X-LLM-Run-Id — both the // owner (REST)
    and the LLM (MCP) drive the SAME service layer; the write-side
  cost: 'A comment restates that a curation call over MCP needs no run identity. The code already holds
    this, because the handler is mounted as `handler: t.handler as (input: unknown) => Promise<McpEnvelope>`
    and receives only the tool input. A second statement of the rule sits in prose, so the next reader
    may take the comment, rather than the node, as where the rule was decided.'
  node: constraints/curation-mcp-needs-no-run-identity
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment above the GET /metrics handler, lines 126-135
  evidence: '// Wraps the shared mapper with a graceful-degradation override: ANY residual // 500 outcome
    is re-mapped to 503 SYSTEM_SERVICE_UNAVAILABLE so the front // spec MetricsStrip (R1) can fall back
    to per-kind totals from /queue. 401 // auth failures and 2xx responses are NEVER degraded.'
  cost: 'The comment restates the metrics refusal that the node holds: when the metrics cannot be read,
    the answer is HTTP 503 SYSTEM_SERVICE_UNAVAILABLE. The code holds the same thing in this file at `const
    degradedStatus = statusCode === 500 ? 503 : statusCode`. The comment also adds a rationale (a front-end
    MetricsStrip fallback) and a "401 ... NEVER degraded" claim. Neither of those appears in any node
    I opened.'
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment above the `logLevel === "error"` branch in sendError, lines 87-93
  evidence: '// Infra / unknown faults (logLevel "error": pg unavailable, unhandled // exceptions) have
    their `err.message` masked in the envelope. Log the // original server-side so the cause is not lost'
  cost: The comment says again that an unreachable-store write failure is logged with its cause. The code
    holds that fact at the `logger.error(... "curation_request_failed")` call just below it. A second
    account of the fact sits beside the node's own, and if the node moves the comment goes on claiming
    the old behaviour.
  node: constraints/curation-write-failure-logged
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment inside the GET /metrics handler, lines 145-149
  evidence: // Bare success body — consistent with every other curation REST // endpoint (queue/confirm/reject/...).
    The SPA's httpCuration returns // the raw 2xx JSON, so an `{ ok, result }` wrapper here would surface
  cost: The comment restates that the metrics success is an HTTP 200 with no envelope, which the node
    holds. The code holds it at `return reply.status(200).send(result);`. The comment is a second account
    of a contract fact, and it names SPA internals.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the same comment in sendError, lines 90-93
  evidence: '// Expected client-driven // faults (logLevel "warn": business / validation / not-found)
    are NOT logged // here, matching the pre-refactor behaviour and avoiding log noise.'
  cost: The comment restates that business and validation refusals are not logged at error level. The
    `if (logLevel === "error")` gate in this file holds that fact. The comment is a second home outside
    behaviour, and its reference to "pre-refactor behaviour" points to a history the specification does
    not carry.
  node: constraints/expected-refusals-not-logged-as-errors
- file: src/modules/ingestion/service/extraction.service.ts
  where: the comment block above ANTHROPIC_REQUEST_TIMEOUT_MS and ANTHROPIC_MAX_RETRIES, lines 190-199
  evidence: '"// A5 — bound the per-request wait on the Anthropic API so a stalled stream ... so a 5-minute
    ceiling is generous headroom ... `maxRetries` is pinned explicitly (matches the SDK default) so transient
    429/529/network blips self-heal without inflating cost."'
  cost: The comment states the five-minute wait and the retry bound a second time, in prose. The constants
    below it already hold both. If the node moves, a reader updating the code is also left with prose
    that still states the old figures, and the prose is not bound to the node.
  node: constraints/extraction-model-call-bounded
unbound:
- src/mcp/server.ts
- src/mcp/stdio-tools.ts
- src/server.ts
adopted: true
unheld:
- node: constraints/retrieval-transports-answer-alike
  how: 'read on 19 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
pairs_omitted:
- node: constraints/every-operation-requires-owner-authentication
  file: src/middleware/auth.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/local-operator-token-development-only
  file: src/middleware/auth.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/internal-failure-withholds-cause
  file: src/middleware/error-handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/unreachable-store-answers-unavailable
  file: src/middleware/error-handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/archived-conversation-takes-no-turn
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-answer-recorded
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/cancel-requires-turn-in-flight
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-toolset-requires-every-query-tool
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-archived
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-request-check-order
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-update-names-a-field
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distillation-follows-live-turn
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-requires-catalog-snapshot
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotency-match
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotent-recovery
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotent-replay
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/message-listing-pages-backwards
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/one-turn-in-flight
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/owner-message-recorded-first
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/recording-failure-keeps-stream
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/replay-reports-failure
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/chat/send-message-check-order
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/chat/tool-call-recorded
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-cancel
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-failure-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-default
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-text-withholds-system-prompt
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/iteration-recorded
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-failure-continues-turn
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-invocation-carries-turn
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-result-truncated
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-cancel
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-ends-once
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-failure-stop-reason
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-limit-before-cancel
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-call-limit
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-one-tool-at-a-time
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-reports-last-model
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-time-limit
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-tokens-summed
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-toolset-requires-every-query-tool
  file: src/modules/chat/service/tool-catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/mcp/curation-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/llm-toolset-omits-curation-metrics
  file: src/modules/curation/mcp/curation-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/routes/curation.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-request-checked-first
  file: src/modules/curation/routes/curation.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/modules/ingestion/mcp/transport.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/affected-nodes-only-when-completed
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-closes-its-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-fails-on-repeated-system-errors
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-requires-running-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/model-refusal-skips-chunk
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 19 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-test-intent-constraints.returns/.

  Staged as an adoption of source no delivery wrote: 14 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  A finding in src/middleware/error-handler.ts names contracts/knowledge-base/access, which no file of
  this set is bound to: Branch 3 of classify() (the isFastifyValidationError branch), lines 108-123.:
  message: err.message ?? "Request payload failed validation.", details: err.validation, — The access
  contract answers every validation failure with the message "Request payload failed validation." and
  `details` a bare list of `{ path, message }`. Its decision log records that a caller cannot tell which
  validator ran. This branch forwards the framework''s own message and its raw validation array as `details`.
  A request rejected by Fastify''s built-in schema validation therefore gets a different message and a
  different details shape from one rejected by Zod, and the caller can tell the two validators apart..
  It blocks nothing here; it is owed a route of its own.

  Candidates: 16 opened across 8 of 19 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 26 fact(s) the source states that no node holds, over 13 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.

  Restates: 16 place(s) where text in the source restates a node''s fact the code holds, over 8 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-test-intent-constraints.returns/`, which are the evidence behind every entry above.
