import type { CorrectItemRequest, ItemKind, ValidFromSource } from "../../types";

export interface CorrectionFormDefaults {
  readonly value?: string | null;
  readonly targetNodeId?: string | null;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly validFromSource?: ValidFromSource;
  readonly validFromFragmentId?: string | null;
}

export interface CorrectionFormProps {
  readonly itemKind: ItemKind;
  readonly itemId: string;
  readonly defaults: CorrectionFormDefaults;
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  readonly onSubmit: (body: CorrectItemRequest) => void;
  readonly onCancel: () => void;
  readonly submitting?: boolean;
  readonly serverError?: { readonly code: string; readonly message: string } | null;
  readonly className?: string;
}
