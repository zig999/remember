/**
 * DropdownMenu — Radix dropdown menu (z-popover). Root/Trigger/Group passthrough;
 * Content/Item/CheckboxItem/Label/Separator styled on an elevated surface with
 * the open/close keyframes. Used for the header ⚙ settings menu.
 */
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
} from "./dropdown-menu.types";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-popover min-w-44 overflow-hidden rounded-md border border-border bg-elevated p-1 text-body shadow-md",
          "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-sm rounded-sm px-md py-1.5 text-xs font-medium text-foreground outline-none transition-colors",
        "data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-md text-xs font-medium text-foreground outline-none transition-colors",
        "data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-4 text-primary" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-md py-1.5 text-xs font-medium font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
