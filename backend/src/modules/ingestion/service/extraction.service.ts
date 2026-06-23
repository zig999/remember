// Extraction orchestrator — TC-12 / BR-26 / UC-12.
//
// Synchronous, in-process orchestrator. Drives Anthropic via the official
// SDK in a MANUAL tool-use loop (NOT the SDK's tool runner — BR-26 says
// "manual loop"). Per chunk it issues `client.messages.stream({...})
// .finalMessage()`, then for each `tool_use` block in the response it
// dispatches to the matching transport-agnostic service (TC-09), capturing
// the verbatim MCP envelope. The loop terminates at `stop_reason ===
// 'end_turn'` (or `'refusal'` — soft skip; or `'pause_turn'` — resume once
// without modifying messages).
//
// Transaction policy (BR-19, BR-26 §"Transaction policy"):
//   The orchestrator NEVER wraps the chunk loop or the run loop in a
//   transaction. Each tool dispatch goes through `runIngestHandler`, which
//   opens one transaction per tool call, writes the audit row in the same
//   TX on success, and a separate short audit TX on rollback (BR-23). The
//   orchestrator never holds a `pg` client across tool calls (BR-19,
//   §6 "Anthropic API" row of `ingestion.back.md`).
//
// Error paths:
//   - run not 'running' at entry           -> RunNotRunnableError (409)
//   - run id unknown                       -> ResourceNotFoundError (404)
//   - >=3 consecutive 'error' outcomes      -> ExtractionFatalError (500)
//   - Anthropic SDK fatal error mid-run    -> LlmProviderFatalError (502)
//   - any other uncaught exception         -> ExtractionFatalError (500)
//
// All four close the run as `failed` in a fresh short transaction (BR-26
// step 7) BEFORE the exception is thrown out. Successful completion closes
// the run as `completed` (BR-26 step 6).
//
// ANTHROPIC_API_KEY (BR-29): the key is read from `env` at orchestrator
// init. It MUST NOT appear in logs, responses, stack traces, or `tool_call`
// rows. The orchestrator never serialises `env` to log payloads.

import type Anthropic from "@anthropic-ai/sdk";
import { default as AnthropicClient } from "@anthropic-ai/sdk";
import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  IngestToolDescriptions,
  IngestToolInputJsonSchemas,
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import type { LlmRunResponse } from "../dto/llm-run.dto.js";
import {
  proposeAttributeHandler,
} from "../mcp/propose-attribute.handler.js";
import {
  proposeFragmentHandler,
} from "../mcp/propose-fragment.handler.js";
import {
  proposeLinkHandler,
} from "../mcp/propose-link.handler.js";
import {
  proposeNodeHandler,
} from "../mcp/propose-node.handler.js";
import type { McpEnvelope } from "../mcp/handler-base.js";
import {
  closeLlmRunRow,
  findLlmRunById,
} from "../repository/llm-run.repository.js";
import { findChunksByRawInformationId, findRawInformationById } from "../repository/ingestion.repository.js";

import { type DocumentMetadata } from "../prompts/extraction.v1.js";
import { selectPromptModule, type PromptModule } from "../prompts/index.js";
import { ResourceNotFoundError } from "./ingestion.service.js";
import {
  aggregateToolCallOutcomes,
} from "../repository/llm-run.repository.js";
import {
  createAffectedNodeCollector,
  resolveAffectedNodes,
  setCachedAffectedNodes,
  type AffectedNode,
  type AffectedNodeCollector,
} from "./affected-nodes.js";

// --------------------------------------------------------------------------
// Public error sentinels — caller maps to HTTP envelope.
// --------------------------------------------------------------------------

/** 409 BUSINESS_RUN_NOT_RUNNABLE — pre-check failure (UC-12 alt 2b). */
export class RunNotRunnableError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_RUN_NOT_RUNNABLE" as const;
  public readonly llmRunId: string;
  public readonly currentStatus: "running" | "completed" | "failed";

  constructor(
    llmRunId: string,
    currentStatus: "running" | "completed" | "failed"
  ) {
    super(
      `LLMRun ${llmRunId} is in status '${currentStatus}' and cannot be extracted ` +
        `(only 'running' is runnable; reopen a failed run via retryLlmRun first).`
    );
    this.name = "RunNotRunnableError";
    this.llmRunId = llmRunId;
    this.currentStatus = currentStatus;
  }
}

/** 502 SYSTEM_LLM_PROVIDER_UNAVAILABLE — Anthropic SDK fatal error (UC-12 alt 4a). */
export class LlmProviderFatalError extends Error {
  public readonly statusCode = 502;
  public readonly code = "SYSTEM_LLM_PROVIDER_UNAVAILABLE" as const;
  public readonly llmRunId: string;
  public readonly partialRun: LlmRunResponse;

  constructor(
    llmRunId: string,
    causeMessage: string,
    partialRun: LlmRunResponse
  ) {
    super(
      `Anthropic SDK fatal error during LLMRun ${llmRunId}: ${causeMessage}.`
    );
    this.name = "LlmProviderFatalError";
    this.llmRunId = llmRunId;
    this.partialRun = partialRun;
  }
}

/** 500 SYSTEM_INTERNAL_ERROR — >=3 consecutive errors OR uncaught exception. */
export class ExtractionFatalError extends Error {
  public readonly statusCode = 500;
  public readonly code = "SYSTEM_INTERNAL_ERROR" as const;
  public readonly llmRunId: string;
  public readonly partialRun: LlmRunResponse;

  constructor(
    llmRunId: string,
    reason: string,
    partialRun: LlmRunResponse
  ) {
    super(`Extraction fatal failure for LLMRun ${llmRunId}: ${reason}.`);
    this.name = "ExtractionFatalError";
    this.llmRunId = llmRunId;
    this.partialRun = partialRun;
  }
}

// --------------------------------------------------------------------------
// Anthropic SDK abstraction — keeps the orchestrator testable without
// hitting the network. The real client is `new Anthropic({ apiKey })`; the
// tests pass a stub object with the same shape.
// --------------------------------------------------------------------------

/**
 * Minimal surface of `Anthropic.Messages.MessageCreateParamsStreaming` the
 * orchestrator actually sets. We avoid importing the full streaming params
 * to keep the seam narrow.
 */
export interface ExtractionMessageRequest {
  readonly model: string;
  // `string` OR a content-block array carrying cache_control (prompt caching,
  // P0). A breakpoint on the system block caches the tools+system prefix.
  readonly system: string | readonly Anthropic.Messages.TextBlockParam[];
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly thinking: { type: "adaptive" };
  readonly max_tokens: number;
  readonly messages: Anthropic.Messages.MessageParam[];
}

/**
 * Minimal surface of `MessageStream` — only `finalMessage()` is consumed.
 * The orchestrator never iterates raw stream events.
 */
export interface ExtractionMessageStream {
  finalMessage(): Promise<Anthropic.Messages.Message>;
}

/** Injectable Anthropic-like client. */
export interface AnthropicLike {
  readonly messages: {
    stream(req: ExtractionMessageRequest): ExtractionMessageStream;
  };
}

/** Factory injected by the route or by tests. */
export type AnthropicFactory = (apiKey: string) => AnthropicLike;

// A5 — bound the per-request wait on the Anthropic API so a stalled stream
// cannot keep an extraction turn pending for the SDK's loose implicit default
// (~10 min). A single extraction turn emits at most `MAX_TOKENS` (8000) output
// tokens plus adaptive thinking and completes in well under a minute in
// practice, so a 5-minute ceiling is generous headroom while halving the
// worst-case stall before the turn is aborted-and-retried. `maxRetries` is
// pinned explicitly (matches the SDK default) so transient 429/529/network
// blips self-heal without inflating cost. This does NOT change the latency of a
// healthy run; it only caps a pathological hang. (If per-deployment tuning is
// ever needed, promote these to env vars alongside `PG_STATEMENT_TIMEOUT_MS`.)
const ANTHROPIC_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
const ANTHROPIC_MAX_RETRIES = 2;

/** Default factory — used by the route handler. */
export const defaultAnthropicFactory: AnthropicFactory = (apiKey) =>
  new AnthropicClient({
    apiKey,
    timeout: ANTHROPIC_REQUEST_TIMEOUT_MS,
    maxRetries: ANTHROPIC_MAX_RETRIES,
  }) as unknown as AnthropicLike;

// --------------------------------------------------------------------------
// Dispatch table — tool name -> handler. The handlers already manage the
// per-tool transaction + audit row via `runIngestHandler` (BR-19 + BR-23),
// so the orchestrator never opens its own client.
// --------------------------------------------------------------------------

interface DispatchDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly llm_run_id: string;
  readonly catalog: CatalogSnapshot;
  readonly now: () => Date;
}

async function dispatchToolUse(
  toolName: string,
  rawInput: unknown,
  deps: DispatchDeps,
  chunkId: string
): Promise<McpEnvelope<Record<string, unknown>>> {
  switch (toolName) {
    case "propose_fragment": {
      // Option (b): the orchestrator is authoritative about which chunk is
      // being processed, so it injects the current `chunk_id` instead of
      // asking the LLM for an opaque uuid it cannot know (the propose_fragment
      // tool schema sent to the model omits `chunk_ids`). Any `chunk_ids` the
      // model emitted are overridden.
      const withChunk = {
        ...(rawInput as Record<string, unknown>),
        chunk_ids: [chunkId],
      };
      const parsed = ProposeFragmentInputSchema.safeParse(withChunk);
      if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);
      return (await proposeFragmentHandler(parsed.data, {
        pool: deps.pool,
        logger: deps.logger,
        llm_run_id: deps.llm_run_id,
      })) as McpEnvelope<Record<string, unknown>>;
    }
    case "propose_node": {
      const parsed = ProposeNodeInputSchema.safeParse(rawInput);
      if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);
      return (await proposeNodeHandler(parsed.data, {
        pool: deps.pool,
        logger: deps.logger,
        llm_run_id: deps.llm_run_id,
        catalog: deps.catalog,
      })) as McpEnvelope<Record<string, unknown>>;
    }
    case "propose_link": {
      const parsed = ProposeLinkInputSchema.safeParse(rawInput);
      if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);
      return (await proposeLinkHandler(parsed.data, {
        pool: deps.pool,
        logger: deps.logger,
        llm_run_id: deps.llm_run_id,
        catalog: deps.catalog,
        now: deps.now,
      })) as McpEnvelope<Record<string, unknown>>;
    }
    case "propose_attribute": {
      const parsed = ProposeAttributeInputSchema.safeParse(rawInput);
      if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);
      return (await proposeAttributeHandler(parsed.data, {
        pool: deps.pool,
        logger: deps.logger,
        llm_run_id: deps.llm_run_id,
        catalog: deps.catalog,
        now: deps.now,
      })) as McpEnvelope<Record<string, unknown>>;
    }
    default:
      return {
        ok: false,
        error: {
          code: "STRUCTURAL_INVALID",
          message: `Unknown tool '${toolName}'.`,
          details: { tool_name: toolName },
        },
      };
  }
}

function zodErrorEnvelope(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
): McpEnvelope<Record<string, unknown>> {
  return {
    ok: false,
    error: {
      code: "STRUCTURAL_INVALID",
      message: "Input failed Zod parse.",
      details: {
        issues: issues.map((i) => ({
          // Zod v4 issue paths can include symbols; stringify each segment.
          path: i.path.map((seg) => String(seg)).join("."),
          message: i.message,
        })),
      },
    },
  };
}

// --------------------------------------------------------------------------
// Tool definitions — derived from the four Zod schemas at module init via
// the JSON-Schema-2020-12 documents exported by `dto/index.ts` (BR-24).
// --------------------------------------------------------------------------

function buildTools(): Anthropic.Messages.Tool[] {
  // Descriptions come from the single source in `dto/index.ts` so the MCP
  // transport and this in-process loop present the LLM the same contract.
  return [
    buildTool("propose_fragment", IngestToolDescriptions.propose_fragment),
    buildTool("propose_node", IngestToolDescriptions.propose_node),
    buildTool("propose_link", IngestToolDescriptions.propose_link),
    buildTool("propose_attribute", IngestToolDescriptions.propose_attribute),
  ];
}

function buildTool(
  name: keyof typeof IngestToolInputJsonSchemas,
  description: string
): Anthropic.Messages.Tool {
  // The JSON Schema produced by `z.toJSONSchema()` is 2020-12; Anthropic
  // accepts a JSON Schema input_schema. We cast through `unknown` because
  // the SDK's `Tool.input_schema` is a JSONSchema7-like type, and the
  // shape is compatible at runtime.
  let schema = IngestToolInputJsonSchemas[name] as unknown as Record<
    string,
    unknown
  >;
  if (name === "propose_fragment") {
    // Option (b): `chunk_ids` is injected by the orchestrator
    // (dispatchToolUse), so the model must not be asked for it — drop it from
    // the tool schema the LLM sees.
    schema = stripProperty(schema, "chunk_ids");
  }
  return {
    name,
    description,
    input_schema: schema as unknown as Anthropic.Messages.Tool.InputSchema,
  };
}

/**
 * Shallow-clone a JSON-Schema object with `prop` removed from both
 * `properties` and `required`. Hides orchestrator-injected fields from the
 * LLM-facing tool schema without mutating the shared schema document.
 */
function stripProperty(
  schema: Record<string, unknown>,
  prop: string
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...schema };
  const props = {
    ...((clone.properties as Record<string, unknown> | undefined) ?? {}),
  };
  delete props[prop];
  clone.properties = props;
  if (Array.isArray(clone.required)) {
    clone.required = (clone.required as string[]).filter((r) => r !== prop);
  }
  return clone;
}

// --------------------------------------------------------------------------
// Orchestrator entry point.
// --------------------------------------------------------------------------

/** Maximum consecutive `error` validation_outcome rows allowed within a chunk. */
export const FATAL_ERROR_BURST = 3 as const;

/** `prev_tail` window — last N characters of the previous chunk's text. */
export const PREV_TAIL_CHARS = 200 as const;

/** Dependencies accepted by the orchestrator. The factory is injectable for testing. */
export interface RunExtractionDeps {
  readonly env: { readonly ANTHROPIC_API_KEY: string };
  readonly anthropicFactory?: AnthropicFactory;
  readonly now?: () => Date;
}

/**
 * Drive the extraction loop for `llmRunId`. Returns the final `LlmRun`
 * response on success. On any error path throws one of:
 *   - `ResourceNotFoundError`     — unknown llm_run id
 *   - `RunNotRunnableError`       — run not 'running'
 *   - `LlmProviderFatalError`     — Anthropic SDK fatal
 *   - `ExtractionFatalError`      — >=3 errors in a row OR uncaught exception
 *
 * The orchestrator never opens a long-lived `pg` connection: it acquires a
 * short read-only connection at entry for the pre-checks, releases it, and
 * then per tool-use dispatches a fresh `runIngestHandler` (which acquires
 * its own client). Closing the run also uses a fresh short transaction.
 */
export async function runLlmExtraction(
  pool: Pool,
  llmRunId: string,
  logger: Logger,
  catalog: CatalogSnapshot,
  deps: RunExtractionDeps
): Promise<LlmRunResponse> {
  const anthropicFactory = deps.anthropicFactory ?? defaultAnthropicFactory;
  const now = deps.now ?? (() => new Date());

  // ---- Pre-check: load run + source + chunks ----
  const { run, metadata, chunks } = await loadRunContext(pool, llmRunId);

  if (run.status !== "running") {
    throw new RunNotRunnableError(llmRunId, run.status);
  }

  // ---- Anthropic client + tools (BR-29 + BR-24) ----
  const anthropic = anthropicFactory(deps.env.ANTHROPIC_API_KEY);
  const tools = buildTools();

  // ---- Drive the per-chunk loop ----
  let prevTail = "";
  const dispatchDeps: DispatchDeps = {
    pool,
    logger,
    llm_run_id: llmRunId,
    catalog,
    now,
  };

  // BR-33 — per-run affected-node collector. Records ids touched by every
  // `propose_*` ok:true envelope (filtering by outcome inside the collector).
  // On happy-path completion the orchestrator resolves to `AffectedNode[]` via
  // ONE batched lookup and writes through to the process-scoped cache. On any
  // failure path we do NOT cache (the read path remains best-effort and the
  // run is `failed` — read paths omit the field anyway).
  const affectedNodes = createAffectedNodeCollector();

  try {
    // Prompt selection (BR-26 step 2) — dispatch on the run's prompt_version.
    // Inside the run-scoped try so an unknown version flips the run to `failed`
    // and surfaces 500 (never silently runs a prompt the audit trail doesn't
    // record). selectPromptModule throws UnknownPromptVersionError on a miss.
    const prompt = selectPromptModule(run.prompt_version);
    logger.info(
      {
        llm_run_id: llmRunId,
        prompt_version: run.prompt_version,
        prompt_module: prompt.version,
      },
      "extraction_prompt_selected"
    );

    for (const chunk of chunks) {
      const outcome = await runChunkLoop({
        anthropic,
        tools,
        catalog,
        model: run.model,
        metadata,
        chunkText: chunk.text,
        chunkId: chunk.id,
        prevTail,
        dispatchDeps,
        prompt,
        logger,
        llmRunId,
        affectedNodes,
      });

      if (outcome.kind === "fatal_burst") {
        await closeRunSafe(pool, llmRunId, "failed");
        const partial = await readFinalRun(pool, llmRunId);
        throw new ExtractionFatalError(
          llmRunId,
          `>=${FATAL_ERROR_BURST} consecutive tool-call errors within one chunk`,
          partial
        );
      }
      // soft per-chunk outcomes (refusal, end_turn) -> proceed to next chunk.
      prevTail = chunk.text.length <= PREV_TAIL_CHARS
        ? chunk.text
        : chunk.text.slice(-PREV_TAIL_CHARS);
    }
  } catch (err) {
    if (err instanceof ExtractionFatalError) throw err;
    if (err instanceof LlmProviderFatalError) throw err;
    if (isAnthropicSdkError(err)) {
      // Close run as failed, then surface 502.
      await closeRunSafe(pool, llmRunId, "failed");
      const partial = await readFinalRun(pool, llmRunId);
      const cause = err instanceof Error ? err.message : String(err);
      // NEVER include the API key in the error message; we only forward the
      // SDK's own message which the SDK is trusted not to echo secrets into.
      logger.error(
        { llm_run_id: llmRunId, cause_message: cause },
        "extraction_anthropic_fatal"
      );
      throw new LlmProviderFatalError(llmRunId, cause, partial);
    }
    // Uncaught -> 500.
    await closeRunSafe(pool, llmRunId, "failed");
    const partial = await readFinalRun(pool, llmRunId);
    const cause = err instanceof Error ? err.message : String(err);
    logger.error(
      { llm_run_id: llmRunId, cause_message: cause },
      "extraction_uncaught_exception"
    );
    throw new ExtractionFatalError(llmRunId, cause, partial);
  }

  // ---- Happy path — close run as completed ----
  await closeRunSafe(pool, llmRunId, "completed");

  // BR-33 — resolve the collected ids to `AffectedNode[]` via ONE batched
  // `knowledge_node JOIN node_type` lookup, then write through to the
  // process-scoped LRU cache so the next `get_ingestion_status` poll is a
  // cache hit. Empty ids list = empty resolved list (a completed run with
  // only `rejected` outcomes); we still cache the empty array so the read
  // path emits `affected_nodes: []` (a valid completed-run payload).
  //
  // Best-effort: a transient DB outage during the batched lookup is logged
  // at WARN and the field is omitted from the run-completion log. The read
  // path re-derives the list on the next poll (cache miss → derived).
  let resolved: AffectedNode[] = [];
  try {
    const collectedIds = affectedNodes.ids();
    const client = await pool.connect();
    try {
      resolved = await resolveAffectedNodes(client, collectedIds);
    } finally {
      client.release();
    }
    setCachedAffectedNodes(llmRunId, resolved);
  } catch (err) {
    logger.warn(
      {
        llm_run_id: llmRunId,
        cause_message: err instanceof Error ? err.message : String(err),
      },
      "extraction_affected_nodes_resolution_failed"
    );
    // resolved stays []; we still attempt to attach via readFinalRun below
    // (which itself goes through getLlmRunById and will re-derive on miss).
  }

  const finalRun = await readFinalRun(pool, llmRunId, resolved);
  logger.info(
    {
      llm_run_id: llmRunId,
      model: finalRun.model,
      prompt_version: finalRun.prompt_version,
      attempts: finalRun.attempts,
      summary: finalRun.summary,
      affected_nodes_count: resolved.length,
    },
    "run_completed"
  );
  return finalRun;
}

// --------------------------------------------------------------------------
// Per-chunk loop — implements BR-26 step 5.
// --------------------------------------------------------------------------

interface ChunkLoopInput {
  readonly anthropic: AnthropicLike;
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly catalog: CatalogSnapshot;
  readonly model: string;
  readonly metadata: DocumentMetadata;
  readonly chunkText: string;
  readonly chunkId: string;
  readonly prevTail: string;
  readonly dispatchDeps: DispatchDeps;
  readonly prompt: PromptModule;
  readonly logger: Logger;
  readonly llmRunId: string;
  /** BR-33 — accumulates affected-node ids across every chunk of this run. */
  readonly affectedNodes: AffectedNodeCollector;
}

type ChunkLoopOutcome =
  | { kind: "completed" }
  | { kind: "refused" }
  | { kind: "fatal_burst" };

async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {
  const systemText = input.prompt.system(input.catalog);
  // P0 prompt caching: cache the stable tools+system prefix. The extraction
  // system prompt (catalog render + worked examples) + ingest tool schemas are
  // re-sent on every turn of every chunk; a cache breakpoint on the system
  // block makes turns 2..N and subsequent chunks read it at ~0.1x. Built once
  // per chunk and reused each turn. Cost-only change — no behavior change.
  const systemParam: Anthropic.Messages.TextBlockParam[] = [
    { type: "text", text: systemText, cache_control: { type: "ephemeral" } },
  ];
  const userBlocks = input.prompt.user({
    metadata: input.metadata,
    chunkText: input.chunkText,
    prevTail: input.prevTail,
  });
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: userBlocks },
  ];

  let consecutiveErrors = 0;

  // The loop has no hard iteration cap by design (BR-26 step 5b: "Repeat
  // until stop_reason === 'end_turn'"). The Anthropic SDK enforces its own
  // per-stream limits; a runaway loop is bounded by `max_tokens` per turn.
  // We keep a defensive iteration ceiling of 64 turns per chunk to catch
  // pathological stubs / model behaviour.
  const MAX_TURNS_PER_CHUNK = 64;

  for (let turn = 0; turn < MAX_TURNS_PER_CHUNK; turn += 1) {
    const stream = input.anthropic.messages.stream({
      model: input.model,
      system: systemParam,
      tools: input.tools as Anthropic.Messages.Tool[],
      thinking: { type: "adaptive" },
      max_tokens: input.prompt.MAX_TOKENS,
      messages,
    });
    const response = await stream.finalMessage();
    // P0/P1 — log per-turn token usage incl. cache hit/write so the
    // prompt-cache effect is observable (cache_read should dominate after the
    // first turn / first chunk; cache_creation > 0 only on the first write).
    input.logger.info(
      {
        event: "extraction.turn_usage",
        llm_run_id: input.llmRunId,
        chunk_id: input.chunkId,
        turn,
        input_tokens: response.usage?.input_tokens ?? 0,
        output_tokens: response.usage?.output_tokens ?? 0,
        cache_read_input_tokens: response.usage?.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens:
          response.usage?.cache_creation_input_tokens ?? 0,
      },
      "extraction turn token usage"
    );

    // Append the assistant turn verbatim (preserves tool_use blocks etc).
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      return { kind: "completed" };
    }
    if (response.stop_reason === "refusal") {
      input.logger.warn(
        { llm_run_id: input.llmRunId },
        "extraction_chunk_refused"
      );
      return { kind: "refused" };
    }
    if (response.stop_reason === "pause_turn") {
      // BR-26 step 5b bullet 2: "continue the loop without modifying
      // messages". Anthropic continues from the partial state.
      continue;
    }

    // tool_use (or other) — dispatch every `tool_use` block to the matching
    // service and feed the results back as a single user turn carrying all
    // tool_result blocks.
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      // No tool_use AND not an end_turn / refusal / pause_turn — treat as
      // soft end_turn (the model has nothing more to say). This matches
      // UC-12 alt 4c (a chunk yielded no extractable knowledge).
      return { kind: "completed" };
    }

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    let burstReset = false;
    for (const block of toolUseBlocks) {
      const envelope = await dispatchToolUse(
        block.name,
        block.input,
        input.dispatchDeps,
        input.chunkId
      );

      // BR-33 — record any affected node ids from this envelope. The
      // collector itself filters by tool name + outcome (only `propose_*`
      // ok:true with a contributing outcome contribute; `rejected` /
      // `error` / `ok:false` envelopes are no-ops).
      input.affectedNodes.record(block.name, envelope);

      if (envelope.ok) {
        // Any ok:true (including outcome=rejected for confidence floor)
        // resets the burst counter — the layered validation produced a
        // business outcome, not a system error.
        const isErrorOutcome = isErrorValidationOutcome(envelope);
        if (isErrorOutcome) {
          consecutiveErrors += 1;
        } else {
          consecutiveErrors = 0;
          burstReset = true;
        }
      } else {
        // ok:false envelopes from layered validation (STRUCTURAL_INVALID,
        // NOT_FOUND, RULE_VIOLATION, etc.) are 'rejected' on the audit row
        // — NOT 'error'. Only INTERNAL counts toward the fatal burst.
        if (envelope.error.code === "INTERNAL") {
          consecutiveErrors += 1;
        } else {
          consecutiveErrors = 0;
          burstReset = true;
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(envelope),
        is_error: !envelope.ok,
      });

      if (consecutiveErrors >= FATAL_ERROR_BURST) {
        return { kind: "fatal_burst" };
      }
    }
    void burstReset;

    // Append the user turn carrying every tool_result block and restart
    // the loop.
    messages.push({ role: "user", content: toolResults });
  }

  // Defensive cap reached — log and treat as soft completion. The
  // existing tool_call audit rows still attest to the work done.
  input.logger.warn(
    { llm_run_id: input.llmRunId, turns: MAX_TURNS_PER_CHUNK },
    "extraction_chunk_turn_cap_reached"
  );
  return { kind: "completed" };
}

/**
 * Detect an `ok:true` envelope whose business `outcome` is the SDK
 * 'error' bucket. Only INTERNAL on the error branch counts; everything
 * else (accepted, consolidated, disputed, uncertain, rejected, needs_review,
 * superseded_previous) is a business outcome.
 *
 * In the current TC-09 / TC-10 / TC-11 contract the service-layer never
 * emits an 'error' validation_outcome on ok:true — that bucket is reserved
 * for the catch-all path inside the handler shell. This function exists as
 * a forward-compatible guard.
 */
function isErrorValidationOutcome(
  envelope: McpEnvelope<Record<string, unknown>>
): boolean {
  if (!envelope.ok) return false;
  const result = envelope.result as Record<string, unknown> | null;
  if (result === null || typeof result !== "object") return false;
  const outcome = (result as { outcome?: unknown }).outcome;
  return outcome === "error";
}

// --------------------------------------------------------------------------
// Anthropic SDK error detection.
// --------------------------------------------------------------------------

/**
 * Conservative discriminator: treat any error thrown out of the Anthropic
 * stream call as a provider fatal unless it is one of our own typed
 * sentinels. Bare `Error`s from the stub also flow through here (tests
 * may use the dedicated `AnthropicError` brand).
 *
 * In practice we identify SDK errors by name prefix: the SDK ships
 * `Anthropic.APIError` / `Anthropic.APIConnectionError` etc., all of which
 * have `name` starting with `Anthropic`. The brand check is the primary
 * signal; we also accept an explicit `__anthropic: true` flag for tests
 * that don't import the SDK error classes.
 */
function isAnthropicSdkError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  if (typeof name === "string" && name.startsWith("Anthropic")) return true;
  if ((err as { __anthropic?: unknown }).__anthropic === true) return true;
  return false;
}

// --------------------------------------------------------------------------
// DB helpers — short reads + the closing write.
// --------------------------------------------------------------------------

interface LoadedRunContext {
  readonly run: {
    readonly id: string;
    readonly status: "running" | "completed" | "failed";
    readonly model: string;
    readonly prompt_version: string;
    readonly input_raw_information_id: string;
  };
  readonly metadata: DocumentMetadata;
  readonly chunks: readonly { readonly id: string; readonly chunk_index: number; readonly text: string }[];
}

async function loadRunContext(
  pool: Pool,
  llmRunId: string
): Promise<LoadedRunContext> {
  const client = await pool.connect();
  try {
    const runRow = await findLlmRunById(client, llmRunId);
    if (runRow === null) {
      throw new ResourceNotFoundError("llm_run", llmRunId);
    }
    const rawInfo = await findRawInformationById(
      client,
      runRow.input_raw_information_id
    );
    if (rawInfo === null) {
      // This is a referential-integrity violation — the FK in `llm_run`
      // already guarantees the row exists. Treat as 500.
      throw new Error(
        `llm_run ${llmRunId} references missing raw_information ${runRow.input_raw_information_id}`
      );
    }
    const chunkRows = await findChunksByRawInformationId(client, rawInfo.id);

    const metadataObj = (rawInfo.metadata ?? {}) as Record<string, unknown>;
    const metadata: DocumentMetadata = {
      source_type: rawInfo.source_type,
      document_date: stringOrNull(metadataObj["document_date"]),
      title: stringOrNull(metadataObj["title"]),
      received_at: rawInfo.received_at.toISOString(),
    };

    return {
      run: {
        id: runRow.id,
        status: runRow.status,
        model: runRow.model,
        prompt_version: runRow.prompt_version,
        input_raw_information_id: runRow.input_raw_information_id,
      },
      metadata,
      chunks: chunkRows.map((c) => ({
        id: c.id,
        chunk_index: c.chunk_index,
        text: c.text,
      })),
    };
  } finally {
    client.release();
  }
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (v.length === 0) return null;
  return v;
}

/**
 * Close the run in a fresh short transaction. Swallow errors — if the
 * UPDATE itself fails we still want the original cause to surface to the
 * caller (the run is already in an inconsistent state; the caller will
 * retry via UC-06).
 */
async function closeRunSafe(
  pool: Pool,
  llmRunId: string,
  outcome: "completed" | "failed"
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await closeLlmRunRow(client, { llm_run_id: llmRunId, outcome });
    await client.query("COMMIT");
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* swallow */
    }
    // Do not re-throw; the caller has its own error path.
  } finally {
    client.release();
  }
}

/**
 * Read the final run row + summary in a fresh transaction. Used both for
 * the happy-path response and for the partial summary attached to the
 * 502 / 500 error sentinels.
 *
 * BR-33 — when `affectedNodes` is supplied (happy path) the field is attached
 * verbatim. On error paths the caller passes `undefined`; the read path will
 * also omit the field because the run is `failed` and BR-33's read contract
 * limits the field to `status === 'completed'`.
 */
async function readFinalRun(
  pool: Pool,
  llmRunId: string,
  affectedNodes?: readonly AffectedNode[]
): Promise<LlmRunResponse> {
  const client = await pool.connect();
  try {
    const row = await findLlmRunById(client, llmRunId);
    if (row === null) {
      // Should not happen — pre-check confirmed the run exists.
      throw new ResourceNotFoundError("llm_run", llmRunId);
    }
    const summary = await aggregateToolCallOutcomes(client, llmRunId);
    const base: LlmRunResponse = {
      id: row.id,
      model: row.model,
      prompt_version: row.prompt_version,
      started_at: row.started_at.toISOString(),
      finished_at:
        row.finished_at === null ? null : row.finished_at.toISOString(),
      status: row.status,
      attempts: row.attempts,
      input_raw_information_id: row.input_raw_information_id,
      idempotency_key: row.idempotency_key,
      summary,
    };
    if (row.status === "completed" && affectedNodes !== undefined) {
      return { ...base, affected_nodes: [...affectedNodes] };
    }
    return base;
  } finally {
    client.release();
  }
}

// --------------------------------------------------------------------------
// Internal testing surface — not part of the public API.
// --------------------------------------------------------------------------

export const __testing__: {
  buildTools: typeof buildTools;
  dispatchToolUse: typeof dispatchToolUse;
  isAnthropicSdkError: typeof isAnthropicSdkError;
  isErrorValidationOutcome: typeof isErrorValidationOutcome;
} = {
  buildTools,
  dispatchToolUse,
  isAnthropicSdkError,
  isErrorValidationOutcome,
};
