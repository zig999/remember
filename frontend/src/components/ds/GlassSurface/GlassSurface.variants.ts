/**
 * GlassSurface — CVA factory (COMP-02, spec §10.1).
 *
 * Tailwind v4 dual-namespace pattern (spec §10, `tokens.md §7.2`,
 * CLAUDE.md "Known Gotchas"):
 *  - `border-color-*` (color) and `--border-*` (width) live in separate
 *    namespaces; if either half is missing the rendered border collapses to
 *    0 with no error.
 *  - The BASE class set MUST therefore always emit BOTH halves —
 *    `border` (width) + `border-border-glass` (color).
 *  - Accent variants REPLACE only the color half — the width class `border`
 *    stays present in every accent.
 *  - Accent `none` is the empty string so the default `border-border-glass`
 *    survives unchanged.
 *
 * Per-level shadow / blur / radius / background composition is the
 * canonical mapping from `GlassSurface.component.spec.md §6.1–§6.3` and
 * `tokens.md §9`.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const glassSurface = cva(
  // ALWAYS emit BOTH halves: width ("border") + color ("border-border-glass").
  // Missing either half makes the edge silently disappear in Tailwind v4.
  "border border-border-glass",
  {
    variants: {
      level: {
        // spec §6.1 — ambient: thin frame, no radius, no top-edge highlight.
        ambient:
          "bg-surface-glass-ambient backdrop-blur-glass-sm shadow-sm rounded-none",
        // spec §6.2 — panel: workhorse, glass shadow stack, 14 px radius.
        panel:
          "bg-surface-glass-panel backdrop-blur-glass-md shadow-md shadow-glass rounded-lg",
        // spec §6.3 — modal: heaviest, deep shadow, 20 px radius.
        modal:
          "bg-surface-glass-modal backdrop-blur-glass-lg shadow-lg shadow-glass rounded-xl",
      },
      accent: {
        // spec §6.4 — accent="none" keeps the default border-border-glass.
        // Empty string is critical: anything else (even "border-border-glass")
        // would put the color class in BOTH the base AND the variant, which
        // tailwind-merge does NOT deduplicate to a single emission and would
        // make consumer className overrides unpredictable.
        none: "",
        accepted: "border-border-accepted",
        uncertain: "border-border-uncertain",
        disputed: "border-border-disputed",
        superseded: "border-border-superseded",
        // spec §6.4 — focus accent ALSO adds an inner ring (composition).
        focus: "border-border-focus ring-2 ring-border-focus",
        error: "border-border-error",
      },
    },
    defaultVariants: {
      level: "panel",
      accent: "none",
    },
  },
);

export type GlassSurfaceVariants = VariantProps<typeof glassSurface>;
