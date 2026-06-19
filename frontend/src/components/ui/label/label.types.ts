/**
 * Label — public type contract (DS port §4.7). Passthrough of Radix Label Root.
 */
import type { ComponentProps } from "react";
import type * as LabelPrimitive from "@radix-ui/react-label";

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;
