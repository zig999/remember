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

export { REDACTED_LITERAL } from "./service/compliance-audit.service.js";
