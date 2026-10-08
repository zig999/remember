import { type FC } from "react";
import { Alert } from "@/shared/components/ui/alert";
import type { EditOutcome } from "../types";

export const CONFLICT_ALERT_TEXT =
  "Este nó mudou desde que você abriu o formulário.";

export const COULD_NOT_BE_SENT_ALERT_TEXT =
  "Não foi possível enviar a edição. Tente novamente.";

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
    case "refused":
      return (
        <Alert
          variant="destructive"
          role="alert"
          data-testid="entity-save-refused"
        >
          {outcome.failure.message}
        </Alert>
      );
    case "unreachable":
      return (
        <Alert
          variant="destructive"
          role="alert"
          data-testid="entity-save-unreachable"
        >
          {COULD_NOT_BE_SENT_ALERT_TEXT}
        </Alert>
      );
    default:
      return null;
  }
};
