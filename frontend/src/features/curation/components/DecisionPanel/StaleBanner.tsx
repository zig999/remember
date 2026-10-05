import type { FC } from "react";
import { RefreshCw } from "lucide-react";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

export interface StaleBannerProps {
  readonly onReload: () => void;
  readonly className?: string;
}

export const StaleBanner: FC<StaleBannerProps> = ({ onReload, className }) => {
  return (
    <Alert
      variant="warning"
      role="alert"
      className={className}
      action={
        <Button type="button" size="sm" variant="outline" onClick={onReload}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Recarregar
        </Button>
      }
    >
      Este item mudou desde que você o abriu.
    </Alert>
  );
};
