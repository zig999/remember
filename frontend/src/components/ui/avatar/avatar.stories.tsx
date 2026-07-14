/**
 * Avatar — Storybook stories (DS port §4.3).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion as m } from "framer-motion";
import { Avatar } from "./avatar";
import { staggerContainer, listItem } from "@/lib/motion";

const NAMES = [
  "Rodrigo Alves",
  "Ana",
  "Maria da Silva Santos",
  "João Pedro",
  "Beatriz Lima",
];

const meta: Meta<typeof Avatar> = {
  title: "Eternal/Components/Avatar",
  component: Avatar,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { name: "Rodrigo Alves", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-md p-md">
      <Avatar name="Rodrigo Alves" size="sm" />
      <Avatar name="Rodrigo Alves" size="md" />
      <Avatar name="Rodrigo Alves" size="lg" />
    </div>
  ),
};

export const DeterministicColors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      {NAMES.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </div>
  ),
};

/**
 * Group stagger (front.md §9, #3) — a row of avatars cascades in via the
 * `staggerContainer` + `listItem` factories. Hover any avatar to feel the lift.
 */
export const GroupStagger: Story = {
  render: () => (
    <m.div
      variants={staggerContainer(false)}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-sm p-md"
    >
      {NAMES.map((n) => (
        <m.span key={n} variants={listItem(false)}>
          <Avatar name={n} />
        </m.span>
      ))}
    </m.div>
  ),
};
