import { type FC, type ReactNode } from "react";
import { useParams } from "@tanstack/react-router";
import { entityRoute } from "@/router/routes";
import { useAttributeKeys } from "../api/catalog.hooks";
import { useNodeRead } from "../api/node.hooks";
import { ACTIVE_NODE_STATUS, classifyNodeFailure } from "./entity-page-helpers";
import { EntityForm } from "./EntityForm";
import {
  FormLoadErrorAlert,
  FormLoading,
  NodeAttributeList,
  NodeDeletedAlert,
  NodeHeader,
  NodeNotFoundAlert,
} from "./entity-page-parts";

export const EntityPage: FC = () => {
  const { nodeId } = useParams({ from: entityRoute.id }) as { nodeId: string };

  const nodeQuery = useNodeRead(nodeId);
  const read = nodeQuery.data;
  const formNodeType =
    read !== undefined && read.node.status === ACTIVE_NODE_STATUS
      ? read.node.nodeType
      : null;
  const catalogQuery = useAttributeKeys(formNodeType);

  const nodeFailure = nodeQuery.isError
    ? classifyNodeFailure(nodeQuery.error)
    : null;
  const catalogFailed = formNodeType !== null && catalogQuery.isError;

  const retry = (): void => {
    void nodeQuery.refetch();
    if (formNodeType !== null) void catalogQuery.refetch();
  };

  let body: ReactNode;
  if (nodeFailure === "not-found") {
    body = <NodeNotFoundAlert />;
  } else if (nodeFailure === "deleted") {
    body = <NodeDeletedAlert />;
  } else if (nodeFailure === "other" || catalogFailed) {
    body = <FormLoadErrorAlert onRetry={retry} />;
  } else if (read === undefined) {
    body = <FormLoading />;
  } else if (formNodeType === null) {
    body = <NodeAttributeList attributes={read.attributes} />;
  } else if (catalogQuery.data === undefined) {
    body = <FormLoading />;
  } else {
    body = <EntityForm node={read} attributeKeys={catalogQuery.data} />;
  }

  return (
    <section
      aria-label="Nó de conhecimento"
      data-testid="entity-page"
      className="w-full flex-1"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-lg p-lg">
        {read !== undefined && nodeFailure === null ? (
          <NodeHeader node={read.node} />
        ) : null}
        {body}
      </div>
    </section>
  );
};
