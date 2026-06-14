// Public surface of the knowledge-graph module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export { registerKnowledgeGraphRoutes } from "./routes/knowledge-graph.routes.js";
export type { KnowledgeGraphRouteDeps } from "./routes/knowledge-graph.routes.js";

// Catalog snapshot — built once at BFF startup and shared across modules.
export {
  attributeKeyCacheKey,
  buildSnapshot,
  loadCatalog,
} from "./catalog/catalog.js";
export type {
  AttributeKeyRow,
  CatalogSnapshot,
  LinkTypeRow,
  LinkTypeRuleRow,
  NodeTypeRow,
} from "./catalog/catalog.js";

// MCP toolset registration entry points.
export { registerQueryToolset } from "./mcp/query-toolset.js";
export type { QueryToolsetDeps } from "./mcp/query-toolset.js";

// MCP query transport — POST /api/v1/mcp/query (TC-02, BR-23).
export { registerQueryMcpTransport } from "./mcp/query-transport.js";
export type { QueryMcpTransportDeps } from "./mcp/query-transport.js";
// NOTE: the `curation` MCP toolset moved to `backend/src/modules/curation/` in
// TC-07; the stale skeleton at `./mcp/curation-toolset.ts` is kept only as a
// no-op so legacy imports continue to compile. Bootstrap now imports the
// real registrar from the `curation` module.

// Re-export the temporal-filter helper so other modules (TC-05 traversal,
// query-retrieval) can reuse it.
export { applyTemporalFilter } from "./repository/temporal-filter.js";
export type {
  TemporalFilterFragment,
  TemporalFilterOptions,
} from "./repository/temporal-filter.js";

// ---------------------------------------------------------------------------
// Cross-domain traversal contract — consumed by `query-retrieval` (TC-06).
// `TRAVERSAL_DECAY` and `traverseNodes()` are the public surface; changing
// either is a coordinated cross-domain change. See BR-13 / BR-14 of
// `knowledge-graph.back.md`.
// ---------------------------------------------------------------------------
export {
  TRAVERSAL_DECAY,
  TRAVERSAL_DEPTH_DEFAULT,
  TRAVERSAL_DEPTH_MAX,
  TRAVERSAL_DEPTH_MIN,
} from "./traversal/config.js";
export { traverseNodes } from "./service/traversal.service.js";
export type {
  TraverseNodesInput,
  TraverseNodesResult,
} from "./service/traversal.service.js";
