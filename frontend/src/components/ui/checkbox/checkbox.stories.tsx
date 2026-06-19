/**
 * Checkbox — Storybook stories (DS port §4.8).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "../label";

const meta: Meta<typeof Checkbox> = {
  title: "DS/Checkbox",
  component: Checkbox,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-md p-md">
      <div className="flex items-center gap-sm">
        <Checkbox id="c1" />
        <Label htmlFor="c1">Não marcado</Label>
      </div>
      <div className="flex items-center gap-sm">
        <Checkbox id="c2" defaultChecked />
        <Label htmlFor="c2">Marcado</Label>
      </div>
      <div className="flex items-center gap-sm">
        <Checkbox id="c3" disabled />
        <Label htmlFor="c3" className="peer-disabled:opacity-50">
          Desabilitado
        </Label>
      </div>
    </div>
  ),
};
