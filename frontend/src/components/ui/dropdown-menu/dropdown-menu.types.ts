/**
 * DropdownMenu — public type contract. Passthrough of Radix DropdownMenu parts.
 */
import type { ComponentProps } from "react";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export type DropdownMenuContentProps = ComponentProps<
  typeof DropdownMenuPrimitive.Content
>;
export type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuPrimitive.Item>;
export type DropdownMenuCheckboxItemProps = ComponentProps<
  typeof DropdownMenuPrimitive.CheckboxItem
>;
export type DropdownMenuLabelProps = ComponentProps<typeof DropdownMenuPrimitive.Label>;
export type DropdownMenuSeparatorProps = ComponentProps<
  typeof DropdownMenuPrimitive.Separator
>;
