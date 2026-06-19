/**
 * Switch — Storybook stories (DS port §4.10).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";
import { Label } from "../label";

const meta: Meta<typeof Switch> = {
  title: "DS/Switch",
  component: Switch,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-md p-md">
      <div className="flex items-center gap-sm">
        <Switch id="s1" />
        <Label htmlFor="s1">Desligado</Label>
      </div>
      <div className="flex items-center gap-sm">
        <Switch id="s2" defaultChecked />
        <Label htmlFor="s2">Ligado</Label>
      </div>
      <div className="flex items-center gap-sm">
        <Switch id="s3" disabled />
        <Label htmlFor="s3" className="peer-disabled:opacity-50">
          Desabilitado
        </Label>
      </div>
    </div>
  ),
};
