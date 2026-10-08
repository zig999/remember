import { type FC } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import type { ListedNode, NodeType } from "../types";

export const ALL_TYPES_VALUE = "";

const TYPE_LABEL_ID = "entity-list-type-label";

interface RetryAlertProps {
  readonly message: string;
  readonly onRetry: () => void;
  readonly testId: string;
  readonly retryTestId: string;
}

const RetryAlert: FC<RetryAlertProps> = ({
  message,
  onRetry,
  testId,
  retryTestId,
}) => (
  <Alert
    variant="destructive"
    role="alert"
    data-testid={testId}
    action={
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        data-testid={retryTestId}
      >
        Tentar novamente
      </Button>
    }
  >
    {message}
  </Alert>
);

export const ListLoading: FC = () => (
  <div
    role="status"
    aria-live="polite"
    data-testid="entity-list-loading"
    className="text-xs text-muted-foreground"
  >
    Carregando nós…
  </div>
);

export const ListErrorAlert: FC<{ readonly onRetry: () => void }> = ({
  onRetry,
}) => (
  <RetryAlert
    message="Não foi possível carregar os nós. Tente novamente."
    onRetry={onRetry}
    testId="entity-list-error"
    retryTestId="entity-list-retry"
  />
);

export const ListEmpty: FC = () => (
  <p data-testid="entity-list-empty" className="text-sm text-muted-foreground">
    Nenhum nó encontrado.
  </p>
);

export const TypesLoading: FC = () => (
  <div
    role="status"
    aria-live="polite"
    data-testid="entity-list-types-loading"
    className="text-xs text-muted-foreground"
  >
    Carregando tipos de nó…
  </div>
);

export const TypesErrorAlert: FC<{ readonly onRetry: () => void }> = ({
  onRetry,
}) => (
  <RetryAlert
    message="Não foi possível carregar os tipos de nó. Tente novamente."
    onRetry={onRetry}
    testId="entity-list-types-error"
    retryTestId="entity-list-types-retry"
  />
);

interface TypeChoiceProps {
  readonly types: readonly NodeType[];
  readonly value: string;
  readonly onChange: (nodeType: string) => void;
}

export const TypeChoice: FC<TypeChoiceProps> = ({ types, value, onChange }) => (
  <div
    role="group"
    aria-labelledby={TYPE_LABEL_ID}
    className="flex flex-col gap-xs"
  >
    <Label id={TYPE_LABEL_ID}>Tipo de nó</Label>
    <Select
      value={value}
      onChange={onChange}
      options={[
        { value: ALL_TYPES_VALUE, label: "Todos os tipos" },
        ...types.map((type) => ({ value: type.name, label: type.name })),
      ]}
      data-testid="entity-list-type"
    />
  </div>
);

export const NodeList: FC<{ readonly nodes: readonly ListedNode[] }> = ({
  nodes,
}) => (
  <ul
    aria-label="Nós de conhecimento"
    data-testid="entity-list"
    className="flex flex-col gap-sm"
  >
    {nodes.map((node) => (
      <li
        key={node.id}
        data-testid="entity-list-item"
        className="flex flex-col gap-xs border-b border-border pb-sm"
      >
        <Link
          to="/entities/$nodeId"
          params={{ nodeId: node.id }}
          preload={false}
          className={cn(
            "text-sm font-medium text-foreground underline-offset-4 hover:underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          )}
        >
          {node.canonicalName}
        </Link>
        <dl className="flex flex-wrap gap-md text-xs text-muted-foreground">
          <div className="flex gap-xs">
            <dt className="sr-only">Tipo</dt>
            <dd data-testid="entity-list-item-type">{node.nodeType}</dd>
          </div>
          <div className="flex gap-xs">
            <dt className="sr-only">Status</dt>
            <dd data-testid="entity-list-item-status">{node.status}</dd>
          </div>
        </dl>
      </li>
    ))}
  </ul>
);
