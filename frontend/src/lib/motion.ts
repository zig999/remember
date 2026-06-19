/**
 * motion — the six canonical Framer Motion variants Remember uses to express
 * "movimento com significado" (front.md §9, tokens.md §11.2).
 *
 * Components MUST import these — they MUST NOT invent their own variants
 * (front.back.md BR-10). Durations/easings are NUMERIC constants (seconds +
 * cubic-bezier tuples) that MIRROR the canonical tokens in `tokens.md §11.1`.
 * They are NOT CSS `var(--…)` strings: Framer Motion drives animation in JS
 * (WAAPI) and a `var()` string makes `duration` non-numeric, which throws
 * "duration must be non-negative" in the browser (jsdom does not catch it).
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

/* ---------- token-mirrored motion constants ----------
 * Framer Motion drives animation in JS (WAAPI), which requires a NUMERIC
 * `duration` (seconds) and a cubic-bezier tuple for `ease`. It cannot consume
 * CSS `var(--…)` strings here (those only work for CSS transitions/animations,
 * e.g. the `uncertain-border-pulse` @keyframes in theme.css). These values
 * MIRROR the canonical tokens in `tokens.md §11.1` — keep them in sync if the
 * tokens change. `backgroundColor` keeps a CSS var: Framer resolves color
 * variables, and the value must follow the [data-theme] cascade. */

const VAR = {
  durationFast: 0.2, //     --duration-fast (200ms)
  durationModerate: 0.3, // --duration-moderate (300ms)
  durationEntrance: 0.5, // --duration-entrance (500ms)
  durationInstant: 0.1, //  --duration-instant (100ms)
  durationPulse: 2.4, //    --duration-pulse (2400ms)
  easeOut: [0.25, 1, 0.5, 1] as [number, number, number, number], //      --ease-out
  easeIn: [0.7, 0, 0.84, 0] as [number, number, number, number], //       --ease-in
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number], //   --ease-in-out
  easeOutQuint: [0.22, 1, 0.36, 1] as [number, number, number, number], // --ease-out-quint
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number], //  --ease-out-expo
  easeBack: [0.34, 1.56, 0.64, 1] as [number, number, number, number], // --ease-back (overshoot; y>1 now allowed, front.md §9.1 v1.1.0)
  colorAccepted: "var(--color-state-accepted)",
  colorUncertain: "var(--color-state-uncertain)",
};

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

/* ============================================================
   Decorative / interaction motions (added 2026-06-19 — front.md §9 v1.1.0).
   Motion may now be decorative; these power the modern/technological feel of
   the components/ui primitives. Same contract: components consume these (no
   inline variants), and each still accepts `reducedMotion` (now optional but
   kept so callers MAY honour useReducedMotion()).
   ============================================================ */

/** Prop bag for an interactive element: tap press-in + optional hover lift. */
export function pressable(
  reducedMotion: boolean,
  opts?: { lift?: boolean },
): Record<string, unknown> {
  if (reducedMotion) return {};
  const bag: Record<string, unknown> = {
    whileTap: { scale: 0.96 },
    transition: { duration: VAR.durationFast, ease: VAR.easeOut },
  };
  if (opts?.lift) bag.whileHover = { y: -2 };
  return bag;
}

/** Prop bag: hover lift + shadow (clickable cards / surfaces). */
export function hoverLift(reducedMotion: boolean): Record<string, unknown> {
  if (reducedMotion) return {};
  return {
    whileHover: { y: -3, boxShadow: "0 12px 32px -8px rgba(0,0,0,0.5)" },
    transition: { duration: VAR.durationFast, ease: VAR.easeOut },
  };
}

/** Mount entrance: scale 0.8 → 1 + fade, with a slight overshoot. */
export function popIn(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, scale: 1, transition: { duration: 0 } },
      visible: { opacity: 1, scale: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: VAR.durationFast, ease: VAR.easeBack },
    },
  };
}

/** One-shot pulse for a value that just changed (e.g. a count badge). */
export function countPulse(reducedMotion: boolean): Variants {
  return {
    rest: { scale: 1 },
    pulse: reducedMotion
      ? { scale: 1, transition: { duration: 0 } }
      : { scale: [1, 1.22, 1], transition: { duration: VAR.durationModerate, ease: VAR.easeBack } },
  };
}

/** Stagger orchestrator — apply to a list container; children use `listItem`. */
export function staggerContainer(reducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: reducedMotion ? { duration: 0 } : { staggerChildren: 0.06 },
    },
  };
}

/** List item revealed by `staggerContainer`: rise + fade. */
export function listItem(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0, transition: { duration: 0 } },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: VAR.durationModerate, ease: VAR.easeOut },
    },
  };
}

/** Validation error shake (x oscillation). Trigger by switching `still`→`shake`. */
export function errorShake(reducedMotion: boolean): Variants {
  return {
    still: { x: 0 },
    shake: reducedMotion
      ? { x: 0, transition: { duration: 0 } }
      : { x: [0, -4, 4, -3, 3, 0], transition: { duration: VAR.durationModerate, ease: VAR.easeInOut } },
  };
}

/** Checkbox check / radio dot entrance: scale 0 → 1 with overshoot. */
export function checkIn(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, scale: 1, transition: { duration: 0 } },
      visible: { opacity: 1, scale: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: VAR.durationFast, ease: VAR.easeBack },
    },
  };
}

/** Dropdown / popover enter/exit (scale from the trigger edge + fade). */
export function transitionPopover(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, scale: 1, y: 0, transition: { duration: 0 } },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.96, y: -4 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: VAR.durationFast, ease: VAR.easeOutQuint },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: VAR.durationInstant, ease: VAR.easeIn },
    },
  };
}

/** Form validation message reveal: fade + small rise. */
export function messageReveal(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0, transition: { duration: 0 } },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: -4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: VAR.durationFast, ease: VAR.easeOut },
    },
  };
}

/* ---------- canonical-name index ---------- */

/**
 * The canonical motion variants/factories. Components SHOULD import the named
 * factory directly; this index exists so the unit test can enumerate the
 * contract. The original six are under `pulse` / `transition`; decorative and
 * interaction motions (v1.1.0) are grouped under `interaction` / `entrance` /
 * `feedback`.
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
    popover: transitionPopover,
  },
  interaction: {
    pressable,
    "hover-lift": hoverLift,
  },
  entrance: {
    "pop-in": popIn,
    "stagger-container": staggerContainer,
    "list-item": listItem,
    message: messageReveal,
  },
  feedback: {
    "count-pulse": countPulse,
    "error-shake": errorShake,
    "check-in": checkIn,
  },
} as const;
