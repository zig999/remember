/**
 * StreamingCursor — animated blinking block cursor (TC-08).
 *
 * Rendered inline at the tail of an in-flight assistant bubble while
 * `useChatTurnStore.isStreaming === true`. Indicates "more text is on the
 * way" to sighted users; screen readers ignore it (the live-region
 * semantics are owned by `aria-busy='true'` on the MessageStream root,
 * spec §8 / TC-08 constraint).
 *
 * Animation:
 *  - CSS `@keyframes cursor-blink` in `styles/theme.css` — opacity 1 → 0 → 1,
 *    ~1.1s loop. Wrapped in `@media (prefers-reduced-motion: no-preference)`
 *    via the Tailwind `motion-safe:` variant so reduced-motion users see a
 *    solid block (still visible, no blink).
 *  - We do NOT use Framer Motion here: the blink is decorative ambient
 *    motion, no entrance/exit transitions, no state-driven variants, and
 *    keyframe animation on a single property in CSS is the cheapest path
 *    (no JS WAAPI on every paint).
 *
 * Accessibility (TC-08 constraint):
 *  - `aria-hidden='true'` always. The cursor never appears in the AT tree.
 *
 * Why feature-local (not in `components/ds/`):
 *  - The cursor exists exclusively in service of the chat streaming flow;
 *    no other surface in the app has a "live caret" concept. Front.md §6.2
 *    keeps single-feature widgets in the feature folder.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";

export interface StreamingCursorProps {
  /** Optional class merge — merged via cn() (tailwind-merge + clsx). */
  readonly className?: string;
}

export const StreamingCursor: FC<StreamingCursorProps> = ({ className }) => {
  return (
    <span
      aria-hidden="true"
      data-testid="streaming-cursor"
      // `motion-safe:` => only blinks when prefers-reduced-motion: no-preference.
      // The fixed inline-block ensures the caret keeps a stable footprint as
      // surrounding text grows (no layout shift between deltas).
      className={cn(
        "ml-[1px] inline-block h-[1em] w-[0.45em] align-text-bottom bg-foreground",
        "motion-safe:[animation:cursor-blink_1.1s_ease-in-out_infinite]",
        className,
      )}
    />
  );
};
