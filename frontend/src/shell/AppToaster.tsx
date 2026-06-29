/**
 * AppToaster — the single sonner <Toaster> mount, styled as a glass panel.
 *
 * Spec references:
 *  - front.back.md BR-12 (single <Toaster> mounted at __root)
 *  - design-system/tokens.md §9 (glass surface material) + GlassSurface COMP-02
 *
 * Goal: the toast surface must equal a GlassSurface `level="panel"` —
 * translucent bg + frosted blur + glass border + 14px radius + the panel
 * shadow.
 *
 * CASCADE-LAYER GOTCHA (why we DON'T just apply the `bg-surface-glass-*`
 * classes): Tailwind v4 utilities live in `@layer utilities`, but sonner ships
 * its base toast styles UNLAYERED (`:where([data-sonner-toast][data-styled]) {
 * background; border; box-shadow; border-radius }`, see
 * node_modules/sonner/dist/styles.css). In the CSS cascade, an unlayered
 * declaration beats a layered one regardless of specificity — so sonner's white
 * `background` silently wins over a `bg-surface-glass-panel` utility. (Plain
 * GlassSurface divs work because nothing unlayered competes there.)
 *
 * So we work WITH sonner instead of against it:
 *  - bg / border / text / radius: sonner paints these from its own (unlayered)
 *    vars, so we point those vars at the GlassSurface panel tokens. The vars are
 *    set on the toaster container and cascade to each toast.
 *  - box-shadow: also unlayered in sonner → override it via INLINE style (inline
 *    beats unlayered). The measured panel shadow is --shadow-md (tailwind-merge
 *    drops shadow-glass from the CVA, so --shadow-md is the real rendered value).
 *  - backdrop blur: sonner sets no backdrop-filter, so the layered utility class
 *    applies unopposed.
 *
 * `z-toast` (60) keeps the stack above the frame (z-frame = 40).
 *
 * POSITION: top-right, but offset BELOW the fixed header (h-12 = 3rem) so toasts
 * open inside the workspace area (between header and footer), not flush against
 * the viewport top where they'd overlap the header. The top offset mirrors the
 * workspace's `pt-12` reserve; `--spacing-md` adds the gap below the header.
 *
 * THEME-COLLISION GOTCHA: sonner writes `data-theme={theme}` on its own
 * container (the `theme` prop, default "light"). Our design system ALSO uses
 * `data-theme` on `<html>` as the single token-switch surface (front.md §8 /
 * BR-14). Since the toaster portals to <body>, its own `data-theme` becomes the
 * nearest one for the toasts — so sonner's default "light" would force LIGHT
 * glass tokens (a near-white panel over the dark backdrop). The app is
 * dark-only, so we pin sonner's theme to `"dark"` to match our single theme.
 */
import { Toaster } from "sonner";
import type { CSSProperties } from "react";

/** sonner's unlayered theming vars → GlassSurface panel tokens. */
const glassVars = {
  "--normal-bg": "var(--color-surface-glass-panel)",
  "--normal-border": "var(--color-border-glass)",
  "--normal-text": "var(--color-content)",
  "--border-radius": "var(--radius-lg)",
} as CSSProperties;

export function AppToaster() {
  return (
    <Toaster
      // Dark-only app: pin sonner's data-theme to match (see header note).
      theme="dark"
      position="top-right"
      // Always-expanded stack: every toast stays fully visible (never collapsed
      // behind the front one). A new toast pushes the existing ones DOWN to make
      // room, then drops into the top slot with the scripted entrance (theme.css
      // → toast-drop-in). Sonner positions expanded toasts with pure translateY,
      // which composes cleanly with our right-anchored entrance (no scale, so the
      // entrance's transform-origin:right never perturbs stacking).
      expand
      // Start below the fixed header (h-12 = 3rem) + a gap; right gap from edge.
      offset={{ top: "calc(3rem + var(--spacing-md))", right: "var(--spacing-lg)" }}
      mobileOffset={{
        top: "calc(3rem + var(--spacing-md))",
        right: "var(--spacing-md)",
        left: "var(--spacing-md)",
      }}
      closeButton
      style={glassVars}
      toastOptions={{
        // Inline beats sonner's unlayered rules (same cascade-layer reason as the
        // surface). box-shadow → the panel shadow. Typography → the app's body
        // type system: Space Mono (--font-mono is the body font; --font-sans is
        // headings-only), body size + zero tracking. Set on the toast root so it
        // cascades to the title/description slots (sonner otherwise renders the
        // text in ui-sans-serif at its own size).
        style: {
          boxShadow: "var(--shadow-md)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-body-lg)",
          letterSpacing: "0",
        },
        // backdrop-filter has no sonner rule → the layered utility applies.
        classNames: { toast: "backdrop-blur-glass-md z-toast" },
      }}
    />
  );
}
