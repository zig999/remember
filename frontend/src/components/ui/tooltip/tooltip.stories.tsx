/**
 * Tooltip — Storybook stories.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
import { Button } from "../button";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { a11y: { element: "#storybook-root" } },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={150}>
        <div className="p-2xl">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="outline">Passe o mouse</Button>
      </TooltipTrigger>
      <TooltipContent>Abre o explorador centrado neste nó</TooltipContent>
    </Tooltip>
  ),
};
