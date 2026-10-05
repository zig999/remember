import type { Pool } from "pg";
import type { Logger } from "pino";
import { z, ZodError } from "zod";

import { withReadOnly } from "../../../shared/pg-transaction.js";

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

export { INGEST_TOOL_NAMES, type IngestMcpToolName };

export interface IngestToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly INGEST_MODEL: string;
    readonly CONTEXT_MODEL: string;
    readonly CHAT_INGEST_ENABLED?: boolean;
  };
  readonly now?: () => Date;
  readonly anthropicFactory?: IngestDocumentDeps["anthropicFactory"];
}

export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export function registerIngestToolset(deps: IngestToolsetDeps): void {
  const { mcp, pool, logger, catalog } = deps;
  const now = deps.now ?? (() => new Date());

  mcp.registerTool("ingest", {
    name: "propose_fragment",
    description: IngestToolDescriptions.propose_fragment,
    inputSchema: ProposeFragmentMcpInputSchema,
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

  mcp.registerTool("ingest", {
    name: "propose_node",
    description: IngestToolDescriptions.propose_node,
    inputSchema: ProposeNodeMcpInputSchema,
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

  mcp.registerTool("ingest", {
    name: "propose_link",
    description: IngestToolDescriptions.propose_link,
    inputSchema: ProposeLinkMcpInputSchema,
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

  mcp.registerTool("ingest", {
    name: "propose_attribute",
    description: IngestToolDescriptions.propose_attribute,
    inputSchema: ProposeAttributeMcpInputSchema,
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

  mcp.registerTool("ingest", {
    name: "ingest_document",
    description: IngestToolDescriptions.ingest_document,
    inputSchema: IngestDocumentMcpInputSchema,
    handler: async (rawInput: unknown): Promise<McpEnvelopeJson> => {
      const parsed = IngestDocumentMcpInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "VALIDATION_INVALID_FORMAT",
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
        contextModel: deps.env.CONTEXT_MODEL,
        now,
        ...(deps.anthropicFactory !== undefined
          ? { anthropicFactory: deps.anthropicFactory }
          : {}),
      });
    },
  });

  mcp.registerTool("ingest", {
    name: "ingest_directed",
    description: IngestToolDescriptions.ingest_directed,
    inputSchema: IngestDirectedMcpInputSchema,
    handler: async (
      rawInput: unknown,
      invocation_context?: Record<string, unknown>
    ): Promise<McpEnvelopeJson> => {
      return await ingestDirectedHandler(
        rawInput,
        {
          pool,
          logger,
          catalog,
          now,
        },
        invocation_context as
          | import("./directed-ingest.handler.js").IngestDirectedInvocationContext
          | undefined
      );
    },
  });

  mcp.registerTool("ingest", {
    name: "health",
    description: IngestToolDescriptions.health,
    inputSchema: HealthMcpInputSchema,
    handler: async (): Promise<McpEnvelopeJson> => {
      const report = await collectHealth(pool);
      return { ok: true, result: report };
    },
  });

  mcp.registerTool("ingest", {
    name: "get_ingestion_status",
    description: IngestToolDescriptions.get_ingestion_status,
    inputSchema: GetIngestionStatusMcpInputSchema,
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

  mcp.registerTool("ingest", {
    name: "list_recent_ingestions",
    description: IngestToolDescriptions.list_recent_ingestions,
    inputSchema: ListRecentIngestionsMcpInputSchema,
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
  return (await runIngestHandler({
    deps: { pool, logger, llm_run_id: llmRunId },
    tool_name: toolName,
    input: rawInput as never,
    run: async () => {
      throw new ValidationFailure(
        "VALIDATION_INVALID_FORMAT",
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
