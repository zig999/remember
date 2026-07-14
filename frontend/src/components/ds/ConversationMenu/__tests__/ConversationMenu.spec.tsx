/**
 * ConversationMenu — unit tests (TC-06).
 *
 * Why these tests exist (Golden Rule 9):
 *  - Spec §5 lists 7 callbacks, all consumer-owned (no IO inside the
 *    component). If any callback stops firing, the chat feature silently
 *    breaks (e.g. create button no longer creates a conversation); the
 *    callback contract is the load-bearing edge of the pure-UI promise.
 *  - Spec §3.1 fallbacks ("Conversa sem título" / "Nova conversa") and §9
 *    aria-label ("Conversas — {activeTitle ?? 'Nova conversa'}") are the
 *    accessibility contract — they are user-visible WCAG 2.2 AA promises and
 *    must be pinned.
 *  - Spec §8 BDD scenarios — Default render, Open dropdown, Select, Rename,
 *    Delete with confirmation, Keyboard nav — each gets at least one test.
 *  - Spec §4 "renaming"/"deleting" states are local-only state machines —
 *    starting and cancelling rename, opening + cancelling + confirming the
 *    delete dialog — they are pinned end-to-end.
 *
 * Test strategy:
 *  Radix DropdownMenu/Dialog/Switch use portals + layout APIs jsdom does NOT
 *  ship (pointer capture, etc.). The shell-test for CommandPalette mocks them
 *  for the same reason. We mock our local primitives to expose all subtrees
 *  (no open/close gating) so we can assert the component's logic without
 *  fighting Radix portals. The Radix integration is covered separately by
 *  the Storybook story (rendered as a Vitest browser-mode test by addon-vitest).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement, ReactNode } from "react";

// --- mock UI primitives BEFORE importing the component ---------------------

// vi.mock matches by RESOLVED file path. The SUT imports via `@/...` alias
// (which vite-tsconfig-paths resolves to the file path at SUT-load time);
// but THIS test file is excluded from tsconfig.json (test files are excluded
// to keep build artefacts narrow), so the alias does NOT resolve from this
// file. The fix: declare mocks with relative paths that resolve to the SAME
// absolute file paths as the SUT's alias imports. Both paths land on the
// same module entry, so Vitest swaps them.
vi.mock("../../../ui/dropdown-menu", () => {
  // Render content always-visible; trigger is a passthrough button so clicks
  // dispatch normally. asChild renders the child directly.
  return {
    DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({
      children,
      asChild,
    }: {
      children: ReactNode;
      asChild?: boolean;
    }) => (asChild ? <>{children}</> : <button type="button">{children}</button>),
    DropdownMenuContent: ({
      children,
      className,
      ...rest
    }: {
      children: ReactNode;
      className?: string;
      [k: string]: unknown;
    }) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
    DropdownMenuItem: ({
      children,
      onSelect,
      className,
      ...rest
    }: {
      children: ReactNode;
      onSelect?: () => void;
      className?: string;
      [k: string]: unknown;
    }) => (
      <div
        role="menuitem"
        className={className}
        onClick={() => onSelect?.()}
        {...rest}
      >
        {children}
      </div>
    ),
    DropdownMenuSeparator: () => <hr />,
  };
});

// O alias @/shared não resolve dentro de .spec (fora do escopo do
// vite-tsconfig-paths); mockamos o kit dialog pelo caminho relativo — resolve
// para o MESMO módulo que o componente importa via @/shared, então intercepta.
vi.mock("../../../../../vendor/ui-kit/frontend/src/shared/components/ui/dialog", () => {
  return {
    Dialog: ({
      open,
      onOpenChange,
      children,
    }: {
      open?: boolean;
      onOpenChange?: (o: boolean) => void;
      children: ReactNode;
    }) =>
      open ? (
        <div
          role="dialog"
          data-state="open"
          // expose the close hook so tests can simulate ESC by calling
          // onOpenChange(false) via the cancel button.
          data-on-open-change={onOpenChange ? "yes" : "no"}
        >
          {children}
        </div>
      ) : null,
    DialogContent: ({
      children,
      className,
      ...rest
    }: {
      children: ReactNode;
      className?: string;
      [k: string]: unknown;
    }) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
    DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
    DialogDescription: ({
      children,
      id,
    }: {
      children: ReactNode;
      id?: string;
    }) => <p id={id}>{children}</p>,
  };
});

vi.mock("../../../ui/switch", () => {
  return {
    Switch: ({
      checked,
      onCheckedChange,
      "aria-label": ariaLabel,
      id,
      ...rest
    }: {
      checked?: boolean;
      onCheckedChange?: (v: boolean) => void;
      "aria-label"?: string;
      id?: string;
      [k: string]: unknown;
    }) => (
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked ? "true" : "false"}
        aria-label={ariaLabel}
        onClick={() => onCheckedChange?.(!checked)}
        {...rest}
      />
    ),
  };
});

// --- now import the SUT ----------------------------------------------------

import { ConversationMenu } from "../ConversationMenu";
// Type-only import via relative path — see vi.mock note above; test file is
// excluded from tsconfig.json, so the @/ alias would not resolve here.
import type { Conversation } from "../../../../features/chat/types";

/* ---------- render harness (mirrors StateBadge tests pattern) ----------- */

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
  vi.restoreAllMocks();
});

function render(el: ReactElement): void {
  act(() => root.render(el));
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function changeInput(el: HTMLInputElement, value: string): void {
  // React tracks input values via a hidden "_valueTracker" — directly setting
  // `el.value` skips that tracker, so React reads the OLD value when the
  // `input` event fires (the synthetic event sees no change → no onChange).
  // The official escape hatch is to call the native HTMLInputElement value
  // setter, which writes through the tracker, and then dispatch the event.
  // (Same trick React's own test utilities use.)
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function keyDown(el: Element, key: string): void {
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

/* ---------- fixture data ---------------------------------------------- */

function fixture(): Conversation[] {
  return [
    {
      id: "c1",
      title: "Reuniao Apollo",
      archivedAt: null,
      createdAt: new Date("2026-06-19T10:00:00Z"),
    },
    {
      id: "c2",
      title: null, // exercises the "Conversa sem título" fallback
      archivedAt: null,
      createdAt: new Date("2026-06-18T10:00:00Z"),
    },
    {
      id: "c3",
      title: "Backlog antigo",
      archivedAt: new Date("2026-06-10T10:00:00Z"), // archived
      createdAt: new Date("2026-06-01T10:00:00Z"),
    },
  ];
}

function baseProps(overrides: Partial<React.ComponentProps<typeof ConversationMenu>> = {}) {
  return {
    activeConversationId: null,
    activeTitle: null,
    conversations: fixture(),
    isLoading: false,
    includeArchived: false,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onRename: vi.fn(),
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
    onDelete: vi.fn(),
    onIncludeArchivedChange: vi.fn(),
    ...overrides,
  } as React.ComponentProps<typeof ConversationMenu>;
}

/* ---------- BDD: Default render ---------------------------------------- */

describe("ConversationMenu — default render (spec §8 'Default render')", () => {
  it("trigger shows 'Nova conversa' when no conversation is active", () => {
    render(<ConversationMenu {...baseProps()} />);
    const trigger = container.querySelector(
      '[data-testid="conversation-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain("Nova conversa");
    // aria-label pinned per spec §9
    expect(trigger.getAttribute("aria-label")).toBe("Conversas — Nova conversa");
  });

  it("trigger shows the activeTitle when an active conversation is set", () => {
    render(
      <ConversationMenu
        {...baseProps({ activeConversationId: "c1", activeTitle: "Reuniao Apollo" })}
      />,
    );
    const trigger = container.querySelector(
      '[data-testid="conversation-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toContain("Reuniao Apollo");
    expect(trigger.getAttribute("aria-label")).toBe("Conversas — Reuniao Apollo");
  });

  it("falls back to 'Conversa sem título' when active title is null", () => {
    // spec §3 — "Falls back to 'Conversa sem título' if null" applies to the
    // displayed trigger label, NOT the aria-label (which uses the spec
    // formula "activeTitle ?? 'Nova conversa'").
    render(
      <ConversationMenu
        {...baseProps({ activeConversationId: "c2", activeTitle: null })}
      />,
    );
    const trigger = container.querySelector(
      '[data-testid="conversation-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toContain("Conversa sem título");
  });
});

/* ---------- BDD: Open dropdown — list + 'Nova conversa' --------------- */

describe("ConversationMenu — open dropdown (spec §8 'Open dropdown')", () => {
  it("renders 'Nova conversa' CTA at top, each conversation, archived badge", () => {
    render(<ConversationMenu {...baseProps()} />);
    // mocked DropdownMenu renders content unconditionally
    const create = container.querySelector(
      '[data-testid="conversation-menu-create"]',
    );
    expect(create).toBeTruthy();
    expect(create?.textContent).toContain("Nova conversa");

    const item1 = container.querySelector(
      '[data-testid="conversation-menu-item-c1"]',
    );
    const item2 = container.querySelector(
      '[data-testid="conversation-menu-item-c2"]',
    );
    const item3 = container.querySelector(
      '[data-testid="conversation-menu-item-c3"]',
    );
    expect(item1?.textContent).toContain("Reuniao Apollo");
    // null title -> 'Conversa sem título' fallback
    expect(item2?.textContent).toContain("Conversa sem título");
    // archived item shows the badge
    expect(item3?.textContent).toContain("Arquivada");
    // archived item gets data-archived flag for styling
    expect(item3?.getAttribute("data-archived")).toBe("true");
    // archived item aria-label includes the archived suffix (spec §9)
    expect(item3?.getAttribute("aria-label")).toBe("Backlog antigo (arquivada)");
  });

  it("active conversation item has data-active flag", () => {
    render(
      <ConversationMenu
        {...baseProps({ activeConversationId: "c1", activeTitle: "Reuniao Apollo" })}
      />,
    );
    const item1 = container.querySelector(
      '[data-testid="conversation-menu-item-c1"]',
    );
    expect(item1?.getAttribute("data-active")).toBe("true");
  });

  it("empty state renders message when conversations is []", () => {
    render(<ConversationMenu {...baseProps({ conversations: [] })} />);
    const empty = container.querySelector('[data-testid="conversation-menu-empty"]');
    expect(empty).toBeTruthy();
  });
});

/* ---------- BDD: Select conversation ---------------------------------- */

describe("ConversationMenu — select (spec §8 'Select conversation')", () => {
  it("clicking a conversation item emits onSelect(id)", () => {
    const onSelect = vi.fn();
    render(<ConversationMenu {...baseProps({ onSelect })} />);
    const item = container.querySelector(
      '[data-testid="conversation-menu-item-c1"]',
    )!;
    click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("clicking 'Nova conversa' emits onCreate (no args)", () => {
    const onCreate = vi.fn();
    render(<ConversationMenu {...baseProps({ onCreate })} />);
    const cta = container.querySelector(
      '[data-testid="conversation-menu-create"]',
    )!;
    click(cta);
    expect(onCreate).toHaveBeenCalledTimes(1);
    // pure-UI: should be called with no arguments (spec §5)
    expect(onCreate).toHaveBeenCalledWith();
  });
});

/* ---------- BDD: Rename conversation ---------------------------------- */

describe("ConversationMenu — rename (spec §8 'Rename conversation')", () => {
  it("opens inline input pre-filled with current title", () => {
    render(<ConversationMenu {...baseProps()} />);
    const renameBtn = container.querySelector(
      '[data-testid="conversation-menu-rename-btn-c1"]',
    )!;
    click(renameBtn);

    const input = container.querySelector(
      '[data-testid="conversation-menu-rename-input-c1"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe("Reuniao Apollo");
  });

  it("Enter on rename input emits onRename(id, newTitle) with the typed value", () => {
    const onRename = vi.fn();
    render(<ConversationMenu {...baseProps({ onRename })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-rename-btn-c1"]')!,
    );
    const input = container.querySelector(
      '[data-testid="conversation-menu-rename-input-c1"]',
    ) as HTMLInputElement;
    changeInput(input, "Apollo retro");
    keyDown(input, "Enter");

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith("c1", "Apollo retro");
    // After commit the row is back to display mode
    expect(
      container.querySelector('[data-testid="conversation-menu-rename-input-c1"]'),
    ).toBeNull();
  });

  it("Enter with empty/whitespace-only value DOES NOT emit onRename (spec §5)", () => {
    const onRename = vi.fn();
    render(<ConversationMenu {...baseProps({ onRename })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-rename-btn-c2"]')!,
    );
    const input = container.querySelector(
      '[data-testid="conversation-menu-rename-input-c2"]',
    ) as HTMLInputElement;
    changeInput(input, "   ");
    keyDown(input, "Enter");
    expect(onRename).not.toHaveBeenCalled();
  });

  it("Esc on rename input cancels and restores display mode without onRename", () => {
    const onRename = vi.fn();
    render(<ConversationMenu {...baseProps({ onRename })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-rename-btn-c1"]')!,
    );
    const input = container.querySelector(
      '[data-testid="conversation-menu-rename-input-c1"]',
    ) as HTMLInputElement;
    keyDown(input, "Escape");
    expect(onRename).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-testid="conversation-menu-rename-input-c1"]'),
    ).toBeNull();
  });

  it("Confirm (✓) button commits and Cancel (✕) button discards", () => {
    const onRename = vi.fn();
    render(<ConversationMenu {...baseProps({ onRename })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-rename-btn-c1"]')!,
    );
    const input = container.querySelector(
      '[data-testid="conversation-menu-rename-input-c1"]',
    ) as HTMLInputElement;
    changeInput(input, "Novo");
    click(
      container.querySelector(
        '[data-testid="conversation-menu-rename-confirm-c1"]',
      )!,
    );
    expect(onRename).toHaveBeenCalledWith("c1", "Novo");

    // re-open and cancel
    click(
      container.querySelector('[data-testid="conversation-menu-rename-btn-c1"]')!,
    );
    click(
      container.querySelector(
        '[data-testid="conversation-menu-rename-cancel-c1"]',
      )!,
    );
    expect(onRename).toHaveBeenCalledTimes(1); // not called again
  });
});

/* ---------- Archive / Unarchive --------------------------------------- */

describe("ConversationMenu — archive / unarchive (spec §5)", () => {
  it("clicking 'Arquivar' on an active item emits onArchive(id)", () => {
    const onArchive = vi.fn();
    render(<ConversationMenu {...baseProps({ onArchive })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-archive-btn-c1"]')!,
    );
    expect(onArchive).toHaveBeenCalledWith("c1");
  });

  it("archived item shows 'Reativar' (not 'Arquivar') and emits onUnarchive", () => {
    const onUnarchive = vi.fn();
    const onArchive = vi.fn();
    render(<ConversationMenu {...baseProps({ onArchive, onUnarchive })} />);

    // c3 is archived in the fixture — its action is unarchive, NOT archive
    expect(
      container.querySelector('[data-testid="conversation-menu-archive-btn-c3"]'),
    ).toBeNull();
    const unarchiveBtn = container.querySelector(
      '[data-testid="conversation-menu-unarchive-btn-c3"]',
    )!;
    expect(unarchiveBtn).toBeTruthy();
    click(unarchiveBtn);
    expect(onUnarchive).toHaveBeenCalledWith("c3");
    expect(onArchive).not.toHaveBeenCalled();
  });
});

/* ---------- BDD: Delete with confirmation ----------------------------- */

describe("ConversationMenu — delete with confirmation (spec §8 'Delete')", () => {
  it("clicking 'Excluir' opens AlertDialog with the spec confirmation copy", () => {
    render(<ConversationMenu {...baseProps()} />);
    expect(
      container.querySelector('[data-testid="conversation-menu-delete-dialog"]'),
    ).toBeNull();

    click(
      container.querySelector('[data-testid="conversation-menu-delete-btn-c1"]')!,
    );

    const dialog = container.querySelector(
      '[data-testid="conversation-menu-delete-dialog"]',
    );
    expect(dialog).toBeTruthy();
    // spec §4 row 5 / spec §1 — exact pt-BR body
    expect(dialog?.textContent).toContain(
      "Tem certeza? Esta ação não pode ser desfeita.",
    );
  });

  it("'Confirmar' emits onDelete(id) and closes the dialog", () => {
    const onDelete = vi.fn();
    render(<ConversationMenu {...baseProps({ onDelete })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-delete-btn-c2"]')!,
    );
    click(
      container.querySelector(
        '[data-testid="conversation-menu-delete-confirm"]',
      )!,
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("c2");
    expect(
      container.querySelector('[data-testid="conversation-menu-delete-dialog"]'),
    ).toBeNull();
  });

  it("'Cancelar' closes the dialog WITHOUT calling onDelete", () => {
    const onDelete = vi.fn();
    render(<ConversationMenu {...baseProps({ onDelete })} />);
    click(
      container.querySelector('[data-testid="conversation-menu-delete-btn-c1"]')!,
    );
    click(
      container.querySelector(
        '[data-testid="conversation-menu-delete-cancel"]',
      )!,
    );
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-testid="conversation-menu-delete-dialog"]'),
    ).toBeNull();
  });
});

/* ---------- include_archived toggle ----------------------------------- */

describe("ConversationMenu — include_archived (spec §5 'onIncludeArchivedChange')", () => {
  it("emits onIncludeArchivedChange(true) when toggled from false", () => {
    const onIncludeArchivedChange = vi.fn();
    render(
      <ConversationMenu
        {...baseProps({ includeArchived: false, onIncludeArchivedChange })}
      />,
    );
    const sw = container.querySelector(
      '[data-testid="conversation-menu-include-archived"]',
    )!;
    expect(sw.getAttribute("aria-checked")).toBe("false");
    click(sw);
    expect(onIncludeArchivedChange).toHaveBeenCalledWith(true);
  });

  it("reflects includeArchived=true in aria-checked", () => {
    render(<ConversationMenu {...baseProps({ includeArchived: true })} />);
    const sw = container.querySelector(
      '[data-testid="conversation-menu-include-archived"]',
    )!;
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });
});

/* ---------- Loading state --------------------------------------------- */

describe("ConversationMenu — loading state (spec §4 'loading')", () => {
  it("isLoading=true disables trigger and shows spinner", () => {
    render(<ConversationMenu {...baseProps({ isLoading: true })} />);
    const trigger = container.querySelector(
      '[data-testid="conversation-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(
      container.querySelector('[data-testid="conversation-menu-spinner"]'),
    ).toBeTruthy();
  });

  it("isLoading + empty list shows skeleton (spec §4 'list shows skeleton if conversations=[]')", () => {
    render(
      <ConversationMenu {...baseProps({ isLoading: true, conversations: [] })} />,
    );
    expect(
      container.querySelector('[data-testid="conversation-menu-skeleton"]'),
    ).toBeTruthy();
  });

  it("isLoading=true but with cached conversations keeps the list visible", () => {
    render(<ConversationMenu {...baseProps({ isLoading: true })} />);
    expect(
      container.querySelector('[data-testid="conversation-menu-skeleton"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="conversation-menu-item-c1"]'),
    ).toBeTruthy();
  });
});

/* ---------- className merge (spec §3 + CLAUDE.md cn() contract) -------- */

describe("ConversationMenu — className merge", () => {
  it("merges custom className onto the trigger button", () => {
    render(<ConversationMenu {...baseProps({ className: "custom-trigger-class" })} />);
    const trigger = container.querySelector(
      '[data-testid="conversation-menu-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger.className).toContain("custom-trigger-class");
  });
});
