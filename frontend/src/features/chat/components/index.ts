/**
 * Chat feature components — public surface barrel.
 *
 * Feature-local re-exports for the chat feature's components. Per CLAUDE.md
 * "Conventions": features may export their own components from a feature-local
 * barrel; cross-feature imports must go through the chat feature's root, not
 * sibling features.
 */
export { ChatWorkspace } from "./ChatWorkspace";
export { ConversationView } from "./ConversationView";
export { Composer } from "./Composer";
export type { ComposerProps } from "./Composer.types";
export { MessageStream } from "./MessageStream";
export type { MessageStreamProps } from "./MessageStream";
export { StreamingCursor } from "./StreamingCursor";
export type { StreamingCursorProps } from "./StreamingCursor";
// TC-10 will add ToolCallChip and UsageBadge to this barrel.
