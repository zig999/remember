/**
 * Dialog — public type contract (DS port §4.12).
 */
import type { ComponentProps, Ref } from "react";
import type * as DialogPrimitive from "@radix-ui/react-dialog";

/** Entrance motion (front.md §9): `pop` (scale + overshoot, default) | `slide` (rise up). */
export type DialogEnter = "pop" | "slide";

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** Entrance animation style. Defaults to `pop`. */
  enter?: DialogEnter;
};
export type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;
export type DialogDescriptionProps = ComponentProps<
  typeof DialogPrimitive.Description
>;
export interface DialogHeaderProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
export interface DialogFooterProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
