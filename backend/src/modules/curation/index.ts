export {
  registerCurationRoutes,
} from "./routes/curation.routes.js";
export type { CurationRouteDeps } from "./routes/curation.routes.js";

export { registerEditEntityRoute } from "./routes/edit-entity.routes.js";
export type { EditEntityRouteDeps } from "./routes/edit-entity.routes.js";

export {
  CURATION_TOOL_NAMES,
  CurationToolDescriptions,
  CurationToolInputJsonSchemas,
  registerCurationToolset,
} from "./mcp/curation-toolset.js";
export type {
  CurationToolName,
  CurationToolsetDeps,
} from "./mcp/curation-toolset.js";

export { registerCurationMcpTransport } from "./mcp/curation-transport.js";
export type { CurationMcpTransportDeps } from "./mcp/curation-transport.js";
