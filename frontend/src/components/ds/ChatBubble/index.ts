/**
 * ChatBubble — public surface (front.md §6.4, per-component index.ts allowed).
 * Re-exports only this component's public surface (stack exception to the
 * generic no-barrel rule).
 */
export { ChatBubble } from "./ChatBubble";
export { chatBubble } from "./ChatBubble.variants";
export type { ChatBubbleVariants } from "./ChatBubble.variants";
export type { ChatBubbleProps, ChatBubbleVariant } from "./ChatBubble.types";
