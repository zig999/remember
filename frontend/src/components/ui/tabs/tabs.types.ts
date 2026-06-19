/**
 * Tabs — public type contract (DS port §4.13). Passthrough of Radix Tabs parts.
 */
import type { ComponentProps } from "react";
import type * as TabsPrimitive from "@radix-ui/react-tabs";

export type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;
export type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;
export type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger>;
export type TabsContentProps = ComponentProps<typeof TabsPrimitive.Content>;
