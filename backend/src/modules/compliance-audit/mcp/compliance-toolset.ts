// MCP integration of the compliance-audit module.
//
// BR-14: `compliance_delete` is mirrored as an MCP tool under the `curation`
// toolset (per v7 §14.4). The handler uses the SAME service layer as the
// REST route — `complianceDelete()` — wrapped in its own transaction.
//
// Envelope (CLAUDE.md "Architecture / Backend"):
//   success -> { ok: true,  result: { outcome, deletion } }
//   failure -> { ok: false, error: { code, message, details? } }
//
// Per BR-15:
//   - Zod parse failure on input -> STRUCTURAL_INVALID
//   - raw_information_id resolves to no row -> NOT_FOUND
//   - UC-01 alt 4c legacy orphan -> INTERNAL
//   - Any unhandled exception -> INTERNAL

import type { Pool } from "pg";
import type { Logger } from "pino";
import { ZodError } from "zod";

import type { McpServer } from "../../../mcp/server.js";
import { ComplianceDeleteRequestSchema } from "../dto/compliance-delete.dto.js";
import { complianceDelete } from "../service/compliance-audit.service.js";
import { withTransaction } from "../service/transaction.js";
import {
  InternalFailure,
  ResourceNotFoundError,
  ValidationFailure,
} from "../service/errors.js";

export interface ComplianceToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
}

/**
 * Tool result envelope returned to the MCP transport. Mirrors the design
 * principle of §14 ("business outcomes are not errors"): idempotent no-op is
 * a successful `ok: true` envelope with `outcome: noop_already_deleted`.
 */
type McpEnvelope =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export function registerComplianceToolset(deps: ComplianceToolsetDeps): void {
  // BR-14 — registered under the `curation` toolset namespace.
  deps.mcp.registerTool("curation", {
    name: "compliance_delete",
    description:
      "Tombstone a RawInformation under LGPD or owner request. Idempotent.",
    inputSchema: ComplianceDeleteRequestSchema,
    handler: async (input): Promise<McpEnvelope> => {
      let body;
      try {
        body = ComplianceDeleteRequestSchema.parse(input);
      } catch (err) {
        if (err instanceof ZodError) {
          return {
            ok: false,
            error: {
              code: "STRUCTURAL_INVALID",
              message: "Tool input failed validation.",
              details: {
                issues: err.issues.map((i) => ({
                  path: i.path.join("."),
                  message: i.message,
                })),
              },
            },
          };
        }
        throw err;
      }

      try {
        const result = await withTransaction(deps.pool, (client) =>
          complianceDelete({ logger: deps.logger }, client, body)
        );
        return { ok: true, result };
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: err.message,
              details: err.details,
            },
          };
        }
        if (err instanceof ValidationFailure) {
          return {
            ok: false,
            error: {
              code: "STRUCTURAL_INVALID",
              message: err.message,
              details: err.details,
            },
          };
        }
        if (err instanceof InternalFailure) {
          return {
            ok: false,
            error: {
              code: "INTERNAL",
              message: err.message,
              details: err.details,
            },
          };
        }
        // Anything else -> INTERNAL (BR-15).
        deps.logger.error(
          {
            component: "mcp.curation.compliance_delete",
            cause: err instanceof Error ? err.message : String(err),
          },
          "compliance_delete_internal_error"
        );
        return {
          ok: false,
          error: {
            code: "INTERNAL",
            message: "Unexpected internal error.",
          },
        };
      }
    },
  });

  deps.logger.info(
    {
      component: "mcp.curation.compliance",
      tool: "compliance_delete",
    },
    "compliance_delete_tool_registered"
  );
}
