/**
 * RadioGroup — public type contract (DS port §4.9). Passthrough of Radix Root + Item.
 */
import type { ComponentProps } from "react";
import type * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

export type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>;
export type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;
