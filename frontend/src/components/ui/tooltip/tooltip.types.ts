/**
 * Tooltip — public type contract. Passthrough of Radix Tooltip.
 */
import type { ComponentProps } from "react";
import type * as TooltipPrimitive from "@radix-ui/react-tooltip";

export type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content>;
