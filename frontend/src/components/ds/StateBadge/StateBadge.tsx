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

const STATE_LABELS: Readonly<Record<ConfidenceState, string>> = Object.freeze({
  accepted: "Aceito",
  uncertain: "Incerto",
  "low-confidence": "Baixa confiança",
  disputed: "Em disputa",
  superseded: "Superado",
});

const STATE_ICONS: Readonly<Record<ConfidenceState, LucideIcon>> = Object.freeze({
  accepted: CheckCircle2,
  uncertain: HelpCircle,
  "low-confidence": CircleDashed,
  disputed: GitFork,
  superseded: Archive,
});

const ICON_PX: Readonly<Record<StateBadgeSize, number>> = Object.freeze({
  sm: 12,
  md: 16,
});

export const stateBadgeVariants = cva(
  "inline-flex items-center rounded-pill border select-none whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "text-xs p-xs gap-xs",
        md: "text-xs p-sm gap-sm",
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

type TransitionKind = "promote" | "supersede" | "merge" | null;

function decideTransition(
  prev: ConfidenceState | undefined,
  next: ConfidenceState,
  dataTransitionAttr: string | undefined,
): TransitionKind {
  if (dataTransitionAttr === "merge") return "merge";
  if (prev === undefined) return null;
  if (prev === next) return null;
  if (prev === "uncertain" && next === "accepted") return "promote";
  if (next === "superseded") return "supersede";
  return null;
}

export const StateBadge: FC<StateBadgeProps> = ({
  state,
  animate = true,
  size = "sm",
  iconOnly = false,
  label,
  className,
  ref,
}) => {
  const prefersReducedMotion = useReducedMotion() === true;
  const motionAllowed = animate && !prefersReducedMotion;

  const resolvedLabel = label ?? STATE_LABELS[state];

  const IconCmp = STATE_ICONS[state];
  const iconSize = ICON_PX[size];

  const prevStateRef = useRef<ConfidenceState | undefined>(undefined);

  const rootRef = useRef<HTMLSpanElement | null>(null);

  function setRefs(node: HTMLSpanElement | null): void {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && "current" in ref) {
      (ref as { current: HTMLSpanElement | null }).current = node;
    }
  }

  useEffect(() => {
    prevStateRef.current = state;
  }, [state]);

  const dataTransitionAttr = rootRef.current?.dataset.stateTransition;
  const transitionKind = motionAllowed
    ? decideTransition(prevStateRef.current, state, dataTransitionAttr)
    : null;

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
