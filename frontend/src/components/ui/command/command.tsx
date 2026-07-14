/**
 * Command — command palette (cmdk), styled to the design system. `CommandDialog`
 * wraps it in our Dialog for the global ⌘K (layout.md §5, z4). cmdk marks the
 * active item with `data-selected="true"`.
 */
import type { ComponentProps } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import type { CommandDialogProps } from "./command.types";

export function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-elevated text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-sm border-b border-border px-md">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <CommandPrimitive.Input
        className={cn(
          "h-11 w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    />
  );
}

export function CommandEmpty(
  props: ComponentProps<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-xs text-muted-foreground"
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-md [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-sm rounded-sm px-md py-2 text-xs font-medium text-foreground outline-none transition-colors",
        "data-[selected=true]:bg-background data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/** ⌘K palette: Command inside our Dialog (glass-modal entrance). */
export function CommandDialog({
  open,
  onOpenChange,
  children,
  label = "Paleta de comandos",
}: CommandDialogProps) {
  return (
    <Dialog
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}
