/**
 * Dialog — Radix dialog (DS port §4.12).
 *
 * Root/Trigger/Close are passthrough; Content composes Overlay + Content + a
 * built-in Close. Tokens remapped: veil -> the new `overlay` token; panel ->
 * surface; title family -> font-sans (Space Grotesk). z-layer -> z-modal.
 * Focus trap / ESC / click-outside are Radix defaults.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DialogContentProps,
  DialogEnter,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogHeaderProps,
  DialogFooterProps,
} from "./dialog.types";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** enter -> (open/close keyframe classes). Keyframes carry the centring transform. */
const ENTER_MOTION: Record<DialogEnter, string> = {
  pop: "data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out",
  slide:
    "data-[state=open]:animate-modal-slide-in data-[state=closed]:animate-modal-slide-out",
};

export function DialogContent({
  className,
  children,
  enter = "pop",
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-modal bg-overlay data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
      <DialogPrimitive.Content
        className={cn(
          // enter/exit motion (front.md §9): backdrop fades; panel pops (scale+overshoot)
          // or slides up, per `enter`. The keyframes carry translate(-50%,-50%) (centring).
          "fixed left-1/2 top-1/2 z-modal w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-xl text-body shadow-lg",
          ENTER_MOTION[enter],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Fechar"
          className="absolute right-4 top-4 text-muted transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn("flex flex-col gap-xs pb-md", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("flex items-center justify-end gap-md pt-lg", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("font-sans text-subheading font-bold text-content", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-body-sm text-muted", className)}
      {...props}
    />
  );
}
