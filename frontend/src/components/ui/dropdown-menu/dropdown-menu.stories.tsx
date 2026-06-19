/**
 * DropdownMenu — Storybook stories.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { Button } from "../button";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Settings_: Story = {
  name: "Settings menu",
  render: () => {
    function Demo() {
      const [light, setLight] = useState(false);
      return (
        <div className="p-2xl">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Configurações">
                <Settings className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Configurações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={light} onCheckedChange={setLight}>
                Tema claro
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem>Atalhos de teclado</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return <Demo />;
  },
};
