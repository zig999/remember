import type { FC } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";

export interface StaleBannerProps {
  readonly onReload: () => void;
  readonly message?: string;
  readonly className?: string;
}

const DEFAULT_MESSAGE = "Este item mudou desde que você o abriu.";

export const StaleBanner: FC<StaleBannerProps> = ({
  onReload,
  message = DEFAULT_MESSAGE,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-md rounded-md border border-border bg-warning p-md text-foreground",
        className,
      )}
    >
      <p className="flex items-center gap-sm text-xs">
        <RefreshCw aria-hidden="true" className="size-4" />
        {message}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onReload}>
        Recarregar
      </Button>
    </div>
  );
};
