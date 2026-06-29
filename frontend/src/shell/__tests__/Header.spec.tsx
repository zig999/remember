/**
 * Header — TC-02 conditional mount of ConversationMenu.
 *
 * Validation criteria (tc-002.md):
 *   - On `/chat` route: ConversationMenu (via HeaderConversationMenu) is in DOM.
 *   - On any other route: it is absent.
 *   - The `?conversation=<id>` URL search param flows into the menu's
 *     `activeConversationId` prop.
 *   - Nested chat paths (e.g. `/chat/foo`) also count.
 *   - Non-string `?conversation` values are ignored (URL guard).
 *
 * Render pattern: `createRoot` + `act` from `react-dom/client` — matches the
 * project's existing component-spec style (see ConversationMenu.spec.tsx).
 * We stub `HeaderConversationMenu` so we don't have to bring the chat data
 * layer + Radix portals into this Header-focused test; the adapter itself
 * is covered by HeaderConversationMenu.spec.tsx.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement, ReactNode } from "react";

// ---- mocks ---------------------------------------------------------------

const useLocationMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useLocation: (opts?: {
    select?: (l: { pathname: string; search: Record<string, unknown> }) => unknown;
  }) => {
    const loc = useLocationMock();
    return opts?.select ? opts.select(loc) : loc;
  },
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children?: ReactNode } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const hcmPropsSpy = vi.fn();
vi.mock("../HeaderConversationMenu", () => ({
  HeaderConversationMenu: (props: {
    activeConversationId: string | undefined;
    className?: string;
  }) => {
    hcmPropsSpy(props);
    return (
      <div
        data-testid="hcm"
        data-active-id={String(props.activeConversationId)}
      />
    );
  },
}));

// Stub Zustand stores — selector-style API matching the real ones.
vi.mock("../../state/command-palette", () => ({
  useCommandPaletteStore: (
    selector: (s: { toggle: () => void }) => unknown,
  ) => selector({ toggle: () => undefined }),
}));

// ---- SUT (imported after mocks) -----------------------------------------
import { Header } from "../Header";

// ---- harness -------------------------------------------------------------

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useLocationMock.mockReset();
  hcmPropsSpy.mockReset();
});

function render(el: ReactElement): void {
  act(() => root.render(el));
}

// ---- tests ---------------------------------------------------------------

describe("Header — ConversationMenu conditional mount (TC-02)", () => {
  it("does NOT render ConversationMenu on a non-chat route", () => {
    useLocationMock.mockReturnValue({ pathname: "/graph", search: {} });
    render(<Header />);
    expect(container.querySelector("[data-testid='hcm']")).toBeNull();
    expect(hcmPropsSpy).not.toHaveBeenCalled();
  });

  it("renders ConversationMenu on `/chat` with undefined active id when no search param", () => {
    useLocationMock.mockReturnValue({ pathname: "/chat", search: {} });
    render(<Header />);
    expect(container.querySelector("[data-testid='hcm']")).not.toBeNull();
    expect(hcmPropsSpy).toHaveBeenCalled();
    expect(hcmPropsSpy.mock.calls[0]?.[0].activeConversationId).toBeUndefined();
  });

  it("passes `?conversation=<id>` from the URL into `activeConversationId`", () => {
    useLocationMock.mockReturnValue({
      pathname: "/chat",
      search: { conversation: "conv-42" },
    });
    render(<Header />);
    expect(
      container.querySelector("[data-testid='hcm']")?.getAttribute("data-active-id"),
    ).toBe("conv-42");
    expect(hcmPropsSpy.mock.calls[0]?.[0].activeConversationId).toBe("conv-42");
  });

  it("ignores a non-string `conversation` search value (URL guard)", () => {
    useLocationMock.mockReturnValue({
      pathname: "/chat",
      search: { conversation: 123 },
    });
    render(<Header />);
    expect(hcmPropsSpy.mock.calls[0]?.[0].activeConversationId).toBeUndefined();
  });

  it("also matches nested chat paths (e.g. `/chat/anything`)", () => {
    useLocationMock.mockReturnValue({
      pathname: "/chat/foo",
      search: {},
    });
    render(<Header />);
    expect(container.querySelector("[data-testid='hcm']")).not.toBeNull();
  });

  it("keeps the primary NAV tabs visible on /chat (no regression to existing Header structure)", () => {
    useLocationMock.mockReturnValue({ pathname: "/chat", search: {} });
    render(<Header />);
    // 5 areas per NAV in Header.tsx
    expect(container.querySelectorAll("nav a").length).toBe(5);
  });
});
