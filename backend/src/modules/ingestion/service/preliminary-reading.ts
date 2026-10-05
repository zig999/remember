import type Anthropic from "@anthropic-ai/sdk";
import type { Pool } from "pg";
import type { Logger } from "pino";

import { InvariantError } from "../../../shared/invariant-error.js";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  DocumentContext,
  DocumentContextStatus,
  DocumentEntity,
} from "../dto/llm-run.dto.js";
import {
  PreliminaryReadingResponseSchema,
  type PreliminaryReadingResponseDto,
} from "../dto/preliminary-reading-response.dto.js";
import {
  MAX_TOKENS,
  SUMMARY_MAX_LINES,
  system,
  user,
} from "../prompts/preliminary-reading.js";
import {
  recordDocumentContext,
  recordDocumentContextStatus,
} from "../repository/llm-run.repository.js";

export const PRELIMINARY_READING_MAX_CONTENT_UNITS = 100_000 as const;

const SINGLE_CHUNK_COUNT = 1 as const;
const FIRST_PRELIMINARY_READING_VERSION = 5 as const;
const PROMPT_VERSION_PATTERN = /^v(\d+)$/;
const LINE_BREAK = "\n";

export interface ContextMessageRequest {
  readonly model: string;
  readonly system: string;
  readonly max_tokens: number;
  readonly messages: Anthropic.Messages.MessageParam[];
}

export interface ContextMessageStream {
  finalMessage(): Promise<Anthropic.Messages.Message>;
}

export interface ContextReader {
  readonly messages: {
    stream(req: ContextMessageRequest): ContextMessageStream;
  };
}

export interface DocumentContextRequest {
  readonly pool: Pool;
  readonly anthropic: ContextReader;
  readonly catalog: CatalogSnapshot;
  readonly logger: Logger;
  readonly model: string;
  readonly run: {
    readonly id: string;
    readonly prompt_version: string;
    readonly document_context: DocumentContext | null | undefined;
  };
  readonly chunkCount: number;
  readonly content: string;
}

export class PreliminaryReadingParseError extends Error {
  constructor(reason: string, cause?: unknown) {
    super(`Preliminary reading answer is not a document context: ${reason}.`, {
      cause,
    });
    this.name = "PreliminaryReadingParseError";
  }
}

export function readsDocumentFirst(promptVersion: string): boolean {
  const major = PROMPT_VERSION_PATTERN.exec(promptVersion)?.[1];
  return (
    major !== undefined &&
    Number.parseInt(major, 10) >= FIRST_PRELIMINARY_READING_VERSION
  );
}

export function shouldReadDocument(request: DocumentContextRequest): boolean {
  return (
    readsDocumentFirst(request.run.prompt_version) &&
    request.chunkCount > 1 &&
    request.content.length <= PRELIMINARY_READING_MAX_CONTENT_UNITS &&
    (request.run.document_context === null ||
      request.run.document_context === undefined)
  );
}

export function cutSummaryToLines(summary: string, maxLines: number): string {
  const lines = summary.split(LINE_BREAK);
  if (lines[lines.length - 1] === "") lines.pop();
  if (lines.length <= maxLines) return summary;
  return lines.slice(0, maxLines).join(LINE_BREAK);
}

function keepCatalogEntities(
  entities: readonly DocumentEntity[],
  catalog: CatalogSnapshot
): DocumentEntity[] {
  return entities.filter((e) => catalog.nodeTypeByName.has(e.node_type));
}

function textOf(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(LINE_BREAK);
}

function parseReading(text: string): PreliminaryReadingResponseDto {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new PreliminaryReadingParseError("no JSON object in the answer");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    throw new PreliminaryReadingParseError("the answer is not valid JSON", err);
  }
  const parsed = PreliminaryReadingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PreliminaryReadingParseError("the JSON object has the wrong shape");
  }
  return parsed.data;
}

async function readDocumentContext(
  request: DocumentContextRequest
): Promise<DocumentContext> {
  const stream = request.anthropic.messages.stream({
    model: request.model,
    system: system(request.catalog),
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: user(request.content) }],
  });
  const reading = parseReading(textOf(await stream.finalMessage()));
  return {
    summary: cutSummaryToLines(reading.summary, SUMMARY_MAX_LINES),
    entities: keepCatalogEntities(reading.entities, request.catalog),
    model: request.model,
  };
}

async function recordProducedContext(
  pool: Pool,
  llmRunId: string,
  context: DocumentContext
): Promise<void> {
  const client = await pool.connect();
  let discardConnection = false;
  try {
    await client.query("BEGIN");
    const row = await recordDocumentContext(client, {
      llm_run_id: llmRunId,
      document_context: context,
    });
    if (row === null) {
      throw new InvariantError(`llm_run ${llmRunId} vanished before its document context was recorded`);
    }
    await recordDocumentContextStatus(client, {
      llm_run_id: llmRunId,
      document_context_status: "produced",
    });
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discardConnection = true;
    }
    throw err;
  } finally {
    client.release(discardConnection);
  }
}

async function recordReadingStatus(
  pool: Pool,
  llmRunId: string,
  status: DocumentContextStatus
): Promise<void> {
  const client = await pool.connect();
  try {
    const row = await recordDocumentContextStatus(client, {
      llm_run_id: llmRunId,
      document_context_status: status,
    });
    if (row === null) {
      throw new InvariantError(`llm_run ${llmRunId} vanished before its ${status} document context status was recorded`);
    }
  } finally {
    client.release();
  }
}

async function recordFailedReading(
  request: DocumentContextRequest,
  err: unknown
): Promise<void> {
  request.logger.warn(
    {
      llm_run_id: request.run.id,
      cause_name: err instanceof Error ? err.name : typeof err,
      cause_message: err instanceof Error ? err.message : String(err),
    },
    "document_context_reading_failed"
  );
  await recordReadingStatus(request.pool, request.run.id, "failed");
}

export function skippedReadingStatus(
  request: DocumentContextRequest
): DocumentContextStatus | null {
  if (!readsDocumentFirst(request.run.prompt_version)) return null;
  if (request.chunkCount === SINGLE_CHUNK_COUNT) return "single-chunk";
  if (
    request.chunkCount > SINGLE_CHUNK_COUNT &&
    request.content.length > PRELIMINARY_READING_MAX_CONTENT_UNITS
  ) {
    return "too-long";
  }
  return null;
}

async function recordSkippedReading(
  request: DocumentContextRequest,
  status: DocumentContextStatus
): Promise<void> {
  await recordReadingStatus(request.pool, request.run.id, status);
  request.logger.info(
    { llm_run_id: request.run.id, document_context_status: status },
    "document_context_reading_skipped"
  );
}

function logProducedContext(
  request: DocumentContextRequest,
  context: DocumentContext
): void {
  request.logger.info(
    {
      llm_run_id: request.run.id,
      context_model: context.model,
      entities_count: context.entities.length,
    },
    "document_context_produced"
  );
}

export async function produceDocumentContext(
  request: DocumentContextRequest
): Promise<DocumentContext | null> {
  const held = request.run.document_context ?? null;
  if (held !== null) return held;
  const skipped = skippedReadingStatus(request);
  if (skipped !== null) {
    await recordSkippedReading(request, skipped);
    return null;
  }
  if (!shouldReadDocument(request)) return null;
  let context: DocumentContext;
  try {
    context = await readDocumentContext(request);
  } catch (err) {
    await recordFailedReading(request, err);
    return null;
  }
  await recordProducedContext(request.pool, request.run.id, context);
  logProducedContext(request, context);
  return context;
}
