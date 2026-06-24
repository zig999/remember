/**
 * CurationDecision — page-level controller that mounts the REAL DecisionPanel
 * for the currently-selected queue item on /curation.
 *
 * This is the page counterpart of CurationDrawer's `DrawerPanel`: it wires
 * `useDecisionDispatch` (TC-06) to the DecisionPanel (TC-05) and supplies the
 * ProvenanceTrail as the panel's evidence slot. TC-04 shipped CurationPage with
 * a placeholder here; this closes that gap so the dedicated triage page shows
 * the working decision flow (not "em construção").
 *
 * Differences from the drawer:
 *  - Auto-advance: on a successful destructive commit the dispatch hook calls
 *    `getNextItem()` and advances the page selection (the drawer hosts a single
 *    item and has no "next"). We advance via the queue ring (`neighbour`).
 *  - `onItemRemove`/`onItemRestore` are no-ops: the page does not keep its own
 *    item list (the queue is server-cached and the mutation's
 *    `invalidateQueries` refetches it); selection movement is handled by
 *    `advance` → `getNextItem`.
 */
import { useMemo, type FC } from "react";
import { DecisionPanel } from "./DecisionPanel";
import { ProvenanceTrail } from "./ProvenanceTrail";
import { useDecisionDispatch } from "../hooks/useDecisionDispatch";
import { useCurationStore } from "../state/curation-store";
import { neighbour } from "./curation-page-helpers";
import type { ItemKind, ReviewQueueItem, ReviewQueueList } from "../types";

/**
 * Derive the `(itemKind, itemId)` for the ProvenanceTrail. `entity_match`
 * items carry no link/attribute id of their own (provenance lives on the
 * candidate nodes), so they get no trail — the ComparePane summary IS the
 * evidence and the panel arms immediately. Mirrors CurationDrawer's
 * `provenanceContextOf`.
 */
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
    // Advance through the queue ring on a successful commit. We read the
    // live selection from the store so the lookup is never stale.
    getNextItem: () =>
      neighbour(queue, useCurationStore.getState().selectedItem, "next"),
    // The page has no local item list — the queue refetch (mutation
    // invalidateQueries) removes the row; selection moves via `advance`.
    onItemRemove: () => {},
    onItemRestore: () => {},
  });

  // entity_match has no provenance hook → evidence is the ComparePane summary,
  // so arm immediately. Otherwise ProvenanceTrail.onEvidenceViewed flips it.
  const armedImmediately = provenance === null;
  const effectiveEvidenceViewed = armedImmediately || evidenceViewed;

  return (
    <DecisionPanel
      item={item}
      evidenceViewed={effectiveEvidenceViewed}
      serverError={dispatch.serverError}
      stale={dispatch.stale}
      submitting={dispatch.submitting}
      className="h-full"
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
