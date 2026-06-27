/**
 * IngestSummary — public type contract (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 UI-07
 *    (summary counts table), §7 StateBadge adapter.
 */
import type { IngestRunSummary } from "../IngestPanel/IngestPanel.types";

export interface IngestSummaryProps {
  /** Summary counts — rendered as StateBadge rows for the 7 outcome keys. */
  readonly summary: IngestRunSummary;
  /** Optional className merged via `cn()`. */
  readonly className?: string;
}
