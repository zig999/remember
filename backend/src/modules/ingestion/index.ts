// Public surface of the ingestion module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export { registerIngestionRoutes } from "./routes/ingestion.routes.js";
export type { IngestionRouteDeps } from "./routes/ingestion.routes.js";

// MCP ingest toolset — registered per-session by the MCP transport layer
// once an ambient `llm_run_id` is established (BR-21).
export { registerIngestToolset } from "./mcp/toolset.js";
export type { IngestToolsetSessionDeps } from "./mcp/toolset.js";

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
