/**
 * Command — public type contract.
 */
import type { ReactNode } from "react";

export interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  /** Accessible name for the dialog (rendered sr-only). */
  label?: string;
}
