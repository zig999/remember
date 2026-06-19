/**
 * Badge — Storybook stories (DS port §4.2). Generic status pill.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import type { BadgeVariant } from "./badge.types";

const VARIANTS: BadgeVariant[] = [
  "default",
  "accent",
  "data",
  "success",
  "warning",
  "danger",
  "outline",
];

const meta: Meta<typeof Badge> = {
  title: "DS/Badge",
  component: Badge,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { children: "Badge", variant: "default" },
  argTypes: { variant: { control: "select", options: VARIANTS } },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      {VARIANTS.map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
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
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
