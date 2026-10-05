import type { IngestSourceType, LlmRunSummary } from "../../api";

export type IngestPhase =
  | "idle"
  | "ready"
  | "sending"
  | "noop"
  | "extracting"
  | "polling"
  | "revealing"
  | "complete"
  | "error";

export interface IngestPanelProps {
  readonly phase: IngestPhase;
  readonly content: string;
  readonly sourceType: IngestSourceType | "";
  readonly validationMessage?: string;
  readonly summary?: LlmRunSummary;
  readonly errorMessage?: string;
  readonly errorCode?: string;

  readonly onContentChange: (content: string) => void;
  readonly onSourceTypeChange: (sourceType: IngestSourceType | "") => void;
  readonly onSubmit: () => void;
  readonly onAssembleExisting: () => void;
  readonly onRetry: () => void;
  readonly onReset: () => void;
  readonly className?: string;
}
