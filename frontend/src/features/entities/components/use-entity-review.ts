import { useCallback, useMemo, useState } from "react";
import type { AttributeKey } from "../types";
import type {
  AttributeFieldValues,
  EntityFormValues,
} from "./entity-form-schema";
import { reviewEntriesOf, type ReviewEntry } from "./entity-review-entries";

export interface EntityReviewState {
  readonly entries: readonly ReviewEntry[];
  readonly offered: boolean;
  readonly open: boolean;
  readonly openReview: () => void;
  readonly closeReview: () => void;
}

export function useEntityReview(
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
  attributeKeys: readonly AttributeKey[],
  valueTypesAccepted: boolean,
): EntityReviewState {
  const [reviewing, setReviewing] = useState(false);
  const entries = useMemo(
    () => reviewEntriesOf(held, changed, baseline, attributeKeys),
    [held, changed, baseline, attributeKeys],
  );
  const offered = valueTypesAccepted && entries.length > 0;

  if (reviewing && !offered) setReviewing(false);

  const openReview = useCallback(() => setReviewing(true), []);
  const closeReview = useCallback(() => setReviewing(false), []);

  return {
    entries,
    offered,
    open: reviewing && offered,
    openReview,
    closeReview,
  };
}
