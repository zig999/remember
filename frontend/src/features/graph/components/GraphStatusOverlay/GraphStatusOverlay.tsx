import type { FC } from "react";
import { Loader2 } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";
import type { GraphStatusOverlayProps } from "./GraphStatusOverlay.types";

export const GRAPH_STATUS_LOADING_COPY = "Buscando na memória…";

export const GRAPH_STATUS_ERROR_DEFAULT_COPY =
  "Não foi possível carregar o grafo agora.";

export const GraphStatusOverlay: FC<GraphStatusOverlayProps> = ({
  variant,
  errorMessage,
  className,
  ref,
}) => {
  const isError = variant === "error";
  const message = isError
    ? (errorMessage ?? GRAPH_STATUS_ERROR_DEFAULT_COPY)
    : GRAPH_STATUS_LOADING_COPY;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 z-frame",
        "flex items-center justify-center",
        "pointer-events-none",
        className,
      )}
      role="status"
      aria-live="polite"
      data-variant={variant}
      data-testid="graph-status-overlay"
    >
      <GlassSurface
        level="panel"
        accent={isError ? "error" : "none"}
        className={cn(
          "pointer-events-auto",
          "flex items-center gap-sm px-lg py-md",
          "min-w-0 max-w-md",
        )}
        aria-label={isError ? "Erro do grafo" : "Carregando grafo"}
      >
        {!isError && (
          <Loader2
            className="size-4 shrink-0 animate-spin text-foreground"
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "text-xs text-foreground",
            "min-w-0 line-clamp-2",
          )}
        >
          {message}
        </span>
      </GlassSurface>
    </div>
  );
};
