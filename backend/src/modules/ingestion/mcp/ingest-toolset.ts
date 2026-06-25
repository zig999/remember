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

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";
import { z, ZodError } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { IngestToolDescriptions } from "../dto/index.js";
import type { IngestToolName } from "../dto/llm-run.dto.js";
import type { McpServer } from "../../../mcp/server.js";
import {
  internalError,
  isPgUnavailable,
  serviceUnavailableError,
} from "../../../shared/error-mapping.js";
import { collectHealth } from "../../../shared/health.js";
import {
  getLlmRunById,
  listRecentIngestions,
} from "../service/llm-run.service.js";
import { ResourceNotFoundError } from "../service/ingestion.service.js";
import { runIngestHandler } from "./handler-base.js";
import { proposeAttributeHandler } from "./propose-attribute.handler.js";
import { proposeFragmentHandler } from "./propose-fragment.handler.js";
import { proposeLinkHandler } from "./propose-link.handler.js";
import { proposeNodeHandler } from "./propose-node.handler.js";
import {
  ingestDocumentHandler,
  type IngestDocumentDeps,
} from "./ingest-document.handler.js";
import { ingestDirectedHandler } from "./directed-ingest.handler.js";
import { ValidationFailure } from "../validation/errors.js";
import {
  GetIngestionStatusMcpInputSchema,
  HealthMcpInputSchema,
  INGEST_TOOL_NAMES,
  IngestDirectedMcpInputSchema,
  IngestDocumentMcpInputSchema,
  ListRecentIngestionsMcpInputSchema,
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
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    /** Default model for the `ingest_document` server-side extraction. */
    readonly INGEST_MODEL: string;
    /**
     * Rollout flag for `start_async_ingestion` (BR-32). When `true`, the tool
     * is registered on the `ingest` toolset; when `false` or absent, the
     * registration is skipped at boot — `tools/list` then omits the tool and
     * `mcp.getTool('ingest', 'start_async_ingestion')` returns `undefined`.
     * Boot-only — there is no per-call gate after registration. Wired from
     * `env.CHAT_INGEST_ENABLED` (default `false`, added by TC-02).
     */
    readonly CHAT_INGEST_ENABLED?: boolean;
  };
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
        ingestModel: deps.env.INGEST_MODEL,
        now,
        ...(deps.anthropicFactory !== undefined
          ? { anthropicFactory: deps.anthropicFactory }
          : {}),
      });
    },
  });

  // ----- ingest_directed (BR-34) — deterministic, NO-LLM sibling of ingest_document -----
  // Always registered (no rollout flag): the directed path never calls
  // Anthropic and re-uses the same validated `propose_*` pipeline as the four
  // proposal writers, so there is no extraction cost or model risk to gate.
  // Replaces the retired `start_async_ingestion` tool (TC-03 / BR-34).
  mcp.registerTool("ingest", {
    name: "ingest_directed",
    description: IngestToolDescriptions.ingest_directed,
    inputSchema: IngestDirectedMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      // The handler owns its own Zod parse (BR-34, TC-03) — no second parse
      // here. A parse failure surfaces as STRUCTURAL_INVALID; the run is
      // never opened so there is no `tool_call` row to audit against.
      return await ingestDirectedHandler(rawInput, {
        pool,
        logger,
        catalog,
        now,
      });
    },
  });

  // ----- health — liveness + DB ping (read-only, no args) -----
  // Always succeeds at the MCP level: a DB failure surfaces inside `result`
  // (`{ ok: false, database: "unreachable" }`) rather than as an error
  // envelope, so the caller can always tell the BFF is answering.
  mcp.registerTool("ingest", {
    name: "health",
    description: IngestToolDescriptions.health,
    inputSchema: HealthMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (): Promise<McpEnvelopeJson> => {
      const report = await collectHealth(pool);
      return { ok: true, result: report };
    },
  });

  // ----- get_ingestion_status — poll one run by id (read-only) -----
  mcp.registerTool("ingest", {
    name: "get_ingestion_status",
    description: IngestToolDescriptions.get_ingestion_status,
    inputSchema: GetIngestionStatusMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      try {
        const { llm_run_id } = GetIngestionStatusMcpInputSchema.parse(rawInput);
        const result = await withReadOnly(pool, (client) =>
          getLlmRunById(client, llm_run_id)
        );
        return { ok: true, result };
      } catch (err) {
        return mapReadError(err);
      }
    },
  });

  // ----- list_recent_ingestions — discover a run after a timeout (read-only) -----
  mcp.registerTool("ingest", {
    name: "list_recent_ingestions",
    description: IngestToolDescriptions.list_recent_ingestions,
    inputSchema: ListRecentIngestionsMcpInputSchema as unknown as z.ZodTypeAny,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      try {
        const { limit } = ListRecentIngestionsMcpInputSchema.parse(rawInput);
        const items = await withReadOnly(pool, (client) =>
          listRecentIngestions(client, limit)
        );
        return { ok: true, result: { items } };
      } catch (err) {
        return mapReadError(err);
      }
    },
  });

  const READ_ONLY_TOOL_NAMES = [
    "health",
    "get_ingestion_status",
    "list_recent_ingestions",
  ] as const;

  logger.info(
    {
      component: "mcp.ingest",
      tools_registered:
        INGEST_TOOL_NAMES.length + 2 + READ_ONLY_TOOL_NAMES.length,
      tool_names: [
        ...INGEST_TOOL_NAMES,
        "ingest_document",
        "ingest_directed",
        ...READ_ONLY_TOOL_NAMES,
      ],
    },
    "ingest_toolset_registered"
  );
}

// --------------------------------------------------------------------------
// Read-only helpers for the three operational tools above. Mirrors the
// `withReadOnly` + envelope pattern of `query-retrieval/mcp/query-toolset.ts`,
// duplicated rather than imported to keep the ingest toolset independent of the
// query-retrieval module (Rule 3 surgical). The error mapper handles the
// ingestion-domain `ResourceNotFoundError` (the KG mapper recognises a
// DIFFERENT class) plus Zod / pg-unavailable / unknown terminals.
// --------------------------------------------------------------------------

async function withReadOnly<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow rollback failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}

function mapReadError(err: unknown): McpEnvelopeJson {
  if (err instanceof ZodError) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_INVALID_FORMAT",
        message: "Request payload failed validation.",
        details: err.issues.map((i) => ({
          path: i.path.map((seg) => String(seg)).join("."),
          message: i.message,
        })),
      },
    };
  }
  if (err instanceof ResourceNotFoundError) {
    return {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: { entity: err.entity, id: err.entityId },
      },
    };
  }
  if (isPgUnavailable(err)) {
    return serviceUnavailableError().envelope;
  }
  return internalError().envelope;
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
