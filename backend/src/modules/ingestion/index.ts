// Public surface of the ingestion module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export { registerIngestionRoutes } from "./routes/ingestion.routes.js";
export type { IngestionRouteDeps } from "./routes/ingestion.routes.js";

// MCP ingest toolset — registered per-session by the MCP transport layer
// once an ambient `llm_run_id` is established (BR-21).
export { registerIngestToolset, getIngestToolJsonSchemas } from "./mcp/toolset.js";
export type { IngestToolsetSessionDeps } from "./mcp/toolset.js";

// Tool input schemas — single source per BR-24 (Zod + derived JSON Schema).
// Future REST mirror (TC-12) and Anthropic tool-use loop (TC-12) consume the
// derived JSON Schemas from here.
export {
  IngestToolInputJsonSchemas,
  ProposeAttributeInputJsonSchema,
  ProposeAttributeInputSchema,
  ProposeFragmentInputJsonSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputJsonSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputJsonSchema,
  ProposeNodeInputSchema,
} from "./dto/index.js";
export type {
  ProposeAttributeInput,
  ProposeAttributeResult,
  ProposeFragmentInput,
  ProposeFragmentResult,
  ProposeLinkInput,
  ProposeLinkResult,
  ProposeNodeInput,
  ProposeNodeResult,
} from "./dto/index.js";

// Transport-agnostic `propose_*` services (BR-28). The MCP handlers, the
// future REST mirrors, and the future extraction orchestrator all call
// through these.
export { proposeAttributeService } from "./service/propose-attribute.service.js";
export { proposeFragmentService } from "./service/propose-fragment.service.js";
export { proposeLinkService } from "./service/propose-link.service.js";
export { proposeNodeService } from "./service/propose-node.service.js";
export type { McpEnvelope, RunContext } from "./service/propose.types.js";

// Catalog snapshot — loaded once at BFF startup by the bootstrap; passed to
// `registerIngestToolset` on every MCP session.
export {
  buildSnapshot,
  isLinkRuleActive,
  loadCatalog,
} from "./catalog/catalog.js";
export type {
  CatalogSnapshot,
  NodeTypeRow,
  LinkTypeRow,
  LinkTypeRuleRow,
  AttributeKeyRow,
} from "./catalog/catalog.js";
