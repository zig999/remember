/**
 * Badge — generic status pill (DS port §4.2).
 *
 * Display-only (no state). Variants remapped to Remember tokens. Contrast pairs:
 *   - action/accent/danger fills -> light `content-inverse` text
 *   - data/warning fills (light hues) -> dark `primary` text
 *   - success -> the contrast-checked state-accepted / state-accepted-fg pair
 */
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { BadgeProps } from "./badge.types";

export const badgeVariants = cva(
  "inline-flex items-center gap-xs whitespace-nowrap rounded-pill px-md py-1 text-badge",
  {
    variants: {
      variant: {
        default: "bg-action text-content-inverse",
        accent: "bg-accent text-content-inverse",
        data: "bg-data text-primary",
        success: "bg-state-accepted text-state-accepted-fg",
        warning: "bg-warning text-primary",
        danger: "bg-danger text-content-inverse",
        outline: "border-2 border-border bg-transparent text-content",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ref, ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
