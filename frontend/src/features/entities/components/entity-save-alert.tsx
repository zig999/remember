import { type FC } from "react";
import { Alert } from "@/shared/components/ui/alert";
import type { EditOutcome } from "../types";

export const CONFLICT_ALERT_TEXT =
  "Este nó mudou desde que você abriu o formulário.";

export interface EntitySaveAlertProps {
  readonly outcome: EditOutcome | null;
}

export const EntitySaveAlert: FC<EntitySaveAlertProps> = ({ outcome }) => {
  switch (outcome?.kind) {
    case "conflict":
      return (
        <Alert
          variant="warning"
          role="alert"
          data-testid="entity-save-conflict"
        >
          {CONFLICT_ALERT_TEXT}
        </Alert>
      );
    default:
      return null;
  }
};
