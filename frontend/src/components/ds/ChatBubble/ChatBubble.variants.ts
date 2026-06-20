/**
 * ChatBubble — CVA factory (TC-05, spec §6).
 *
 * Two visual variants on a single axis (`variant: user | assistant`):
 *  - `user`      — self-end alignment + assertive content-foreground text.
 *                  Right-anchored bubble; max-width caps prevent the bubble
 *                  from spanning the whole pane on wide viewports (CLAUDE.md
 *                  "text-containers have max-width" rule).
 *  - `assistant` — self-start alignment + standard body text + max-width that
 *                  matches the prose typography contract (≤ 75ch per
 *                  u-fe-standards visual rules).
 *
 * The bubble surface is rendered by `GlassSurface` (level='modal'); CVA here
 * controls the WRAPPER only (alignment + max-width). Glass classes are NOT
 * duplicated here — that would fight the v4 dual-namespace border rule
 * (CLAUDE.md "Known Gotchas").
 */
import { cva, type VariantProps } from "class-variance-authority";

export const chatBubble = cva(
  // Base: column layout (chips above text, notice below), prose max-width
  // cap (CLAUDE.md spacing tokens), gentle vertical breathing room.
  "flex flex-col gap-xs max-w-[75ch]",
  {
    variants: {
      variant: {
        // §6 user — self-end (right-aligned within a flex container).
        user: "self-end items-end text-right",
        // §6 assistant — self-start (left-aligned within a flex container).
        assistant: "self-start items-start text-left",
      },
    },
    defaultVariants: {
      variant: "assistant",
    },
  },
);

export type ChatBubbleVariants = VariantProps<typeof chatBubble>;
