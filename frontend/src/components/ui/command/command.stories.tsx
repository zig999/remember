/**
 * Command — Storybook stories. Inline palette (always-open) so it renders
 * standalone; the ⌘K wiring (CommandDialog + global keybind) lands with the shell.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Network, Search, Upload, Scale, History } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./command";

const meta: Meta<typeof Command> = {
  title: "Eternal/Components/Command",
  component: Command,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Command>;

export const Palette: Story = {
  render: () => (
    <div className="max-w-xl rounded-md border border-border p-md">
      <Command>
        <CommandInput placeholder="Buscar áreas e ações…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ir para">
            <CommandItem>
              <Network className="size-4 text-muted-foreground" aria-hidden="true" /> Grafo
            </CommandItem>
            <CommandItem>
              <Search className="size-4 text-muted-foreground" aria-hidden="true" /> Buscar
            </CommandItem>
            <CommandItem>
              <Upload className="size-4 text-muted-foreground" aria-hidden="true" /> Ingerir
            </CommandItem>
            <CommandItem>
              <Scale className="size-4 text-muted-foreground" aria-hidden="true" /> Curar
            </CommandItem>
            <CommandItem>
              <History className="size-4 text-muted-foreground" aria-hidden="true" /> Histórico
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações">
            <CommandItem>Alternar tema</CommandItem>
            <CommandItem>Recorte temporal (as_of)…</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
};
