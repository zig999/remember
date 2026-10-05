import type { Ref } from "react";

export type ConfidenceState =
  | "accepted"
  | "uncertain"
  | "low-confidence"
  | "disputed"
  | "superseded";

export type StateBadgeSize = "sm" | "md";

export interface StateBadgeProps {
  state: ConfidenceState;

  animate?: boolean;

  size?: StateBadgeSize;

  iconOnly?: boolean;

  label?: string;

  className?: string;

  ref?: Ref<HTMLSpanElement>;
}
