/**
 * features/ingest/api — public surface (TC-03).
 *
 * Currently exposes `useIngestGraphAssembly`, the parallel-traverse +
 * graph-assembly hook consumed by `IngestWorkspace` after a successful
 * extraction. The companion `IngestAffectedNode` shape is re-exported so
 * the workspace component does not need to deep-import the hook file.
 */
export {
  useIngestGraphAssembly,
  type IngestAffectedNode,
  type UseIngestGraphAssemblyResult,
} from "./useIngestGraphAssembly";
