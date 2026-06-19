/**
 * Tooltip — Radix tooltip. Provider/Root/Trigger passthrough; Content styled
 * on an elevated surface (front.md §9 motion via the popover keyframes).
 * Wrap the app (or a subtree) in <TooltipProvider> once.
 */
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";
import type { TooltipContentProps } from "./tooltip.types";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-popover max-w-3xs overflow-hidden rounded-md border border-border bg-elevated px-md py-1 text-body-sm text-content shadow-md",
          "data-[state=delayed-open]:animate-popover-in data-[state=instant-open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
