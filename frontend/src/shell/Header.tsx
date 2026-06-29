/**
 * Header — fixed top region (z-frame): brand + primary navigation + actions.
 *
 * Spec: front.md §2 (fixed/thin), §2.2 (z-frame), frontend-analise-funcional.md §2
 * (brand · nav between the 5 areas, active highlighted · ⌘K).
 *
 * Navigation uses TanStack Router <Link>; active state is derived from the
 * current pathname (so the highlight is controlled via cn(), not concatenated).
 * ⌘K toggles the command-palette store (the palette UI is wired in a later step).
 */
import { Link, useLocation } from "@tanstack/react-router";
import {
  Diamond,
  MessageSquare,
  Network,
  Search,
  Upload,
  Scale,
  History,
  Command as CommandIcon,
} from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useCommandPaletteStore } from "@/state/command-palette";
import { HeaderConversationMenu } from "./HeaderConversationMenu";

export interface HeaderProps {
  className?: string;
}

const NAV = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/graph", label: "Grafo", icon: Network },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/ingest", label: "Ingerir", icon: Upload },
  { to: "/curation", label: "Curar", icon: Scale },
  { to: "/history", label: "Histórico", icon: History },
] as const;

export function Header({ className }: HeaderProps) {
  // Select both pathname and the `?conversation` search param in one
  // subscription. `select` returns a stable shape so the Header only
  // re-renders when one of these two values changes (not on every router
  // tick). The narrow cast on `search` is intentional: the router-level
  // location is untyped (any route can sit here), and only the /chat route
  // validates the `conversation` key.
  const { pathname, conversationId } = useLocation({
    select: (l) => ({
      pathname: l.pathname,
      conversationId:
        typeof (l.search as { conversation?: unknown }).conversation === "string"
          ? ((l.search as { conversation?: string }).conversation as string)
          : undefined,
    }),
  });
  const onChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");
  const togglePalette = useCommandPaletteStore((s) => s.toggle);

  return (
    <GlassSurface
      level="ambient"
      role="banner"
      aria-label="Cabeçalho"
      className={cn(
        "fixed inset-x-0 top-0 z-frame flex h-12 items-center gap-lg px-lg",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-xs">
        <Diamond className="size-4 text-action" aria-hidden="true" />
        <span className="font-sans text-subheading font-bold tracking-tight text-content">
          Remember
        </span>
      </div>

      {/* Primary navigation */}
      <nav aria-label="Áreas" className="flex items-center gap-xs">
        {NAV.map((item) => {
          const active =
            pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-xs rounded-md px-md py-1 text-body-sm font-semibold transition-colors",
                active
                  ? "bg-surface text-content"
                  : "text-muted hover:text-content",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Active-conversation menu — only on /chat (TC-02). The hooks live
          inside this child so chat-feature traffic stays off other routes. */}
      {onChatRoute ? (
        <HeaderConversationMenu
          activeConversationId={conversationId}
          className="ml-md"
        />
      ) : null}

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePalette}
          aria-label="Abrir paleta de comandos (⌘K)"
          className="gap-xs text-muted"
        >
          <CommandIcon className="size-4" aria-hidden="true" />
          <kbd className="text-caption">⌘K</kbd>
        </Button>
      </div>
    </GlassSurface>
  );
}
