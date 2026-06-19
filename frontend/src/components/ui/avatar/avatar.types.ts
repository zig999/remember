/**
 * Avatar — public type contract.
 *
 * Source: DS port §4.3. Initials avatar (no image). Deterministic swatch from
 * the name hash; swatches remapped to Remember tokens (action/accent/data).
 */
import type { ComponentProps, Ref } from "react";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends ComponentProps<"span"> {
  /** Required — drives the initials and the deterministic swatch color. */
  name: string;
  /** Size; defaults to `md`. */
  size?: AvatarSize;
  /** React 19 ref-as-prop — attached to the `<span>`. No `forwardRef`. */
  ref?: Ref<HTMLSpanElement>;
}
