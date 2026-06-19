/**
 * Checkbox — Radix checkbox (DS port §4.8).
 * Tokens remapped: `border-subtle` -> `border-border`; checked fill -> action +
 * content-inverse glyph. Controlled/uncontrolled + indeterminate via Radix.
 */
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CheckboxProps } from "./checkbox.types";

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-5 shrink-0 rounded-sm border border-border bg-surface transition-colors",
        "data-[state=checked]:border-action data-[state=checked]:bg-action data-[state=checked]:text-content-inverse",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
