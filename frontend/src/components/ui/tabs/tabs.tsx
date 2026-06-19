/**
 * Tabs — Radix tabs (DS port §4.13).
 * Tokens remapped: list border -> border-border; active trigger -> action
 * (underline via border-b-2 + -mb-px overlapping the list border).
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";
import type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./tabs.types";

export function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-md", className)}
      {...props}
    />
  );
}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-xl border-b border-border", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative -mb-px inline-flex items-center justify-center border-b-2 border-transparent px-1 pb-md pt-1 text-body-sm font-semibold text-muted transition-colors",
        "hover:text-content",
        "data-[state=active]:border-action data-[state=active]:text-content",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        className,
      )}
      {...props}
    />
  );
}
