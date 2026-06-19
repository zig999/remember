/**
 * Switch — public type contract (DS port §4.10). Passthrough of Radix Switch Root.
 */
import type { ComponentProps } from "react";
import type * as SwitchPrimitive from "@radix-ui/react-switch";

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root>;
