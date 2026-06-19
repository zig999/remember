/**
 * StateBadge — foundation atom (COMP-01).
 *
 * Renders the confidence state of a fact (`KnowledgeLink`, `NodeAttribute`,
 * `InformationFragment`, `KnowledgeNode`) as a small selo: colour + lucide
 * icon + pt-BR label. Source: docs/specs/front/components/StateBadge.component.spec.md@1.1.0.
 *
 * Contract highlights enforced here:
 *  - §3   Props contract (state + animate + size + iconOnly + label + className + ref).
 *  - §5   CVA factory across two axes (size × state) — `front.md §6.4` (CVA at ≥2 variants).
 *  - §6.1–§6.5  Per-state tokens + lucide icon + pt-BR default label.
 *  - §7   Motion variants consumed from `@/lib/motion` — NEVER inlined here.
 *  - §9   WCAG 2.2 AA: aria-label always present, icon aria-hidden, motion gated by useReducedMotion().
 *  - §10  React 19 ref-as-prop — no `forwardRef`.
 *  - §11  `cn()` merge for className.
 */
import { useEffect, useRef, type FC } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion as motionLib, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  CircleDashed,
  GitFork,
  Archive,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  pulseUncertain,
  transitionPromote,
  transitionSupersede,
  transitionMerge,
} from "@/lib/motion";
import type {
  ConfidenceState,
  StateBadgeProps,
  StateBadgeSize,
} from "./StateBadge.types";

/* ---------- canonical pt-BR labels (§6) -------------------------------- */
/**
 * Frozen pt-BR label map — no i18n layer (CLAUDE.md `i18n: false`). Adding a
 * new `ConfidenceState` REQUIRES adding an entry here in the same CR.
 */
const STATE_LABELS: Readonly<Record<ConfidenceState, string>> = Object.freeze({
  accepted: "Aceito",
  uncertain: "Incerto",
  "low-confidence": "Baixa confiança",
  disputed: "Em disputa",
  superseded: "Superado",
});

/* ---------- canonical lucide icon map (§6) ----------------------------- */
const STATE_ICONS: Readonly<Record<ConfidenceState, LucideIcon>> = Object.freeze({
  accepted: CheckCircle2,
  uncertain: HelpCircle,
  "low-confidence": CircleDashed,
  disputed: GitFork,
  superseded: Archive,
});

/* ---------- icon size by badge size (§5.1) ----------------------------- */
const ICON_PX: Readonly<Record<StateBadgeSize, number>> = Object.freeze({
  sm: 12,
  md: 16,
});

/* ---------- CVA factory (size × state — independent axes, §5) ---------- */
/**
 * CVA factory for StateBadge class variants.
 *
 * Generates the Tailwind utility class string for a given confidence state
 * and size. Two independent axes (size × state) — see spec §5.
 *
 * Border pair rule (CLAUDE.md "Known Gotchas" + spec §12):
 *   ALWAYS declare both `border` (width) and `border-border-<state>` (colour);
 *   the `low-confidence` state intentionally uses neutral `border-border`
 *   (no state-specific colour, §6.3).
 *
 * Base classes (independent of variants):
 *   - layout: `inline-flex items-center` (icon + label side-by-side)
 *   - radius: `rounded-pill` (both sizes)
 *   - reset:  `select-none whitespace-nowrap` (badge never wraps; not selectable)
 *
 * @param props - CVA variant props.
 * @param props.state - Confidence state: `'accepted' | 'uncertain' | 'low-confidence' | 'disputed' | 'superseded'`. Defaults to `'accepted'`.
 * @param props.size - Visual size variant: `'sm'` (caption-level) | `'md'` (body-sm-level). Defaults to `'sm'`.
 * @returns Resolved Tailwind utility class string (`string`) — pass through `cn()` to merge with consumer `className`.
 */
export const stateBadgeVariants = cva(
  "inline-flex items-center rounded-pill border select-none whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "text-caption p-xs gap-xs",
        md: "text-body-sm p-sm gap-sm",
      },
      state: {
        accepted: "bg-state-accepted text-state-accepted-fg border-border-accepted",
        uncertain: "bg-state-uncertain text-state-uncertain-fg border-border-uncertain",
        "low-confidence":
          "bg-state-low-confidence text-state-low-confidence-fg border-border",
        disputed: "bg-state-disputed text-state-disputed-fg border-border-disputed",
        superseded:
          "bg-state-superseded text-state-superseded-fg border-border-superseded",
      },
    },
    defaultVariants: {
      size: "sm",
      state: "accepted",
    },
  },
);

export type StateBadgeVariants = VariantProps<typeof stateBadgeVariants>;

/* ---------- transition triggers (§4 / §7) ------------------------------ */
type TransitionKind = "promote" | "supersede" | "merge" | null;

/**
 * Decide which one-shot variant to play given the prop transition.
 * Pure function — easy to unit-test independently if a regression appears.
 */
function decideTransition(
  prev: ConfidenceState | undefined,
  next: ConfidenceState,
  dataTransitionAttr: string | undefined,
): TransitionKind {
  // Consumer-driven merge always wins (§7.4).
  if (dataTransitionAttr === "merge") return "merge";
  if (prev === undefined) return null; // first mount — no transition.
  if (prev === next) return null;
  if (prev === "uncertain" && next === "accepted") return "promote";
  if (next === "superseded") return "supersede";
  return null;
}

/* ---------- component -------------------------------------------------- */

/**
 * Foundation atom: confidence-state selo. Non-interactive by default.
 * Consumers wrap in `<button>` / `<Tooltip>` for interactivity.
 *
 * The component renders a `<motion.span>` so Framer Motion can drive both the
 * ambient `uncertain` pulse and the one-shot transition variants without
 * mounting/unmounting (AnimatePresence is NOT required — same node persists).
 */
export const StateBadge: FC<StateBadgeProps> = ({
  state,
  animate = true,
  size = "sm",
  iconOnly = false,
  label,
  className,
  ref,
  // Allow data-state-transition="merge" passthrough without leaking to ...rest
  // (the badge reads it via DOM ref — see effect below). We do NOT spread
  // arbitrary HTML attributes; the spec restricts the public API to the props
  // declared in §3.
}) => {
  // useReducedMotion() returns true when the user prefers reduced motion.
  // null is treated as "motion allowed" (Framer Motion default during SSR).
  const prefersReducedMotion = useReducedMotion() === true;
  const motionAllowed = animate && !prefersReducedMotion;

  // Resolve label: prop wins; otherwise the per-state pt-BR default (§6).
  const resolvedLabel = label ?? STATE_LABELS[state];

  // Resolve icon (always render; aria-hidden="true" — §9, decorative).
  const IconCmp = STATE_ICONS[state];
  const iconSize = ICON_PX[size];

  // Track the previous state so we can play the right one-shot transition
  // on prop change (§4 transition rows). Initialized to undefined → first
  // mount plays no transition (correct: a fresh badge is the resting state).
  const prevStateRef = useRef<ConfidenceState | undefined>(undefined);

  // The data-state-transition="merge" attribute is read from the root span
  // after mount (consumer sets it imperatively for the graph merge controller
  // — §7.4). We expose it via a small ref so the variant resolution can read
  // the latest value without re-rendering on attribute change.
  const rootRef = useRef<HTMLSpanElement | null>(null);

  // Merge-or-forward the consumer ref (§10: ref is a normal prop, no forwardRef).
  function setRefs(node: HTMLSpanElement | null): void {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && "current" in ref) {
      (ref as { current: HTMLSpanElement | null }).current = node;
    }
  }

  // Bump `prevStateRef` AFTER each render so the next render's transition
  // decision is based on the previous render's state (not the current one).
  useEffect(() => {
    prevStateRef.current = state;
  }, [state]);

  // Decide which one-shot transition (if any) plays this render.
  const dataTransitionAttr = rootRef.current?.dataset.stateTransition;
  const transitionKind = motionAllowed
    ? decideTransition(prevStateRef.current, state, dataTransitionAttr)
    : null;

  /* ---------- pick the active Framer Motion variants (§7) -------------- */
  // Three independent paths:
  //   1) uncertain + motionAllowed -> ambient pulse (infinite loop)
  //   2) one-shot transition (promote / supersede / merge) -> play once
  //   3) neither -> no `variants` attached
  // We never combine pulse + one-shot on the same render — the spec treats
  // them as distinct semantic events.
  let variants: ReturnType<typeof pulseUncertain> | undefined;
  let animateProp: string | string[] | undefined;
  let initialProp: string | undefined;

  if (transitionKind === "promote") {
    variants = transitionPromote(false);
    initialProp = "from";
    animateProp = "to";
  } else if (transitionKind === "supersede") {
    variants = transitionSupersede(false);
    initialProp = "from";
    animateProp = "to";
  } else if (transitionKind === "merge") {
    // Per spec §7.4, the badge plays the SOURCE side of the merge variant
    // (translate + fade); the surviving target badge runs its own instance.
    // Target coordinates are not known to the badge — the consumer reads
    // them from the DOM and orchestrates separately. The variant played here
    // is a no-coord variant (x:0,y:0 → 0,0) that fades only; this is the
    // safest default while preserving the API surface. The graph merge
    // controller drives the actual translation via separate animation
    // primitives (out of scope for this atom).
    const merge = transitionMerge(false, { x: 0, y: 0 });
    variants = merge.source;
    initialProp = "from";
    animateProp = "to";
  } else if (state === "uncertain" && motionAllowed) {
    variants = pulseUncertain(false);
    animateProp = "visible";
  }

  return (
    <motionLib.span
      ref={setRefs}
      className={cn(stateBadgeVariants({ state, size }), className)}
      aria-label={`Estado de confiança: ${resolvedLabel}`}
      data-state={state}
      data-size={size}
      data-motion-variant={
        // Surfaced for spec-driven tests (BDD §6.2: "variant on the motion element").
        // Falsy values omitted by JSX attribute coercion when undefined.
        variants === undefined
          ? undefined
          : transitionKind ?? (state === "uncertain" ? "pulse.uncertain" : undefined)
      }
      {...(variants !== undefined ? { variants } : {})}
      {...(initialProp !== undefined ? { initial: initialProp } : {})}
      {...(animateProp !== undefined ? { animate: animateProp } : {})}
    >
      <IconCmp size={iconSize} aria-hidden="true" />
      {!iconOnly && <span>{resolvedLabel}</span>}
    </motionLib.span>
  );
};
