import { randomUUID } from "node:crypto";

import type { Pool } from "pg";
import type { Logger } from "pino";

import { withTransaction } from "../../../shared/pg-transaction.js";
import { z } from "zod";

import { isPgUnavailable } from "../../../shared/error-mapping.js";
import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ChangeHintSchema,
  ValidFromBasisSchema,
  type ProposeLinkInput,
  type ProposeLinkOutcome,
} from "../dto/propose-link.dto.js";
import type {
  ProposeAttributeInput,
  ProposeAttributeOutcome,
} from "../dto/propose-attribute.dto.js";
import type { ProposeFragmentInput } from "../dto/propose-fragment.dto.js";
import type { ProposeNodeInput, ProposeNodeResolution } from "../dto/propose-node.dto.js";
import { proposeAttributeHandler } from "../mcp/propose-attribute.handler.js";
import { proposeFragmentHandler } from "../mcp/propose-fragment.handler.js";
import { proposeLinkHandler } from "../mcp/propose-link.handler.js";
import { proposeNodeHandler } from "../mcp/propose-node.handler.js";
import type { McpEnvelope } from "../mcp/handler-base.js";
import {
  closeLlmRunRow,
  findLlmRunById,
} from "../repository/llm-run.repository.js";

import {
  createAffectedNodeCollector,
  resolveAffectedNodes,
  setCachedAffectedNodes,
  type AffectedNode,
} from "./affected-nodes.js";
import { DIRECTED_MODEL, DIRECTED_PROMPT_VERSION } from "./directed-run.js";
import { ingestRawInformation } from "./ingestion.service.js";

export { DIRECTED_MODEL, DIRECTED_PROMPT_VERSION };

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD");

const DirectedRefSchema = z.string().min(1).max(120);

export const DirectedFragmentItemSchema = z.object({
  ref: DirectedRefSchema,
  text: z.string().min(1).max(1000),
});

export const DirectedNodeItemSchema = z.object({
  ref: DirectedRefSchema,
  node_type: z.string().min(1),
  name: z.string().min(1).max(500),
  node_id: z.string().uuid().optional(),
  aliases: z.array(z.string().min(1).max(500)).optional(),
});

const DirectedAttributeValueSchema = z.union([
  z.string().min(1).max(2000),
  z.number().finite(),
  z.boolean(),
]);

export const DirectedAttributeItemSchema = z.object({
  node_ref: DirectedRefSchema,
  key: z.string().min(1),
  value: DirectedAttributeValueSchema,
  evidence_ref: DirectedRefSchema,
  valid_from: IsoDateSchema.optional(),
  valid_to: IsoDateSchema.optional(),
  valid_from_basis: ValidFromBasisSchema.optional(),
  change_hint: ChangeHintSchema.optional(),
});

export const DirectedLinkItemSchema = z.object({
  source_ref: DirectedRefSchema,
  link_type: z.string().min(1),
  target_ref: DirectedRefSchema,
  evidence_ref: DirectedRefSchema,
  valid_from: IsoDateSchema.optional(),
  valid_to: IsoDateSchema.optional(),
  valid_from_basis: ValidFromBasisSchema.optional(),
  change_hint: ChangeHintSchema.optional(),
});

export const DirectedIngestionInputSchema = z.object({
  fragments: z.array(DirectedFragmentItemSchema).min(1),
  nodes: z.array(DirectedNodeItemSchema).min(1),
  attributes: z.array(DirectedAttributeItemSchema).optional(),
  links: z.array(DirectedLinkItemSchema).optional(),
  source_label: z.string().min(1).max(200).optional(),
});

export type DirectedIngestionInput = z.infer<typeof DirectedIngestionInputSchema>;
export type DirectedFragmentItem = z.infer<typeof DirectedFragmentItemSchema>;
export type DirectedNodeItem = z.infer<typeof DirectedNodeItemSchema>;
export type DirectedAttributeItem = z.infer<typeof DirectedAttributeItemSchema>;
export type DirectedLinkItem = z.infer<typeof DirectedLinkItemSchema>;

export type DirectedItemKind = "fragment" | "node" | "attribute" | "link";

export type DirectedItemStatus =
  | "accepted"
  | "consolidated"
  | "superseded_previous"
  | "needs_review"
  | "uncertain"
  | "disputed"
  | "rejected"
  | "error"
  | "dependency_failed";

export interface DirectedItemReport {
  readonly ref: string;
  readonly kind: DirectedItemKind;
  readonly status: DirectedItemStatus;
  readonly fragment_id?: string;
  readonly node_id?: string;
  readonly attribute_id?: string;
  readonly link_id?: string;
  readonly resolution?: ProposeNodeResolution;
  readonly reason?: string;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export interface DirectedSummary {
  readonly fragments: number;
  readonly nodes: number;
  readonly attributes: number;
  readonly links: number;
  readonly accepted: number;
  readonly consolidated: number;
  readonly superseded_previous: number;
  readonly needs_review: number;
  readonly uncertain: number;
  readonly disputed: number;
  readonly rejected: number;
  readonly error: number;
  readonly dependency_failed: number;
}

export interface DirectedRunResponse {
  readonly id: string;
  readonly model: typeof DIRECTED_MODEL;
  readonly prompt_version: typeof DIRECTED_PROMPT_VERSION;
  readonly status: "completed";
  readonly started_at: string;
  readonly finished_at: string;
  readonly attempts: number;
  readonly input_raw_information_id: string;
  readonly affected_nodes: readonly AffectedNode[];
}

export interface DirectedIngestionResult {
  readonly outcome: "ingested";
  readonly raw_information_id: string;
  readonly llm_run_id: string;
  readonly chunk_count: number;
  readonly summary: DirectedSummary;
  readonly run: DirectedRunResponse;
  readonly report: readonly DirectedItemReport[];
}

export interface DirectedIngestionDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly now?: () => Date;
  readonly ingestRaw?: typeof ingestRawInformation;
  readonly proposeFragment?: typeof proposeFragmentHandler;
  readonly proposeNode?: typeof proposeNodeHandler;
  readonly proposeAttribute?: typeof proposeAttributeHandler;
  readonly proposeLink?: typeof proposeLinkHandler;
  readonly verifyNodePin?: typeof verifyNodePin;
  readonly sourceExcerpt?: string;
  readonly metadataPointer?: {
    readonly conversation_id: string;
    readonly message_id: string;
  };
}

export async function directedIngestionService(
  input: unknown,
  deps: DirectedIngestionDeps
): Promise<McpEnvelope<DirectedIngestionResult>> {
  const parsed = DirectedIngestionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_INVALID_FORMAT",
        message: "Input failed Zod parse.",
        details: {
          issues: parsed.error.issues.map((i) => ({
            path: i.path.map((seg) => String(seg)).join("."),
            message: i.message,
          })),
        },
      },
    };
  }
  const payload = parsed.data;
  const ingestRaw = deps.ingestRaw ?? ingestRawInformation;
  const proposeFragment = deps.proposeFragment ?? proposeFragmentHandler;
  const proposeNode = deps.proposeNode ?? proposeNodeHandler;
  const proposeAttribute = deps.proposeAttribute ?? proposeAttributeHandler;
  const proposeLink = deps.proposeLink ?? proposeLinkHandler;
  const verifyPin = deps.verifyNodePin ?? verifyNodePin;
  const now = deps.now ?? (() => new Date());

  const synth = synthesiseContent(payload, now());
  const intakeMetadata: Record<string, unknown> = {
    directed: true,
  };
  if (payload.source_label !== undefined) {
    intakeMetadata.source_label = payload.source_label;
  }
  if (deps.metadataPointer !== undefined) {
    intakeMetadata.conversation_id = deps.metadataPointer.conversation_id;
    intakeMetadata.message_id = deps.metadataPointer.message_id;
  }

  let intake;
  try {
    intake = await withTransaction(deps.pool, async (client) => {
      return await ingestRaw(client, {
        source_type: "chat",
        content: synth.content,
        metadata: intakeMetadata,
        model: DIRECTED_MODEL,
        prompt_version: DIRECTED_PROMPT_VERSION,
        original_input: deps.sourceExcerpt ?? null,
      });
    });
  } catch (err) {
    const pgDown = isPgUnavailable(err);
    deps.logger.error(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_intake_failed",
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "directed_ingestion_intake_failed"
    );
    return {
      ok: false,
      error: pgDown
        ? {
            code: "SYSTEM_SERVICE_UNAVAILABLE",
            message: "A backing service is temporarily unavailable.",
          }
        : {
            code: "SYSTEM_INTERNAL_ERROR",
            message: "Failed to persist the directed payload before dispatch.",
          },
    };
  }

  const {
    raw_information_id,
    llm_run_id,
    chunk_count,
    chunks,
  } = intake.body;

  if (intake.body.outcome !== "created") {
    deps.logger.error(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_noop_unexpected",
        raw_information_id,
        llm_run_id,
      },
      "directed_ingestion_noop_unexpected"
    );
    return {
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message:
          "Directed ingestion intake returned 'noop_existing'; the per-call nonce should make this unreachable.",
        details: { raw_information_id, llm_run_id },
      },
    };
  }

  if (chunks.length === 0) {
    deps.logger.error(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_no_chunks",
        raw_information_id,
        llm_run_id,
      },
      "directed_ingestion_no_chunks"
    );
    return {
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Directed ingestion intake produced no chunks.",
        details: { raw_information_id, llm_run_id },
      },
    };
  }

  const anchorChunkId = chunks[0]!.id;

  const handlerDeps = {
    pool: deps.pool,
    logger: deps.logger,
    llm_run_id,
    catalog: deps.catalog,
    now,
  };

  const report: DirectedItemReport[] = [];
  const refToFragmentId = new Map<string, string>();
  const refToNodeId = new Map<string, string>();
  const affectedNodes = createAffectedNodeCollector();

  for (const item of payload.fragments) {
    const fragInput: ProposeFragmentInput = {
      text: item.text,
      confidence: 1.0,
      chunk_ids: [anchorChunkId],
    };
    const envelope = await proposeFragment(fragInput, {
      pool: handlerDeps.pool,
      logger: handlerDeps.logger,
      llm_run_id: handlerDeps.llm_run_id,
    });
    if (envelope.ok) {
      refToFragmentId.set(item.ref, envelope.result.fragment_id);
      affectedNodes.record(
        "propose_fragment",
        envelope as unknown as McpEnvelope<Record<string, unknown>>
      );
      report.push({
        ref: item.ref,
        kind: "fragment",
        status: "accepted",
        fragment_id: envelope.result.fragment_id,
      });
    } else {
      report.push({
        ref: item.ref,
        kind: "fragment",
        status: classifyEnvelopeFailureStatus(envelope),
        error: {
          code: envelope.error.code,
          message: envelope.error.message,
          ...(envelope.error.details !== undefined
            ? { details: envelope.error.details }
            : {}),
        },
      });
    }
  }

  for (const item of payload.nodes) {
    if (item.node_id !== undefined) {
      const pinResult = await verifyPin(deps.pool, item.node_id);
      if (pinResult.kind === "ok") {
        refToNodeId.set(item.ref, item.node_id);
        affectedNodes.record("propose_node", {
          ok: true,
          result: { node_id: item.node_id, resolution: "matched_existing" },
        });
        report.push({
          ref: item.ref,
          kind: "node",
          status: "accepted",
          node_id: item.node_id,
          resolution: "matched_existing",
        });
      } else {
        const pinCode =
          (pinResult.details as { reason?: unknown }).reason === "not_found"
            ? "RESOURCE_NOT_FOUND"
            : "VALIDATION_INVALID_FORMAT";
        report.push({
          ref: item.ref,
          kind: "node",
          status: "rejected",
          error: {
            code: pinCode,
            message: pinResult.message,
            details: { node_id: item.node_id, ...pinResult.details },
          },
        });
      }
      continue;
    }

    const nodeInput: ProposeNodeInput = {
      node_type: item.node_type,
      name: item.name,
      ...(item.aliases !== undefined ? { aliases: item.aliases } : {}),
    };
    const envelope = await proposeNode(nodeInput, {
      pool: handlerDeps.pool,
      logger: handlerDeps.logger,
      llm_run_id: handlerDeps.llm_run_id,
      catalog: handlerDeps.catalog,
    });
    if (envelope.ok) {
      refToNodeId.set(item.ref, envelope.result.node_id);
      affectedNodes.record(
        "propose_node",
        envelope as unknown as McpEnvelope<Record<string, unknown>>
      );
      report.push({
        ref: item.ref,
        kind: "node",
        status: envelope.result.resolution === "needs_review"
          ? "needs_review"
          : "accepted",
        node_id: envelope.result.node_id,
        resolution: envelope.result.resolution,
      });
    } else {
      report.push({
        ref: item.ref,
        kind: "node",
        status: classifyEnvelopeFailureStatus(envelope),
        error: {
          code: envelope.error.code,
          message: envelope.error.message,
          ...(envelope.error.details !== undefined
            ? { details: envelope.error.details }
            : {}),
        },
      });
    }
  }

  const attributeItems = payload.attributes ?? [];
  for (const item of attributeItems) {
    const cascade = checkCascade(item, refToFragmentId, refToNodeId);
    if (cascade !== null) {
      report.push({
        ref: refForAttribute(item),
        kind: "attribute",
        status: "dependency_failed",
        reason: cascade,
      });
      deps.logger.info(
        {
          component: "ingestion.directed",
          event: "directed_ingestion_cascade",
          kind: "attribute",
          missing_ref: cascade,
          item_ref: refForAttribute(item),
          llm_run_id,
        },
        "directed_ingestion_cascade"
      );
      continue;
    }

    const nodeId = refToNodeId.get(item.node_ref)!;
    const fragmentId = refToFragmentId.get(item.evidence_ref)!;
    const attrInput: ProposeAttributeInput = {
      node_id: nodeId,
      key: item.key,
      value: canonicaliseAttributeValue(item.value),
      confidence: 1.0,
      fragment_ids: [fragmentId],
      ...(item.valid_from !== undefined ? { valid_from: item.valid_from } : {}),
      ...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),
      valid_from_basis: item.valid_from_basis ?? "stated",
      change_hint: item.change_hint ?? "none",
    };
    const envelope = await proposeAttribute(attrInput, {
      pool: handlerDeps.pool,
      logger: handlerDeps.logger,
      llm_run_id: handlerDeps.llm_run_id,
      catalog: handlerDeps.catalog,
      now: handlerDeps.now,
    });
    if (envelope.ok) {
      affectedNodes.record("propose_attribute", {
        ok: true,
        result: { ...envelope.result, node_id: nodeId },
      });
      const status = mapAttributeOutcomeToStatus(envelope.result.outcome);
      const entry: DirectedItemReport = {
        ref: refForAttribute(item),
        kind: "attribute",
        status,
        ...(envelope.result.attribute_id !== null
          ? { attribute_id: envelope.result.attribute_id }
          : {}),
      };
      report.push(entry);
    } else {
      report.push({
        ref: refForAttribute(item),
        kind: "attribute",
        status: classifyEnvelopeFailureStatus(envelope),
        error: {
          code: envelope.error.code,
          message: envelope.error.message,
          ...(envelope.error.details !== undefined
            ? { details: envelope.error.details }
            : {}),
        },
      });
    }
  }

  const linkItems = payload.links ?? [];
  for (const item of linkItems) {
    const cascade = checkLinkCascade(item, refToFragmentId, refToNodeId);
    if (cascade !== null) {
      report.push({
        ref: refForLink(item),
        kind: "link",
        status: "dependency_failed",
        reason: cascade,
      });
      deps.logger.info(
        {
          component: "ingestion.directed",
          event: "directed_ingestion_cascade",
          kind: "link",
          missing_ref: cascade,
          item_ref: refForLink(item),
          llm_run_id,
        },
        "directed_ingestion_cascade"
      );
      continue;
    }

    const sourceNodeId = refToNodeId.get(item.source_ref)!;
    const targetNodeId = refToNodeId.get(item.target_ref)!;
    const fragmentId = refToFragmentId.get(item.evidence_ref)!;
    const linkInput: ProposeLinkInput = {
      source_node_id: sourceNodeId,
      link_type: item.link_type,
      target_node_id: targetNodeId,
      confidence: 1.0,
      fragment_ids: [fragmentId],
      ...(item.valid_from !== undefined ? { valid_from: item.valid_from } : {}),
      ...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),
      valid_from_basis: item.valid_from_basis ?? "stated",
      change_hint: item.change_hint ?? "none",
    };
    const envelope = await proposeLink(linkInput, {
      pool: handlerDeps.pool,
      logger: handlerDeps.logger,
      llm_run_id: handlerDeps.llm_run_id,
      catalog: handlerDeps.catalog,
      now: handlerDeps.now,
    });
    if (envelope.ok) {
      affectedNodes.record("propose_link", {
        ok: true,
        result: {
          ...envelope.result,
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
        },
      });
      const status = mapLinkOutcomeToStatus(envelope.result.outcome);
      const entry: DirectedItemReport = {
        ref: refForLink(item),
        kind: "link",
        status,
        ...(envelope.result.link_id !== null
          ? { link_id: envelope.result.link_id }
          : {}),
      };
      report.push(entry);
    } else {
      report.push({
        ref: refForLink(item),
        kind: "link",
        status: classifyEnvelopeFailureStatus(envelope),
        error: {
          code: envelope.error.code,
          message: envelope.error.message,
          ...(envelope.error.details !== undefined
            ? { details: envelope.error.details }
            : {}),
        },
      });
    }
  }

  await closeRunCompletedSafe(deps.pool, llm_run_id, deps.logger);

  let resolvedAffected: readonly AffectedNode[] = [];
  try {
    const client = await deps.pool.connect();
    try {
      resolvedAffected = await resolveAffectedNodes(client, affectedNodes.ids());
    } finally {
      client.release();
    }
    setCachedAffectedNodes(llm_run_id, resolvedAffected);
  } catch (err) {
    deps.logger.warn(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_affected_nodes_resolution_failed",
        llm_run_id,
        cause_message: err instanceof Error ? err.message : String(err),
      },
      "directed_ingestion_affected_nodes_resolution_failed"
    );
  }

  const runRow = await readClosedRunSafe(deps.pool, llm_run_id, deps.logger);

  const summary = buildSummary(report);

  deps.logger.info(
    {
      component: "ingestion.directed",
      event: "directed_ingestion_completed",
      raw_information_id,
      llm_run_id,
      summary,
      affected_nodes_count: resolvedAffected.length,
    },
    "directed_ingestion_completed"
  );

  return {
    ok: true,
    result: {
      outcome: "ingested",
      raw_information_id,
      llm_run_id,
      chunk_count,
      summary,
      run: {
        id: llm_run_id,
        model: DIRECTED_MODEL,
        prompt_version: DIRECTED_PROMPT_VERSION,
        status: "completed",
        started_at: runRow.started_at,
        finished_at: runRow.finished_at,
        attempts: runRow.attempts,
        input_raw_information_id: raw_information_id,
        affected_nodes: resolvedAffected,
      },
      report,
    },
  };
}

function synthesiseContent(
  payload: DirectedIngestionInput,
  at: Date
): { content: string; nonce: string } {
  const nonce = randomUUID();
  const lines: string[] = payload.fragments.map(
    (f) => `[${f.ref}] ${f.text}`
  );
  if (payload.source_label !== undefined) {
    lines.push(`-- source_label=${payload.source_label}`);
  }
  lines.push(`-- directed_at=${at.toISOString()} nonce=${nonce}`);
  return { content: lines.join("\n"), nonce };
}

async function verifyNodePin(
  pool: Pool,
  nodeId: string
):
  Promise<
    | { kind: "ok" }
    | {
        kind: "rejected";
        message: string;
        details: Record<string, unknown>;
      }
  > {
  const client = await pool.connect();
  try {
    const res = await client.query<{ status: string }>(
      `SELECT status FROM knowledge_node WHERE id = $1 LIMIT 1`,
      [nodeId]
    );
    if (res.rows.length === 0) {
      return {
        kind: "rejected",
        message: "node_id pin does not resolve to an existing knowledge_node row.",
        details: { reason: "not_found" },
      };
    }
    const row = res.rows[0]!;
    if (row.status !== "active") {
      return {
        kind: "rejected",
        message: `node_id pin resolves to a knowledge_node row whose status is '${row.status}' (only 'active' is accepted).`,
        details: { reason: "inactive", current_status: row.status },
      };
    }
    return { kind: "ok" };
  } finally {
    client.release();
  }
}

function checkCascade(
  item: DirectedAttributeItem,
  refToFragmentId: ReadonlyMap<string, string>,
  refToNodeId: ReadonlyMap<string, string>
): string | null {
  if (!refToNodeId.has(item.node_ref)) return item.node_ref;
  if (!refToFragmentId.has(item.evidence_ref)) return item.evidence_ref;
  return null;
}

function checkLinkCascade(
  item: DirectedLinkItem,
  refToFragmentId: ReadonlyMap<string, string>,
  refToNodeId: ReadonlyMap<string, string>
): string | null {
  if (!refToNodeId.has(item.source_ref)) return item.source_ref;
  if (!refToNodeId.has(item.target_ref)) return item.target_ref;
  if (!refToFragmentId.has(item.evidence_ref)) return item.evidence_ref;
  return null;
}

function refForAttribute(item: DirectedAttributeItem): string {
  return `${item.node_ref}.${item.key}`;
}
function refForLink(item: DirectedLinkItem): string {
  return `${item.source_ref}->${item.link_type}->${item.target_ref}`;
}

function canonicaliseAttributeValue(v: string | number | boolean): string {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function mapLinkOutcomeToStatus(outcome: ProposeLinkOutcome): DirectedItemStatus {
  return outcome;
}
function mapAttributeOutcomeToStatus(
  outcome: ProposeAttributeOutcome
): DirectedItemStatus {
  return outcome;
}

function classifyEnvelopeFailureStatus(
  envelope: { ok: false; error: { code: string } }
): DirectedItemStatus {
  return envelope.error.code.startsWith("SYSTEM_") ? "error" : "rejected";
}

function buildSummary(report: readonly DirectedItemReport[]): DirectedSummary {
  const summary = {
    fragments: 0,
    nodes: 0,
    attributes: 0,
    links: 0,
    accepted: 0,
    consolidated: 0,
    superseded_previous: 0,
    needs_review: 0,
    uncertain: 0,
    disputed: 0,
    rejected: 0,
    error: 0,
    dependency_failed: 0,
  };
  for (const item of report) {
    summary[`${item.kind}s` as "fragments" | "nodes" | "attributes" | "links"] += 1;
    summary[item.status] += 1;
  }
  return summary;
}

async function closeRunCompletedSafe(
  pool: Pool,
  llmRunId: string,
  logger: Logger
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await closeLlmRunRow(client, { llm_run_id: llmRunId, outcome: "completed" });
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      logger.warn(
        {
          component: "ingestion.directed",
          event: "directed_ingestion_rollback_failed",
          llm_run_id: llmRunId,
          cause_message:
            rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
        },
        "directed_ingestion_rollback_failed"
      );
    }
    logger.warn(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_close_failed",
        llm_run_id: llmRunId,
        cause_message: err instanceof Error ? err.message : String(err),
      },
      "directed_ingestion_close_failed"
    );
  } finally {
    client.release();
  }
}

async function readClosedRunSafe(
  pool: Pool,
  llmRunId: string,
  logger: Logger
): Promise<{
  started_at: string;
  finished_at: string;
  attempts: number;
}> {
  const fallback = {
    started_at: new Date(0).toISOString(),
    finished_at: new Date(0).toISOString(),
    attempts: 1,
  };
  const client = await pool.connect();
  try {
    const row = await findLlmRunById(client, llmRunId);
    if (row === null) {
      logger.warn(
        {
          component: "ingestion.directed",
          event: "directed_ingestion_read_closed_run_missing",
          llm_run_id: llmRunId,
        },
        "directed_ingestion_read_closed_run_missing"
      );
      return fallback;
    }
    return {
      started_at: row.started_at.toISOString(),
      finished_at:
        row.finished_at === null
          ? new Date(0).toISOString()
          : row.finished_at.toISOString(),
      attempts: row.attempts,
    };
  } catch (err) {
    logger.warn(
      {
        component: "ingestion.directed",
        event: "directed_ingestion_read_closed_run_failed",
        llm_run_id: llmRunId,
        cause_message: err instanceof Error ? err.message : String(err),
      },
      "directed_ingestion_read_closed_run_failed"
    );
    return fallback;
  } finally {
    client.release();
  }
}

export const __testing__ = {
  synthesiseContent,
  buildSummary,
  canonicaliseAttributeValue,
  classifyEnvelopeFailureStatus,
  checkCascade,
  checkLinkCascade,
};
