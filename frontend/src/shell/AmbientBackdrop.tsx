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
 *  - on `error`, src is cleared so the underlying `bg-background` shows through
 *    (graceful flat-color fallback per BR-15).
 *
 * Single (dark) theme: the asset is the committed landscape photo
 * `public/backdrop/cityscape-dusk.png` (from `images/background.png`).
 */

import { useEffect, useState } from "react";

/** The committed dark landscape photo (the app is dark-only). */
const BACKDROP_SRC = "/backdrop/cityscape-dusk.png";

export function AmbientBackdrop() {
  const [src, setSrc] = useState<string>("");

  // BR-15: defer src assignment until after the initial render.
  useEffect(() => {
    let cancelled = false;
    const assign = () => {
      if (cancelled) return;
      setSrc(BACKDROP_SRC);
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
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-backdrop overflow-hidden bg-background"
      data-testid="ambient-backdrop"
    >
      {src !== "" && (
        <img
          src={src}
          alt=""
          role="presentation"
          className="h-full w-full object-cover object-center opacity-60"
          onError={() => setSrc("")}
        />
      )}
    </div>
  );
}
