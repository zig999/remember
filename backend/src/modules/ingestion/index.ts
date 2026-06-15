// Public surface of the ingestion module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export { registerIngestionRoutes } from "./routes/ingestion.routes.js";
export type { IngestionRouteDeps } from "./routes/ingestion.routes.js";

// MCP ingest toolset — registered on the SHARED in-process `McpServer`
// registry at boot. The MCP transport below resolves the four tool
// descriptors at request time. (Per-session factory retired in v1.2.4.)
export {
  registerIngestToolset,
  INGEST_TOOL_NAMES,
  type IngestToolsetDeps,
  type IngestMcpToolName,
} from "./mcp/ingest-toolset.js";

// MCP-over-HTTP transport (v1.2.4) — thin wrapper over the shared SDK kernel
// `mountMcpEndpoint`, mounted as `POST /mcp/ingest` under the auth-protected
// `/api/v1` scope by the bootstrap. Stateless single-shape; tools are always
// listed (BR-21 revised). NO `X-LLM-Run-Id` ambient header — `llm_run_id` is
// a per-call tool argument validated by the MCP-facing Zod schemas (Option B).
export {
  registerIngestMcpTransport,
  type IngestMcpTransportDeps,
} from "./mcp/transport.js";

// Tool input schemas — single source per BR-24 (Zod + derived JSON Schema).
// Future REST mirror (TC-13) and Anthropic tool-use loop (TC-12) consume the
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
// REST mirrors, and the extraction orchestrator all call through these.
export { proposeAttributeService } from "./service/propose-attribute.service.js";
export { proposeFragmentService } from "./service/propose-fragment.service.js";
export { proposeLinkService } from "./service/propose-link.service.js";
export { proposeNodeService } from "./service/propose-node.service.js";
export type { McpEnvelope, RunContext } from "./service/propose.types.js";

// Catalog snapshot — loaded once at BFF startup by the bootstrap; passed to
// `registerIngestToolset` once, and passed to the propose-* REST mirrors.
export {
  buildSnapshot,
  domainOf,
  isLinkRuleActive,
  loadCatalog,
} from "./catalog/catalog.js";
export type {
  AttributeKeyRow,
  AttributeValidValueRow,
  CatalogSnapshot,
  LinkTypeRow,
  LinkTypeRuleRow,
  NodeTypeRow,
} from "./catalog/catalog.js";
