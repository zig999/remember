import { useMemo, type FC } from "react";
import { DecisionPanel } from "./DecisionPanel";
import { ProvenanceTrail } from "./ProvenanceTrail";
import { useDecisionDispatch } from "../hooks/useDecisionDispatch";
import { useCurationStore } from "../state/curation-store";
import { neighbour } from "./curation-page-helpers";
import type { ItemKind, ReviewQueueItem, ReviewQueueList } from "../types";

function provenanceContextOf(
  item: ReviewQueueItem,
): { itemKind: ItemKind; itemId: string } | null {
  if (item.kind === "entity_match") return null;
  const first = item.sides[0];
  if (first === undefined) return null;
  return { itemKind: item.itemKind, itemId: first.itemId };
}

interface CurationDecisionProps {
  readonly item: ReviewQueueItem;
  readonly queue: ReviewQueueList | undefined;
}

export const CurationDecision: FC<CurationDecisionProps> = ({ item, queue }) => {
  const evidenceViewed = useCurationStore((s) => s.evidenceViewed);
  const setEvidenceViewed = useCurationStore((s) => s.setEvidenceViewed);

  const provenance = useMemo(() => provenanceContextOf(item), [item]);

  const dispatch = useDecisionDispatch({
    getNextItem: () =>
      neighbour(queue, useCurationStore.getState().selectedItem, "next"),
    onItemRemove: () => {},
    onItemRestore: () => {},
  });

  const armedImmediately = provenance === null;
  const effectiveEvidenceViewed = armedImmediately || evidenceViewed;

  return (
    <DecisionPanel
      item={item}
      evidenceViewed={effectiveEvidenceViewed}
      serverError={dispatch.serverError}
      stale={dispatch.stale}
      submitting={dispatch.submitting}
      actions={{
        onResolveEntityMatch: (body) => {
          if (item.kind !== "entity_match") return;
          if (body.decision === "merge_into") {
            dispatch.dispatchDestructive(
              { kind: "resolve_entity_match_merge", nodeId: item.nodeId, body },
              item.nodeId,
              "Item fundido",
            );
          } else {
            dispatch.dispatchNonDestructive({
              kind: "resolve_entity_match_keep",
              nodeId: item.nodeId,
              body,
            });
          }
        },
        onResolveDispute: (body) => {
          if (item.kind !== "disputed") return;
          const optimisticId = body.item_ids[0] ?? item.sides[0]?.itemId ?? "";
          if (body.decision === "prefer_one") {
            dispatch.dispatchDestructive(
              { kind: "resolve_dispute_prefer", body },
              optimisticId,
              "Lado preferido",
            );
          } else if (body.decision === "keep_disputed") {
            dispatch.dispatchNonDestructive({
              kind: "resolve_dispute_keep",
              body,
            });
          } else {
            dispatch.dispatchNonDestructive({
              kind: "resolve_dispute_adjust",
              body,
            });
          }
        },
        onConfirm: (body) => {
          dispatch.dispatchNonDestructive({ kind: "confirm_item", body });
        },
        onReject: (body) => {
          dispatch.dispatchDestructive(
            { kind: "reject_item", body },
            body.item_id,
            "Item rejeitado",
          );
        },
        onCorrect: (body) => {
          dispatch.dispatchNonDestructive({ kind: "correct_item", body });
        },
      }}
      provenanceSlot={
        provenance !== null ? (
          <div className="px-md">
            <ProvenanceTrail
              itemKind={provenance.itemKind}
              itemId={provenance.itemId}
              onEvidenceViewed={() => {
                setEvidenceViewed(true);
              }}
            />
          </div>
        ) : null
      }
    />
  );
};
