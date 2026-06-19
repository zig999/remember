/**
 * Badge — public type contract.
 *
 * Source: DS port §4.2. Origin's brand blue/teal/yellow variants are remapped
 * to Remember's semantic palette (action/accent/data + success=state-accepted +
 * warning/danger). This is the GENERIC badge; the confidence-state selo is the
 * separate `StateBadge` atom under components/ds/.
 */
import type { ComponentProps, Ref } from "react";

export type BadgeVariant =
  | "default"
  | "accent"
  | "data"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export interface BadgeProps extends ComponentProps<"span"> {
  /** Visual intent. Defaults to `default` (action). */
  variant?: BadgeVariant;
  /** React 19 ref-as-prop — attached to the `<span>`. No `forwardRef`. */
  ref?: Ref<HTMLSpanElement>;
}
