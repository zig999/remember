/**
 * Checkbox — public type contract (DS port §4.8). Passthrough of Radix Checkbox Root.
 */
import type { ComponentProps } from "react";
import type * as CheckboxPrimitive from "@radix-ui/react-checkbox";

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;
