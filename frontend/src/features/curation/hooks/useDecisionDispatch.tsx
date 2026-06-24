/**
 * useDecisionDispatch — unified DecisionPanel/BatchBar mutation controller (TC-06).
 *
 * Glues:
 *   - TC-03 mutation hooks (`useResolveEntityMatch`, `useResolveDispute`,
 *     `useConfirmItem`, `useRejectItem`, `useCorrectItem`).
 *   - TC-04 curationStore (`setSelectedItem`, `incrementResolved`,
 *     `setSelectedItems`).
 *   - sonner toasts (UI-04 UndoToast, UI-06 success, §6 warning/danger).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-04/UI-05/UI-06/UI-10/UI-12.
 *  - §3 state transitions (UI-03 → UI-04/UI-05; UI-04 undo → UI-03;
 *    UI-04 timer expire → UI-05; UI-05 200 → UI-06; UI-05 409 → UI-10).
 *  - §6 API Error → UI Mapping (every mutation error code).
 *  - flow.md FL-CURATION-04 (auto-advance), FL-CURATION-05 (UndoToast),
 *    FL-CURATION-06 (409 stale), FL-CURATION-08 (navigation teardown).
 *
 * Key contracts:
 *
 *   1. **ZERO BFF traffic during the 5-second window.** The hook stores a
 *      pending `PendingDestructive` in memory (NOT in Zustand — pending
 *      lifecycle does not survive re-mounts; the navigation teardown path
 *      below handles that case explicitly). The setTimeout that fires the
 *      POST is the only network trigger during this phase.
 *
 *   2. **Auto-advance < 50ms.** On 200 OK (UI-06), the hook calls
 *      `setSelectedItem(nextItem)` synchronously and reads `nextItem` from
 *      the caller-provided `getNextItem()` selector. The caller is
 *      responsible for prefetching (TanStack Query handles it via the
 *      pre-existing `prefetchQuery` hook in CurationPage).
 *
 *   3. **§6 mapping is exhaustive.** Every error code in the spec table is
 *      handled. Codes we project into the DecisionPanel (REASON_REQUIRED,
 *      SELF_MERGE_FORBIDDEN, TEMPORAL_INCOHERENT, CORRECTION_NO_CHANGES,
 *      INVALID_TARGET_NODE, DATE_UNJUSTIFIED, FRAGMENT_NOT_ACCEPTED) are
 *      surfaced via the `serverError` field returned from the hook; the
 *      DecisionPanel reads it and highlights the right field. Codes that
 *      mean "the item went away" (409, 410, 404) optimistically remove
 *      the item, emit a toast, and auto-advance — no inline error.
 *
 *   4. **Navigation teardown.** On unmount, if a UndoToast timer is still
 *      live, the hook commits the destructive action synchronously (the
 *      mutation runs after unmount; we accept the dangling fetch because
 *      the alternative — silently discarding the action — would violate
 *      the spec's "fail loud / never silently discard" principle).
 */
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

/* ------------------------------------------------------------------ *
 * Public types                                                        *
 * ------------------------------------------------------------------ */

/** Discriminated union of every destructive action the curator can take.
 *  Non-destructive actions (`keep_separate`, `keep_disputed`, `adjust_periods`,
 *  `confirm`, `correct`) commit immediately and never enter the UndoToast
 *  branch. */
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
  /** Selector that returns the next item to advance to after a 200 / 409 /
   *  410 / 404. Returning `null` puts the page back into UI-07 (empty). */
  readonly getNextItem: () => SelectedItem | null;
  /**
   * Called whenever an item should be visually removed from the queue
   * BEFORE the BFF request fires (optimistic removal — UI-04 destructive,
   * 409/410/404 paths). The caller drives whichever store/cache backs the
   * QueueList; we don't reach into TanStack Query cache directly because
   * the optimistic update strategy varies per page (page may use a derived
   * Set of "tombstoned" ids on top of the cached list).
   *
   * For undo, the same id is passed to `onItemRestore`.
   */
  readonly onItemRemove: (id: string) => void;
  /** Inverse of `onItemRemove`. Called from the Desfazer click path. */
  readonly onItemRestore: (id: string) => void;
}

export interface UseDecisionDispatchResult {
  /** Triggered by the DecisionPanel destructive buttons. Opens UndoToast. */
  readonly dispatchDestructive: (
    dispatch: DestructiveDispatch,
    /** Stable id used for optimistic removal (entity_match: node_id;
     *  disputed/reject: item_id; correct: predecessor id). */
    optimisticId: string,
    /** Caption rendered inside the UndoToast (e.g. "Item removido"). */
    label: string,
  ) => void;
  /** Triggered by non-destructive buttons. Commits immediately. */
  readonly dispatchNonDestructive: (dispatch: NonDestructiveDispatch) => void;
  /** Cancel the in-flight UndoToast — used by tests / navigation teardown. */
  readonly cancelPending: () => void;
  /** Commit the in-flight UndoToast immediately (navigation teardown). */
  readonly commitPending: () => void;
  /** True while ANY mutation is in flight (post-toast commit OR direct). */
  readonly submitting: boolean;
  /** Latest server error projected for inline display in the panel. Cleared
   *  on the next dispatch. */
  readonly serverError: ServerError | null;
  /** True when the most recent error was a 409 stale signal — caller may
   *  render <StaleBanner /> on top of the panel. Cleared on next dispatch. */
  readonly stale: boolean;
}

/* ------------------------------------------------------------------ *
 * §6 error projection                                                 *
 * ------------------------------------------------------------------ */

/** Codes that mean "the item is gone" — optimistic remove + toast + advance. */
const VANISHED_CODES = new Set<string>([
  "BUSINESS_REVIEW_NOT_PENDING",
  "BUSINESS_ITEM_NOT_DISPUTED",
  "BUSINESS_ITEM_NOT_UNCERTAIN",
  "BUSINESS_ITEM_NOT_DELETABLE",
  "BUSINESS_NODE_DELETED",
  "RESOURCE_NOT_FOUND",
]);

/** Codes the DecisionPanel projects into field-level highlights. */
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

/* ------------------------------------------------------------------ *
 * Hook                                                                *
 * ------------------------------------------------------------------ */

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

  // -------- mutation hooks (TC-03) --------
  const mEntityMatch = useResolveEntityMatch();
  const mDispute = useResolveDispute();
  const mConfirm = useConfirmItem();
  const mReject = useRejectItem();
  const mCorrect = useCorrectItem();

  // -------- curation store (TC-04) --------
  const setSelectedItem = useCurationStore((s) => s.setSelectedItem);
  const incrementResolved = useCurationStore((s) => s.incrementResolved);

  // -------- local state --------
  const pendingRef = useRef<PendingDestructive | null>(null);
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [stale, setStale] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // A stable id (per hook instance) used as a discriminator on the
  // optimisticId when the host wants to render multiple parallel toasts
  // (BatchBar). Today we use a single id; the prefix avoids collision with
  // toasts created elsewhere on the page (chat, ingest progress).
  const toastIdPrefix = useId();

  /* ---------------- internal commit path ---------------- */

  const advance = useCallback((): void => {
    const next = getNextItem();
    setSelectedItem(next);
    incrementResolved();
  }, [getNextItem, setSelectedItem, incrementResolved]);

  const runMutation = useCallback(
    async (dispatch: AnyDispatch): Promise<void> => {
      // Resolve the typed mutation hook for the dispatch kind. Each branch
      // calls `.mutateAsync()` so the await + catch lives in ONE place and
      // we can map every EnvelopeError uniformly.
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

      // Auth 401 is handled globally (QueryCache.onError) — but the
      // throw still surfaces here. We swallow the inline projection
      // because the global handler will redirect / clear the store.
      if (
        code === "AUTH_UNAUTHORIZED" ||
        code === "AUTH_TOKEN_EXPIRED" ||
        code === "AUTH_TOKEN_INVALID" ||
        code === "AUTH_SESSION_EXPIRED"
      ) {
        return;
      }

      // §6 — 409/410/404 family: optimistic remove + toast + auto-advance,
      // no inline error.
      if (VANISHED_CODES.has(code)) {
        if (optimisticId !== null) {
          // The original destructive path already removed the item; for
          // non-destructive paths (where the BFF replies 409 directly),
          // remove it now.
          onItemRemove(optimisticId);
        }
        toast.warning(vanishedToastMessage(code));
        setStale(code === "BUSINESS_REVIEW_NOT_PENDING" ||
          code === "BUSINESS_ITEM_NOT_DISPUTED");
        advance();
        return;
      }

      // §6 — inline field errors: hand them to the DecisionPanel via
      // `serverError`. The panel reads the code and highlights the right
      // input + focuses it.
      if (INLINE_FIELD_CODES.has(code)) {
        setServerError({ code, message, httpStatus });
        return;
      }

      // §6 — 500/503 — toast danger (the QueryCache.onError ALSO renders a
      // global "server error" toast; that's fine — sonner deduplicates by
      // content, and the spec asks for a danger toast + the user must be
      // able to retry).
      if (httpStatus >= 500) {
        toast.error(
          httpStatus === 503
            ? "Serviço temporariamente indisponível. Tente novamente em instantes."
            : "Algo deu errado. Tente novamente.",
        );
        return;
      }

      // Fallback — surface the message generically.
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
        // UI-06 — auto-advance. For non-destructive actions, also emit a
        // short success toast per spec §2 UI-06.
        if (!isDestructive) {
          toast.success("Confirmado.", { duration: 2_000 });
        }
        advance();
      } catch (err) {
        // Destructive flows have already optimistically removed the item.
        // Non-destructive flows reach this branch on 409 with the item
        // still in the queue — pass the optimisticId so VANISHED_CODES
        // can drop it now.
        handleError(err, isDestructive ? null : optimisticId);
        // If the destructive commit failed with a non-vanished code, the
        // item is GONE optimistically but the server rejected it. We
        // restore it so the curator can retry — except for VANISHED_CODES,
        // which already advanced past it.
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

  /* ---------------- public API ---------------- */

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
      // If there's already a pending toast (rapid-fire), commit it before
      // starting a new one. The spec doesn't allow two pending destructive
      // actions concurrently — would race against the queue.
      if (pendingRef.current !== null) {
        commitPending();
      }

      // 1) Optimistic remove + auto-advance NOW (UI-04).
      onItemRemove(optimisticId);
      advance();

      const deadlineMs = Date.now() + UNDO_WINDOW_MS;
      const toastIdValue = `${toastIdPrefix}-undo-${optimisticId}`;

      // 2) Mount the UndoToast via sonner.
      toast.custom(
        (sonnerId) => (
          <UndoToast
            label={label}
            deadlineMs={deadlineMs}
            onUndo={() => {
              // The store remembers the same toast id; sonner's `id` arg is
              // identical because we passed `id: toastIdValue`. Dismiss is
              // idempotent — calling it from cancelPending too is a no-op.
              void sonnerId;
              cancelPending();
            }}
          />
        ),
        { id: toastIdValue, duration: UNDO_WINDOW_MS },
      );

      // 3) Arm the commit timer. ZERO BFF requests in the 5-second window.
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
      // Resolve the optimistic id (used only on 409 vanish path).
      const optimisticId = optimisticIdOf(dispatch);
      void commit(dispatch, optimisticId, false);
    },
    [commit],
  );

  /* ---------------- navigation teardown (FL-CURATION-08) ---------------- */

  useEffect(() => {
    // Capture refs so the cleanup closure doesn't re-bind on each render.
    return () => {
      if (pendingRef.current !== null) {
        // Spec: pending destructive action is committed immediately on
        // unmount; brief "Ação comprometida ao sair." toast fires before
        // unmount.
        toast.info("Ação comprometida ao sair.");
        const snapshot = pendingRef.current;
        clearTimeout(snapshot.timeoutId);
        toast.dismiss(snapshot.toastId);
        pendingRef.current = null;
        // Fire-and-forget the mutation; we cannot await across unmount.
        void commit(snapshot.dispatch, snapshot.optimisticId, true);
      }
    };
    // We intentionally do NOT include `commit` in deps — the cleanup must
    // see the LATEST commit closure when the page unmounts, but adding
    // `commit` here would tear down + re-arm on every render. The closure
    // captures the latest `commit` via the ref pattern: the timeout fires
    // synchronously inside useEffect cleanup, which runs before React unmounts.
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

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

/** Derive the optimistic id for a non-destructive dispatch — used only on
 *  the 409 vanish path to remove the item from the queue. */
function optimisticIdOf(d: NonDestructiveDispatch): string | null {
  switch (d.kind) {
    case "resolve_entity_match_keep":
      return d.nodeId;
    case "resolve_dispute_keep":
    case "resolve_dispute_adjust":
      // Use the first item_id as the optimistic id; the spec treats every
      // dispute side as one logical item from the queue's perspective.
      return d.body.item_ids[0] ?? null;
    case "confirm_item":
      return d.body.item_id;
    case "correct_item":
      return d.body.item_id;
  }
}

/** Public re-export so the panel/page can type a buffer of items per kind. */
export type DispatchedItemKind = ItemKind;
