import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Network,
  Search,
  Upload,
  Scale,
  History,
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
              <a.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
