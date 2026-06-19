/**
 * Popover — public type contract. Passthrough of Radix Popover.
 */
import type { ComponentProps } from "react";
import type * as PopoverPrimitive from "@radix-ui/react-popover";

export type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;
