import type Anthropic from "@anthropic-ai/sdk";
import { default as AnthropicClient } from "@anthropic-ai/sdk";
import type { Pool } from "pg";
import type { Logger } from "pino";

import { InvariantError } from "../../../shared/invariant-error.js";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  IngestToolDescriptions,
  IngestToolInputJsonSchemas,
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import type { DocumentContext, LlmRunResponse } from "../dto/llm-run.dto.js";
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
import {
  produceDocumentContext,
  type ContextMessageRequest,
} from "./preliminary-reading.js";

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

export interface ExtractionMessageRequest {
  readonly model: string;
  readonly system: string | readonly Anthropic.Messages.TextBlockParam[];
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly thinking: { type: "adaptive" };
  readonly max_tokens: number;
  readonly messages: Anthropic.Messages.MessageParam[];
}

export interface ExtractionMessageStream {
  finalMessage(): Promise<Anthropic.Messages.Message>;
}

export interface AnthropicLike {
  readonly messages: {
    stream(
      req: ExtractionMessageRequest | ContextMessageRequest
    ): ExtractionMessageStream;
  };
}

export type AnthropicFactory = (apiKey: string) => AnthropicLike;

const ANTHROPIC_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
const ANTHROPIC_MAX_RETRIES = 2;

export const defaultAnthropicFactory: AnthropicFactory = (apiKey) =>
  new AnthropicClient({
    apiKey,
    timeout: ANTHROPIC_REQUEST_TIMEOUT_MS,
    maxRetries: ANTHROPIC_MAX_RETRIES,
  }) as unknown as AnthropicLike;

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
          code: "VALIDATION_INVALID_FORMAT",
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
      code: "VALIDATION_INVALID_FORMAT",
      message: "Input failed Zod parse.",
      details: {
        issues: issues.map((i) => ({
          path: i.path.map((seg) => String(seg)).join("."),
          message: i.message,
        })),
      },
    },
  };
}

function buildTools(): Anthropic.Messages.Tool[] {
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
  let schema = IngestToolInputJsonSchemas[name] as unknown as Record<
    string,
    unknown
  >;
  if (name === "propose_fragment") {
    schema = stripProperty(schema, "chunk_ids");
  }
  return {
    name,
    description,
    input_schema: schema as unknown as Anthropic.Messages.Tool.InputSchema,
  };
}

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

export const FATAL_ERROR_BURST = 3 as const;

export const PREV_TAIL_CHARS = 200 as const;

export interface RunExtractionDeps {
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly CONTEXT_MODEL: string;
  };
  readonly anthropicFactory?: AnthropicFactory;
  readonly now?: () => Date;
}

export async function runLlmExtraction(
  pool: Pool,
  llmRunId: string,
  logger: Logger,
  catalog: CatalogSnapshot,
  deps: RunExtractionDeps
): Promise<LlmRunResponse> {
  const anthropicFactory = deps.anthropicFactory ?? defaultAnthropicFactory;
  const now = deps.now ?? (() => new Date());

  const { run, metadata, chunks, content } = await loadRunContext(
    pool,
    llmRunId
  );

  if (run.status !== "running") {
    throw new RunNotRunnableError(llmRunId, run.status);
  }

  const anthropic = anthropicFactory(deps.env.ANTHROPIC_API_KEY);
  const tools = buildTools();

  let prevTail = "";
  const dispatchDeps: DispatchDeps = {
    pool,
    logger,
    llm_run_id: llmRunId,
    catalog,
    now,
  };

  const affectedNodes = createAffectedNodeCollector();

  try {
    const prompt = selectPromptModule(run.prompt_version);
    logger.info(
      {
        llm_run_id: llmRunId,
        prompt_version: run.prompt_version,
        prompt_module: prompt.version,
      },
      "extraction_prompt_selected"
    );

    await produceDocumentContext({
      pool,
      anthropic,
      catalog,
      logger,
      model: deps.env.CONTEXT_MODEL,
      run,
      chunkCount: chunks.length,
      content,
    });

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
      prevTail = chunk.text.length <= PREV_TAIL_CHARS
        ? chunk.text
        : chunk.text.slice(-PREV_TAIL_CHARS);
    }
  } catch (err) {
    if (err instanceof ExtractionFatalError) throw err;
    if (err instanceof LlmProviderFatalError) throw err;
    if (isAnthropicSdkError(err)) {
      await closeRunSafe(pool, llmRunId, "failed");
      const partial = await readFinalRun(pool, llmRunId);
      const cause = err instanceof Error ? err.message : String(err);
      logger.error(
        { llm_run_id: llmRunId, cause_message: cause },
        "extraction_anthropic_fatal"
      );
      throw new LlmProviderFatalError(llmRunId, cause, partial);
    }
    await closeRunSafe(pool, llmRunId, "failed");
    const partial = await readFinalRun(pool, llmRunId);
    const cause = err instanceof Error ? err.message : String(err);
    logger.error(
      { llm_run_id: llmRunId, cause_message: cause },
      "extraction_uncaught_exception"
    );
    throw new ExtractionFatalError(llmRunId, cause, partial);
  }

  await closeRunSafe(pool, llmRunId, "completed");

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
  readonly affectedNodes: AffectedNodeCollector;
}

type ChunkLoopOutcome =
  | { kind: "completed" }
  | { kind: "refused" }
  | { kind: "fatal_burst" };

async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {
  const systemText = input.prompt.system(input.catalog);
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
      continue;
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
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

      input.affectedNodes.record(block.name, envelope);

      if (envelope.ok) {
        const isErrorOutcome = isErrorValidationOutcome(envelope);
        if (isErrorOutcome) {
          consecutiveErrors += 1;
        } else {
          consecutiveErrors = 0;
          burstReset = true;
        }
      } else {
        if (envelope.error.code.startsWith("SYSTEM_")) {
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

    messages.push({ role: "user", content: toolResults });
  }

  input.logger.warn(
    { llm_run_id: input.llmRunId, turns: MAX_TURNS_PER_CHUNK },
    "extraction_chunk_turn_cap_reached"
  );
  return { kind: "completed" };
}

function isErrorValidationOutcome(
  envelope: McpEnvelope<Record<string, unknown>>
): boolean {
  if (!envelope.ok) return false;
  const result = envelope.result as Record<string, unknown> | null;
  if (result === null || typeof result !== "object") return false;
  const outcome = (result as { outcome?: unknown }).outcome;
  return outcome === "error";
}

function isAnthropicSdkError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  if (typeof name === "string" && name.startsWith("Anthropic")) return true;
  if ((err as { __anthropic?: unknown }).__anthropic === true) return true;
  return false;
}

interface LoadedRunContext {
  readonly run: {
    readonly id: string;
    readonly status: "running" | "completed" | "failed";
    readonly model: string;
    readonly prompt_version: string;
    readonly input_raw_information_id: string;
    readonly document_context: DocumentContext | null;
  };
  readonly metadata: DocumentMetadata;
  readonly content: string;
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
      throw new InvariantError(
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
        document_context: runRow.document_context,
      },
      metadata,
      content: rawInfo.content,
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
    await client.query("ROLLBACK").catch(() => undefined);
  } finally {
    client.release();
  }
}

async function readFinalRun(
  pool: Pool,
  llmRunId: string,
  affectedNodes?: readonly AffectedNode[]
): Promise<LlmRunResponse> {
  const client = await pool.connect();
  try {
    const row = await findLlmRunById(client, llmRunId);
    if (row === null) {
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
