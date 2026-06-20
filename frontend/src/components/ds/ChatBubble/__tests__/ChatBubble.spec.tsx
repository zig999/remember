/**
 * ChatBubble — unit tests (TC-05).
 *
 * Why these tests exist (Golden Rule 9):
 *
 *  - The bubble is the visible surface of every chat message. The spec §4
 *    state matrix (idle / streaming / error / stopped / entering) is the
 *    contract the chat feature relies on; silent regressions here surface
 *    as user-visible bugs (cursor stuck, error border missing, "Resposta
 *    interrompida" not appearing). Each state has at least one test.
 *
 *  - The accessibility contract (§9) is the most subtle: `aria-busy='true'`
 *    MUST appear when streaming and DISAPPEAR when streaming ends — leaving
 *    it stuck breaks AT live-region semantics. The streaming cursor MUST
 *    carry `aria-hidden='true'` so the glyph is not announced. We pin both.
 *
 *  - The "ChatBubble is at z-base, NOT z-modal" constraint is invisible
 *    until something else stacks on top and a modal-tier bubble eats the
 *    overlay. We assert no `z-modal` class leaks from the atom's defaults.
 *
 *  - The stop-reason table (§4 stopped) is exact-copy: `cancelled` →
 *    "Resposta interrompida"; anything else → no notice. We test both
 *    branches and an unknown reason to lock the table-driven behaviour.
 *
 *  - The entrance-motion source is constrained by spec: "transitionGlassModal
 *    from lib/motion.ts — no inline variants". We mock `useReducedMotion`
 *    and assert (a) `animate=true` + motion allowed surfaces the
 *    `data-motion-source='transitionGlassModal'` marker AND the inner glass
 *    plays `data-motion-variant='glass-modal'`; (b) `animate=false` and
 *    reduced-motion both silence the motion contract.
 *
 *  - The React 19 ref-as-prop contract (spec §10) silently regresses if
 *    someone wraps in `forwardRef`. Asserting `ref.current` is the wrapper
 *    `<div>` (NOT the inner GlassSurface) pins the contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, useRef, useEffect, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChatBubble } from "../ChatBubble";
import type { ToolCallData } from "@/features/chat/types";

/* ---------- minimal render harness (no @testing-library/react needed) ---- */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

function render(element: ReactElement): void {
  act(() => {
    root.render(element);
  });
}

function getBubble(): HTMLDivElement {
  const el = container.querySelector("div[data-variant]");
  if (!el) throw new Error("ChatBubble root <div> not found");
  return el as HTMLDivElement;
}

function getGlass(): HTMLDivElement {
  // GlassSurface emits data-level on the glass div.
  const el = container.querySelector("div[data-level]");
  if (!el) throw new Error("GlassSurface inner <div> not found");
  return el as HTMLDivElement;
}

/* ---------- framer-motion useReducedMotion() mock ----------------------- */
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

import { useReducedMotion } from "framer-motion";
const useReducedMotionMock = vi.mocked(useReducedMotion);

beforeEach(() => {
  useReducedMotionMock.mockReturnValue(false);
});

/* ====================================================================== */
/*  §6 — Variants (alignment + role mapping)                              */
/* ====================================================================== */

describe("ChatBubble — variants (§6)", () => {
  it("variant='user' aligns to the right (self-end + text-right)", () => {
    render(<ChatBubble variant="user" content="oi" />);
    const el = getBubble();
    expect(el.getAttribute("data-variant")).toBe("user");
    expect(el.classList.contains("self-end")).toBe(true);
    expect(el.classList.contains("items-end")).toBe(true);
    expect(el.classList.contains("text-right")).toBe(true);
  });

  it("variant='assistant' aligns to the left (self-start + text-left)", () => {
    render(<ChatBubble variant="assistant" content="resposta" />);
    const el = getBubble();
    expect(el.getAttribute("data-variant")).toBe("assistant");
    expect(el.classList.contains("self-start")).toBe(true);
    expect(el.classList.contains("items-start")).toBe(true);
    expect(el.classList.contains("text-left")).toBe(true);
  });

  it("renders the message content verbatim (no markdown/escape mangling)", () => {
    render(<ChatBubble variant="assistant" content="linha 1\nlinha 2" />);
    const el = container.querySelector('[data-testid="bubble-content"]');
    expect(el?.textContent).toContain("linha 1");
  });

  it("uses GlassSurface level='modal' (heaviest tier, spec §4 entering visual)", () => {
    render(<ChatBubble variant="assistant" content="x" />);
    expect(getGlass().getAttribute("data-level")).toBe("modal");
  });
});

/* ====================================================================== */
/*  §4 — State: idle (history bubble, no streaming, no error, no notice)   */
/* ====================================================================== */

describe("ChatBubble — state=idle (§4)", () => {
  it("data-state='idle' when streaming=false + error=false + no stopReason", () => {
    render(<ChatBubble variant="assistant" content="ok" />);
    expect(getBubble().getAttribute("data-state")).toBe("idle");
  });

  it("does NOT render the streaming cursor", () => {
    render(<ChatBubble variant="assistant" content="ok" />);
    expect(container.querySelector('[data-testid="streaming-cursor"]')).toBeNull();
  });

  it("does NOT render a stop-reason notice", () => {
    render(<ChatBubble variant="assistant" content="ok" />);
    expect(container.querySelector('[data-testid="stop-notice"]')).toBeNull();
  });

  it("does NOT carry aria-busy", () => {
    render(<ChatBubble variant="assistant" content="ok" />);
    expect(getBubble().getAttribute("aria-busy")).toBeNull();
  });

  it("uses GlassSurface accent='none' (default border) when no error", () => {
    render(<ChatBubble variant="assistant" content="ok" />);
    expect(getGlass().getAttribute("data-accent")).toBe("none");
  });
});

/* ====================================================================== */
/*  §4 — State: streaming                                                  */
/* ====================================================================== */

describe("ChatBubble — state=streaming (§4)", () => {
  it("data-state='streaming' when streaming=true", () => {
    render(<ChatBubble variant="assistant" content="ainda " streaming />);
    expect(getBubble().getAttribute("data-state")).toBe("streaming");
  });

  it("sets aria-busy='true' (live-region semantics, §9)", () => {
    render(<ChatBubble variant="assistant" content="x" streaming />);
    expect(getBubble().getAttribute("aria-busy")).toBe("true");
  });

  it("renders the streaming cursor with aria-hidden='true'", () => {
    render(<ChatBubble variant="assistant" content="x" streaming />);
    const cursor = container.querySelector('[data-testid="streaming-cursor"]');
    expect(cursor).not.toBeNull();
    expect(cursor?.getAttribute("aria-hidden")).toBe("true");
  });

  it("aria-busy disappears when streaming flips to false (no stuck live region)", () => {
    render(<ChatBubble variant="assistant" content="x" streaming />);
    expect(getBubble().getAttribute("aria-busy")).toBe("true");
    render(<ChatBubble variant="assistant" content="x" streaming={false} />);
    expect(getBubble().getAttribute("aria-busy")).toBeNull();
    expect(
      container.querySelector('[data-testid="streaming-cursor"]'),
    ).toBeNull();
  });
});

/* ====================================================================== */
/*  §4 — State: error                                                      */
/* ====================================================================== */

describe("ChatBubble — state=error (§4)", () => {
  it("data-state='error' when error=true", () => {
    render(<ChatBubble variant="assistant" content="falhou" error />);
    expect(getBubble().getAttribute("data-state")).toBe("error");
  });

  it("forwards accent='error' to GlassSurface (red border via border-border-error)", () => {
    render(<ChatBubble variant="assistant" content="falhou" error />);
    const glass = getGlass();
    expect(glass.getAttribute("data-accent")).toBe("error");
    // The accent class is applied by GlassSurface's CVA — pin the
    // dual-namespace pair (CLAUDE.md Tailwind v4 gotcha).
    expect(glass.classList.contains("border")).toBe(true);
    expect(glass.classList.contains("border-border-error")).toBe(true);
  });

  it("error wins over streaming in the visual state machine", () => {
    render(<ChatBubble variant="assistant" content="x" error streaming />);
    // data-state is error (priority: error > streaming > stopped > idle).
    expect(getBubble().getAttribute("data-state")).toBe("error");
  });
});

/* ====================================================================== */
/*  §4 — State: stopped                                                    */
/* ====================================================================== */

describe("ChatBubble — state=stopped (§4)", () => {
  it("stopReason='cancelled' renders the EXACT notice 'Resposta interrompida'", () => {
    render(
      <ChatBubble
        variant="assistant"
        content="parcial"
        stopReason="cancelled"
      />,
    );
    const notice = container.querySelector('[data-testid="stop-notice"]');
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toBe("Resposta interrompida");
    expect(getBubble().getAttribute("data-state")).toBe("stopped");
  });

  it("stopReason='end_turn' renders NO notice (normal completion)", () => {
    render(
      <ChatBubble
        variant="assistant"
        content="terminou"
        stopReason="end_turn"
      />,
    );
    expect(container.querySelector('[data-testid="stop-notice"]')).toBeNull();
    expect(getBubble().getAttribute("data-state")).toBe("idle");
  });

  it("stopReason='max_tokens' renders NO notice (table-driven)", () => {
    render(
      <ChatBubble
        variant="assistant"
        content="..."
        stopReason="max_tokens"
      />,
    );
    expect(container.querySelector('[data-testid="stop-notice"]')).toBeNull();
  });

  it("unknown stopReason renders NO notice (silent default)", () => {
    render(
      <ChatBubble
        variant="assistant"
        content="..."
        stopReason="some_unknown_reason"
      />,
    );
    expect(container.querySelector('[data-testid="stop-notice"]')).toBeNull();
  });
});

/* ====================================================================== */
/*  §4 — State: entering (motion contract)                                 */
/* ====================================================================== */

describe("ChatBubble — state=entering / motion contract (§4)", () => {
  it("animate=true (default) + motion allowed → inner glass plays glass-modal variant", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<ChatBubble variant="assistant" content="x" />);
    expect(getGlass().getAttribute("data-motion-variant")).toBe("glass-modal");
  });

  it("animate=true surfaces the data-motion-source='transitionGlassModal' marker", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<ChatBubble variant="assistant" content="x" animate />);
    expect(getGlass().getAttribute("data-motion-source")).toBe(
      "transitionGlassModal",
    );
  });

  it("animate=false silences the motion contract (no variant on inner glass)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<ChatBubble variant="assistant" content="x" animate={false} />);
    expect(getGlass().getAttribute("data-motion-variant")).toBeNull();
    expect(getGlass().getAttribute("data-motion-source")).toBeNull();
  });

  it("prefers-reduced-motion=reduce wins over animate=true (BR-10)", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<ChatBubble variant="assistant" content="x" animate />);
    expect(getGlass().getAttribute("data-motion-variant")).toBeNull();
    expect(getGlass().getAttribute("data-motion-source")).toBeNull();
  });
});

/* ====================================================================== */
/*  Tool-chips slot                                                        */
/* ====================================================================== */

describe("ChatBubble — toolChips slot", () => {
  const CHIPS_OK: ReadonlyArray<ToolCallData> = [
    { tool: "search", argsSummary: "q=Rodrigo", ok: true },
    { tool: "get_node", argsSummary: "id=…", ok: true },
  ];

  it("renders one chip per ToolCallData entry, above the message text", () => {
    render(
      <ChatBubble variant="assistant" content="x" toolChips={CHIPS_OK} />,
    );
    const chips = container.querySelectorAll('[data-testid="tool-chip-stub"]');
    expect(chips.length).toBe(2);
    expect(chips[0].getAttribute("data-tool")).toBe("search");
    expect(chips[0].getAttribute("data-ok")).toBe("ok");
    expect(chips[1].getAttribute("data-tool")).toBe("get_node");
  });

  it("ok=null chip renders as pending", () => {
    const chips: ReadonlyArray<ToolCallData> = [
      { tool: "search", argsSummary: "...", ok: null },
    ];
    render(<ChatBubble variant="assistant" content="x" toolChips={chips} />);
    const chip = container.querySelector('[data-testid="tool-chip-stub"]');
    expect(chip?.getAttribute("data-ok")).toBe("pending");
  });

  it("ok=false chip renders as error", () => {
    const chips: ReadonlyArray<ToolCallData> = [
      { tool: "broken", argsSummary: "...", ok: false },
    ];
    render(<ChatBubble variant="assistant" content="x" toolChips={chips} />);
    const chip = container.querySelector('[data-testid="tool-chip-stub"]');
    expect(chip?.getAttribute("data-ok")).toBe("error");
  });

  it("empty toolChips=[] renders NO chip container (no empty <div> noise)", () => {
    render(<ChatBubble variant="assistant" content="x" toolChips={[]} />);
    expect(container.querySelector('[data-testid="tool-chips"]')).toBeNull();
  });

  it("undefined toolChips renders NO chip container", () => {
    render(<ChatBubble variant="assistant" content="x" />);
    expect(container.querySelector('[data-testid="tool-chips"]')).toBeNull();
  });
});

/* ====================================================================== */
/*  Constraint: z-base (NEVER z-modal) — spec constraint table             */
/* ====================================================================== */

describe("ChatBubble — z-index constraint (z-base, NEVER z-modal)", () => {
  it("does NOT emit z-modal on either the wrapper or the inner glass", () => {
    render(<ChatBubble variant="assistant" content="x" />);
    expect(getBubble().classList.contains("z-modal")).toBe(false);
    expect(getGlass().classList.contains("z-modal")).toBe(false);
  });

  it("does NOT set role='dialog' on the wrapper (bubble is NOT an ARIA modal)", () => {
    render(<ChatBubble variant="assistant" content="x" />);
    expect(getBubble().getAttribute("role")).not.toBe("dialog");
  });

  it("does NOT set tabIndex on the wrapper (no focus trap)", () => {
    render(<ChatBubble variant="assistant" content="x" />);
    expect(getBubble().getAttribute("tabindex")).toBeNull();
  });
});

/* ====================================================================== */
/*  className merge contract (§3, cn())                                    */
/* ====================================================================== */

describe("ChatBubble — className merge (cn())", () => {
  it("consumer className is additive (alignment + max-width survive)", () => {
    render(
      <ChatBubble
        variant="user"
        content="x"
        className="my-custom-class p-lg"
      />,
    );
    const el = getBubble();
    // Consumer additions present.
    expect(el.classList.contains("my-custom-class")).toBe(true);
    expect(el.classList.contains("p-lg")).toBe(true);
    // Variant base preserved.
    expect(el.classList.contains("self-end")).toBe(true);
  });
});

/* ====================================================================== */
/*  React 19 ref-as-prop (spec §10)                                        */
/* ====================================================================== */

describe("ChatBubble — React 19 ref-as-prop", () => {
  it("ref.current is the wrapper <div> (NOT the inner GlassSurface)", () => {
    let captured: HTMLDivElement | null = null;

    function Consumer(): ReactElement {
      const r = useRef<HTMLDivElement>(null);
      useEffect(() => {
        captured = r.current;
      }, []);
      return <ChatBubble variant="assistant" content="x" ref={r} />;
    }

    render(<Consumer />);

    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("DIV");
    // Wrapper has data-variant; inner glass has data-level. Pinning the
    // wrapper makes sure the ref did not leak through to the glass.
    expect(captured!.getAttribute("data-variant")).toBe("assistant");
    expect(captured!.getAttribute("data-level")).toBeNull();
  });
});

/* ====================================================================== */
/*  Props pass-through (id, data-*, onClick)                               */
/* ====================================================================== */

describe("ChatBubble — props pass-through", () => {
  it("spreads ...rest onto the wrapper <div> (id + data-testid preserved)", () => {
    render(
      <ChatBubble
        variant="assistant"
        content="x"
        id="bubble-42"
        data-testid="my-bubble"
      />,
    );
    const el = getBubble();
    expect(el.id).toBe("bubble-42");
    expect(el.getAttribute("data-testid")).toBe("my-bubble");
  });
});
