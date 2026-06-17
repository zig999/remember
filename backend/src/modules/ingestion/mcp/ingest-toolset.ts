// MCP `ingest` toolset registrar — wires the four `propose_*` tool handlers
// onto the SHARED in-process `McpServer` registry under the `ingest` toolset
// key. The MCP transport (`mcp/transport.ts`, mounted via the shared SDK
// kernel `mountMcpEndpoint`) looks tools up on this registry at request time.
//
// Pattern mirrors `modules/curation/mcp/curation-toolset.ts` and
// `modules/knowledge-graph/mcp/query-toolset.ts` — single source per BR-24,
// per-tool handler that owns the MCP-facing Zod parse, dispatch to the
// transport-agnostic business shell, and envelope shape.
//
// Run binding (BR-21 revised, BR-28, v1.2.4 — Option B):
//   - The MCP-facing schema of each tool extends the business DTO with
//     `llm_run_id: z.string().min(1)`.
//   - The handler reads `llm_run_id` from the parsed args, splits it from the
//     business DTO, and forwards both to the existing `proposeXxxHandler`
//     (`propose-*.handler.ts`), which already owns the per-call transaction,
//     `assertRunIsRunning`, and the `tool_call` audit row (BR-23 updated).
//   - A Zod failure (missing/invalid `llm_run_id` or malformed business DTO)
//     also goes through `runIngestHandler` so the rejected `tool_call` audit
//     row is written (BR-23 updated). When no `llm_run_id` is parseable from
//     the raw input, the audit-row insert cannot resolve its FK; the shell's
//     `safeWriteAuditOnRollback` logs and swallows that, and the LLM still
//     sees the STRUCTURAL_INVALID envelope (best-effort audit).
//
// Idempotency: `McpServer.registerTool` rejects duplicates by design; calling
// this registrar twice in the same process throws. The boot wires it once.

import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { IngestToolDescriptions } from "../dto/index.js";
import type { IngestToolName } from "../dto/llm-run.dto.js";
import type { McpServer } from "../../../mcp/server.js";
import { runIngestHandler } from "./handler-base.js";
import { proposeAttributeHandler } from "./propose-attribute.handler.js";
import { proposeFragmentHandler } from "./propose-fragment.handler.js";
import { proposeLinkHandler } from "./propose-link.handler.js";
import { proposeNodeHandler } from "./propose-node.handler.js";
import {
  ingestDocumentHandler,
  type IngestDocumentDeps,
} from "./ingest-document.handler.js";
import { ValidationFailure } from "../validation/errors.js";
import {
  INGEST_TOOL_NAMES,
  IngestDocumentMcpInputSchema,
  ProposeAttributeMcpInputSchema,
  ProposeFragmentMcpInputSchema,
  ProposeLinkMcpInputSchema,
  ProposeNodeMcpInputSchema,
  type IngestMcpToolName,
} from "./mcp-schemas.js";

// --------------------------------------------------------------------------
// Public closed enumeration — re-exported from this module (consumed by
// `app.ts` to compose the transport's `toolNames` whitelist).
// --------------------------------------------------------------------------

export { INGEST_TOOL_NAMES, type IngestMcpToolName };

/** Dependencies required to register the ingest MCP tools. */
export interface IngestToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  /**
   * Anthropic secret — consumed by the high-level `ingest_document` tool, which
   * drives the server-side extraction orchestrator. The four `propose_*` tools
   * do not need it (they are called BY an LLM, not the other way around).
   */
  readonly env: { readonly ANTHROPIC_API_KEY: string };
  /** Clock source — defaults to `() => new Date()`. Tests inject deterministic clocks. */
  readonly now?: () => Date;
  /** Test seam — forwarded to the `ingest_document` orchestrator. Production omits it. */
  readonly anthropicFactory?: IngestDocumentDeps["anthropicFactory"];
}

// --------------------------------------------------------------------------
// Envelope shape — identical to query / curation. Kept as a structural type
// so we do not pull a service-layer type into the toolset module.
// --------------------------------------------------------------------------

export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

// --------------------------------------------------------------------------
// Register the four `ingest` tools on the shared registry under the `ingest`
// toolset key. Idempotency caveat: `McpServer.registerTool` rejects duplicate
// keys — calling this twice in the same process throws.
// --------------------------------------------------------------------------

export function registerIngestToolset(deps: IngestToolsetDeps): void {
  const { mcp, pool, logger, catalog } = deps;
  const now = deps.now ?? (() => new Date());

  // ----- propose_fragment (UC-08) -----
  mcp.registerTool("ingest", {
    name: "propose_fragment",
    description: IngestToolDescriptions.propose_fragment,
    inputSchema: ProposeFragmentMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = ProposeFragmentMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return (await runZodFailureAudit(
          pool,
          logger,
          rawInput,
          parsed.error,
          "propose_fragment"
        )) as McpEnvelopeJson;
      }
      const { llm_run_id, ...input } = parsed.data;
      return (await proposeFragmentHandler(input, {
        pool,
        logger,
        llm_run_id,
      })) as McpEnvelopeJson;
    },
  });

  // ----- propose_node (UC-09) -----
  mcp.registerTool("ingest", {
    name: "propose_node",
    description: IngestToolDescriptions.propose_node,
    inputSchema: ProposeNodeMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = ProposeNodeMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return (await runZodFailureAudit(
          pool,
          logger,
          rawInput,
          parsed.error,
          "propose_node"
        )) as McpEnvelopeJson;
      }
      const { llm_run_id, ...input } = parsed.data;
      return (await proposeNodeHandler(input, {
        pool,
        logger,
        llm_run_id,
        catalog,
      })) as McpEnvelopeJson;
    },
  });

  // ----- propose_link (UC-10) -----
  mcp.registerTool("ingest", {
    name: "propose_link",
    description: IngestToolDescriptions.propose_link,
    inputSchema: ProposeLinkMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = ProposeLinkMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return (await runZodFailureAudit(
          pool,
          logger,
          rawInput,
          parsed.error,
          "propose_link"
        )) as McpEnvelopeJson;
      }
      const { llm_run_id, ...input } = parsed.data;
      return (await proposeLinkHandler(input, {
        pool,
        logger,
        llm_run_id,
        catalog,
        now,
      })) as McpEnvelopeJson;
    },
  });

  // ----- propose_attribute (UC-11) -----
  mcp.registerTool("ingest", {
    name: "propose_attribute",
    description: IngestToolDescriptions.propose_attribute,
    inputSchema: ProposeAttributeMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = ProposeAttributeMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return (await runZodFailureAudit(
          pool,
          logger,
          rawInput,
          parsed.error,
          "propose_attribute"
        )) as McpEnvelopeJson;
      }
      const { llm_run_id, ...input } = parsed.data;
      return (await proposeAttributeHandler(input, {
        pool,
        logger,
        llm_run_id,
        catalog,
        now,
      })) as McpEnvelopeJson;
    },
  });

  // ----- ingest_document (TC-MCI-002) — one-shot, run-creating ingestion -----
  // Distinct from the four `propose_*` writers: this tool CREATES the run and
  // drives server-side extraction, so it takes no `llm_run_id`. A Zod failure
  // happens before any run exists, so there is no `tool_call` row to audit
  // against — we return STRUCTURAL_INVALID directly (the orchestrator it
  // triggers writes its own per-proposal audit rows).
  mcp.registerTool("ingest", {
    name: "ingest_document",
    description: IngestToolDescriptions.ingest_document,
    inputSchema: IngestDocumentMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = IngestDocumentMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "STRUCTURAL_INVALID",
            message: "ingest_document arguments failed validation.",
            details: {
              issues: parsed.error.issues.map((i) => ({
                path: i.path.map((seg) => String(seg)).join("."),
                message: i.message,
              })),
            },
          },
        };
      }
      return await ingestDocumentHandler(parsed.data, {
        pool,
        logger,
        catalog,
        anthropicApiKey: deps.env.ANTHROPIC_API_KEY,
        now,
        ...(deps.anthropicFactory !== undefined
          ? { anthropicFactory: deps.anthropicFactory }
          : {}),
      });
    },
  });

  logger.info(
    {
      component: "mcp.ingest",
      tools_registered: INGEST_TOOL_NAMES.length + 1,
      tool_names: [...INGEST_TOOL_NAMES, "ingest_document"],
    },
    "ingest_toolset_registered"
  );
}

// --------------------------------------------------------------------------
// Zod-failure audit path: route the failed parse through `runIngestHandler`
// so a `tool_call` row with `validation_outcome='rejected'` is written under
// the same shell that the in-handler Zod-fail path uses (BR-23 updated).
//
// `llm_run_id` is extracted from the raw input on a best-effort basis: if the
// caller sent a non-empty string, the FK resolves and the audit row is
// persisted; if it is missing or syntactically wrong, the shell's
// `safeWriteAuditOnRollback` logs and swallows the FK violation — the LLM
// still sees the STRUCTURAL_INVALID envelope.
// --------------------------------------------------------------------------

function extractLlmRunIdFromRaw(rawInput: unknown): string {
  if (typeof rawInput !== "object" || rawInput === null) return "";
  const candidate = (rawInput as { llm_run_id?: unknown }).llm_run_id;
  return typeof candidate === "string" ? candidate : "";
}

async function runZodFailureAudit(
  pool: Pool,
  logger: Logger,
  rawInput: unknown,
  zodError: z.ZodError,
  toolName: IngestToolName
): Promise<McpEnvelopeJson> {
  const llmRunId = extractLlmRunIdFromRaw(rawInput);
  // The handler-shell takes the audit row's `arguments` from the `input`
  // payload it receives. We forward the raw (untyped) input verbatim so the
  // tool_call row records exactly what the LLM sent.
  return (await runIngestHandler({
    deps: { pool, logger, llm_run_id: llmRunId },
    tool_name: toolName,
    input: rawInput as never,
    run: async () => {
      throw new ValidationFailure(
        "STRUCTURAL_INVALID",
        "MCP tool args failed Zod parse.",
        {
          issues: zodError.issues.map((i) => ({
            path: i.path.map((seg) => String(seg)).join("."),
            message: i.message,
          })),
        }
      );
    },
  })) as McpEnvelopeJson;
}
