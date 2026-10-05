import type {
  ReviewQueueItem,
  ItemKind,
  ResolveEntityMatchRequest,
  ResolveDisputeRequest,
  ConfirmItemRequest,
  RejectItemRequest,
  CorrectItemRequest,
} from "../../types";

export type DisputeSideId = string;

export interface DecisionPanelActions {
  readonly onResolveEntityMatch?: (body: ResolveEntityMatchRequest) => void;
  readonly onResolveDispute?: (body: ResolveDisputeRequest) => void;
  readonly onConfirm?: (body: ConfirmItemRequest) => void;
  readonly onReject?: (body: RejectItemRequest) => void;
  readonly onCorrect?: (body: CorrectItemRequest) => void;
}

export interface DecisionPanelServerError {
  readonly code: string;
  readonly message: string;
}

export interface DecisionPanelProps {
  readonly item: ReviewQueueItem;
  readonly evidenceViewed: boolean;
  readonly stale?: boolean;
  readonly onRefetch?: () => void;
  readonly serverError?: DecisionPanelServerError | null;
  readonly submitting?: boolean;
  readonly actions?: DecisionPanelActions;
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  readonly provenanceSlot?: React.ReactNode;
  readonly surface?: "ambient" | "plain";
  readonly className?: string;
}

export function itemKindOf(item: ReviewQueueItem): ItemKind {
  if (item.kind === "entity_match") {
    return "link";
  }
  return item.itemKind;
}
