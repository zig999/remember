/**
 * RadioGroup — Radix radio group (DS port §4.9).
 * Tokens remapped: `border-subtle` -> `border-border`; checked ring/dot -> action.
 */
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RadioGroupProps, RadioGroupItemProps } from "./radio-group.types";

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-col gap-md", className)}
      {...props}
    />
  );
}

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "aspect-square size-5 shrink-0 rounded-pill border border-border bg-input transition-colors",
        "data-[state=checked]:border-action",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        {/* Indicator mounts on select -> check-pop runs once (front.md §9). */}
        <Circle className="size-2.5 animate-check-pop fill-action text-action" aria-hidden="true" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
