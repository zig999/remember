/**
 * Popover — Radix popover (z-popover). Root/Trigger/Anchor passthrough; Content
 * styled on an elevated surface with the open/close keyframes. Used for the
 * footer `as_of` time picker and filter menus (layout.md §5, z3).
 */
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import type { PopoverContentProps } from "./popover.types";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-popover w-72 rounded-md border border-border bg-elevated p-md text-body shadow-lg outline-none",
          "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
