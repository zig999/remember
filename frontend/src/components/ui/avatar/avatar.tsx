/**
 * Avatar — initials avatar with deterministic color (DS port §4.3).
 *
 * Pure display. `initials()` and `swatch()` are exported for unit testing —
 * the determinism (same name -> same color) is the load-bearing behavior.
 */
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { AvatarProps } from "./avatar.types";

/** First letter of first + last word; single word -> first 2 letters; empty -> "?". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/** 3-swatch palette remapped to Remember tokens (was origin brand-ink/blue/blue-deep). */
export const SWATCHES = ["bg-action", "bg-accent", "bg-data"] as const;

/** Deterministic swatch from a stable string hash — same name always same color. */
export function swatch(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return SWATCHES[Math.abs(h) % SWATCHES.length]!;
}

export const avatarVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold uppercase tracking-tight text-content-inverse",
  {
    variants: {
      size: {
        sm: "size-7 text-caption",
        md: "size-9 text-body-sm",
        lg: "size-12 text-subheading",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export function Avatar({ className, name, size, ref, ...props }: AvatarProps) {
  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      className={cn(avatarVariants({ size }), swatch(name), className)}
      {...props}
    >
      {initials(name)}
    </span>
  );
}
