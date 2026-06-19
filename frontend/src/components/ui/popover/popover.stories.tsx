/**
 * Popover — Storybook stories.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "../button";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
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
          <p className="text-label font-semibold text-content">Recorte temporal</p>
          <p className="mt-xs text-body-sm text-body">
            Selecione uma data para ver o que era verdade naquele dia (as_of).
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
