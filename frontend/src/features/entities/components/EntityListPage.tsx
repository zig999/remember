import { useState, type FC, type ReactNode } from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useNodeListing, useNodeTypes } from "../api/listing.hooks";
import {
  ListEmpty,
  ListErrorAlert,
  ListLoading,
  NodeList,
  TypeChoice,
  TypesErrorAlert,
  TypesLoading,
} from "./entity-list-parts";

export const EntityListPage: FC = () => {
  const [namePrefix, setNamePrefix] = useState("");
  const [nodeType, setNodeType] = useState("");

  const types = useNodeTypes();
  const listing = useNodeListing({ namePrefix, nodeType });

  let typeChoice: ReactNode;
  if (types.data !== undefined) {
    typeChoice = (
      <TypeChoice types={types.data} value={nodeType} onChange={setNodeType} />
    );
  } else if (types.isError) {
    typeChoice = (
      <TypesErrorAlert
        onRetry={() => {
          void types.refetch();
        }}
      />
    );
  } else {
    typeChoice = <TypesLoading />;
  }

  let results: ReactNode;
  if (listing.isPending) {
    results = <ListLoading />;
  } else if (listing.isError) {
    results = (
      <ListErrorAlert
        onRetry={() => {
          void listing.refetch();
        }}
      />
    );
  } else if (listing.data.items.length === 0) {
    results = <ListEmpty />;
  } else {
    results = <NodeList nodes={listing.data.items} />;
  }

  return (
    <section
      aria-label="Nós de conhecimento"
      data-testid="entity-list-page"
      className="w-full flex-1"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-lg p-lg">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Nós de conhecimento
        </h1>
        <div className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <Label htmlFor="entity-list-prefix">Prefixo do nome</Label>
            <Input
              id="entity-list-prefix"
              type="text"
              autoComplete="off"
              value={namePrefix}
              onChange={(event) => setNamePrefix(event.target.value)}
              data-testid="entity-list-prefix"
            />
          </div>
          <div className="flex flex-col gap-xs">{typeChoice}</div>
        </div>
        <div aria-live="polite">{results}</div>
      </div>
    </section>
  );
};
