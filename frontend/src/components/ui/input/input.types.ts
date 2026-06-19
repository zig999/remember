/**
 * Input — public type contract (DS port §4.5).
 */
import type { ComponentProps, Ref } from "react";

export interface InputProps extends ComponentProps<"input"> {
  /** Invalid state — sets the error border + aria-invalid. */
  invalid?: boolean;
  /** React 19 ref-as-prop — attached to the `<input>`. No `forwardRef`. */
  ref?: Ref<HTMLInputElement>;
}
