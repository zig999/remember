import type { Ref } from "react";

export type GraphStatusOverlayVariant = "loading" | "error";

export interface GraphStatusOverlayProps {
  variant: GraphStatusOverlayVariant;
  errorMessage?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
