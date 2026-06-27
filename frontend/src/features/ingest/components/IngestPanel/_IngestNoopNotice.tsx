/**
 * _IngestNoopNotice — internal sub-component of IngestPanel (dev_tc_004_r1).
 *
 * Extracted from `IngestPanel.tsx` to keep that file ≤ 300 lines
 * (`u-fe-standards/SKILL.md` Code Quality Gate). Rendering logic is
 * unchanged — see `ingest.feature.spec.md §2 UI-04`.
 *
 * Underscore prefix marks the file as an internal sibling; not re-exported
 * from the per-component `index.ts`.
 */
import type { FC } from "react";
import { Button } from "@/components/ui/button";

export interface IngestNoopNoticeProps {
  /** Raised on "Ver grafo existente" click. */
  readonly onAssembleExisting: () => void;
  /** Raised on "Ingerir outro documento" click. */
  readonly onReset: () => void;
}

export const IngestNoopNotice: FC<IngestNoopNoticeProps> = ({
  onAssembleExisting,
  onReset,
}) => {
  return (
    <div
      data-testid="ingest-noop-notice"
      className="flex flex-col gap-sm rounded-md border border-border-glass bg-surface-glass-ambient p-md"
    >
      <p className="text-label text-content">Documento já ingerido</p>
      <p className="text-body-sm text-muted">
        Este conteúdo já foi processado anteriormente. O grafo abaixo
        mostra os nós extraídos.
      </p>
      <div className="flex flex-wrap gap-sm">
        <Button
          type="button"
          size="sm"
          data-testid="ingest-assemble-existing"
          onClick={onAssembleExisting}
        >
          Ver grafo existente
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="ingest-reset"
          onClick={onReset}
        >
          Ingerir outro documento
        </Button>
      </div>
    </div>
  );
};
