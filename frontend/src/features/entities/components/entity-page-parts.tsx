import { type FC } from "react";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Panel } from "@/shared/components/ui/panel";
import type { ListedNode, NodeAttribute } from "../types";

export const FormLoading: FC = () => (
  <div
    role="status"
    aria-live="polite"
    data-testid="entity-loading"
    className="text-xs text-muted-foreground"
  >
    Carregando formulário…
  </div>
);

export const NodeNotFoundAlert: FC = () => (
  <Alert variant="warning" role="alert" data-testid="entity-not-found">
    Nó não encontrado.
  </Alert>
);

export const NodeDeletedAlert: FC = () => (
  <Alert variant="warning" role="alert" data-testid="entity-deleted">
    Este nó foi apagado.
  </Alert>
);

export const FormLoadErrorAlert: FC<{ readonly onRetry: () => void }> = ({
  onRetry,
}) => (
  <Alert
    variant="destructive"
    role="alert"
    data-testid="entity-load-error"
    action={
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        data-testid="entity-load-retry"
      >
        Tentar novamente
      </Button>
    }
  >
    Não foi possível carregar o formulário. Tente novamente.
  </Alert>
);

export const NodeHeader: FC<{ readonly node: ListedNode }> = ({ node }) => (
  <header data-testid="entity-header" className="flex flex-col gap-xs">
    <h1 className="text-lg font-semibold tracking-tight text-foreground">
      {node.canonicalName}
    </h1>
    <dl className="flex flex-wrap gap-md text-xs text-muted-foreground">
      <div className="flex gap-xs">
        <dt className="sr-only">Tipo</dt>
        <dd data-testid="entity-node-type">{node.nodeType}</dd>
      </div>
      <div className="flex gap-xs">
        <dt className="sr-only">Status</dt>
        <dd data-testid="entity-node-status">{node.status}</dd>
      </div>
    </dl>
  </header>
);

export const NodeAttributeList: FC<{
  readonly attributes: readonly NodeAttribute[];
}> = ({ attributes }) => {
  if (attributes.length === 0) return null;
  return (
    <Panel title="Atributos" titleLevel={2} data-testid="entity-attributes">
      <dl className="mt-sm flex flex-col gap-sm">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="flex flex-col gap-xs">
            <dt className="text-xs text-muted-foreground">
              {attribute.attributeKey}
            </dt>
            <dd className="text-sm text-foreground">{attribute.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};
