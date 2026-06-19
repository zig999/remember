/**
 * Select — Storybook stories (DS port §4.11).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";

const meta: Meta<typeof Select> = {
  title: "DS/Select",
  component: Select,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="max-w-xs p-md">
      <Select defaultValue="grafo">
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grafo">Grafo</SelectItem>
          <SelectItem value="busca">Busca</SelectItem>
          <SelectItem value="ingestao">Ingestão</SelectItem>
          <SelectItem value="curadoria" disabled>
            Curadoria (em breve)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
