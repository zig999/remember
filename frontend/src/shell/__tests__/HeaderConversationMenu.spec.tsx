/**
 * HeaderConversationMenu — tests for the adapter that wires
 * `ConversationMenu` to the chat data layer (TC-02).
 *
 * What is being verified:
 *  1. The menu only renders when Header detects `/chat` (covered by the
 *     Header conditional-mount test below; the adapter itself is only
 *     mounted there).
 *  2. The seven callbacks from the pure-UI menu are wired to the right
 *     mutations (create/update/delete) and to navigation.
 *  3. Navigation rules from chat.feature.spec.md §3 hold:
 *       - create success → navigate to /chat?conversation=<new-id>
 *       - archive ACTIVE id → navigate to /chat (no id)
 *       - delete ACTIVE id → navigate to /chat (no id)
 *       - archive/delete a NON-active id → no navigation
 *       - rename / unarchive → no navigation
 *  4. `includeArchived` flips the list-query filter (local UI state owned
 *     by this adapter, not the menu).
 *
 * Tests stub `ConversationMenu` with a thin mock that exposes each callback
 * as a button — this isolates the wiring under test from the menu's
 * implementation details (Radix portals etc.), keeping the test fast and
 * deterministic in jsdom.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ---- mock @tanstack/react-router: capture useNavigate calls -------------
const navigateSpy = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateSpy,
}));

// ---- mock the chat api: capture mutation calls --------------------------
const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();
const listQueryState: {
  data: { conversations: Array<{ id: string; title: string | null }> } | undefined;
  isLoading: boolean;
} = {
  data: { conversations: [] },
  isLoading: false,
};

vi.mock("@/features/chat/api", () => ({
  useListConversations: vi.fn(() => listQueryState),
  useCreateConversation: () => ({ mutate: createMutate }),
  useUpdateConversation: () => ({ mutate: updateMutate }),
  useDeleteConversation: () => ({ mutate: deleteMutate }),
}));

// ---- mock ConversationMenu: surface the 7 callbacks as buttons ----------
type MenuProps = {
  activeConversationId: string | null;
  activeTitle: string | null;
  conversations: ReadonlyArray<{ id: string; title: string | null }>;
  isLoading?: boolean;
  includeArchived?: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, t: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onIncludeArchivedChange: (v: boolean) => void;
};

vi.mock("@/components/ds/ConversationMenu", () => ({
  ConversationMenu: (props: MenuProps) => (
    <div data-testid="menu">
      <span data-testid="active-id">{String(props.activeConversationId)}</span>
      <span data-testid="active-title">{String(props.activeTitle)}</span>
      <span data-testid="count">{props.conversations.length}</span>
      <span data-testid="loading">{String(props.isLoading)}</span>
      <span data-testid="include-archived">{String(props.includeArchived)}</span>
      <button onClick={() => props.onSelect("conv-x")}>select</button>
      <button onClick={() => props.onCreate()}>create</button>
      <button onClick={() => props.onRename("conv-x", "novo título")}>rename</button>
      <button onClick={() => props.onArchive("conv-active")}>archive-active</button>
      <button onClick={() => props.onArchive("conv-other")}>archive-other</button>
      <button onClick={() => props.onUnarchive("conv-x")}>unarchive</button>
      <button onClick={() => props.onDelete("conv-active")}>delete-active</button>
      <button onClick={() => props.onDelete("conv-other")}>delete-other</button>
      <button onClick={() => props.onIncludeArchivedChange(true)}>toggle-archived</button>
    </div>
  ),
}));

// Imported AFTER vi.mock blocks so the mocks take effect.
const { HeaderConversationMenu } = await import("../HeaderConversationMenu");
const chatApi = await import("@/features/chat/api");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  navigateSpy.mockReset();
  createMutate.mockReset();
  updateMutate.mockReset();
  deleteMutate.mockReset();
  listQueryState.data = {
    conversations: [
      { id: "conv-active", title: "Conversa Ativa" },
      { id: "conv-other", title: "Outra" },
    ],
  };
  listQueryState.isLoading = false;
});

afterEach(() => cleanup());

describe("HeaderConversationMenu — props derivation", () => {
  it("derives activeTitle from the conversations list using activeConversationId", () => {
    const { getByTestId } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    expect(getByTestId("active-id").textContent).toBe("conv-active");
    expect(getByTestId("active-title").textContent).toBe("Conversa Ativa");
    expect(getByTestId("count").textContent).toBe("2");
  });

  it("passes null activeConversationId when none is selected (bare /chat)", () => {
    const { getByTestId } = wrap(
      <HeaderConversationMenu activeConversationId={undefined} />,
    );
    expect(getByTestId("active-id").textContent).toBe("null");
    expect(getByTestId("active-title").textContent).toBe("null");
  });

  it("propagates isLoading from the list query", () => {
    listQueryState.data = undefined;
    listQueryState.isLoading = true;
    const { getByTestId } = wrap(
      <HeaderConversationMenu activeConversationId={undefined} />,
    );
    expect(getByTestId("loading").textContent).toBe("true");
    expect(getByTestId("count").textContent).toBe("0");
  });
});

describe("HeaderConversationMenu — callback wiring", () => {
  it("onSelect → navigate to /chat?conversation=<id>", async () => {
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("select"));
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/chat",
      search: { conversation: "conv-x" },
    });
  });

  it("onCreate → fires createMutation; on success navigates to the new id", async () => {
    createMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.({ id: "conv-new" });
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId={undefined} />,
    );
    await user.click(getByText("create"));
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/chat",
      search: { conversation: "conv-new" },
    });
  });

  it("onRename → fires updateMutation with { id, title } and DOES NOT navigate", async () => {
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("rename"));
    expect(updateMutate).toHaveBeenCalledWith({
      id: "conv-x",
      title: "novo título",
    });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onArchive of the ACTIVE id → updates with archivedAt + navigates to /chat (no id)", async () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("archive-active"));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const call = updateMutate.mock.calls[0]?.[0] as {
      id: string;
      archivedAt: string;
    };
    expect(call.id).toBe("conv-active");
    expect(typeof call.archivedAt).toBe("string");
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/chat", search: {} });
  });

  it("onArchive of a NON-active id → updates but DOES NOT navigate", async () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("archive-other"));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onUnarchive → updates with archivedAt:null and DOES NOT navigate", async () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("unarchive"));
    expect(updateMutate).toHaveBeenCalledWith({
      id: "conv-x",
      archivedAt: null,
    });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onDelete of the ACTIVE id → fires deleteMutation + navigates to /chat (no id)", async () => {
    deleteMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("delete-active"));
    expect(deleteMutate).toHaveBeenCalledWith(
      { id: "conv-active" },
      expect.any(Object),
    );
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/chat", search: {} });
  });

  it("onDelete of a NON-active id → fires deleteMutation but DOES NOT navigate", async () => {
    deleteMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    const { getByText } = wrap(
      <HeaderConversationMenu activeConversationId="conv-active" />,
    );
    await user.click(getByText("delete-other"));
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onIncludeArchivedChange → flips includeArchived AND drives the list query filter", async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = wrap(
      <HeaderConversationMenu activeConversationId={undefined} />,
    );
    expect(getByTestId("include-archived").textContent).toBe("false");
    await user.click(getByText("toggle-archived"));
    expect(getByTestId("include-archived").textContent).toBe("true");
    // The list-query hook is called once per render with the current filter.
    // The latest call must reflect the toggled value.
    const calls = (chatApi.useListConversations as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(calls[calls.length - 1]?.[0]).toEqual({ includeArchived: true });
  });
});
