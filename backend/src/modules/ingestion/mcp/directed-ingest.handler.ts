// MCP `ingest.ingest_directed` handler (BR-34 / TC-03).
//
// Thin transport-shaped wrapper around `directedIngestionService`
// (BR-34 / TC-01) — the deterministic, NO-LLM sibling of `ingest_document`.
// The handler:
//   1. Zod-parses the raw MCP arguments against `IngestDirectedMcpInputSchema`.
//      A parse failure short-circuits with a `STRUCTURAL_INVALID` envelope
//      (no run is created and no service call is made).
//   2. Delegates to `directedIngestionService` with the parsed payload. The
//      service owns intake (RawInformation + LLMRun), dispatch through the
//      validated `propose_*` handlers, and the per-item report.
//   3. Forwards the service envelope verbatim (success or layered failure
//      such as `SYSTEM_SERVICE_UNAVAILABLE` / `INTERNAL`).
//   4. NEVER re-throws — an unexpected exception is logged and mapped to a
//      clean `INTERNAL` envelope. The MCP SDK kernel would otherwise turn a
//      raw throw into a JSON-RPC error and potentially leak `err.message`.
//
// Distinct from the four `propose_*` writers: this handler CREATES the run
// (no ambient `llm_run_id`), so its MCP-facing schema does NOT extend with
// `llm_run_id`. Mirrors the `ingest_document` shape in that respect; the
// audit `tool_call` rows live INSIDE the dispatched `propose_*` calls the
// service makes (one per dispatched item) — this handler writes none of its
// own.
//
// CLAUDE.md "Architecture / Backend":
//   - The LLM never touches the DB directly — every write flows through the
//     validated `propose_*` path the service drives.
//   - Envelope `{ok,result,error}` is the LOGICAL contract; the SDK kernel
//     renders it as MCP `content`/`isError`.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  directedIngestionService,
  type DirectedIngestionDeps,
  type DirectedIngestionResult,
} from "../service/directed-ingestion.service.js";
import { IngestDirectedMcpInputSchema } from "./mcp-schemas.js";

/** Canonical MCP envelope this handler returns. Mirrors the shape used by
 *  every other ingest tool handler — kept as a local structural type so the
 *  handler does not depend on a transport-specific module. */
export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/**
 * Dependencies for the `ingest_directed` handler. Mirrors the
 * `ingest-document.handler.ts` DI seam pattern: real production wiring uses
 * the defaults; unit tests inject `directedIngestion` (and the orchestrator's
 * own collaborator seams) to exercise branch logic without a database.
 */
export interface IngestDirectedDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly now?: () => Date;
  /**
   * Test seam — defaults to the real `directedIngestionService`. Tests inject
   * a stub to exercise the handler's envelope-forwarding/error-mapping logic
   * without touching the orchestrator.
   */
  readonly directedIngestion?: typeof directedIngestionService;
  /**
   * Test seams forwarded into the orchestrator when the real service is used
   * (and ignored when `directedIngestion` is stubbed). Production omits.
   */
  readonly ingestRaw?: DirectedIngestionDeps["ingestRaw"];
  readonly proposeFragment?: DirectedIngestionDeps["proposeFragment"];
  readonly proposeNode?: DirectedIngestionDeps["proposeNode"];
  readonly proposeAttribute?: DirectedIngestionDeps["proposeAttribute"];
  readonly proposeLink?: DirectedIngestionDeps["proposeLink"];
  readonly verifyNodePin?: DirectedIngestionDeps["verifyNodePin"];
}

/**
 * Optional transport-neutral invocation context (TC-01 / BR-34 — Path 1).
 *
 * The chat agent dispatch supplies `source_excerpt` (the operator's verbatim
 * turn) here so the orchestrator can persist it as `original_input` on the
 * `RawInformation` row. REST / MCP-direct callers omit this argument — the
 * handler treats it as `undefined` and the orchestrator stores `null`.
 *
 * TC-02 / BR-34 adds the optional `pointer` field: when chat is the
 * transport, the route supplies `{ conversation_id, message_id }` so the
 * orchestrator can merge a non-PII pointer into the `RawInformation.metadata`
 * jsonb. The LLM never sees these ids (they live entirely in the request
 * pipeline). Both ids are required when `pointer` is present — partial
 * pointers are dropped.
 *
 * Why an additional argument (and not a tool-schema field):
 *   - Capture is SERVER-SIDE deterministic — the LLM never relays the
 *     verbatim text (which would re-introduce paraphrase / typo-fix).
 *   - Path-neutral: same handler shape for chat (with excerpt) and for
 *     REST / MCP direct (without). No `if`-by-tool branching upstream.
 */
export interface IngestDirectedInvocationContext {
  readonly source_excerpt?: string;
  readonly pointer?: {
    readonly conversation_id: string;
    readonly message_id: string;
  };
}

/**
 * Drive the `ingest_directed` MCP tool. `rawInput` is the verbatim arguments
 * object from the MCP request — `unknown` because the SDK kernel hands it
 * over before any schema validation. `invocationContext` is the optional
 * transport-neutral second argument supplied by the chat-agent dispatch
 * (TC-01 / BR-34); REST and direct MCP callers omit it. Returns the MCP
 * envelope. Never throws.
 */
export async function ingestDirectedHandler(
  rawInput: unknown,
  deps: IngestDirectedDeps,
  invocationContext?: IngestDirectedInvocationContext
): Promise<McpEnvelopeJson> {
  // ---- Step 1 — Zod parse (STRUCTURAL_INVALID on failure, no service call) ----
  const parsed = IngestDirectedMcpInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "ingest_directed arguments failed validation.",
        details: {
          issues: parsed.error.issues.map((i) => ({
            path: i.path.map((seg) => String(seg)).join("."),
            message: i.message,
          })),
        },
      },
    };
  }

  // ---- Step 2 — delegate to the orchestrator ----
  const directed = deps.directedIngestion ?? directedIngestionService;

  // Build the orchestrator's deps surface. Forward each optional test seam
  // ONLY when the caller provided it — undefined keys would otherwise clash
  // with `exactOptionalPropertyTypes` and overwrite the orchestrator's
  // defaults with `undefined`.
  const serviceDeps: DirectedIngestionDeps = {
    pool: deps.pool,
    logger: deps.logger,
    catalog: deps.catalog,
    ...(deps.now !== undefined ? { now: deps.now } : {}),
    ...(deps.ingestRaw !== undefined ? { ingestRaw: deps.ingestRaw } : {}),
    ...(deps.proposeFragment !== undefined
      ? { proposeFragment: deps.proposeFragment }
      : {}),
    ...(deps.proposeNode !== undefined
      ? { proposeNode: deps.proposeNode }
      : {}),
    ...(deps.proposeAttribute !== undefined
      ? { proposeAttribute: deps.proposeAttribute }
      : {}),
    ...(deps.proposeLink !== undefined
      ? { proposeLink: deps.proposeLink }
      : {}),
    ...(deps.verifyNodePin !== undefined
      ? { verifyNodePin: deps.verifyNodePin }
      : {}),
    // TC-01 / BR-34 — forward the verbatim user turn captured by the chat
    // dispatch. Omitted (not set to `undefined`) so `exactOptionalPropertyTypes`
    // does not collide with the orchestrator's default.
    ...(invocationContext?.source_excerpt !== undefined
      ? { sourceExcerpt: invocationContext.source_excerpt }
      : {}),
    // TC-02 / BR-34 — forward the chat-row pointer (conversation_id +
    // message_id) so the orchestrator can merge it into the RawInformation
    // metadata jsonb. Both ids are mandatory together — a partial pointer is
    // dropped (omitted) rather than persisted with a missing field.
    ...(invocationContext?.pointer !== undefined &&
    typeof invocationContext.pointer.conversation_id === "string" &&
    typeof invocationContext.pointer.message_id === "string"
      ? {
          metadataPointer: {
            conversation_id: invocationContext.pointer.conversation_id,
            message_id: invocationContext.pointer.message_id,
          },
        }
      : {}),
  };

  // The orchestrator returns clean envelopes for every modelled failure
  // (intake-failure → SYSTEM_SERVICE_UNAVAILABLE / INTERNAL, defensive Zod
  // → STRUCTURAL_INVALID); we forward those verbatim. An UNEXPECTED throw
  // here (bug in the orchestrator, raw pg error escaping classification)
  // would otherwise bubble into the SDK kernel and leak `err.message` —
  // catch it and surface as a generic INTERNAL.
  try {
    // The service Zod-parses internally as a second line of defence; we pass
    // the typed payload (the service accepts `unknown` so this is widening,
    // not a contract change). The service-side schema mirrors the MCP one
    // by design — a divergence would be a spec drift to flag, not silently
    // bridge.
    const envelope = await directed(parsed.data, serviceDeps);
    return envelope as McpEnvelopeJson;
  } catch (err) {
    deps.logger.error(
      {
        component: "mcp.ingest",
        tool: "ingest_directed",
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "ingest_directed_unexpected_error"
    );
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Unexpected error during directed ingestion.",
      },
    };
  }
}

/** Re-exported for tests that want the success-envelope result shape. */
export type IngestDirectedResult = DirectedIngestionResult;
