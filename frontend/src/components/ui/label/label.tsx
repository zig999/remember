/**
 * Label — form label (DS port §4.7). Wraps Radix Label so `peer-disabled`
 * reflects the sibling control's disabled state. React 19: ref flows via props.
 */
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/cn";
import type { LabelProps } from "./label.types";

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "select-none text-label font-semibold text-content peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
