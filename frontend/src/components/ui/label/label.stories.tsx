/**
 * Label — Storybook stories (DS port §4.7).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "../input";

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-sm p-md">
      <Label htmlFor="doc-title">Título do documento</Label>
      <Input id="doc-title" placeholder="Ex.: Ata 12/06" />
    </div>
  ),
};
