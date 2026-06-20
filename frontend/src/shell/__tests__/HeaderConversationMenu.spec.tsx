/**
 * HeaderConversationMenu — adapter wiring tests (TC-02).
 *
 * Why these tests exist:
 *  - The adapter is the load-bearing seam between the pure-UI ConversationMenu
 *    (TC-06) and the chat data layer (TC-03). If any of the 7 callbacks stops
 *    firing the right mutation — or stops navigating correctly on success —
 *    the chat feature silently breaks for the user.
 *
 * What is pinned (chat.feature.spec.md §3 + tc-002.md constraints):
 *  - onSelect             → navigate /chat?conversation=<id>
 *  - onCreate             → createMutation; onSuccess navigate to new id
 *  - onRename             → updateMutation({id,title}); no navigation
 *  - onArchive ACTIVE     → updateMutation({id,archivedAt}); navigate /chat (no id)
 *  - onArchive NON-ACTIVE → updateMutation; NO navigation
 *  - onUnarchive          → updateMutation({id,archivedAt:null}); no navigation
 *  - onDelete  ACTIVE     → deleteMutation; navigate /chat (no id)
 *  - onDelete  NON-ACTIVE → deleteMutation; NO navigation
 *  - onIncludeArchivedChange → flips local state; re-queries list with new filter
 *
 * Test pattern: createRoot + act (same as ConversationMenu.spec.tsx — no
 * `@testing-library/*` dependency). ConversationMenu is mocked to expose
 * each callback as a button so we can dispatch clicks directly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";

// ---- mocks ---------------------------------------------------------------

const navigateSpy = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateSpy,
}));

const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();
const useListConversationsMock = vi.fn();

vi.mock("../../features/chat/api", () => ({
  useListConversations: (params: { includeArchived?: boolean }) =>
    useListConversationsMock(params),
  useCreateConversation: () => ({ mutate: createMutate }),
  useUpdateConversation: () => ({ mutate: updateMutate }),
  useDeleteConversation: () => ({ mutate: deleteMutate }),
}));

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

let lastMenuProps: MenuProps | null = null;

vi.mock("../../components/ds/ConversationMenu", () => ({
  ConversationMenu: (props: MenuProps) => {
    lastMenuProps = props;
    return (
      <div data-testid="menu">
        <span data-testid="active-id">{String(props.activeConversationId)}</span>
        <span data-testid="active-title">{String(props.activeTitle)}</span>
        <span data-testid="count">{props.conversations.length}</span>
        <span data-testid="loading">{String(props.isLoading)}</span>
        <span data-testid="include-archived">{String(props.includeArchived)}</span>
        <button data-act="select" onClick={() => props.onSelect("conv-x")}>
          select
        </button>
        <button data-act="create" onClick={() => props.onCreate()}>
          create
        </button>
        <button
          data-act="rename"
          onClick={() => props.onRename("conv-x", "novo título")}
        >
          rename
        </button>
        <button
          data-act="archive-active"
          onClick={() => props.onArchive("conv-active")}
        >
          archive-active
        </button>
        <button
          data-act="archive-other"
          onClick={() => props.onArchive("conv-other")}
        >
          archive-other
        </button>
        <button
          data-act="unarchive"
          onClick={() => props.onUnarchive("conv-x")}
        >
          unarchive
        </button>
        <button
          data-act="delete-active"
          onClick={() => props.onDelete("conv-active")}
        >
          delete-active
        </button>
        <button
          data-act="delete-other"
          onClick={() => props.onDelete("conv-other")}
        >
          delete-other
        </button>
        <button
          data-act="toggle-archived"
          onClick={() => props.onIncludeArchivedChange(true)}
        >
          toggle-archived
        </button>
      </div>
    );
  },
}));

// ---- SUT (imported after mocks) -----------------------------------------
import { HeaderConversationMenu } from "../HeaderConversationMenu";

// ---- harness -------------------------------------------------------------

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  navigateSpy.mockReset();
  createMutate.mockReset();
  updateMutate.mockReset();
  deleteMutate.mockReset();
  useListConversationsMock.mockReset();
  useListConversationsMock.mockReturnValue({
    data: {
      items: [
        { id: "conv-active", title: "Conversa Ativa", archivedAt: null, createdAt: new Date() },
        { id: "conv-other", title: "Outra", archivedAt: null, createdAt: new Date() },
      ],
      nextCursor: null,
    },
    isLoading: false,
  });
  lastMenuProps = null;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function wrap(node: ReactElement): ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

function render(el: ReactElement): void {
  act(() => root.render(wrap(el)));
}

function clickBtn(act_name: string): void {
  const el = container.querySelector(`[data-act="${act_name}"]`);
  if (!el) throw new Error(`button data-act=${act_name} not found`);
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function txt(testid: string): string {
  return container.querySelector(`[data-testid="${testid}"]`)?.textContent ?? "";
}

// ---- tests ---------------------------------------------------------------

describe("HeaderConversationMenu — props derivation", () => {
  it("derives activeTitle from the conversations list using activeConversationId", () => {
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    expect(txt("active-id")).toBe("conv-active");
    expect(txt("active-title")).toBe("Conversa Ativa");
    expect(txt("count")).toBe("2");
  });

  it("passes null activeConversationId when none is selected (bare /chat)", () => {
    render(<HeaderConversationMenu activeConversationId={undefined} />);
    expect(txt("active-id")).toBe("null");
    expect(txt("active-title")).toBe("null");
  });

  it("propagates isLoading and empty list when the query is still pending", () => {
    useListConversationsMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<HeaderConversationMenu activeConversationId={undefined} />);
    expect(txt("loading")).toBe("true");
    expect(txt("count")).toBe("0");
  });
});

describe("HeaderConversationMenu — callback wiring", () => {
  it("onSelect → navigate to /chat?conversation=<id>", () => {
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("select");
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/chat",
      search: { conversation: "conv-x" },
    });
  });

  it("onCreate → fires createMutation; on success navigates to the new id", () => {
    createMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.({ id: "conv-new" });
    });
    render(<HeaderConversationMenu activeConversationId={undefined} />);
    clickBtn("create");
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/chat",
      search: { conversation: "conv-new" },
    });
  });

  it("onCreate → does NOT navigate when the mutation has not resolved yet", () => {
    // No onSuccess fired by the mock — simulates the in-flight request.
    createMutate.mockImplementation(() => undefined);
    render(<HeaderConversationMenu activeConversationId={undefined} />);
    clickBtn("create");
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onRename → fires updateMutation with { id, title } and DOES NOT navigate", () => {
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("rename");
    expect(updateMutate).toHaveBeenCalledWith({
      id: "conv-x",
      title: "novo título",
    });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onArchive of the ACTIVE id → updates with archivedAt + navigates to /chat (no id)", () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("archive-active");
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const call = updateMutate.mock.calls[0]?.[0] as {
      id: string;
      archivedAt: string;
    };
    expect(call.id).toBe("conv-active");
    expect(typeof call.archivedAt).toBe("string");
    // ISO-8601 sanity check (no NaN, not empty)
    expect(Number.isNaN(Date.parse(call.archivedAt))).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/chat", search: {} });
  });

  it("onArchive of a NON-active id → updates but DOES NOT navigate", () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("archive-other");
    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onUnarchive → updates with archivedAt:null and DOES NOT navigate", () => {
    updateMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("unarchive");
    expect(updateMutate).toHaveBeenCalledWith({
      id: "conv-x",
      archivedAt: null,
    });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onDelete of the ACTIVE id → fires deleteMutation + navigates to /chat (no id)", () => {
    deleteMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("delete-active");
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(
      (deleteMutate.mock.calls[0]?.[0] as { id: string }).id,
    ).toBe("conv-active");
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/chat", search: {} });
  });

  it("onDelete of a NON-active id → fires deleteMutation but DOES NOT navigate", () => {
    deleteMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<HeaderConversationMenu activeConversationId="conv-active" />);
    clickBtn("delete-other");
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("onIncludeArchivedChange → flips includeArchived AND drives the list query filter", () => {
    render(<HeaderConversationMenu activeConversationId={undefined} />);
    expect(txt("include-archived")).toBe("false");
    clickBtn("toggle-archived");
    expect(txt("include-archived")).toBe("true");
    // Latest call to useListConversations must reflect the toggled value.
    const calls = useListConversationsMock.mock.calls;
    expect(calls[calls.length - 1]?.[0]).toEqual({ includeArchived: true });
  });
});
