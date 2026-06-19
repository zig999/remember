/**
 * Textarea — Storybook stories (DS port §4.6).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "DS/Textarea",
  component: Textarea,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { placeholder: "Cole o conteúdo bruto aqui…", invalid: false, disabled: false },
  argTypes: { invalid: { control: "boolean" }, disabled: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-md p-md">
      <Textarea {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-md p-md">
      <Textarea placeholder="Padrão" />
      <Textarea placeholder="Inválido" invalid defaultValue="conteúdo inválido" />
      <Textarea placeholder="Desabilitado" disabled />
    </div>
  ),
};
