import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * cn — Tailwind-aware className merger (front.md §6.4, BR-11).
 * Required by every shared component; replaces string concatenation.
 *
 * Tailwind v4 CSS-first config note: `tailwind-merge` ships built-in conflict
 * groups for v3's default scale only. Our project tokens (declared in
 * `styles/theme.css` via `@theme`) extend that scale — `rounded-pill`,
 * `text-xs`/`text-xs`/etc., the `p-{xs|sm|md|lg|xl|2xl}` spacing
 * tokens — are unknown to the default merger and either silently dropped
 * (when they collide with a built-in like `text-<color>`) or fail to be
 * overridden (when a consumer passes a built-in like `rounded-md`).
 *
 * Source of truth for the extension is `styles/theme.css` §1 + §3
 * (radius / spacing / typography) and `design-system/tokens.md §8 / §4 / §5`.
 * Keep this list in lock-step with theme.css — a token added there MUST
 * be added here too, otherwise consumer overrides will silently break.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // tokens.md §8 — radius scale (5 tokens, includes `pill`).
      rounded: [{ rounded: ["sm", "md", "lg", "xl", "pill"] }],

      // tokens.md §5 — typography scale (8 tokens). Separating font-size into
      // its own group prevents collision with `text-<color>` utilities
      // (e.g. `text-state-accepted-fg`).
      "font-size": [
        {
          text: [
            "display",
            "heading",
            "subheading",
            "body-lg",
            "body-sm",
            "label",
            "caption",
            "code",
          ],
        },
      ],

      // tokens.md §4 — 4-pt spacing grid (6 tokens). Built-in `p-*` accepts
      // arbitrary suffixes BUT our custom names (`xs`, `sm`, `md`, `lg`,
      // `xl`, `2xl`) must be enumerated so tailwind-merge recognises them
      // as members of the spacing groups and resolves conflicts correctly.
      p: [{ p: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      px: [{ px: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      py: [{ py: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      pt: [{ pt: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      pb: [{ pb: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      pl: [{ pl: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      pr: [{ pr: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      m: [{ m: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      mx: [{ mx: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      my: [{ my: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      mt: [{ mt: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      mb: [{ mb: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      ml: [{ ml: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      mr: [{ mr: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      gap: [{ gap: ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      "gap-x": [{ "gap-x": ["xs", "sm", "md", "lg", "xl", "2xl"] }],
      "gap-y": [{ "gap-y": ["xs", "sm", "md", "lg", "xl", "2xl"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
