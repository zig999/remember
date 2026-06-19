/**
 * Textarea — multi-line text field (DS port §4.6).
 * Same invalid/focus/disabled contract as Input; browser-default resize kept.
 */
import { cn } from "@/lib/cn";
import type { TextareaProps } from "./textarea.types";

export function Textarea({ className, invalid, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-20 w-full rounded-md border bg-surface px-md py-2 text-label text-content transition-colors placeholder:text-muted",
        "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-border-error" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
