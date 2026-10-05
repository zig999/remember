import { useEffect, useRef } from "react";
import { useGraphStore } from "../state/graph-store";

export const DEFAULT_REVEAL_STAGGER_MS = 90;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function drainAll(): void {
  const { revealQueue, revealedIds, status } = useGraphStore.getState();
  if (revealQueue.length === 0) {
    if (status === "revealing") {
      useGraphStore.getState().setStatus("ready");
    }
    return;
  }
  const next = new Set(revealedIds);
  for (const id of revealQueue) next.add(id);
  useGraphStore.setState({
    revealQueue: [],
    revealedIds: next,
  });
  if (useGraphStore.getState().status === "revealing") {
    useGraphStore.getState().setStatus("ready");
  }
}

function revealOne(id: string): void {
  const { revealedIds } = useGraphStore.getState();
  if (revealedIds.has(id)) return;
  const next = new Set(revealedIds);
  next.add(id);
  useGraphStore.setState({ revealedIds: next });
}

export function useGraphReveal(
  staggerMs: number = DEFAULT_REVEAL_STAGGER_MS,
): ReadonlySet<string> {
  const revealQueue = useGraphStore((s) => s.revealQueue);
  const revealedIds = useGraphStore((s) => s.revealedIds);

  const staggerRef = useRef<number>(staggerMs);
  staggerRef.current = staggerMs;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (revealQueue.length === 0) {
      if (useGraphStore.getState().status === "revealing") {
        useGraphStore.getState().setStatus("ready");
      }
      return;
    }

    if (prefersReducedMotion()) {
      drainAll();
      return;
    }

    const delay = Math.max(0, staggerRef.current);

    const tick = (): void => {
      const id = useGraphStore.getState().dequeueReveal();
      if (id !== undefined) {
        revealOne(id);
      }
      timerRef.current = null;
      if (useGraphStore.getState().revealQueue.length === 0) {
        if (useGraphStore.getState().status === "revealing") {
          useGraphStore.getState().setStatus("ready");
        }
      }
    };

    timerRef.current = setTimeout(tick, delay);

    return (): void => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealQueue]);

  return revealedIds;
}
