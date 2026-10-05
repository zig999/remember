import { useEffect, useState } from "react";

const BACKDROP_SRC = "/backdrop/cityscape-dusk.png";

export function AmbientBackdrop() {
  const [src, setSrc] = useState<string>("");

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
