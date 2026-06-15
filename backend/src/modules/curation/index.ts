// Public surface of the curation module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export {
  registerCurationRoutes,
} from "./routes/curation.routes.js";
export type { CurationRouteDeps } from "./routes/curation.routes.js";

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
