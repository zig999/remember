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
// Per BR-15 (P2.1 canonical taxonomy — same codes on REST and MCP):
//   - Zod parse failure -> VALIDATION_REQUIRED_FIELD | VALIDATION_INVALID_FORMAT
//                         | VALIDATION_OUT_OF_RANGE (Zod-discriminated)
//   - raw_information_id resolves to no row -> RESOURCE_NOT_FOUND
//   - UC-01 alt 4c legacy orphan -> SYSTEM_INTERNAL_ERROR
//   - Any unhandled exception -> SYSTEM_INTERNAL_ERROR
//
// Failure envelopes are produced through the shared `renderErrorEnvelope`
// helper (`src/shared/error-mapping.ts`), the single source of truth for
// code → HTTP-status resolution. The MCP path ignores `statusCode` (all MCP
// tool errors travel on HTTP 200 with `isError: true` wrapped by the SDK
// kernel) — only `.envelope` is consumed here.

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
import {
  renderErrorEnvelope,
  type ErrorEnvelope,
} from "../../../shared/error-mapping.js";

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
  | ErrorEnvelope;

/**
 * Zod parse failure -> canonical VALIDATION_* code (P2.1). Mirrors the priority
 * discrimination the REST route uses (`compliance-audit.routes.ts`
 * `handleZodError`) so REST and MCP surface byte-identical codes for the same
 * input:
 *   1. Explicit `superRefine` `VALIDATION_OUT_OF_RANGE` marker (semi-open range
 *      guard on the list endpoint — POST /compliance/deletions does not use it,
 *      but keeping the branch keeps this helper reusable across all compliance
 *      DTOs).
 *   2. Missing / undefined field -> `VALIDATION_REQUIRED_FIELD`. Zod v4 surfaces
 *      this as `invalid_type` with `received === "undefined"` on the issue
 *      (message also contains "received undefined").
 *   3. `reason` length / trim violation (`too_small` / `too_big` on the `reason`
 *      path) -> `VALIDATION_OUT_OF_RANGE`.
 *   4. Everything else -> `VALIDATION_INVALID_FORMAT`.
 */
function mapZodErrorToEnvelope(err: ZodError): ErrorEnvelope {
  const issues = err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));

  // Priority 1 — explicit semi-open range refinement.
  if (
    err.issues.some(
      (i) => i.code === "custom" && i.message === "VALIDATION_OUT_OF_RANGE"
    )
  ) {
    return renderErrorEnvelope(
      "VALIDATION_OUT_OF_RANGE",
      "Time range bounds must satisfy `from < to`.",
      { issues }
    ).envelope;
  }

  // Priority 2 — missing / undefined field.
  const reqField = err.issues.find((i) => {
    if (i.code === "invalid_type") {
      const received = (i as { received?: string }).received;
      if (received === "undefined") return true;
      if (
        typeof i.message === "string" &&
        i.message.toLowerCase().includes("received undefined")
      ) {
        return true;
      }
    }
    if ((i.code as string) === "required") return true;
    return false;
  });
  if (reqField) {
    return renderErrorEnvelope(
      "VALIDATION_REQUIRED_FIELD",
      `Field '${reqField.path.join(".")}' is required.`,
      { issues }
    ).envelope;
  }

  // Priority 3 — `reason` length / trim violation.
  if (
    err.issues.some(
      (i) =>
        (i.code === "too_small" || i.code === "too_big") &&
        i.path[0] === "reason"
    )
  ) {
    return renderErrorEnvelope(
      "VALIDATION_OUT_OF_RANGE",
      "Field 'reason' must be non-empty after trim and ≤ 1000 characters.",
      { issues }
    ).envelope;
  }

  return renderErrorEnvelope(
    "VALIDATION_INVALID_FORMAT",
    "Request payload failed validation.",
    { issues }
  ).envelope;
}

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
          return mapZodErrorToEnvelope(err);
        }
        throw err;
      }

      try {
        const result = await withTransaction(deps.pool, (client) =>
          complianceDelete({ logger: deps.logger }, client, body)
        );
        return { ok: true, result };
      } catch (err) {
        if (
          err instanceof ResourceNotFoundError ||
          err instanceof ValidationFailure ||
          err instanceof InternalFailure
        ) {
          return renderErrorEnvelope(err.code, err.message, err.details)
            .envelope;
        }
        // Anything else -> generic 500 (SYSTEM_INTERNAL_ERROR). Never leak
        // `err.message` to the client (BR-15).
        deps.logger.error(
          {
            component: "mcp.curation.compliance_delete",
            cause: err instanceof Error ? err.message : String(err),
          },
          "compliance_delete_internal_error"
        );
        return renderErrorEnvelope(
          "SYSTEM_INTERNAL_ERROR",
          "Unexpected internal error."
        ).envelope;
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
