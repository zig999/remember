/**
 * Input — Storybook stories (DS port §4.5).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { placeholder: "Digite algo…", invalid: false, disabled: false },
  argTypes: { invalid: { control: "boolean" }, disabled: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-sm p-md">
      <Input {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-md p-md">
      <Input placeholder="Padrão" />
      <Input placeholder="Inválido" invalid defaultValue="texto errado" />
      <Input placeholder="Desabilitado" disabled />
    </div>
  ),
};
