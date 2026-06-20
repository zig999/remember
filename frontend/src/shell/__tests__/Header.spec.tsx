/**
 * Header — TC-02 conditional mount of ConversationMenu.
 *
 * Validation criteria (tc-002.md):
 *   - On `/chat` route: ConversationMenu is visible in Header.
 *   - On any other route: ConversationMenu is absent.
 *   - The `?conversation=<id>` URL search param flows into the menu's
 *     `activeConversationId` prop.
 *
 * Approach: stub `HeaderConversationMenu` so we don't have to mount the
 * chat data layer / Radix portals — we only need to assert WHEN it is
 * rendered and WHAT props it received. `useLocation` is stubbed per test
 * to flip the route under inspection.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";

// ---- mocks --------------------------------------------------------------
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

const hcmPropsSpy = vi.fn<
  [{ activeConversationId: string | undefined; className?: string }],
  void
>();
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

// State stores accessed via zustand — stub them since they're not under test.
vi.mock("@/state/theme", () => ({
  useThemeStore: (selector: (s: { theme: string; set: (t: string) => void }) => unknown) =>
    selector({ theme: "dark", set: () => undefined }),
}));
vi.mock("@/state/command-palette", () => ({
  useCommandPaletteStore: (
    selector: (s: { toggle: () => void }) => unknown,
  ) => selector({ toggle: () => undefined }),
}));

const { Header } = await import("../Header");

afterEach(() => {
  cleanup();
  useLocationMock.mockReset();
  hcmPropsSpy.mockReset();
});

describe("Header — ConversationMenu conditional mount (TC-02)", () => {
  it("does NOT render ConversationMenu on a non-chat route", () => {
    useLocationMock.mockReturnValue({ pathname: "/graph", search: {} });
    const { queryByTestId } = render(<Header />);
    expect(queryByTestId("hcm")).toBeNull();
    expect(hcmPropsSpy).not.toHaveBeenCalled();
  });

  it("renders ConversationMenu on `/chat` with undefined active id when no search param", () => {
    useLocationMock.mockReturnValue({ pathname: "/chat", search: {} });
    const { getByTestId } = render(<Header />);
    expect(getByTestId("hcm")).toBeTruthy();
    expect(hcmPropsSpy).toHaveBeenCalledTimes(1);
    expect(hcmPropsSpy.mock.calls[0]?.[0].activeConversationId).toBeUndefined();
  });

  it("passes `?conversation=<id>` from the URL into `activeConversationId`", () => {
    useLocationMock.mockReturnValue({
      pathname: "/chat",
      search: { conversation: "conv-42" },
    });
    const { getByTestId } = render(<Header />);
    expect(getByTestId("hcm").getAttribute("data-active-id")).toBe("conv-42");
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
    const { getByTestId } = render(<Header />);
    expect(getByTestId("hcm")).toBeTruthy();
  });
});
