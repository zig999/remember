import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { EnvelopeError } from "@/lib/http";
import { UndoToast, UNDO_WINDOW_MS } from "../components/UndoToast";
import {
  useResolveEntityMatch,
  useResolveDispute,
  useConfirmItem,
  useRejectItem,
  useCorrectItem,
} from "../api/curation.hooks";
import { useCurationStore } from "../state/curation-store";
import type { SelectedItem } from "../state/curation-store";
import type {
  ResolveEntityMatchRequest,
  ResolveDisputeRequest,
  ConfirmItemRequest,
  RejectItemRequest,
  CorrectItemRequest,
  ItemKind,
} from "../types";

export type DestructiveDispatch =
  | {
      readonly kind: "resolve_entity_match_merge";
      readonly nodeId: string;
      readonly body: ResolveEntityMatchRequest;
    }
  | {
      readonly kind: "resolve_dispute_prefer";
      readonly body: ResolveDisputeRequest;
    }
  | {
      readonly kind: "reject_item";
      readonly body: RejectItemRequest;
    };

export type NonDestructiveDispatch =
  | {
      readonly kind: "resolve_entity_match_keep";
      readonly nodeId: string;
      readonly body: ResolveEntityMatchRequest;
    }
  | {
      readonly kind: "resolve_dispute_keep";
      readonly body: ResolveDisputeRequest;
    }
  | {
      readonly kind: "resolve_dispute_adjust";
      readonly body: ResolveDisputeRequest;
    }
  | {
      readonly kind: "confirm_item";
      readonly body: ConfirmItemRequest;
    }
  | {
      readonly kind: "correct_item";
      readonly body: CorrectItemRequest;
    };

export type AnyDispatch = DestructiveDispatch | NonDestructiveDispatch;

export interface ServerError {
  readonly code: string;
  readonly message: string;
  readonly httpStatus: number;
}

export interface UseDecisionDispatchOptions {
  readonly getNextItem: () => SelectedItem | null;
  readonly onItemRemove: (id: string) => void;
  readonly onItemRestore: (id: string) => void;
}

export interface UseDecisionDispatchResult {
  readonly dispatchDestructive: (
    dispatch: DestructiveDispatch,
    optimisticId: string,
    label: string,
  ) => void;
  readonly dispatchNonDestructive: (dispatch: NonDestructiveDispatch) => void;
  readonly cancelPending: () => void;
  readonly commitPending: () => void;
  readonly submitting: boolean;
  readonly serverError: ServerError | null;
  readonly stale: boolean;
}

const VANISHED_CODES = new Set<string>([
  "BUSINESS_REVIEW_NOT_PENDING",
  "BUSINESS_ITEM_NOT_DISPUTED",
  "BUSINESS_ITEM_NOT_UNCERTAIN",
  "BUSINESS_ITEM_NOT_DELETABLE",
  "BUSINESS_NODE_DELETED",
  "RESOURCE_NOT_FOUND",
]);

const INLINE_FIELD_CODES = new Set<string>([
  "BUSINESS_REASON_REQUIRED",
  "BUSINESS_SELF_MERGE_FORBIDDEN",
  "BUSINESS_TARGET_NODE_REQUIRED",
  "BUSINESS_INVALID_TARGET_NODE",
  "BUSINESS_DISPUTE_WINNER_REQUIRED",
  "BUSINESS_DISPUTE_PERIODS_REQUIRED",
  "BUSINESS_TEMPORAL_INCOHERENT",
  "BUSINESS_DATE_UNJUSTIFIED",
  "BUSINESS_CORRECTION_NO_CHANGES",
  "BUSINESS_FRAGMENT_NOT_ACCEPTED",
]);

function vanishedToastMessage(code: string): string {
  switch (code) {
    case "BUSINESS_REVIEW_NOT_PENDING":
    case "BUSINESS_ITEM_NOT_DISPUTED":
      return "Já resolvido em outro lugar.";
    case "BUSINESS_ITEM_NOT_UNCERTAIN":
      return "Este item já não está incerto.";
    case "BUSINESS_ITEM_NOT_DELETABLE":
      return "Este item já foi rejeitado ou substituído.";
    case "BUSINESS_NODE_DELETED":
      return "Este nó foi excluído por conformidade.";
    case "RESOURCE_NOT_FOUND":
      return "Item não encontrado.";
    default:
      return "Item indisponível.";
  }
}

function isEnvelopeError(err: unknown): err is EnvelopeError {
  return err instanceof EnvelopeError;
}

interface PendingDestructive {
  readonly dispatch: DestructiveDispatch;
  readonly optimisticId: string;
  readonly toastId: string | number;
  readonly timeoutId: ReturnType<typeof setTimeout>;
  readonly deadlineMs: number;
}

export function useDecisionDispatch(
  opts: UseDecisionDispatchOptions,
): UseDecisionDispatchResult {
  const { getNextItem, onItemRemove, onItemRestore } = opts;

  const mEntityMatch = useResolveEntityMatch();
  const mDispute = useResolveDispute();
  const mConfirm = useConfirmItem();
  const mReject = useRejectItem();
  const mCorrect = useCorrectItem();

  const setSelectedItem = useCurationStore((s) => s.setSelectedItem);
  const incrementResolved = useCurationStore((s) => s.incrementResolved);

  const pendingRef = useRef<PendingDestructive | null>(null);
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [stale, setStale] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toastIdPrefix = useId();

  const advance = useCallback((): void => {
    const next = getNextItem();
    setSelectedItem(next);
    incrementResolved();
  }, [getNextItem, setSelectedItem, incrementResolved]);

  const runMutation = useCallback(
    async (dispatch: AnyDispatch): Promise<void> => {
      switch (dispatch.kind) {
        case "resolve_entity_match_merge":
        case "resolve_entity_match_keep":
          await mEntityMatch.mutateAsync({
            node_id: dispatch.nodeId,
            body: dispatch.body,
          });
          return;
        case "resolve_dispute_prefer":
        case "resolve_dispute_keep":
        case "resolve_dispute_adjust":
          await mDispute.mutateAsync(dispatch.body);
          return;
        case "confirm_item":
          await mConfirm.mutateAsync(dispatch.body);
          return;
        case "reject_item":
          await mReject.mutateAsync(dispatch.body);
          return;
        case "correct_item":
          await mCorrect.mutateAsync(dispatch.body);
          return;
      }
    },
    [mEntityMatch, mDispute, mConfirm, mReject, mCorrect],
  );

  const handleError = useCallback(
    (err: unknown, optimisticId: string | null): void => {
      if (!isEnvelopeError(err)) {
        toast.error("Algo deu errado. Tente novamente.");
        return;
      }
      const code = err.code;
      const message = err.message;
      const httpStatus = err.httpStatus;

      if (
        code === "AUTH_UNAUTHORIZED" ||
        code === "AUTH_TOKEN_EXPIRED" ||
        code === "AUTH_TOKEN_INVALID" ||
        code === "AUTH_SESSION_EXPIRED"
      ) {
        return;
      }

      if (VANISHED_CODES.has(code)) {
        if (optimisticId !== null) {
          onItemRemove(optimisticId);
        }
        toast.warning(vanishedToastMessage(code));
        setStale(code === "BUSINESS_REVIEW_NOT_PENDING" ||
          code === "BUSINESS_ITEM_NOT_DISPUTED");
        advance();
        return;
      }

      if (INLINE_FIELD_CODES.has(code)) {
        setServerError({ code, message, httpStatus });
        return;
      }

      if (httpStatus >= 500) {
        toast.error(
          httpStatus === 503
            ? "Serviço temporariamente indisponível. Tente novamente em instantes."
            : "Algo deu errado. Tente novamente.",
        );
        return;
      }

      setServerError({ code, message, httpStatus });
    },
    [onItemRemove, advance],
  );

  const commit = useCallback(
    async (
      dispatch: AnyDispatch,
      optimisticId: string | null,
      isDestructive: boolean,
    ): Promise<void> => {
      setServerError(null);
      setStale(false);
      setSubmitting(true);
      try {
        await runMutation(dispatch);
        if (!isDestructive) {
          toast.success("Confirmado.", { duration: 2_000 });
        }
        advance();
      } catch (err) {
        handleError(err, isDestructive ? null : optimisticId);
        if (
          isDestructive &&
          isEnvelopeError(err) &&
          !VANISHED_CODES.has(err.code) &&
          optimisticId !== null
        ) {
          onItemRestore(optimisticId);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [runMutation, advance, handleError, onItemRestore],
  );

  const cancelPending = useCallback((): void => {
    const p = pendingRef.current;
    if (!p) return;
    clearTimeout(p.timeoutId);
    toast.dismiss(p.toastId);
    onItemRestore(p.optimisticId);
    pendingRef.current = null;
  }, [onItemRestore]);

  const commitPending = useCallback((): void => {
    const p = pendingRef.current;
    if (!p) return;
    clearTimeout(p.timeoutId);
    toast.dismiss(p.toastId);
    const snapshot = p;
    pendingRef.current = null;
    void commit(snapshot.dispatch, snapshot.optimisticId, true);
  }, [commit]);

  const dispatchDestructive = useCallback(
    (
      dispatch: DestructiveDispatch,
      optimisticId: string,
      label: string,
    ): void => {
      if (pendingRef.current !== null) {
        commitPending();
      }

      onItemRemove(optimisticId);
      advance();

      const deadlineMs = Date.now() + UNDO_WINDOW_MS;
      const toastIdValue = `${toastIdPrefix}-undo-${optimisticId}`;

      toast.custom(
        (sonnerId) => (
          <UndoToast
            label={label}
            deadlineMs={deadlineMs}
            onUndo={() => {
              void sonnerId;
              cancelPending();
            }}
          />
        ),
        { id: toastIdValue, duration: UNDO_WINDOW_MS },
      );

      const timeoutId = setTimeout(() => {
        const snapshot = pendingRef.current;
        if (!snapshot) return;
        toast.dismiss(snapshot.toastId);
        pendingRef.current = null;
        void commit(snapshot.dispatch, snapshot.optimisticId, true);
      }, UNDO_WINDOW_MS);

      pendingRef.current = {
        dispatch,
        optimisticId,
        toastId: toastIdValue,
        timeoutId,
        deadlineMs,
      };
    },
    [onItemRemove, advance, commit, cancelPending, commitPending, toastIdPrefix],
  );

  const dispatchNonDestructive = useCallback(
    (dispatch: NonDestructiveDispatch): void => {
      const optimisticId = optimisticIdOf(dispatch);
      void commit(dispatch, optimisticId, false);
    },
    [commit],
  );

  useEffect(() => {
    return () => {
      if (pendingRef.current !== null) {
        toast.info("Ação comprometida ao sair.");
        const snapshot = pendingRef.current;
        clearTimeout(snapshot.timeoutId);
        toast.dismiss(snapshot.toastId);
        pendingRef.current = null;
        void commit(snapshot.dispatch, snapshot.optimisticId, true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    dispatchDestructive,
    dispatchNonDestructive,
    cancelPending,
    commitPending,
    submitting,
    serverError,
    stale,
  };
}

function optimisticIdOf(d: NonDestructiveDispatch): string | null {
  switch (d.kind) {
    case "resolve_entity_match_keep":
      return d.nodeId;
    case "resolve_dispute_keep":
    case "resolve_dispute_adjust":
      return d.body.item_ids[0] ?? null;
    case "confirm_item":
      return d.body.item_id;
    case "correct_item":
      return d.body.item_id;
  }
}

export type DispatchedItemKind = ItemKind;
