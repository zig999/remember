/**
 * Button — primary interactive control (DS port §4.1).
 *
 * Tokens remapped to Remember's vocabulary:
 *   - `default`     -> bg-action (PRIMARY) + content-inverse text
 *   - `secondary`   -> bg-accent (violet) — was origin's brand-blue
 *   - `destructive` -> bg-danger
 *   - `outline` / `ghost` -> transparent + surface hover
 *
 * Contract: React 19 ref-as-prop (no forwardRef), `cn()` merge, semantic
 * tokens only, CVA across 2 axes (variant × size) — front.md §6.4.
 */
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ButtonProps } from "./button.types";

export const buttonVariants = cva(
  // Motion (front.md §9): `transition` animates color + transform + box-shadow
  // (the focus ring sweeps in); `active:scale-95` is the press feedback.
  "inline-flex items-center justify-center gap-sm whitespace-nowrap rounded-pill font-bold transition duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // filled CTAs also lift on hover
        default:
          "bg-action text-content-inverse hover:bg-action-hover active:bg-action-active hover:-translate-y-0.5 hover:shadow-md",
        secondary:
          "bg-accent text-content-inverse hover:opacity-90 active:opacity-80 hover:-translate-y-0.5 hover:shadow-md",
        destructive:
          "bg-danger text-content-inverse hover:opacity-90 active:opacity-80 hover:-translate-y-0.5 hover:shadow-md",
        outline:
          "border-2 border-border bg-transparent text-content hover:bg-surface",
        ghost: "bg-transparent text-content hover:bg-surface",
      },
      size: {
        sm: "h-8 px-md text-body-sm",
        md: "h-9 px-lg text-body-sm",
        lg: "h-11 px-xl text-body-lg",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
