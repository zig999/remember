import type { SelectedItemKind } from "../../state/curation-store";

export interface CurationDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly kind: SelectedItemKind;
  readonly itemId: string;
  readonly itemLabel?: string;
}
