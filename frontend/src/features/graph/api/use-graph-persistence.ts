/**
 * useGraphPersistence — per-conversation graph view persistence hook (BR-42).
 *
 * Spec references:
 *  - /home/siegfriedneto/.claude/plans/sleepy-jingling-quiche.md §Frontend
 *  - docs/specs/domains/chat/openapi.yaml (GET/PUT /conversations/:id/graph)
 *
 * Contract:
 *  - Mounted once in ChatWorkspace, driven by the active conversationId.
 *  - RESTORE: on conversationId change, after the existing clear() in
 *    ChatWorkspace, GET the snapshot and hydrate() if present.
 *  - SAVE (debounced ~800ms): subscribe to the store's nodes/positions/
 *    layoutNonce identity — the 3 change points: graph_delta→addNodes,
 *    drag→setNodePosition, Reorganizar→resetLayout.
 *  - GUARDS:
 *    (a) skip save when nodes.size === 0 (never overwrite a saved graph
 *        with empty — also makes the clear() on switch a no-op for saving).
 *    (b) skip the store-write caused by hydrate() itself (justHydrated ref)
 *        so reopening a conversation doesn't immediately re-PUT what was
 *        just loaded.
 */
import { useCallback, useEffect, useRef } from "react";
import { http } from "@/lib/http";
import { authHeader } from "@/features/chat/api/_request";
import { useGraphStore } from "../state/graph-store";

/** Wire shape of the snapshot stored in chat_graph_view.snapshot. */
export interface GraphViewSnapshot {
  readonly version: 1;
  readonly nodes: unknown[];
  readonly links: unknown[];
  readonly positions: Record<string, { x: number; y: number }>;
  readonly user_pinned: string[];
}

/**
 * Hook signature: receives the current conversationId string (or undefined
 * when no conversation is selected). Returns void — side-effects only.
 */
export function useGraphPersistence(
  conversationId: string | undefined,
): void {
  // Guards
  const justHydrated = useRef(false);
  const hydratedFor = useRef<string | undefined>(undefined);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // GET — restore snapshot on conversationId change.
  // This runs AFTER ChatWorkspace's clear() effect (same dependency array,
  // declared later in the component — React fires effects in declaration
  // order within the same render cycle).
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function restoreSnapshot() {
      if (!conversationId) return;
      try {
        const snapshot = await http<GraphViewSnapshot | null>(
          `/api/v1/conversations/${encodeURIComponent(conversationId)}/graph`,
          { method: "GET", headers: authHeader() },
        );
        if (cancelled) return;
        if (snapshot !== null) {
          justHydrated.current = true;
          hydratedFor.current = conversationId;
          // The snapshot is validated server-side. Cast nodes/links to their
          // typed forms — the wire schema and store types are aligned.
          useGraphStore.getState().hydrate({
            version: 1,
            nodes: snapshot.nodes as import("../types").GraphNodeData[],
            links: snapshot.links as import("../types").GraphLinkData[],
            positions: snapshot.positions,
            user_pinned: snapshot.user_pinned,
          });
        }
      } catch {
        // Restore is best-effort — a network error / 404 leaves the graph
        // in its cleared state (the user sees an empty graph until the next
        // turn produces a fresh delta). Do not surface the error.
      }
    }

    void restoreSnapshot();
    return () => { cancelled = true; };
  }, [conversationId]);

  // SAVE (debounced) — subscribe to the store's reactive slices.
  // We listen to nodes/positions/layoutNonce identity: any write to these
  // indicates a display-visible change worth persisting.
  const handleStoreChange = useCallback(() => {
    if (!conversationId) return;

    const { nodes } = useGraphStore.getState();
    // Guard (a): never overwrite a saved graph with empty state.
    if (nodes.size === 0) return;

    // Guard (b): skip the write that follows hydrate() to avoid a
    // needless roundtrip re-PUTting what we just loaded.
    if (justHydrated.current) {
      justHydrated.current = false;
      return;
    }

    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      const snapshot = useGraphStore.getState().getSnapshot();
      // nodes.size guard already passed — double-check after debounce.
      if (snapshot.nodes.length === 0) return;
      void http(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/graph`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify(snapshot),
        },
      ).catch(() => {
        // Save is best-effort — a transient failure is silent. The next
        // user interaction will trigger another debounced save attempt.
      });
    }, 800);
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = useGraphStore.subscribe((state, prevState) => {
      // Fire on any of the 3 change points:
      //   1. addNodes       → nodes Map identity changes
      //   2. setNodePosition → positions Map identity changes
      //   3. resetLayout     → layoutNonce increments
      if (
        state.nodes !== prevState.nodes ||
        state.positions !== prevState.positions ||
        state.layoutNonce !== prevState.layoutNonce
      ) {
        handleStoreChange();
      }
    });
    return () => {
      unsubscribe();
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [handleStoreChange]);
}
