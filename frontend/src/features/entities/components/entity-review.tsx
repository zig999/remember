import { useEffect, useRef, type FC } from "react";
import { Button } from "@/shared/components/ui/button";
import { Panel } from "@/shared/components/ui/panel";
import { EDIT_EFFECT_WORDING } from "./entity-change-effect";
import { todayLocalDate } from "./entity-local-date";
import type { ReviewEntry } from "./entity-review-entries";
import type { EntityReviewState } from "./use-entity-review";

interface ReviewValueProps {
  readonly text: string;
  readonly testId: string;
}

const ReviewValue: FC<ReviewValueProps> = ({ text, testId }) => (
  <dd data-testid={testId} className="text-sm text-foreground">
    {text === "" ? (
      <span className="italic text-muted-foreground">Sem valor</span>
    ) : (
      text
    )}
  </dd>
);

interface ReviewItemProps {
  readonly entry: ReviewEntry;
  readonly today: string;
}

const ReviewItem: FC<ReviewItemProps> = ({ entry, today }) => {
  const key = entry.attributeKey;
  const validity = entry.validity;
  const startStated = validity !== null && validity.from !== "";
  return (
    <li
      data-testid={`entity-review-item-${key}`}
      className="flex flex-col gap-xs"
    >
      <p className="text-sm font-medium text-foreground">{key}</p>
      <dl className="grid grid-cols-1 gap-xs sm:grid-cols-2">
        <div className="flex flex-col gap-xs">
          <dt className="text-xs text-muted-foreground">Valor anterior</dt>
          <ReviewValue
            text={entry.startedWith}
            testId={`entity-review-previous-${key}`}
          />
        </div>
        <div className="flex flex-col gap-xs">
          <dt className="text-xs text-muted-foreground">Novo valor</dt>
          <ReviewValue text={entry.value} testId={`entity-review-new-${key}`} />
        </div>
        {entry.effect === null ? null : (
          <div className="flex flex-col gap-xs">
            <dt className="text-xs text-muted-foreground">Efeito</dt>
            <dd
              data-testid={`entity-review-effect-${key}`}
              className="text-sm font-medium text-foreground"
            >
              {EDIT_EFFECT_WORDING[entry.effect]}
            </dd>
          </div>
        )}
        {validity === null ? null : (
          <div className="flex flex-col gap-xs">
            <dt className="text-xs text-muted-foreground">
              Início da validade
            </dt>
            <dd className="flex flex-wrap items-baseline gap-xs text-sm text-foreground">
              <span data-testid={`entity-review-valid-from-${key}`}>
                {startStated ? validity.from : today}
              </span>
              {startStated ? null : (
                <span
                  data-testid={`entity-review-valid-from-unstated-${key}`}
                  className="text-xs text-muted-foreground"
                >
                  Início não informado: hoje.
                </span>
              )}
            </dd>
          </div>
        )}
        {validity === null || validity.to === "" ? null : (
          <div className="flex flex-col gap-xs">
            <dt className="text-xs text-muted-foreground">Fim da validade</dt>
            <dd
              data-testid={`entity-review-valid-to-${key}`}
              className="text-sm text-foreground"
            >
              {validity.to}
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
};

export interface EntityReviewProps {
  readonly review: EntityReviewState;
}

export const EntityReview: FC<EntityReviewProps> = ({ review }) => {
  const { entries, offered, open, openReview, closeReview } = review;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else if (wasOpen.current) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!offered) return null;

  if (!open) {
    return (
      <Button
        ref={buttonRef}
        type="button"
        variant="secondary"
        className="self-start"
        onClick={openReview}
        data-testid="entity-review-button"
      >
        Revisar alterações
      </Button>
    );
  }

  const today = todayLocalDate();
  return (
    <Panel
      ref={panelRef}
      tabIndex={-1}
      title="Revisão das alterações"
      titleLevel={2}
      data-testid="entity-review"
      className="flex flex-col gap-sm"
    >
      <ul className="flex flex-col gap-md">
        {entries.map((entry) => (
          <ReviewItem key={entry.id} entry={entry} today={today} />
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={closeReview}
        data-testid="entity-review-close"
      >
        Voltar à edição
      </Button>
    </Panel>
  );
};
