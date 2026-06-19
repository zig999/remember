/**
 * Switch — Radix toggle (DS port §4.10).
 * Tokens remapped: checked track -> action; unchecked -> muted; thumb -> surface.
 * Usable as `peer` for a sibling Label.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";
import type { SwitchProps } from "./switch.types";

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-pill border-2 border-transparent transition-colors",
        "data-[state=checked]:bg-action data-[state=unchecked]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          // overshoot ease (ease-back) gives the thumb a snappy, mechanical feel (front.md §9)
          "pointer-events-none block size-4 rounded-pill bg-surface shadow-sm transition-transform duration-200 ease-back",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
