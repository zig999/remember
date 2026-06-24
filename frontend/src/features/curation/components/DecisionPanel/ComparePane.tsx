/**
 * ComparePane — adaptive diff/summary view (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-03 (mode resumo / mode diff cheio),
 *    §11 (heuristic — implemented in features/curation/lib/display-mode.ts).
 *
 * The component is data-driven by `resolveDisplayMode(item)`. Both modes
 * render the same data; only the layout / verbosity differ.
 *
 * Selection state lifts to the parent (DecisionPanel) because the
 * DecisionBar needs it to compose the merge/prefer_one body.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import {
  resolveDisplayMode,
  HIGH_SIMILARITY_THRESHOLD,
} from "../../lib/display-mode";
import { useCurationNodeDetail } from "../../api/node.hooks";
import type {
  ReviewQueueItem,
  EntityMatchQueueItem,
  DisputeQueueItem,
} from "../../types";
import { CandidateCard } from "./CandidateCard";
import { DisputeSideCard } from "./DisputeSideCard";
import { PeriodTimeline } from "./PeriodTimeline";

export interface ComparePaneProps {
  readonly item: ReviewQueueItem;
  /** entity_match: candidate node id of the merge target (null = none selected). */
  readonly selectedCandidate: string | null;
  /** disputed (prefer_one): item_id of the winner (null = none selected). */
  readonly selectedSide: string | null;
  readonly onSelectCandidate: (candidateNodeId: string) => void;
  readonly onSelectSide: (itemId: string) => void;
  /** When the parent surfaces SELF_MERGE_FORBIDDEN, the affected candidate
   *  card highlights. */
  readonly invalidCandidateId?: string | null;
  readonly className?: string;
}

const EntityMatchView: FC<{
  readonly item: EntityMatchQueueItem;
  readonly mode: "summary" | "full-diff";
  readonly selectedCandidate: string | null;
  readonly onSelectCandidate: (candidateNodeId: string) => void;
  readonly invalidCandidateId?: string | null;
}> = ({ item, mode, selectedCandidate, onSelectCandidate, invalidCandidateId }) => {
  if (mode === "summary" && item.candidates.length === 1) {
    const top = item.candidates[0]!;
    return (
      <div className="flex flex-col gap-sm">
        <p className="text-body-sm text-content">
          Candidato com alta similaridade (≥{" "}
          {Math.round(HIGH_SIMILARITY_THRESHOLD * 100)}%): podemos fundir
          diretamente.
        </p>
        <CandidateCard
          candidate={top}
          selected={selectedCandidate === top.candidateNodeId}
          onSelect={onSelectCandidate}
          invalid={invalidCandidateId === top.candidateNodeId}
        />
      </div>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label="Candidatos para fusão"
      className="flex flex-col gap-sm"
    >
      <p className="text-body-sm text-content">
        Múltiplos candidatos — escolha qual representa a mesma entidade.
      </p>
      {item.candidates.length === 0 ? (
        <p className="text-body-sm text-body">
          Nenhum candidato sugerido. Você pode manter separados ou fundir
          ad-hoc por busca.
        </p>
      ) : (
        item.candidates.map((c) => (
          <CandidateCard
            key={c.candidateNodeId}
            candidate={c}
            selected={selectedCandidate === c.candidateNodeId}
            onSelect={onSelectCandidate}
            invalid={invalidCandidateId === c.candidateNodeId}
          />
        ))
      )}
    </div>
  );
};

/**
 * DisputeSubject — names WHAT is in dispute and WHY the sides conflict.
 * Without it the panel showed only the competing targets ("Apollo" /
 * "Operação Assistida") with no subject and no reason — the curator could
 * not tell that the Task "Salvar imagens…" is claimed as part_of two
 * projects, nor that part_of (functional) allows only one.
 */
const DisputeSubject: FC<{ readonly item: DisputeQueueItem }> = ({ item }) => {
  const isLink = item.itemKind === "link";
  const subjectId = isLink ? item.scope.sourceNodeId : item.scope.nodeId;
  const relation = isLink ? item.scope.linkType : item.scope.attributeKey;
  const subjectQ = useCurationNodeDetail(subjectId);
  const subjectName = subjectQ.data?.node.canonicalName;
  const subjectType = subjectQ.data?.node.nodeType;
  const n = item.sides.length;

  return (
    <div className="flex flex-col gap-xs rounded-md border border-border bg-elevated p-md">
      <p className="text-body-sm text-content">
        <span className="font-medium">{subjectName ?? "Carregando…"}</span>
        {subjectType && <span className="text-muted"> ({subjectType})</span>}{" "}
        {isLink ? (
          <>
            está vinculado por <span className="font-medium">{relation}</span> a{" "}
            {n} alvos diferentes:
          </>
        ) : (
          <>
            tem {n} valores conflitantes para{" "}
            <span className="font-medium">{relation}</span>:
          </>
        )}
      </p>
      <p className="text-caption text-muted">
        {isLink
          ? `“${relation}” admite apenas um destino vigente por vez, mas há ${n} com vigências sobrepostas. Escolha qual vale (os perdedores são arquivados) ou ajuste os períodos para que não se sobreponham.`
          : `Apenas um valor pode vigorar por vez no mesmo período. Escolha qual vale ou ajuste os períodos.`}
      </p>
    </div>
  );
};

const DisputeView: FC<{
  readonly item: DisputeQueueItem;
  readonly mode: "summary" | "full-diff";
  readonly selectedSide: string | null;
  readonly onSelectSide: (itemId: string) => void;
}> = ({ item, mode, selectedSide, onSelectSide }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Lados em disputa"
      className="flex flex-col gap-sm"
    >
      <DisputeSubject item={item} />
      <p className="text-body-sm text-content">
        {mode === "summary"
          ? "Selecione qual lado prefere."
          : "Selecione qual lado prefere ou ajuste os períodos."}
      </p>
      {item.sides.map((s) => (
        <DisputeSideCard
          key={s.itemId}
          side={s}
          selected={selectedSide === s.itemId}
          onSelect={onSelectSide}
        />
      ))}
      <PeriodTimeline sides={item.sides} />
    </div>
  );
};

export const ComparePane: FC<ComparePaneProps> = ({
  item,
  selectedCandidate,
  selectedSide,
  onSelectCandidate,
  onSelectSide,
  invalidCandidateId,
  className,
}) => {
  const mode = resolveDisplayMode(item);
  return (
    <section
      aria-label="Comparação"
      data-mode={mode}
      className={cn("flex flex-col gap-md p-md", className)}
    >
      {item.kind === "entity_match" ? (
        <EntityMatchView
          item={item}
          mode={mode}
          selectedCandidate={selectedCandidate}
          onSelectCandidate={onSelectCandidate}
          invalidCandidateId={invalidCandidateId ?? null}
        />
      ) : (
        <DisputeView
          item={item}
          mode={mode}
          selectedSide={selectedSide}
          onSelectSide={onSelectSide}
        />
      )}
    </section>
  );
};
