import { type FC } from "react";
import type { AttributeKey, NodeRead } from "../types";

export interface EntityFormProps {
  readonly node: NodeRead;
  readonly attributeKeys: readonly AttributeKey[];
}

export const EntityForm: FC<EntityFormProps> = () => (
  <form aria-label="Formulário de edição" noValidate data-testid="entity-form" />
);
