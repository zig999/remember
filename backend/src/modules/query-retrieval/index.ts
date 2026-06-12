// Public surface of the query-retrieval module — the bootstrap (`app.ts`)
// consumes only what is re-exported here.

export { registerQueryRetrievalRoutes } from "./routes/query-retrieval.routes.js";
export type { QueryRetrievalRouteDeps } from "./routes/query-retrieval.routes.js";

// FTS configuration + scoring constants — exposed for tests and for any
// future tooling that needs to assert layer-weight ordering.
export { FTS_NAME_CONFIG, FTS_PROSE_CONFIG } from "./repository/fts-config.js";
export {
  LAYER_WEIGHT_CHUNK,
  LAYER_WEIGHT_FRAGMENT,
  LAYER_WEIGHT_NODE,
} from "./repository/scoring.js";

// Typed errors — exposed for tests asserting precedence + envelope mapping.
export {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  InvalidSearchLayerError,
  InvalidSearchQueryError,
  RawInformationDeletedError,
} from "./service/errors.js";
