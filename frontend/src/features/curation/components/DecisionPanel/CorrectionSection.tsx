import { useRef, useState, type FC } from "react";
import { Button } from "@/shared/components/ui/button";
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
