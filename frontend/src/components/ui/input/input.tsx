/**
 * Input — text field (DS port §4.5).
 *
 * Tokens remapped: `border-subtle` -> `border-border`, `border-error`/`border-focus`
 * kept. `aria-invalid` is OMITTED when false (never the string "false").
 */
import { cn } from "@/lib/cn";
import type { InputProps } from "./input.types";

export function Input({ className, invalid, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        // `transition` sweeps the focus ring/border in; `animate-shake` fires on
        // the render where the field becomes invalid (front.md §9).
        "h-9 w-full rounded-md border bg-input px-md text-label text-content transition placeholder:text-muted",
        "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-border-error aria-[invalid=true]:animate-shake" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
