import type { FC } from "react";
import type { OutsideCatalogGroup } from "./entity-form-schema";

export interface OutsideCatalogValuesProps {
  readonly groups: readonly OutsideCatalogGroup[];
}

const TITLE_ID = "entity-outside-catalog-title";

export const OutsideCatalogValues: FC<OutsideCatalogValuesProps> = ({
  groups,
}) => {
  if (groups.length === 0) return null;
  return (
    <section
      aria-labelledby={TITLE_ID}
      data-testid="entity-outside-catalog"
      className="flex flex-col gap-xs"
    >
      <p id={TITLE_ID} className="text-sm font-medium text-foreground">
        Valores fora do catálogo
      </p>
      <dl className="flex flex-col gap-sm">
        {groups.map(({ key, values }) => (
          <div
            key={key}
            data-testid={`entity-outside-catalog-group-${key}`}
            className="flex flex-col gap-xs"
          >
            <dt className="text-xs text-muted-foreground">{key}</dt>
            {values.map((attribute) => (
              <dd
                key={attribute.id}
                data-testid={`entity-outside-catalog-value-${key}`}
                className="text-sm text-foreground"
              >
                {attribute.value}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
};
