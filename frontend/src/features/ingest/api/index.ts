/**
 * Ingest api — public surface.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §10 (Components to
 *    Create / Update — hooks listed).
 *  - CLAUDE.md "Conventions" — no `export *` barrels; explicit re-exports
 *    only. The per-feature `api/index.ts` is the documented exception
 *    (mirrors `features/curation/api/index.ts` shape).
 *
 * Integration note (post-merge): TC-002 provides the bare-body REST hooks
 * (`httpIngest` carve-out) and the camelCase transforms; TC-005 layered
 * `useIngestGraphAssembly` on top. Some aliases (`IngestSourceType`,
 * `IngestRawInformationResponse`) are re-exported under both names for the
 * IngestWorkspace/IngestPanel call sites that were written against TC-05's
 * type vocabulary.
 */

export { ingestKeys } from "./keys";

export {
  useIngestRawInformation,
  type UseIngestRawInformationVariables,
} from "./useIngestRawInformation";

export {
  useRunLlmExtraction,
  type UseRunLlmExtractionVariables,
} from "./useRunLlmExtraction";

export {
  useIngestRunStatus,
  type UseIngestRunStatusParams,
  INGEST_RUN_POLL_MS,
} from "./useIngestRunStatus";

export {
  useRetryLlmRun,
  type UseRetryLlmRunVariables,
} from "./useRetryLlmRun";

export {
  toIngestRawInformationResult,
  toLlmRun,
  toLlmRunSummary,
  toAffectedNode,
  type AffectedNode,
  type AffectedNodeWire,
  type ChunkRefWire,
  type IngestOutcome,
  type IngestRawInformationRequest,
  type IngestRawInformationRequestWire,
  type IngestRawInformationResponseWire,
  type IngestRawInformationResult,
  // TC-05 alias — IngestWorkspace expects `IngestRawInformationResponse`.
  type IngestRawInformationResult as IngestRawInformationResponse,
  type IngestSourceType,
  type LlmRun,
  type LlmRunStatusWire,
  type LlmRunStatusWire as LlmRunStatus,
  type LlmRunSummary,
  type LlmRunSummaryWire,
  type LlmRunWire,
  type RetryLlmRunRequestWire,
  type RunLlmExtractionRequestWire,
  type SourceTypeWire,
} from "./_transforms";

export {
  useIngestGraphAssembly,
  type UseIngestGraphAssemblyOptions,
  type UseIngestGraphAssemblyResult,
} from "./useIngestGraphAssembly";
