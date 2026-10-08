import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useEditEntity } from "../api/edit.hooks";
import { useReloadedNode } from "../api/node.hooks";
import type {
  EditOutcome,
  EditVariables,
  EntityEdit,
  NodeRead,
} from "../types";
import type { EntityReviewState } from "./use-entity-review";

export const UNDO_WINDOW_MS = 5_000;
export const RECORDED_NOTICE = "Edição registrada.";
export const UNDO_ACTION_LABEL = "Desfazer";

export interface UndoableSave {
  readonly confirm: () => void;
  readonly outcome: EditOutcome | null;
}

export function useUndoableSave(
  nodeId: string,
  review: EntityReviewState,
  buildEdit: () => EntityEdit,
  restart: (reloaded: NodeRead) => void,
): UndoableSave {
  const { mutateAsync } = useEditEntity();
  const reloadedNode = useReloadedNode();
  const { clearReason, closeReview } = review;
  const toastId = useId();
  const busy = useRef(false);
  const [outcome, setOutcome] = useState<EditOutcome | null>(null);

  const send = async (variables: EditVariables): Promise<void> => {
    try {
      const result = await mutateAsync(variables);
      if (result.kind === "accepted") {
        clearReason();
        closeReview();
        const reloaded = reloadedNode(nodeId);
        if (reloaded !== undefined) restart(reloaded);
      }
      setOutcome(result);
    } catch {
      setOutcome(null);
    } finally {
      busy.current = false;
    }
  };

  const confirm = (): void => {
    if (busy.current || !review.saveOffered) return;
    busy.current = true;
    setOutcome(null);
    const variables: EditVariables = { nodeId, edit: buildEdit() };
    const timer = setTimeout(() => {
      toast.dismiss(toastId);
      void send(variables);
    }, UNDO_WINDOW_MS);
    toast(RECORDED_NOTICE, {
      id: toastId,
      duration: UNDO_WINDOW_MS,
      action: {
        label: UNDO_ACTION_LABEL,
        onClick: () => {
          clearTimeout(timer);
          busy.current = false;
        },
      },
    });
  };

  return { confirm, outcome };
}
