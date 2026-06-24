/**
 * CorrectionSection — the UI-11 "Corrigir…" affordance inside DecisionPanel.
 *
 * Extracted from DecisionPanel.tsx (300-line limit). Self-contained: owns
 * its own open/closed state and the "Corrigir…" button ref so the parent
 * sheds that bookkeeping. The parent resets this section on item change by
 * giving it a `key` tied to the item id (remount → fresh state), mirroring
 * the previous in-panel `setCorrectionOpen(false)` reset.
 *
 * Spec references: curadoria.feature.spec.md §2 UI-11, §8 (focus restore
 * to "Corrigir…" on cancel/submit).
 */
import { useRef, useState, type FC } from "react";
import { Button } from "@/components/ui/button";
import { CorrectionForm, type CorrectionFormDefaults } from "../CorrectionForm";
import type { CorrectItemRequest, ItemKind } from "../../types";
import type { DecisionPanelServerError } from "./DecisionPanel.types";

interface CorrectionSectionProps {
  readonly itemKind: ItemKind;
  readonly itemId: string;
  readonly defaults: CorrectionFormDefaults;
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  readonly submitting: boolean;
  readonly serverError: DecisionPanelServerError | null;
  readonly evidenceViewed: boolean;
  readonly blockedHintId: string;
  readonly onCorrect: (body: CorrectItemRequest) => void;
}

/** CorrectionForm only cares about these codes; everything else is handled
 *  by the DecisionPanel-level banner. */
function correctionServerError(
  serverError: DecisionPanelServerError | null,
): DecisionPanelServerError | null {
  if (!serverError) return null;
  return serverError.code === "BUSINESS_TEMPORAL_INCOHERENT" ||
    serverError.code === "BUSINESS_CORRECTION_NO_CHANGES" ||
    serverError.code === "BUSINESS_DATE_UNJUSTIFIED" ||
    serverError.code === "BUSINESS_FRAGMENT_NOT_ACCEPTED"
    ? serverError
    : null;
}

export const CorrectionSection: FC<CorrectionSectionProps> = ({
  itemKind,
  itemId,
  defaults,
  fragmentFilter,
  submitting,
  serverError,
  evidenceViewed,
  blockedHintId,
  onCorrect,
}) => {
  const [open, setOpen] = useState(false);
  const correctButtonRef = useRef<HTMLButtonElement>(null);

  function close(): void {
    setOpen(false);
    // Restore focus to the "Corrigir…" button per §8.
    requestAnimationFrame(() => {
      correctButtonRef.current?.focus();
    });
  }

  return (
    <div className="border-t border-border p-md">
      {open ? (
        <CorrectionForm
          itemKind={itemKind}
          itemId={itemId}
          defaults={defaults}
          {...(fragmentFilter ? { fragmentFilter } : {})}
          submitting={submitting}
          serverError={correctionServerError(serverError)}
          onCancel={close}
          onSubmit={(body) => {
            onCorrect(body);
          }}
        />
      ) : (
        <Button
          ref={correctButtonRef}
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-disabled={!evidenceViewed || undefined}
          aria-describedby={!evidenceViewed ? blockedHintId : undefined}
          onClickCapture={(e) => {
            if (!evidenceViewed) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          Corrigir…
        </Button>
      )}
    </div>
  );
};
