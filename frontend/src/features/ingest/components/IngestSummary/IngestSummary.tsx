/**
 * IngestSummary — extraction summary counts as StateBadge rows (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 UI-07 (summary
 *    counts: `accepted`, `consolidated`, `needs_review`, `uncertain`,
 *    `disputed`, `rejected`, `error`).
 *  - §7 StateBadge adapter — `state` is the outcome key, `count` is the
 *    integer.
 *
 * Mapping note: the `ConfidenceState` vocabulary used by `StateBadge`
 * (`accepted | uncertain | low-confidence | disputed | superseded`) does
 * NOT cover all 7 outcome keys. We map each outcome to its closest
 * confidence state for the visual treatment (icon + color) and override
 * the pt-BR label via the StateBadge `label` prop so the row matches the
 * spec's outcome vocabulary literally.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import type { IngestRunSummary } from "../IngestPanel/IngestPanel.types";
import type { IngestSummaryProps } from "./IngestSummary.types";

type OutcomeKey = keyof IngestRunSummary;

interface OutcomeRow {
  readonly key: OutcomeKey;
  readonly label: string;
  /** Mapped ConfidenceState driving icon + color. */
  readonly state: ConfidenceState;
}

/**
 * Spec-driven render order (UI-07): accepted, consolidated, needs_review,
 * uncertain, disputed, rejected, error.
 *
 * State mapping rationale:
 *  - accepted        → accepted (1:1)
 *  - consolidated    → accepted (consolidated = re-affirmed accepted, §18)
 *  - needs_review    → uncertain (low-trust pulse semantic)
 *  - uncertain       → uncertain (1:1)
 *  - disputed        → disputed (1:1)
 *  - rejected        → superseded (rejected items are tombstoned, §11)
 *  - error           → superseded (extraction-error rows are dead-ended)
 */
const OUTCOME_ROWS: ReadonlyArray<OutcomeRow> = [
  { key: "accepted", label: "Aceitos", state: "accepted" },
  { key: "consolidated", label: "Consolidados", state: "accepted" },
  { key: "needs_review", label: "Em revisão", state: "uncertain" },
  { key: "uncertain", label: "Incertos", state: "uncertain" },
  { key: "disputed", label: "Em disputa", state: "disputed" },
  { key: "rejected", label: "Rejeitados", state: "superseded" },
  { key: "error", label: "Erros", state: "superseded" },
];

export const IngestSummary: FC<IngestSummaryProps> = ({ summary, className }) => {
  return (
    <ul
      className={cn("flex flex-col gap-xs", className)}
      data-testid="ingest-summary"
    >
      {OUTCOME_ROWS.map((row) => {
        const count = summary[row.key];
        return (
          <li
            key={row.key}
            className="flex items-center justify-between gap-sm"
            data-testid={`ingest-summary-row-${row.key}`}
            data-count={count}
          >
            <StateBadge
              state={row.state}
              label={row.label}
              size="sm"
              animate={false}
            />
            <span className="text-body-sm font-semibold text-content">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
