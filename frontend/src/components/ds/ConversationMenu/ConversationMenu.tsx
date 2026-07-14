/**
 * ConversationMenu — shared DS component (TC-06).
 *
 * Source spec: docs/specs/front/components/ConversationMenu.component.spec.md@1.0.1
 *  - §1 purpose            — dropdown in the global Header
 *  - §3 props contract     — 7 callbacks + activeConversationId/title +
 *                            conversations + isLoading + includeArchived
 *  - §4 component states   — closed | open | loading | renaming | deleting
 *  - §5 events emitted     — onSelect, onCreate, onRename, onArchive,
 *                            onUnarchive, onDelete, onIncludeArchivedChange
 *  - §6 variants           — no-active | active | loading | archived-visible
 *  - §8 BDD scenarios      — five scenarios — pinned by Vitest tests
 *  - §9 accessibility      — trigger aria-label, item ≥ 40px, focus returns
 *  - §10 internal deps     — DropdownMenu + Dialog (used as the AlertDialog
 *                            confirm; the project ships only Dialog primitives)
 *
 * Design system rules respected:
 *  - CLAUDE.md "Component contract — React 19 + Tailwind" — ref as a normal
 *    prop (no `forwardRef`); className merged via `cn()`; semantic tokens only
 *    (no raw values).
 *  - CLAUDE.md "Stack-specific forbidden patterns" — never call `fetch`/
 *    `axios` and never use `useEffect` for data fetching; this component does
 *    NEITHER. All IO lives in the consumer.
 *  - front.md / DS — item floor 40px (WCAG SC 2.5.8 ≥ 24px; project floor 32;
 *    spec §9 explicit 40px).
 *
 * Out of scope per spec §1:
 *  - Pagination beyond limit=20.
 *  - ⌘K shortcut.
 *  - Pre-filled title on create (consumer sends `{}`).
 *  - Rendering message content.
 *
 * Implementation notes (worth surfacing for QA + future maintainers):
 *  - The component owns three pieces of UI-only state:
 *      1) `open`           — controlled Dropdown open/close (so we can close
 *                            the menu programmatically when the user confirms
 *                            a destructive action, returning focus to the
 *                            trigger via Radix).
 *      2) `renamingId`     — id of the conversation currently being inline-
 *                            renamed; `null` when nothing is being renamed.
 *      3) `deletingId`     — id of the conversation queued for confirmation;
 *                            drives the AlertDialog open prop.
 *  - `includeArchived` is mirror-of-prop (controlled). The component never
 *    persists it locally — flipping the Switch fires
 *    `onIncludeArchivedChange(next)` and the consumer rebinds the prop.
 *  - We close the dropdown on Select / Archive / Unarchive immediately and
 *    keep it open during rename (the inline input lives inside the menu).
 *  - The AlertDialog (Dialog from components/ui/dialog) opens OUTSIDE the
 *    DropdownMenu Portal so we don't fight Radix focus stacking; we close the
 *    dropdown when the dialog opens.
 */
import { useState, useRef, useEffect, type FC, type KeyboardEvent } from "react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/lib/cn";
import type { ConversationMenuProps } from "./ConversationMenu.types";

/* ---------- pt-BR strings (frozen — no i18n layer, CLAUDE.md i18n:false) - */
const STRINGS = Object.freeze({
  triggerFallback: "Nova conversa",
  titleFallback: "Conversa sem título",
  archivedSuffix: "(arquivada)",
  newConversation: "Nova conversa",
  rename: "Renomear",
  archive: "Arquivar",
  unarchive: "Reativar",
  delete: "Excluir",
  archivedBadge: "Arquivada",
  showArchived: "Mostrar arquivadas",
  empty: "Nenhuma conversa ainda",
  confirmRename: "Confirmar renomeação",
  cancelRename: "Cancelar renomeação",
  deleteTitle: "Excluir conversa",
  deleteBody: "Tem certeza? Esta ação não pode ser desfeita.",
  deleteCancel: "Cancelar",
  deleteConfirm: "Confirmar",
});

export const ConversationMenu: FC<ConversationMenuProps> = ({
  activeConversationId = null,
  activeTitle = null,
  conversations,
  isLoading = false,
  includeArchived = false,
  onSelect,
  onCreate,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
  onIncludeArchivedChange,
  className,
  ref,
}) => {
  /* ----- ui-only state (see header note) ------------------------------- */
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ref to the trigger so we can restore focus when the AlertDialog closes
  // (Radix Dialog's onOpenChange(false) does NOT know about the dropdown's
  // original trigger — the dialog opens outside the dropdown Portal).
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  function setRefs(node: HTMLButtonElement | null): void {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && "current" in ref) {
      (ref as { current: HTMLButtonElement | null }).current = node;
    }
  }

  /* ----- derived label (spec §3 + §4 trigger row) ---------------------- */
  // Two rules combined:
  //   1) activeConversationId === null  -> "Nova conversa"
  //   2) activeConversationId !== null  -> activeTitle ?? "Conversa sem título"
  const triggerLabel =
    activeConversationId === null
      ? STRINGS.triggerFallback
      : (activeTitle ?? STRINGS.titleFallback);

  // Spec §9: aria-label "Conversas — {activeTitle ?? 'Nova conversa'}".
  // Note the spec phrasing uses activeTitle (not the title-fallback) — when
  // the active conversation has a null title we still announce "Nova
  // conversa" via the ?? branch, matching the spec literally.
  const triggerAriaLabel = `Conversas — ${activeTitle ?? STRINGS.triggerFallback}`;

  /* ----- handlers ------------------------------------------------------- */
  function handleSelect(id: string): void {
    onSelect(id);
    setOpen(false);
  }

  function handleCreate(): void {
    onCreate();
    setOpen(false);
  }

  function startRename(id: string, currentTitle: string | null): void {
    setRenamingId(id);
    setRenameDraft(currentTitle ?? "");
  }

  function commitRename(id: string): void {
    const trimmed = renameDraft.trim();
    // Spec §5: emits "with non-empty title". Empty trim is silently cancelled.
    if (trimmed.length > 0) onRename(id, trimmed);
    setRenamingId(null);
    setRenameDraft("");
  }

  function cancelRename(): void {
    setRenamingId(null);
    setRenameDraft("");
  }

  function handleArchive(id: string): void {
    onArchive(id);
    setOpen(false);
  }

  function handleUnarchive(id: string): void {
    onUnarchive(id);
    setOpen(false);
  }

  function requestDelete(id: string): void {
    // Close the dropdown so its Portal doesn't clash with the dialog Portal,
    // then open the AlertDialog by id.
    setOpen(false);
    setDeletingId(id);
  }

  function confirmDelete(): void {
    if (deletingId !== null) onDelete(deletingId);
    setDeletingId(null);
    // Spec §8 "Delete with confirmation": focus returns to the trigger button
    // after the AlertDialog closes — Radix Dialog DOES return focus to the
    // last-focused element, but the user's last focus was inside the menu
    // item that got unmounted; we explicitly restore it.
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function cancelDelete(): void {
    setDeletingId(null);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  // Rename input keyboard: Enter commits, Esc cancels (spec §4 "renaming").
  function onRenameKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    id: string,
  ): void {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  }

  // When the dropdown transitions from open → closed, drop any in-flight
  // rename so re-opening shows a clean state. We track the PREVIOUS open
  // value via a ref so the effect only runs on a real transition (a
  // useEffect keyed only on `open` would also fire on mount, dropping the
  // rename row before the user could even see it).
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current && !open && renamingId !== null) {
      setRenamingId(null);
      setRenameDraft("");
    }
    wasOpenRef.current = open;
  }, [open, renamingId]);

  /* ----- render -------------------------------------------------------- */
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={setRefs}
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            aria-label={triggerAriaLabel}
            data-testid="conversation-menu-trigger"
            className={cn(
              "inline-flex items-center gap-sm max-w-xs truncate",
              className,
            )}
          >
            <span className="truncate text-xs font-medium">{triggerLabel}</span>
            {isLoading ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden="true"
                data-testid="conversation-menu-spinner"
              />
            ) : (
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-72"
          data-testid="conversation-menu-content"
        >
          {/* "Nova conversa" — top CTA, spec §8 "Open dropdown" scenario */}
          <DropdownMenuItem
            onSelect={handleCreate}
            className="min-h-10 gap-sm font-medium text-foreground"
            data-testid="conversation-menu-create"
          >
            <Plus className="size-4 text-primary" aria-hidden="true" />
            <span>{STRINGS.newConversation}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Loading-with-no-data shows lightweight skeleton (spec §4 row 3) */}
          {isLoading && conversations.length === 0 ? (
            <div
              className="flex flex-col gap-sm p-md"
              data-testid="conversation-menu-skeleton"
            >
              <div className="h-4 w-3/4 rounded-sm bg-muted-foreground/30 animate-pulse" />
              <div className="h-4 w-1/2 rounded-sm bg-muted-foreground/30 animate-pulse" />
              <div className="h-4 w-2/3 rounded-sm bg-muted-foreground/30 animate-pulse" />
            </div>
          ) : conversations.length === 0 ? (
            <div
              className="px-md py-sm text-xs font-medium text-muted-foreground"
              data-testid="conversation-menu-empty"
            >
              {STRINGS.empty}
            </div>
          ) : (
            conversations.map((c) => {
              const isArchived = c.archivedAt !== null;
              const isActive = c.id === activeConversationId;
              const itemTitle = c.title ?? STRINGS.titleFallback;
              const itemAriaLabel = isArchived
                ? `${itemTitle} ${STRINGS.archivedSuffix}`
                : itemTitle;

              // Renaming branch — replaces the row contents but keeps the item
              // pinned in place (no list reorder). We use a plain <div> here
              // because a DropdownMenuItem would auto-close on Enter, fighting
              // the rename commit.
              if (renamingId === c.id) {
                return (
                  <div
                    key={c.id}
                    role="group"
                    aria-label={`Renomeando ${itemTitle}`}
                    className="flex items-center gap-sm px-md py-1.5 min-h-10"
                    data-testid={`conversation-menu-rename-row-${c.id}`}
                  >
                    <Input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => onRenameKeyDown(e, c.id)}
                      aria-label={`Novo título para ${itemTitle}`}
                      className="h-8 flex-1"
                      data-testid={`conversation-menu-rename-input-${c.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => commitRename(c.id)}
                      aria-label={STRINGS.confirmRename}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-primary hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      data-testid={`conversation-menu-rename-confirm-${c.id}`}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      aria-label={STRINGS.cancelRename}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      data-testid={`conversation-menu-rename-cancel-${c.id}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              }

              // Normal row — the conversation item itself selects on click;
              // per-item action buttons live to the right and stop propagation
              // so they don't also trigger onSelect.
              return (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={() => handleSelect(c.id)}
                  aria-label={itemAriaLabel}
                  data-testid={`conversation-menu-item-${c.id}`}
                  data-active={isActive || undefined}
                  data-archived={isArchived || undefined}
                  className={cn(
                    "min-h-10 gap-sm",
                    isActive && "bg-elevated",
                  )}
                >
                  <span className="flex-1 truncate text-foreground">{itemTitle}</span>

                  {isArchived && (
                    <span
                      aria-hidden="true"
                      className="rounded-sm bg-muted-foreground/30 px-xs py-px text-xs text-muted-foreground"
                    >
                      {STRINGS.archivedBadge}
                    </span>
                  )}

                  <span className="flex shrink-0 items-center gap-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startRename(c.id, c.title);
                      }}
                      aria-label={`${STRINGS.rename} ${itemTitle}`}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      data-testid={`conversation-menu-rename-btn-${c.id}`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    {isArchived ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnarchive(c.id);
                        }}
                        aria-label={`${STRINGS.unarchive} ${itemTitle}`}
                        className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                        data-testid={`conversation-menu-unarchive-btn-${c.id}`}
                      >
                        <ArchiveRestore className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleArchive(c.id);
                        }}
                        aria-label={`${STRINGS.archive} ${itemTitle}`}
                        className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                        data-testid={`conversation-menu-archive-btn-${c.id}`}
                      >
                        <Archive className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        requestDelete(c.id);
                      }}
                      aria-label={`${STRINGS.delete} ${itemTitle}`}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-elevated hover:text-state-disputed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      data-testid={`conversation-menu-delete-btn-${c.id}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                </DropdownMenuItem>
              );
            })
          )}

          <DropdownMenuSeparator />

          {/* Footer — include_archived toggle (spec §1 + §5). Not a
              DropdownMenuItem so the Switch click doesn't auto-close. */}
          <div
            className="flex items-center justify-between gap-sm px-md py-sm"
            data-testid="conversation-menu-include-archived-row"
          >
            <label
              htmlFor="conversation-menu-include-archived"
              className="text-xs font-medium text-foreground"
            >
              {STRINGS.showArchived}
            </label>
            <Switch
              id="conversation-menu-include-archived"
              checked={includeArchived}
              onChange={onIncludeArchivedChange}
              aria-label={STRINGS.showArchived}
              data-testid="conversation-menu-include-archived"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation — Dialog (project ships no AlertDialog primitive;
          Dialog provides the same focus-trap + Esc + overlay contract). */}
      <Dialog
        open={deletingId !== null}
        onOpenChange={(o) => {
          if (!o) cancelDelete();
        }}
      >
        <DialogContent
          aria-describedby="conversation-menu-delete-desc"
          data-testid="conversation-menu-delete-dialog"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>{STRINGS.deleteTitle}</DialogTitle>
            <DialogDescription id="conversation-menu-delete-desc">
              {STRINGS.deleteBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={cancelDelete}
              data-testid="conversation-menu-delete-cancel"
            >
              {STRINGS.deleteCancel}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={confirmDelete}
              data-testid="conversation-menu-delete-confirm"
            >
              {STRINGS.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
