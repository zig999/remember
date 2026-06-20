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
export { ToolCallChip } from "./ToolCallChip";
export type { ToolCallChipProps } from "./ToolCallChip/ToolCallChip.types";
export { UsageBadge } from "./UsageBadge";
export type { UsageBadgeProps } from "./UsageBadge/UsageBadge.types";
