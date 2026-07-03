// Directed-ingestion orchestrator — BR-34 / TC-01.
//
// Deterministic, synchronous sibling of `runLlmExtraction` (BR-26). The caller
// supplies a structured payload of fragments / nodes / attributes / links with
// local `ref` identifiers; this orchestrator persists a per-call
// `RawInformation` (stamped with a nonce so the `content_hash` is unique per
// call — no `noop_existing` branch on this path), opens an `LLMRun` carrying
// the sentinels `model='directed'` / `prompt_version='directed-v1'`, dispatches
// the items in dependency order (fragments → nodes → attributes → links)
// through the existing `propose_*` handlers (one TX per dispatch, BR-19; one
// `tool_call` audit row each, BR-23), and returns a per-item report plus the
// run's `affected_nodes` (BR-33).
//
// NEVER calls Anthropic — the directed path is `model = 'directed'`,
// `prompt_version = 'directed-v1'` (sentinels; the run is observable in the
// audit log but no Anthropic round-trip is made). The 5-layer validation
// pipeline of BR-13..BR-18 is preserved verbatim — every dispatched
// `propose_*` runs the same service path that the LLM-driven extraction
// (BR-26) and the REST mirrors (BR-28) use.
//
// Distinct from `runLlmExtraction`:
//   - No `LLMRun` pre-check: the orchestrator OPENS the run as part of
//     intake (BR-34 step 2). Failure to open the run is the only `failed`
//     terminal outcome; otherwise the run always lands `completed`.
//   - No chunk loop, no model dispatch — items are pre-structured.
//   - Forces `confidence = 1.0` and defaults `valid_from_basis = 'stated'`
//     when the caller omits it (BR-34 step 4).
//   - Cascade rule: when a ref dependency is missing (the referenced
//     fragment/node was rejected at its own step), the dependent item is
//     skipped with a synthetic `dependency_failed` report entry — no
//     `tool_call` row is written for the cascaded item (BR-34 step 4).
//
// CLAUDE.md "Architecture / Backend":
//   - Every write flows through a validated `propose_*` handler.
//   - The orchestrator never opens a long-lived `pg` connection — it acquires
//     short transactions via `withTransaction` for intake + close, and each
//     `propose_*` dispatch acquires its own via `runIngestHandler`.

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
import { ingestRawInformation } from "./ingestion.service.js";

// --------------------------------------------------------------------------
// Constants — sentinels for the directed path.
// --------------------------------------------------------------------------

/** Sentinel `model` for every directed run — NEVER an Anthropic model id. */
export const DIRECTED_MODEL = "directed" as const;

/** Sentinel `prompt_version` for every directed run — never resolved by `selectPromptModule`. */
export const DIRECTED_PROMPT_VERSION = "directed-v1" as const;

// --------------------------------------------------------------------------
// Input schema — Zod-validated at the service boundary.
//
// `ref` strings are LOCAL to the call: they are never persisted, never
// returned. The orchestrator builds in-memory maps `ref -> fragment_id` and
// `ref -> node_id` at dispatch time. The schema mirrors the BR-34 tool
// contract; the MCP/REST handler (separate Task Contract) will reuse this
// schema verbatim.
// --------------------------------------------------------------------------

/** ISO date `YYYY-MM-DD`. */
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

/**
 * Attribute value: accepted as `string | number | boolean`. The orchestrator
 * canonicalises to the string form `propose_attribute` expects:
 *   - boolean → `"true"` / `"false"`
 *   - number  → JSON `String(n)` (`5`, `-1.5`)
 *   - string  → verbatim
 *
 * The downstream structural layer (`parseAttributeValue`) re-validates the
 * canonicalised string against the catalog `value_type` — that step is
 * unchanged from the LLM path.
 */
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

// --------------------------------------------------------------------------
// Output shape — per-item report + envelope.
// --------------------------------------------------------------------------

/** Kinds in the per-item report — one entry per input item, in caller order. */
export type DirectedItemKind = "fragment" | "node" | "attribute" | "link";

/**
 * Closed status set for the report. Mirrors the eight `validation_outcome`
 * buckets of BR-12 plus the directed-only `dependency_failed` synthetic
 * outcome (BR-34 step 4) and the wire-level `error` (an unexpected dispatch
 * failure — not a layered-validation rejection).
 */
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
  /** Newly created or matched id when the item produced one. */
  readonly fragment_id?: string;
  readonly node_id?: string;
  readonly attribute_id?: string;
  readonly link_id?: string;
  /** Surfaces the `propose_node` resolution branch verbatim (matched / created / needs_review). */
  readonly resolution?: ProposeNodeResolution;
  /** For dependency_failed: the missing ref that caused the cascade. */
  readonly reason?: string;
  /** For rejected/error: the underlying error code + message + details (forwarded verbatim). */
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
  readonly run: DirectedRunResponse;
  readonly report: readonly DirectedItemReport[];
  readonly summary: DirectedSummary;
}

// --------------------------------------------------------------------------
// Service entry point.
// --------------------------------------------------------------------------

export interface DirectedIngestionDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  /** Test seam — defaults to `() => new Date()`. */
  readonly now?: () => Date;
  /** Test seam — defaults to the real `ingestRawInformation`. */
  readonly ingestRaw?: typeof ingestRawInformation;
  /** Test seam — defaults to the real propose-* MCP handlers. Production omits. */
  readonly proposeFragment?: typeof proposeFragmentHandler;
  readonly proposeNode?: typeof proposeNodeHandler;
  readonly proposeAttribute?: typeof proposeAttributeHandler;
  readonly proposeLink?: typeof proposeLinkHandler;
  /** Test seam — defaults to the real pin verifier. */
  readonly verifyNodePin?: typeof verifyNodePin;
  /**
   * Verbatim user turn that triggered this directed run (TC-01 / BR-34).
   * Path 1 capture: the chat agent dispatch threads `invocation_context.
   * source_excerpt` here; REST / MCP direct callers omit it. Forwarded as
   * `original_input` to `ingestRawInformation`; NEVER mixed into
   * `synthesiseContent` (so `content_hash` is unaffected).
   */
  readonly sourceExcerpt?: string;
  /**
   * Non-PII pointer back to the chat row that triggered this directed run
   * (TC-02 / BR-34). When the chat-agent dispatch invoked the tool the route
   * supplies `{ conversation_id, message_id }` so the orchestrator can merge
   * it into the `RawInformation.metadata` jsonb. REST / MCP-direct callers
   * omit this field; the orchestrator emits a metadata document without the
   * pointer keys. NEVER participates in `content_hash` (lives in metadata,
   * not in the synthesised content).
   */
  readonly metadataPointer?: {
    readonly conversation_id: string;
    readonly message_id: string;
  };
}

/**
 * Drive the directed-ingestion flow end-to-end. Returns a top-level success
 * envelope on every intake-successful call (per-item rejections live inside
 * `result.report`); returns an error envelope only for Zod-failure or
 * intake-failure paths (the run never opens in those cases).
 */
export async function directedIngestionService(
  input: unknown,
  deps: DirectedIngestionDeps
): Promise<McpEnvelope<DirectedIngestionResult>> {
  // ---- Step 1 — Zod parse (VALIDATION_INVALID_FORMAT on failure — P2.1) ----
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

  // ---- Step 2 — synthesise content + open the run (1 TX, BR-19) ----
  // Content is the concatenation of fragments[].text (one per line, prefixed
  // with `[ref]`) + a trailing line carrying timestamp + nonce. The nonce
  // guarantees `content_hash` uniqueness per call — there is NO `noop_existing`
  // branch on the directed path.
  const synth = synthesiseContent(payload, now());
  const intakeMetadata: Record<string, unknown> = {
    directed: true,
  };
  if (payload.source_label !== undefined) {
    intakeMetadata.source_label = payload.source_label;
  }
  // TC-02 / BR-34 — chat-row pointer (non-PII; the verbatim text lives in
  // `original_input`, not here). Merged in only when the chat dispatch
  // supplied it; REST / MCP-direct calls emit metadata without these keys.
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
        // TC-01 / BR-34 — verbatim user turn from the chat dispatch's
        // `invocation_context.source_excerpt`; `null` for REST / MCP direct
        // callers. `synthesiseContent` is unchanged: `content_hash` is
        // unaffected.
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

  // The nonce-stamped content guarantees `outcome === 'created'` here — but we
  // still defensively check rather than trust the invariant silently. A
  // `noop_existing` on the directed path would mean the nonce collided with a
  // prior call (effectively impossible with `randomUUID`), which is a system
  // invariant violation we surface loudly.
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

  // We need at least one chunk id to anchor every dispatched fragment to.
  // `chunkV1` always emits at least one chunk for non-empty content (BR-03),
  // so this is a sanity guard.
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

  // All fragments are anchored to the first chunk of the synthesised content.
  // The chunker may produce multiple chunks for long payloads, but for the
  // anti-hallucination check (BR-18) any chunk of the run's source is a valid
  // anchor — we deliberately pick the first one for determinism. (The
  // directed payload is small per call; in practice content is well under the
  // single-chunk boundary.)
  const anchorChunkId = chunks[0]!.id;

  // ---- Step 3 — dependency-ordered dispatch ----
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

  // 3a. Fragments — confidence forced to 1.0, anchored to the first chunk.
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

  // 3b. Nodes — `node_id` pin bypasses BR-25 fuzzy resolution; otherwise
  //     delegate to `propose_node` (advisory lock + resolution).
  for (const item of payload.nodes) {
    if (item.node_id !== undefined) {
      // Pin path — validate the node exists AND is active. Use a short read
      // transaction; we don't want to hold a connection across the loop.
      const pinResult = await verifyPin(deps.pool, item.node_id);
      if (pinResult.kind === "ok") {
        refToNodeId.set(item.ref, item.node_id);
        // Record the pinned node id on the affected-nodes collector — the
        // run touched this node by virtue of the directed re-affirmation.
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
        // P2.1 pin-failure discriminator (ingestion.back.md v1.6.0 BR-34 note):
        //   - `reason: 'not_found'`  -> RESOURCE_NOT_FOUND (row absent)
        //   - `reason: 'inactive'`   -> VALIDATION_INVALID_FORMAT (row present
        //                                but status != 'active'; structural
        //                                layer surface — see spec table).
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

  // 3c. Attributes — resolve `node_ref` + `evidence_ref` via maps; cascade if
  //     either is missing. `confidence = 1.0`; `valid_from_basis` defaults to
  //     `'stated'` when omitted by caller (BR-34 Defaults matrix).
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
        // The propose_attribute envelope carries `attribute_id` + `outcome`
        // but not `node_id` — the collector reads `node_id`. Synthesise it
        // here so the directed orchestrator surfaces the touched node.
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

  // 3d. Links — mirror of attributes.
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
          // Same trick as attributes — surface the endpoints so the collector
          // records both source + target as affected.
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

  // ---- Step 4 — close the run (always 'completed' on this path) ----
  await closeRunCompletedSafe(deps.pool, llm_run_id, deps.logger);

  // ---- Step 5 — resolve affected nodes (BR-33) ----
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
    // resolvedAffected stays []; the run is still completed.
  }

  // ---- Step 6 — read the closed run row for the response envelope ----
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
      summary,
    },
  };
}

// --------------------------------------------------------------------------
// Helpers.
// --------------------------------------------------------------------------

/**
 * Synthesise the `RawInformation.content` for a directed call. Concatenates
 * `fragments[].text` with `[ref]` prefixes; appends a trailing nonce line so
 * the resulting `content_hash` is unique per call (BR-34 step 2 / decision 3).
 */
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

/**
 * Verify a caller-supplied `node_id` pin: the node row must exist AND its
 * `status` must be `'active'`. Returns a discriminated result so the caller
 * can surface a clean rejection.
 */
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

/**
 * Cascade check for an attribute item — returns the FIRST missing dependency
 * ref encountered, or `null` if every ref resolves.
 */
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

/**
 * A synthetic ref used in the report when the attribute/link payload itself
 * did not supply a `ref` (the schema lets attributes/links omit it — they are
 * scoped by the surrounding fragment/node pair). Deterministic so two runs
 * with identical inputs produce identical report keys.
 */
function refForAttribute(item: DirectedAttributeItem): string {
  return `${item.node_ref}.${item.key}`;
}
function refForLink(item: DirectedLinkItem): string {
  return `${item.source_ref}->${item.link_type}->${item.target_ref}`;
}

/**
 * Canonicalise a directed attribute `value` to the string form
 * `propose_attribute` expects. The structural layer parses this against the
 * declared `value_type` next — that step is unchanged.
 */
function canonicaliseAttributeValue(v: string | number | boolean): string {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

/**
 * Map a `propose_link` outcome to the directed report status. The two enums
 * are nearly identical; only the wire spelling differs.
 */
function mapLinkOutcomeToStatus(outcome: ProposeLinkOutcome): DirectedItemStatus {
  return outcome;
}
function mapAttributeOutcomeToStatus(
  outcome: ProposeAttributeOutcome
): DirectedItemStatus {
  return outcome;
}

/**
 * Classify an `ok:false` envelope from a `propose_*` handler into the report
 * status enum. P2.1 namespaced discriminator (replaces the pre-P2.1 §14 short
 * codes retired by the TC-04 / TC-05 migration):
 *   - System-level failures (`SYSTEM_*` — e.g. `SYSTEM_INTERNAL_ERROR`,
 *     `SYSTEM_SERVICE_UNAVAILABLE`) collapse to `'error'` (SDK / catch-all
 *     bucket).
 *   - Every other namespaced code (`VALIDATION_*` / `BUSINESS_*` /
 *     `RESOURCE_NOT_FOUND`) is a layered-validation rejection and collapses to
 *     `'rejected'`.
 */
function classifyEnvelopeFailureStatus(
  envelope: { ok: false; error: { code: string } }
): DirectedItemStatus {
  return envelope.error.code.startsWith("SYSTEM_") ? "error" : "rejected";
}

/** Aggregate the per-item report into the counters block of the response. */
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

/**
 * Close the run as `completed` in a fresh short transaction. Swallow errors —
 * the dispatch already wrote all `tool_call` audit rows; a failure to flip the
 * run row is surfaced via logs only.
 */
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
    } catch {
      /* swallow */
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

/**
 * Best-effort read of the closed run row for the response. Returns
 * placeholder timestamps when the read itself fails — the run row is already
 * closed at this point and the caller has the ids.
 */
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

// --------------------------------------------------------------------------
// Test-only surface — not part of the public API. Kept narrow.
// --------------------------------------------------------------------------

export const __testing__ = {
  synthesiseContent,
  buildSummary,
  canonicaliseAttributeValue,
  classifyEnvelopeFailureStatus,
  checkCascade,
  checkLinkCascade,
};
