/**
 * CommandPalette — the global ⌘K palette (frontend-analise-funcional.md §9,
 * layout.md §5 z4). Mounted once by the AppShell.
 *
 * - Open state lives in the `command-palette` store (the header ⌘K button also
 *   toggles it).
 * - Global keybind: ⌘K (mac) / Ctrl+K toggles; Esc closes (Dialog default).
 * - Actions: navigate to the five areas; toggle theme. (Opening the as_of time
 *   picker from here will be added with the time-travel wiring.)
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Network,
  Search,
  Upload,
  Scale,
  History,
  SunMoon,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/state/command-palette";
import { useThemeStore } from "@/state/theme";

const AREAS = [
  { to: "/graph", label: "Grafo", icon: Network },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/ingest", label: "Ingerir", icon: Upload },
  { to: "/curation", label: "Curar", icon: Scale },
  { to: "/history", label: "Histórico", icon: History },
] as const;

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const navigate = useNavigate();
  const toggleTheme = useThemeStore((s) => s.toggle);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Close the palette, then run the action.
  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar áreas e ações…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ir para">
          {AREAS.map((a) => (
            <CommandItem
              key={a.to}
              value={a.label}
              onSelect={() => run(() => void navigate({ to: a.to }))}
            >
              <a.icon className="size-4 text-muted" aria-hidden="true" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Ações">
          <CommandItem value="Alternar tema" onSelect={() => run(toggleTheme)}>
            <SunMoon className="size-4 text-muted" aria-hidden="true" />
            Alternar tema
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
