/**
 * Popover — Storybook stories.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "@/shared/components/ui/button";

const meta: Meta<typeof Popover> = {
  title: "Eternal/Components/Popover",
  component: Popover,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <div className="p-2xl">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Como em: hoje</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-xs font-medium font-semibold text-foreground">Recorte temporal</p>
          <p className="mt-xs text-xs text-body">
            Selecione uma data para ver o que era verdade naquele dia (as_of).
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
