import { useCallback, useMemo, useState } from "react";
import type { AttributeKey, NodeAttribute } from "../types";
import type {
  AttributeFieldValues,
  EntityFormValues,
} from "./entity-form-schema";
import { reviewEntriesOf, type ReviewEntry } from "./entity-review-entries";
import { isReasonAccepted, isReasonTooLong } from "./entity-review-reason";

export interface EntityReviewState {
  readonly entries: readonly ReviewEntry[];
  readonly offered: boolean;
  readonly open: boolean;
  readonly openReview: () => void;
  readonly closeReview: () => void;
  readonly reason: string;
  readonly setReason: (reason: string) => void;
  readonly clearReason: () => void;
  readonly reasonTooLong: boolean;
  readonly saveOffered: boolean;
}

export function useEntityReview(
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
  attributeKeys: readonly AttributeKey[],
  attributes: readonly NodeAttribute[],
  valueTypesAccepted: boolean,
): EntityReviewState {
  const [reviewing, setReviewing] = useState(false);
  const [reason, setReason] = useState("");
  const entries = useMemo(
    () => reviewEntriesOf(held, changed, baseline, attributeKeys, attributes),
    [held, changed, baseline, attributeKeys, attributes],
  );
  const offered = valueTypesAccepted && entries.length > 0;

  if (reviewing && !offered) setReviewing(false);

  const openReview = useCallback(() => setReviewing(true), []);
  const closeReview = useCallback(() => setReviewing(false), []);
  const clearReason = useCallback(() => setReason(""), []);

  const open = reviewing && offered;

  return {
    entries,
    offered,
    open,
    openReview,
    closeReview,
    reason,
    setReason,
    clearReason,
    reasonTooLong: isReasonTooLong(reason),
    saveOffered: open && isReasonAccepted(reason),
  };
}
