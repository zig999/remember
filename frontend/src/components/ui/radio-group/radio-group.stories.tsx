/**
 * RadioGroup — Storybook stories (DS port §4.9).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "../label";

const meta: Meta<typeof RadioGroup> = {
  title: "DS/RadioGroup",
  component: RadioGroup,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <div className="p-md">
      <RadioGroup defaultValue="stated">
        {[
          { v: "stated", l: "Data declarada" },
          { v: "document", l: "Data do documento" },
          { v: "received", l: "Data de recebimento" },
        ].map(({ v, l }) => (
          <div key={v} className="flex items-center gap-sm">
            <RadioGroupItem value={v} id={`r-${v}`} />
            <Label htmlFor={`r-${v}`}>{l}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  ),
};
