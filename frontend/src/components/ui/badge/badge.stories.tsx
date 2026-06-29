/**
 * Badge — Storybook stories (DS port §4.2). Generic status pill.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { motion as m } from "framer-motion";
import { Badge } from "./badge";
import { popIn, countPulse } from "@/lib/motion";
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
  title: "Components/Badge",
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

/**
 * Motion (front.md §9, #2) — `pop-in` on appear + `count-pulse` on change,
 * consuming the canonical factories from `lib/motion.ts`. Click to increment;
 * the counter badge pulses.
 */
export const Motion: Story = {
  render: () => {
    function Demo() {
      const [n, setN] = useState(3);
      return (
        <div className="flex items-center gap-lg p-md">
          <m.span variants={popIn(false)} initial="hidden" animate="visible">
            <Badge>Novo</Badge>
          </m.span>
          <m.span
            key={n}
            variants={countPulse(false)}
            initial="rest"
            animate="pulse"
            className="inline-block"
          >
            <Badge variant="accent">{n}</Badge>
          </m.span>
          <button
            onClick={() => setN((x) => x + 1)}
            className="rounded-pill border border-border px-md py-1 text-label text-content transition active:scale-95"
          >
            +1
          </button>
        </div>
      );
    }
    return <Demo />;
  },
};
