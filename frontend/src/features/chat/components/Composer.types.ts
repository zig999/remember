import type { CSSProperties } from "react";

export interface ComposerProps {
  readonly conversationId: string;
  readonly isArchived: boolean;
  readonly onUnarchive: () => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}
