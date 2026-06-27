/**
 * features/ingest — public surface (dev_tc_005).
 *
 * Per-feature barrel: explicit re-exports only.
 */
export { IngestWorkspace } from "./components/IngestWorkspace";
export type { IngestWorkspaceProps } from "./components/IngestWorkspace";
export { IngestPanel, IngestSummary } from "./components/IngestPanel";
export type {
  IngestPanelProps,
  IngestPhase,
  IngestSummaryProps,
} from "./components/IngestPanel";

export {
  ingestKeys,
  useIngestGraphAssembly,
  useIngestRawInformation,
  useIngestRunStatus,
  useRetryLlmRun,
  useRunLlmExtraction,
} from "./api";
export type {
  AffectedNode,
  IngestOutcome,
  IngestRawInformationRequest,
  IngestRawInformationResponse,
  IngestSourceType,
  LlmRun,
  LlmRunStatus,
  LlmRunSummary,
} from "./api";
