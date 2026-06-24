/**
 * DecisionPanel — public surface (per-component barrel; front.md §6.4).
 */
export { DecisionPanel } from "./DecisionPanel";
export type {
  DecisionPanelProps,
  DecisionPanelActions,
  DecisionPanelServerError,
} from "./DecisionPanel.types";

// Sub-components reused by tests / drawer-specific compositions.
export { EvidenceChip } from "./EvidenceChip";
export { StaleBanner } from "./StaleBanner";
export { ReasonField } from "./ReasonField";
export { ComparePane } from "./ComparePane";
export { DecisionBar } from "./DecisionBar";
export { CandidateCard } from "./CandidateCard";
export { DisputeSideCard } from "./DisputeSideCard";
export { PeriodTimeline } from "./PeriodTimeline";
