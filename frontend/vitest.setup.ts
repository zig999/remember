// Vitest setup — global test shims.
// MSW handlers, jest-dom matchers, etc. register here in later waves.

// Radix UI primitives (Select, Dropdown, …) call DOM APIs that jsdom does not
// implement. Stub them so portalled / pointer-driven components mount and open
// in unit tests (real-browser behaviour is covered by Storybook browser mode).
// Harmless no-ops everywhere else.
const proto = globalThis.Element?.prototype as
  | (Element & {
      hasPointerCapture?: (id: number) => boolean;
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
      scrollIntoView?: () => void;
    })
  | undefined;
if (proto) {
  if (typeof proto.hasPointerCapture !== "function") {
    proto.hasPointerCapture = () => false;
  }
  if (typeof proto.setPointerCapture !== "function") {
    proto.setPointerCapture = () => {};
  }
  if (typeof proto.releasePointerCapture !== "function") {
    proto.releasePointerCapture = () => {};
  }
  if (typeof proto.scrollIntoView !== "function") {
    proto.scrollIntoView = () => {};
  }
}

export {};
