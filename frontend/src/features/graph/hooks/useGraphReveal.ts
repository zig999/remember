/**
 * useGraphReveal — staggered "reveal queue" consumer for the GraphSpace (TC-FE-09).
 *
 * Watches `useGraphStore.revealQueue` and pops one id at a time at
 * `staggerMs` intervals, writing each id into `useGraphStore.revealedIds`.
 * When the queue empties and the store status is `"revealing"`, advances
 * the status to `"ready"` so `GraphStatusOverlay` removes itself.
 *
 * Spec references:
 *  - temp/chat-graphspace-plan.md Rev. 2026-06-21 §6.6 (Motion / REQ-8):
 *    "useGraphReveal consome a revealQueue em intervalos de revealStaggerMs
 *    (default ~90ms), marcando 1 id como revelado por tick. Cada nó revelado
 *    entra com Framer Motion: opacity 0→1 + scale 0.85→1 (~180ms, ease-out).
 *    Aresta só aparece quando ambos os endpoints estão revelados.
 *    prefers-reduced-motion: revela tudo de uma vez, sem stagger nem scale
 *    (fade curto só). status transita loading → revealing → ready conforme
 *    a fila esvazia."
 *  - docs/specs/front/components/GraphSpace.component.spec.md @25bf157 §5
 *    (BDD Scenario 3 — Progressive reveal, edge endpoint rule), §9 (key
 *    implementation constraints — `revealStaggerMs` default 90ms;
 *    `useGraphStore.getState().dequeueReveal()` every `revealStaggerMs`ms).
 *
 * Invariants pinned here:
 *  - **AC-F.14 (one-by-one over time)** — the hook does NOT batch the queue
 *    under normal motion. Each tick reveals exactly one id, separated by
 *    `staggerMs` (default 90). With three or more queued nodes, the React
 *    Flow tree sees them appear at least 2 × `staggerMs` apart between the
 *    first and the last.
 *  - **AC-F.15 (edge visibility)** — the hook only marks NODES as revealed.
 *    Edge filtering is the consumer's responsibility (`GraphCanvas` reads the
 *    returned Set and drops edges whose endpoints are still queued). This
 *    file does not import `@xyflow/react`.
 *  - **AC-F.16 (prefers-reduced-motion)** — when
 *    `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, the
 *    hook reveals every queued id in a single synchronous batch. No stagger,
 *    no scale. The hook surfaces the same `revealedIds` Set; the visual
 *    "fade only" entrance is rendered by the consumer (motion factory) under
 *    the same flag — there is no scale animation either way at this layer.
 *  - **Status transition** — `revealing → ready` fires only when the queue
 *    drains AND the current status is `"revealing"`. Any other status
 *    ("loading", "ready" already, "error", "empty") is left untouched —
 *    `useGraphReveal` never owns the transition INTO `"revealing"` (that is
 *    the dispatcher's job on the first `graph_delta`), only the transition
 *    OUT of it.
 *  - **AC-E.3 (Stop during revealing — UI does not freeze)** — on unmount,
 *    or when the queue becomes empty mid-flight, every scheduled timer is
 *    cleared. Already-revealed ids remain in `revealedIds` (the store keeps
 *    them; the hook never deletes from the Set). A subsequent `clear()` on
 *    conversation switch is what empties the Set.
 *  - **Single writer (D2) carve-out** — the store's contract declares
 *    "`dequeueReveal()` pops one id; the caller is responsible for adding
 *    the id to `revealedIds`" (graph-store.ts:104). `useGraphReveal` is
 *    that caller. The hook writes `revealedIds` via `useGraphStore.setState`
 *    — this is the documented exception to D2 ("useGraphStore is the single
 *    writer"), pinned both here and in the store comment.
 *
 * Why setTimeout chaining (not setInterval):
 *  - `setInterval` schedules ticks irrespective of work completion — if a
 *    React render takes longer than `staggerMs`, ticks queue up and the
 *    last few reveals fire back-to-back. Chained `setTimeout` always waits
 *    for the previous handler to return, so each tick begins exactly
 *    `staggerMs` after the previous reveal landed in the store.
 *  - `setInterval` is also harder to cancel cleanly mid-tick (the timer
 *    fires once more before clear takes effect on some browsers); a chained
 *    `setTimeout` only ever has ONE handle outstanding.
 *
 * Why a separate hook (not inline in GraphSpace):
 *  - GraphSpace must stay a thin orchestrator. Owning the timer + the
 *    matchMedia subscription + the store writes inside the component would
 *    bloat it and would make the structural test ("GraphSpace contains no
 *    chat write actions") harder to read.
 *  - The hook is unit-testable without React Flow — only the store + jsdom
 *    + `vi.useFakeTimers()` are needed (parallels `useForceLayout.spec.ts`).
 *
 * Tailwind v4 note:
 *  - This file contains zero presentation logic. No CSS, no className, no
 *    style. The visual entrance (opacity 0→1, scale 0.85→1) lives in the
 *    consumer (a `motion.div` wrapper) using `lib/motion.ts` factories.
 */
import { useEffect, useRef } from "react";
import { useGraphStore } from "../state/graph-store";

/** Default inter-node delay used when the consumer does not provide one.
 *  Matches GraphSpace.component.spec.md §2 (`revealStaggerMs` default = 90)
 *  and chat-graphspace-plan §6.6 ("intervalos de revealStaggerMs (default
 *  ~90ms)"). Exported so tests and the GraphSpace prop default agree on a
 *  single source. */
export const DEFAULT_REVEAL_STAGGER_MS = 90;

/** Reduced-motion media query string. Centralized so the test mock targets
 *  the same string the hook queries. Same string used elsewhere in the
 *  project (e.g. theme.css `@media (prefers-reduced-motion: no-preference)`
 *  for CSS-driven motion). */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SSR-safe check for `prefers-reduced-motion: reduce`.
 *
 * Falls back to `false` (motion ON) when:
 *  - `window` is undefined (SSR / unit-test pre-DOM phase).
 *  - `window.matchMedia` is not present (very old browser / jsdom < 16).
 *
 * Defaulting to "motion ON" is the safe choice: it preserves the visible
 * reveal animation in environments that genuinely cannot report user
 * preference, while still respecting the explicit `reduce` signal whenever
 * it is available.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Drain every queued id into `revealedIds` in a single synchronous batch.
 *
 * Used by:
 *  - the reduced-motion branch (no stagger ever).
 *  - the cleanup hook on unmount when we want any leftover ids to land
 *    immediately so they do not vanish silently from the user's view —
 *    NOT used today (cleanup leaves the queue intact so a re-mount can
 *    resume), but extracted so the reduced-motion path is one call.
 *
 * Internals:
 *  - Reads `revealQueue` once. Builds a fresh `Set` from the current
 *    `revealedIds` ∪ queue.
 *  - Writes both the cleared queue and the new revealedIds in a single
 *    `setState` so Zustand emits one subscription tick.
 *  - If the queue is empty, this function still attempts the status
 *    transition (so a `revealing` status with an already-empty queue
 *    converges to `ready` on the next tick — defensive against races
 *    where `addNodes` is called and then immediately `dequeueReveal`).
 */
function drainAll(): void {
  const { revealQueue, revealedIds, status } = useGraphStore.getState();
  if (revealQueue.length === 0) {
    // Nothing to drain — but still honor the status transition. A pure
    // status check here is harmless (Zustand short-circuits a setState
    // that does not change a primitive — the `revealing → ready` check
    // below only fires when the status actually was `"revealing"`).
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
  // Status transition after the drain — only when we were in `"revealing"`.
  // Read status fresh in case the batch above changed any subscriber's view.
  if (useGraphStore.getState().status === "revealing") {
    useGraphStore.getState().setStatus("ready");
  }
}

/**
 * Mark a single id as revealed inside the store.
 *
 * Idempotent: re-revealing an already-revealed id is a no-op (Set semantics
 * + a referential check before setState to avoid spurious renders).
 */
function revealOne(id: string): void {
  const { revealedIds } = useGraphStore.getState();
  if (revealedIds.has(id)) return;
  const next = new Set(revealedIds);
  next.add(id);
  useGraphStore.setState({ revealedIds: next });
}

/**
 * Public hook surface.
 *
 * @param staggerMs - milliseconds between consecutive reveals when motion
 *                    is allowed. Defaults to `DEFAULT_REVEAL_STAGGER_MS`
 *                    (90). Values ≤ 0 are coerced to a single tick of
 *                    `setTimeout(..., 0)` — the hook never falls back to a
 *                    blocking loop.
 * @returns the live `revealedIds` Set from the store. Consumers
 *           (GraphCanvas) subscribe to this Set and re-render whenever it
 *           grows.
 *
 * The returned Set is the store's own; do NOT mutate it. The hook writes
 * fresh Set identities to the store so referential equality continues to
 * fire subscriptions correctly.
 */
export function useGraphReveal(
  staggerMs: number = DEFAULT_REVEAL_STAGGER_MS,
): ReadonlySet<string> {
  // Subscribe to the queue + the revealedIds Set. The queue subscription is
  // what wakes the effect when `addNodes` enqueues new ids; the revealedIds
  // subscription is what the consumer reads.
  const revealQueue = useGraphStore((s) => s.revealQueue);
  const revealedIds = useGraphStore((s) => s.revealedIds);

  // Latest staggerMs ref — read inside the timer chain so a prop change
  // mid-reveal takes effect on the next tick without re-triggering the
  // effect (which would clear the timer chain and lose progress).
  const staggerRef = useRef<number>(staggerMs);
  staggerRef.current = staggerMs;

  // Outstanding setTimeout handle. At most one is live at any time — the
  // chain advances only after the current handler runs.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Empty queue → nothing to schedule. If we were mid-reveal and the
    // queue just emptied (last `revealOne` ran), close the loop by
    // transitioning status if applicable.
    if (revealQueue.length === 0) {
      if (useGraphStore.getState().status === "revealing") {
        useGraphStore.getState().setStatus("ready");
      }
      return;
    }

    // Reduced-motion branch — short-circuit the entire stagger. Drain the
    // queue in one synchronous batch and transition status. No timer is
    // scheduled; the effect returns immediately so unmount cleanup has
    // nothing to clear.
    if (prefersReducedMotion()) {
      drainAll();
      return;
    }

    // Normal motion: schedule the next reveal. The handler dequeues from
    // the store (single source of truth — re-reads the queue at call time
    // so a queue that grew between scheduling and firing is honored on
    // the NEXT tick driven by the subscription below).
    const delay = Math.max(0, staggerRef.current);

    const tick = (): void => {
      // Re-read the queue at fire time — the snapshot in `revealQueue`
      // above may be stale if `addNodes` ran between scheduling and now.
      const id = useGraphStore.getState().dequeueReveal();
      if (id !== undefined) {
        revealOne(id);
      }
      // After this reveal, the queue subscription will re-fire the effect
      // (the store wrote a fresh queue slice in dequeueReveal). The effect
      // re-runs, sees the next queued id, and schedules the next tick —
      // that is how the chain advances. We do NOT chain timers manually
      // here, because doing so would double-tick when the effect re-runs:
      // the existing timer plus the freshly scheduled one would fire one
      // after the other with no gap.
      //
      // The next-tick scheduling lives in the effect body above; this
      // handler only has to dequeue + mark + close out the status
      // transition when this was the last id.
      timerRef.current = null;
      if (useGraphStore.getState().revealQueue.length === 0) {
        if (useGraphStore.getState().status === "revealing") {
          useGraphStore.getState().setStatus("ready");
        }
      }
    };

    timerRef.current = setTimeout(tick, delay);

    // Cleanup — runs before the next effect AND on unmount. Clear the
    // pending tick. Already-revealed ids stay in `revealedIds` (the
    // contract: AC-E.3 — "nós já revelados permanecem"). Remaining
    // queued ids stay in `revealQueue` — a subsequent re-mount, status
    // change, or new `addNodes` will resume the chain.
    return (): void => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // Re-subscribe whenever the queue identity changes (a new addNodes /
    // a dequeueReveal write). `revealedIds` is intentionally NOT in the
    // dep list — the effect should not re-fire on its own write.
    // staggerMs comes through the ref so changing it does not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealQueue]);

  return revealedIds;
}
