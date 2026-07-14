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
  "inline-flex items-center gap-xs whitespace-nowrap rounded-pill px-md py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent text-primary-foreground",
        data: "bg-data text-background",
        success: "bg-state-accepted text-state-accepted-fg",
        warning: "bg-warning text-background",
        danger: "bg-destructive text-primary-foreground",
        outline: "border-2 border-border bg-transparent text-foreground",
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
