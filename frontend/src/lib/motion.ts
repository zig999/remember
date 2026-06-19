/**
 * motion — the six canonical Framer Motion variants Remember uses to express
 * "movimento com significado" (front.md §9, tokens.md §11.2).
 *
 * Components MUST import these — they MUST NOT invent their own variants
 * (front.back.md BR-10). Every duration / easing is referenced as a CSS
 * variable from `tokens.md §11.1` — bare ms numbers are forbidden in this
 * module.
 *
 * Reduced-motion contract (front.md §9.1, BR-10):
 *  - Each export is a *factory* that takes a `reducedMotion` boolean.
 *  - When `reducedMotion === true`, the returned variants collapse to the
 *    final visible state with `transition: { duration: 0 }` — the state
 *    change remains legible (color/shape swap), the animation does not run.
 *  - At the component level, callers also wrap consumption with Framer
 *    Motion's `useReducedMotion()` hook, so this factory accepts either an
 *    explicit boolean (preferred for tests + Storybook) or the hook value
 *    in production.
 *
 * Animated property scope (tokens.md §11.3):
 *  - Only `transform` (x, y, scale) and `opacity` — never width / height /
 *    padding / margin.
 *  - Max 2 properties animated simultaneously per variant.
 *  - `backgroundColor` transitions on `transition.promote` are allowed
 *    because the token swap is the centerpiece of the promote semantics —
 *    paired with `scale`, that is 2 properties total.
 */

import type { Variants } from "framer-motion";

/* ---------- token aliases (CSS variables — no bare ms) ---------- */

const VAR = {
  durationFast: "var(--duration-fast)",
  durationModerate: "var(--duration-moderate)",
  durationEntrance: "var(--duration-entrance)",
  durationInstant: "var(--duration-instant)",
  durationPulse: "var(--duration-pulse)",
  easeOut: "var(--ease-out)",
  easeIn: "var(--ease-in)",
  easeInOut: "var(--ease-in-out)",
  easeOutQuint: "var(--ease-out-quint)",
  easeOutExpo: "var(--ease-out-expo)",
  colorAccepted: "var(--color-state-accepted)",
  colorUncertain: "var(--color-state-uncertain)",
} as const;

/* ---------- merge target coordinate type ---------- */

export interface MergeTargetCoords {
  readonly x: number;
  readonly y: number;
}

/* ---------- factories ---------- */

/**
 * Ambient pulse for the `uncertain` state (tokens.md §11.2, EV-01).
 * opacity 1 → 0.55 → 1, 2400ms ease-in-out, infinite.
 */
export function pulseUncertain(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }
  return {
    visible: {
      opacity: [1, 0.55, 1],
      transition: {
        duration: VAR.durationPulse,
        ease: VAR.easeInOut,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };
}

/**
 * Promotion uncertain → accepted (tokens.md §11.2, EV-02).
 * backgroundColor swap AND scale 1 → 1.06 → 1, 300ms ease-out-quint, once.
 */
export function transitionPromote(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      from: { backgroundColor: VAR.colorUncertain, scale: 1, transition: { duration: 0 } },
      to: { backgroundColor: VAR.colorAccepted, scale: 1, transition: { duration: 0 } },
    };
  }
  return {
    from: {
      backgroundColor: VAR.colorUncertain,
      scale: 1,
    },
    to: {
      backgroundColor: VAR.colorAccepted,
      scale: [1, 1.06, 1],
      transition: {
        duration: VAR.durationModerate,
        ease: VAR.easeOutQuint,
      },
    },
  };
}

/**
 * Supersession * → superseded (tokens.md §11.2, EV-03).
 * opacity 1 → 0.45 AND y 0 → 4, 500ms ease-in, once.
 */
export function transitionSupersede(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      from: { opacity: 1, y: 0, transition: { duration: 0 } },
      to: { opacity: 0.45, y: 4, transition: { duration: 0 } },
    };
  }
  return {
    from: { opacity: 1, y: 0 },
    to: {
      opacity: 0.45,
      y: 4,
      transition: {
        duration: VAR.durationEntrance,
        ease: VAR.easeIn,
      },
    },
  };
}

/**
 * Entity merge (tokens.md §11.2, EV-04).
 * Source: x/y → target.x/target.y AND opacity 1 → 0.
 * Surviving badge (target side): scale 1 → 1.08 → 1.
 * 500ms ease-out-expo, once.
 *
 * Returns BOTH variants (`source` + `target`); the consumer (Graph merge
 * controller) picks which one to apply to which element. Returning a single
 * factory keeps the merge contract atomic — front.md §9 forbids the merge
 * source and target from drifting out of sync.
 */
export function transitionMerge(
  reducedMotion: boolean,
  targetCoords: MergeTargetCoords,
): { source: Variants; target: Variants } {
  if (reducedMotion) {
    return {
      source: {
        from: { x: 0, y: 0, opacity: 1, transition: { duration: 0 } },
        to: { x: targetCoords.x, y: targetCoords.y, opacity: 0, transition: { duration: 0 } },
      },
      target: {
        from: { scale: 1, transition: { duration: 0 } },
        to: { scale: 1, transition: { duration: 0 } },
      },
    };
  }
  const sharedTransition = {
    duration: VAR.durationEntrance,
    ease: VAR.easeOutExpo,
  } as const;
  return {
    source: {
      from: { x: 0, y: 0, opacity: 1 },
      to: {
        x: targetCoords.x,
        y: targetCoords.y,
        opacity: 0,
        transition: sharedTransition,
      },
    },
    target: {
      from: { scale: 1 },
      to: {
        scale: [1, 1.08, 1],
        transition: sharedTransition,
      },
    },
  };
}

/**
 * Glass panel enter/exit (tokens.md §11.2).
 *  enter: opacity 0 → 1 AND y 8 → 0, 200ms ease-out
 *  exit:  opacity 1 → 0 AND y 0 → 8, 100ms ease-in
 */
export function transitionGlassPanel(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, y: 0, transition: { duration: 0 } },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 0, y: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: VAR.durationFast,
        ease: VAR.easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: 8,
      transition: {
        duration: VAR.durationInstant,
        ease: VAR.easeIn,
      },
    },
  };
}

/**
 * Glass modal enter/exit (tokens.md §11.2).
 *  enter: opacity 0 → 1 AND scale 0.96 → 1, 300ms ease-out-quint
 *  exit:  opacity 1 → 0 AND scale 1 → 0.96, 100ms ease-in
 */
export function transitionGlassModal(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, scale: 1, transition: { duration: 0 } },
      visible: { opacity: 1, scale: 1, transition: { duration: 0 } },
      exit: { opacity: 0, scale: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: VAR.durationModerate,
        ease: VAR.easeOutQuint,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: {
        duration: VAR.durationInstant,
        ease: VAR.easeIn,
      },
    },
  };
}

/* ---------- canonical-name index ---------- */

/**
 * The six canonical motion variants, keyed by their `tokens.md §11.2` name.
 * Components SHOULD import the named factory directly; this index exists so
 * the unit test can enumerate the contract.
 */
export const motion = {
  pulse: {
    uncertain: pulseUncertain,
  },
  transition: {
    promote: transitionPromote,
    supersede: transitionSupersede,
    merge: transitionMerge,
    "glass-panel": transitionGlassPanel,
    "glass-modal": transitionGlassModal,
  },
} as const;
