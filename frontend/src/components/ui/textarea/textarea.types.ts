/**
 * Textarea — public type contract (DS port §4.6).
 */
import type { ComponentProps, Ref } from "react";

export interface TextareaProps extends ComponentProps<"textarea"> {
  /** Invalid state — sets the error border + aria-invalid. */
  invalid?: boolean;
  /** React 19 ref-as-prop — attached to the `<textarea>`. No `forwardRef`. */
  ref?: Ref<HTMLTextAreaElement>;
}
