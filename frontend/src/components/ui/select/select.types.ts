/**
 * Select — public type contract (DS port §4.11). Custom parts passthrough Radix.
 */
import type { ComponentProps } from "react";
import type * as SelectPrimitive from "@radix-ui/react-select";

export type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger>;
export type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content>;
export type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label>;
export type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;
