import { useCallback, useEffect, useRef } from "react";
import { http } from "@/lib/http";
import { authHeader } from "@/features/chat/api/_request";
import { useGraphStore } from "../state/graph-store";

export type GraphViewSnapshot =
  | {
      readonly version: 1;
      readonly nodes: unknown[];
      readonly links: unknown[];
      readonly positions: Record<string, { x: number; y: number }>;
      readonly user_pinned: string[];
    }
  | {
      readonly version: 2;
      readonly nodes: unknown[];
      readonly links: unknown[];
      readonly positions: Record<string, { x: number; y: number }>;
      readonly user_pinned: string[];
      readonly layout_algorithm: "force" | "tree" | "radial";
    };

export function useGraphPersistence(
  conversationId: string | undefined,
): void {
  const justHydrated = useRef(false);
  const hydratedFor = useRef<string | undefined>(undefined);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (snapshot.version === 2) {
            useGraphStore.getState().hydrate({
              version: 2,
              nodes: snapshot.nodes as import("../types").GraphNodeData[],
              links: snapshot.links as import("../types").GraphLinkData[],
              positions: snapshot.positions,
              user_pinned: snapshot.user_pinned,
              layout_algorithm: snapshot.layout_algorithm,
            });
          } else {
            useGraphStore.getState().hydrate({
              version: 1,
              nodes: snapshot.nodes as import("../types").GraphNodeData[],
              links: snapshot.links as import("../types").GraphLinkData[],
              positions: snapshot.positions,
              user_pinned: snapshot.user_pinned,
            });
          }
        }
      } catch {
      }
    }

    void restoreSnapshot();
    return () => { cancelled = true; };
  }, [conversationId]);

  const handleStoreChange = useCallback(() => {
    if (!conversationId) return;

    const { nodes } = useGraphStore.getState();
    if (nodes.size === 0) return;

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
      if (snapshot.nodes.length === 0) return;
      void http(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/graph`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify(snapshot),
        },
      ).catch(() => {
      });
    }, 800);
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = useGraphStore.subscribe((state, prevState) => {
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
