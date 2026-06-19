/**
 * Dialog — public type contract (DS port §4.12).
 */
import type { ComponentProps, Ref } from "react";
import type * as DialogPrimitive from "@radix-ui/react-dialog";

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content>;
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
