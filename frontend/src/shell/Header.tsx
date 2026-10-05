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
import { Button } from "@/shared/components/ui/button";
import { useCommandPaletteStore } from "@/state/command-palette";
import { HeaderConversationMenu } from "./HeaderConversationMenu";
import { ThemeSelect } from "./ThemeSelect";

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
      <div className="flex shrink-0 items-center gap-xs">
        <Diamond className="size-4 text-primary" aria-hidden="true" />
        <span className="font-sans text-sm font-medium font-bold tracking-tight text-foreground">
          Remember
        </span>
      </div>

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
                "inline-flex items-center gap-xs rounded-md px-md py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
                active
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {onChatRoute ? (
        <HeaderConversationMenu
          activeConversationId={conversationId}
          className="ml-md"
        />
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-xs">
        <ThemeSelect />
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePalette}
          aria-label="Abrir paleta de comandos (⌘K)"
          className="gap-xs text-muted-foreground"
        >
          <CommandIcon className="size-4" aria-hidden="true" />
          <kbd className="text-xs">⌘K</kbd>
        </Button>
      </div>
    </GlassSurface>
  );
}
