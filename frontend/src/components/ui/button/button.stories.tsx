/**
 * Button — Storybook stories (DS port §4.1).
 *
 * Every non-interactive story doubles as an addon-vitest component test;
 * addon-a11y runs on each (preview.tsx). Variants/sizes remapped to Remember
 * tokens (default=action, secondary=accent, destructive=danger).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "./button";
import type { ButtonVariant, ButtonSize } from "./button.types";

const VARIANTS: ButtonVariant[] = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
];
const SIZES: ButtonSize[] = ["sm", "md", "lg", "icon"];

const meta: Meta<typeof Button> = {
  title: "DS/Button",
  component: Button,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { children: "Botão", variant: "default", size: "md", loading: false },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      {VARIANTS.map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      <Button size="sm">sm</Button>
      <Button size="md">md</Button>
      <Button size="lg">lg</Button>
      <Button size="icon" aria-label="Adicionar">
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      <Button>
        Avançar
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: "Salvando" } };

export const Disabled: Story = {
  args: { disabled: true, children: "Indisponível" },
};

export const LightTheme: Story = {
  decorators: [
    (Story) => (
      <div data-theme="light" className="bg-primary p-xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-wrap items-center gap-md">
      {VARIANTS.map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};
