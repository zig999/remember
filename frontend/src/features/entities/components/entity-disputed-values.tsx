import type { FC } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import type { NodeAttribute } from "../types";

export interface DisputedValuesProps {
  readonly attributeKey: string;
  readonly values: readonly NodeAttribute[];
}

export const DisputedValues: FC<DisputedValuesProps> = ({
  attributeKey,
  values,
}) => (
  <div className="flex flex-col gap-xs">
    {values.length > 0 ? (
      <ul
        aria-label={`Valores de ${attributeKey}`}
        data-testid={`entity-disputed-values-${attributeKey}`}
        className="flex flex-col gap-xs"
      >
        {values.map((attribute) => (
          <li
            key={attribute.id}
            data-testid={`entity-disputed-value-${attributeKey}`}
            className="text-sm text-foreground"
          >
            {attribute.value}
          </li>
        ))}
      </ul>
    ) : null}
    <Link
      to="/curation"
      data-testid={`entity-curation-link-${attributeKey}`}
      className={cn(
        "self-start text-sm font-medium text-foreground underline underline-offset-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
    >
      Abrir na fila de curadoria
    </Link>
  </div>
);
