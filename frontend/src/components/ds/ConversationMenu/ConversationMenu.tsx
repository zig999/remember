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
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  function setRefs(node: HTMLButtonElement | null): void {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && "current" in ref) {
      (ref as { current: HTMLButtonElement | null }).current = node;
    }
  }

  const triggerLabel =
    activeConversationId === null
      ? STRINGS.triggerFallback
      : (activeTitle ?? STRINGS.titleFallback);

  const triggerAriaLabel = `Conversas — ${activeTitle ?? STRINGS.triggerFallback}`;

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
    setOpen(false);
    setDeletingId(id);
  }

  function confirmDelete(): void {
    if (deletingId !== null) onDelete(deletingId);
    setDeletingId(null);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function cancelDelete(): void {
    setDeletingId(null);
    queueMicrotask(() => triggerRef.current?.focus());
  }

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

  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current && !open && renamingId !== null) {
      setRenamingId(null);
      setRenameDraft("");
    }
    wasOpenRef.current = open;
  }, [open, renamingId]);

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
          <DropdownMenuItem
            onSelect={handleCreate}
            className="min-h-10 gap-sm font-medium text-foreground"
            data-testid="conversation-menu-create"
          >
            <Plus className="size-4 text-primary" aria-hidden="true" />
            <span>{STRINGS.newConversation}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

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
