// Public surface of the compliance-audit module. The bootstrap (`app.ts`)
// consumes only what is re-exported here.

export {
  registerComplianceAuditRoutes,
} from "./routes/compliance-audit.routes.js";
export type { ComplianceAuditRouteDeps } from "./routes/compliance-audit.routes.js";

export {
  registerComplianceToolset,
} from "./mcp/compliance-toolset.js";
export type { ComplianceToolsetDeps } from "./mcp/compliance-toolset.js";

// Re-exported DTO so the bootstrap (`app.ts`) can derive the MCP tool descriptor
// for `compliance_delete` on the curation transport (TC-mcc-03 / BR-29 / BR-31)
// without reaching into the dto/ subfolder directly.
export { ComplianceDeleteRequestSchema } from "./dto/compliance-delete.dto.js";

export { REDACTED_LITERAL } from "./service/compliance-audit.service.js";
