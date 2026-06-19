/**
 * Button — public type contract.
 *
 * Source: temp/design-system-replication-report.md §4.1, remapped to Remember
 * semantic tokens (front.md §6.4 component contract). Variant/size unions are
 * declared here as literals (instead of `VariantProps<typeof buttonVariants>`)
 * to avoid a button.tsx <-> button.types.ts import cycle.
 */
import type { ComponentProps, Ref } from "react";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ComponentProps<"button"> {
  /** Visual intent. Defaults to `default` (primary action). */
  variant?: ButtonVariant;
  /** Size; `md` (h-9) aligns with Input/Select. Defaults to `md`. */
  size?: ButtonSize;
  /** When true, shows a spinner before children and disables the button. */
  loading?: boolean;
  /** React 19 ref-as-prop — attached to the `<button>`. No `forwardRef`. */
  ref?: Ref<HTMLButtonElement>;
}
