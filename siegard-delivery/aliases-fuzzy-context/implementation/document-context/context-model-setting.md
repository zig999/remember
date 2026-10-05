---
target: backend
task: sha256:7146350457343f000b1ddb8e966b87355f0c58b53dc889afeeeabfd513adb753
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-context-model-setting-build
title: Context model setting threaded to every orchestrator entry point
summary: The environment now yields a context model (claude-haiku-4-5 when none is configured), and the REST run route, the MCP ingest toolset and the stdio server each hand it to the extraction orchestrator through its dependency type.
files:
- path: src/config/env.ts
  effect: The env schema gains CONTEXT_MODEL (non-empty string). With no value set, loadEnv yields DEFAULT_CONTEXT_MODEL, "claude-haiku-4-5", a newly exported named constant. With a value set, loadEnv yields that value. The file's comments were removed and its behavior is otherwise unchanged.
- path: src/modules/ingestion/service/extraction.service.ts
  effect: RunExtractionDeps.env now requires CONTEXT_MODEL beside ANTHROPIC_API_KEY, so every caller of the orchestrator must supply it. The orchestrator body is unchanged and does not read the field yet. The swallow-catch in closeRunSafe became `.catch(() => undefined)` with the same behavior, so removing comments left no empty catch block. All comments were removed.
- path: src/modules/ingestion/routes/ingestion.routes.ts
  effect: IngestionRouteDeps.env now requires CONTEXT_MODEL beside ANTHROPIC_API_KEY. POST /llm-runs/:llmRunId/run passes the whole env object to runLlmExtraction, so the orchestrator receives the configured context model. Comments were removed.
- path: src/modules/ingestion/mcp/ingest-document.handler.ts
  effect: IngestDocumentDeps gains a required contextModel. A new buildExtractionDeps helper builds the orchestrator dependencies, with env { ANTHROPIC_API_KEY, CONTEXT_MODEL }, so ingest_document hands the configured context model to runLlmExtraction. The inline construction left ingestDocumentHandler, which is shorter as a result. Comments were removed.
- path: src/modules/ingestion/mcp/ingest-toolset.ts
  effect: IngestToolsetDeps.env now requires CONTEXT_MODEL. The ingest_document tool forwards it to ingestDocumentHandler as contextModel. The propose_* tools, ingest_directed and the read-only tools are unchanged, and the tool descriptions (which live in other files) are untouched. Comments were removed.
- path: src/app.ts
  effect: Passes env.CONTEXT_MODEL into registerIngestionRoutes (REST run route) and into registerIngestToolset (MCP ingest toolset). Routing and registration are otherwise unchanged. Comments were removed.
- path: src/mcp-stdio.ts
  effect: Passes env.CONTEXT_MODEL, read from the loadEnv() result, into registerIngestToolset, so the stdio server hands the configured context model to the orchestrator. Boot and shutdown sequence unchanged. Comments were removed.
criteria:
- criterion: With no context model configured, the context model the environment yields is claude-haiku-4-5.
  met: true
  how: envSchema declares CONTEXT_MODEL as z.string().min(1).default(DEFAULT_CONTEXT_MODEL), and DEFAULT_CONTEXT_MODEL is "claude-haiku-4-5" (src/config/env.ts). loadEnv on a source without CONTEXT_MODEL returns that value on Env.CONTEXT_MODEL.
- criterion: With a context model configured, the environment yields that model.
  met: true
  how: The same schema field accepts any non-empty string, and the parsed value reaches Env.CONTEXT_MODEL unchanged. An empty string is refused as an env validation error, not treated as "none configured".
- criterion: The REST run-extraction route hands the configured context model to the orchestrator.
  met: true
  how: 'app.ts passes env: { ANTHROPIC_API_KEY, CONTEXT_MODEL: env.CONTEXT_MODEL } to registerIngestionRoutes. The POST /llm-runs/:llmRunId/run handler in ingestion.routes.ts passes that env object as runLlmExtraction''s deps.env. RunExtractionDeps.env requires CONTEXT_MODEL, so omitting it is a type error.'
- criterion: The MCP ingest toolset hands the configured context model to the orchestrator.
  met: true
  how: app.ts passes CONTEXT_MODEL in registerIngestToolset's env. The ingest_document tool in ingest-toolset.ts forwards it as contextModel. buildExtractionDeps in ingest-document.handler.ts puts it in RunExtractionDeps.env.CONTEXT_MODEL for the runExtraction call.
- criterion: The stdio server hands the configured context model to the orchestrator.
  met: true
  how: 'mcp-stdio.ts passes CONTEXT_MODEL: env.CONTEXT_MODEL in registerIngestToolset''s env, which takes the same ingest_document path to the orchestrator as above.'
nodes:
- node: rules/knowledge-base/document-context-model
  encoded_at:
  - src/config/env.ts
  - src/modules/ingestion/service/extraction.service.ts
  how: Only the "configured, or claude-haiku-4-5 where none is configured" clause is encoded. env.ts holds the default and the configured value, and RunExtractionDeps.env.CONTEXT_MODEL is the channel that carries it to the orchestrator from the three entry points. The clause "a document context is produced under" that model is not encoded, because no criterion of this task requires it. The orchestrator receives the value and does not use it. This is the gap the task's UNDERDETERMINED note names, and it is left to the task that produces the preliminary reading. The neighbouring node domain/knowledge-base/document-context (its `model` attribute) was not reached.
inferences:
- inferred: The environment variable is named CONTEXT_MODEL, and the dependency field is CONTEXT_MODEL in the orchestrator, route and toolset env fragments. The handler's dependency field is contextModel.
  from: No node names the variable. It follows the sibling model settings INGEST_MODEL, CHAT_MODEL and CHAT_UTILITY_MODEL in src/config/env.ts, and the task's own wording, "context model setting".
- inferred: CONTEXT_MODEL is a required property of the orchestrator, route and toolset env types, and contextModel is required on IngestDocumentDeps. It is not optional with a second default at each layer.
  from: The single default lives in env.ts. A required field turns an entry point that forgets to hand over the model into a type error. INGEST_MODEL is likewise required in IngestToolsetDeps.env. Tests are excluded from tsconfig, so existing specs that build partial env objects still compile, and at runtime they hand the orchestrator an undefined it ignores.
- inferred: An empty CONTEXT_MODEL is refused at boot (min(1)) and does not fall back to the default.
  from: The existing INGEST_MODEL, CHAT_MODEL and CHAT_UTILITY_MODEL declarations use z.string().min(1).default(...).
- inferred: The project rule "source carries no comments" was applied to the seven files this delivery writes whole, so the existing comments in them were removed. The swallow-catch in closeRunSafe was rewritten as `.catch(() => undefined)` so that removing its comment did not leave an empty catch block, which the lint rule no-empty would flag.
  from: 'The framework rule that a session writing a source file delivers it whole under the comment rule, and eslint.config.js (''no-empty'': ''error''). Existing `.catch(() => undefined)` use in mcp-stdio.ts is the precedent for the form.'
- inferred: The default model string is a named exported constant, DEFAULT_CONTEXT_MODEL, and not an inline literal like the neighbouring model defaults.
  from: Standard rule TYP-04 (a value with meaning is a named constant).
divergences:
- cites: MNT-01
  file: src/app.ts
  departure: buildApp remains far over thirty lines. The edit adds one env property to each of two existing call sites and does not split the function.
  why: The function was already over the limit before this task. Splitting the app factory is a refactor outside the objective, so it is disclosed and not changed.
- cites: MNT-01
  file: src/mcp-stdio.ts
  departure: main remains far over thirty lines. The edit adds one property to an existing env object literal.
  why: The function was already over the limit, and restructuring the stdio boot sequence reaches past the task.
- cites: MNT-01
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  departure: registerIngestToolset remains over thirty lines. The edit adds one property to the ingest_document call and one to the env type.
  why: The function registers every ingest tool in one body before this task, and splitting it is outside the objective.
- cites: MNT-01
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  departure: ingestDocumentHandler remains over thirty lines. Building the orchestrator dependencies moved out into buildExtractionDeps, which shortened the function, but the rest of the body was left alone.
  why: Further splitting would reach past the task. The new helper keeps this task from adding lines to an oversized function.
preserved:
- loadEnv still refuses a missing DATABASE_URL, NEON_AUTH_URL or ANTHROPIC_API_KEY. It still refuses LOCAL_OPERATOR_TOKEN outside an explicit NODE_ENV=development, and it still validates OWNER_TZ.
- The INGEST_MODEL default remains claude-sonnet-4-6. The ingest_document run model remains input.model, then ingestModel, then DEFAULT_INGEST_MODEL.
- POST /api/v1/ingest/llm-runs/:llmRunId/run keeps its status mapping (404, 409, 502, 500) and its empty strict body.
- The ingest_document intake, noop_existing and error envelope paths, and the extraction failure mapping, are unchanged.
- The orchestrator's per-chunk loop, tool dispatch, run close and read-back are unchanged. The run is still extracted under run.model.
- The MCP tool descriptions and schemas advertised by tools/list are untouched, and the stdio closed tool set is unchanged.
- The REST mirrors propose-fragment, propose-node, propose-link and propose-attribute, and the retry route, are unchanged.
deferred:
- what: The orchestrator receives CONTEXT_MODEL and does not use it. The preliminary document reading, and its production "under the configured context model", are not implemented.
  why: No criterion of this task requires it, and the task's UNDERDETERMINED note says the clause has to reach a criterion in another task. Implementing the reading here would widen the task.
- what: backend/.env.example and any deployment documentation do not yet list CONTEXT_MODEL. No unit test of env.spec.ts or of the entry-point wiring covers the new setting.
  why: They are outside the source this task wrote. Documentation of configuration is not source, and tests are another judge's work.
- what: A DB-down-style gap remains where `loadEnv` accepts any non-empty string as the context model, with no check that it names a real Anthropic model.
  why: No node states a closed set of models, and the sibling model settings behave the same way, so a closed set would be a fact the specification does not hold.
---

## What it is

The environment now yields a context model (claude-haiku-4-5 when none is configured), and the REST run route, the MCP ingest toolset and the stdio server each hand it to the extraction orchestrator through its dependency type.

## Notes

The orchestrator receives CONTEXT_MODEL and does not use it yet; producing the document context under that model is the preliminary-reading task's.
