/**
 * AmbientBackdrop — z-1 landscape photo behind the 3-region frame.
 *
 * Spec references:
 *  - front.md §2.3 (ambient backdrop strict rules)
 *  - front.back.md BR-15 (lazy-loaded out of LCP; preload via
 *    requestIdleCallback; graceful flat-color fallback)
 *  - design-system/tokens.md §10 (backdrop treatment chain)
 *
 * Contract:
 *  - position fixed, inset-0, z-backdrop (-1)
 *  - <img> with object-fit cover, object-position center, alt="", role="presentation"
 *  - the image src is empty until after the first paint — BR-15 forbids it
 *    from counting against the LCP budget. The `<link rel="preload">` in
 *    `index.html` already warms the asset; we then swap `src` on the next
 *    `requestIdleCallback` (or `setTimeout(0)` fallback).
 *  - on `error`, src is cleared so the underlying `bg-primary` shows through
 *    (graceful flat-color fallback per BR-15).
 *
 * Theme: the asset chosen depends on the active `data-theme` attribute on
 * `<html>`. The component observes the attribute via a MutationObserver so
 * a theme toggle swaps the asset without a route remount.
 */

import { useEffect, useState } from "react";

/** Per-theme asset map (placeholder names per front.md §8.2). */
const BACKDROP_BY_THEME: Record<string, string> = {
  dark: "/backdrop/dusk.jpg",
  light: "/backdrop/dawn.jpg",
};

function currentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function AmbientBackdrop() {
  const [src, setSrc] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">(() => currentTheme());

  // BR-15: defer src assignment until after the initial render.
  useEffect(() => {
    let cancelled = false;
    const assign = () => {
      if (cancelled) return;
      const href = BACKDROP_BY_THEME[theme];
      if (href !== undefined) setSrc(href);
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
    }).requestIdleCallback;
    if (typeof ric === "function") {
      ric(assign);
    } else {
      const timer = window.setTimeout(assign, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [theme]);

  // Observe <html data-theme> so the asset follows the active theme.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      const next = currentTheme();
      setTheme((prev) => (prev === next ? prev : next));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-backdrop overflow-hidden bg-primary"
      data-testid="ambient-backdrop"
    >
      {src !== "" && (
        <img
          src={src}
          alt=""
          role="presentation"
          className="h-full w-full object-cover object-center"
          onError={() => setSrc("")}
        />
      )}
    </div>
  );
}
