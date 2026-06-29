/**
 * GraphNode — Storybook stories.
 *
 * Shown over the ambient backdrop (withAmbientBackdrop) so the translucent glass
 * reads as it will on the graph canvas. This is the presentational node; the
 * React Flow adapter (features/graph) will wrap it with <Handle>s later.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GraphNode } from "./GraphNode";
import type { GraphNodeType } from "./GraphNode.types";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import { withAmbientBackdrop } from "../../../../.storybook/decorators/withAmbientBackdrop";

const TYPES: GraphNodeType[] = [
  "person",
  "organization",
  "project",
  "event",
  "role",
  "category",
  "concept",
  "location",
  "document",
  "task",
];
const STATES: ConfidenceState[] = [
  "accepted",
  "uncertain",
  "low-confidence",
  "disputed",
  "superseded",
];

const meta: Meta<typeof GraphNode> = {
  title: "Components/GraphNode",
  component: GraphNode,
  parameters: { a11y: { element: "#storybook-root" } },
  args: { type: "project", label: "Apollo", state: "accepted" },
  argTypes: {
    type: { control: "select", options: TYPES },
    state: { control: "select", options: [undefined, ...STATES] },
    selected: { control: "boolean" },
    label: { control: "text" },
    subtitle: { control: "text" },
  },
  decorators: [withAmbientBackdrop({})],
};
export default meta;
type Story = StoryObj<typeof GraphNode>;

export const Playground: Story = {};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-md p-md">
      {TYPES.map((t) => (
        <GraphNode key={t} type={t} label={t} state="accepted" />
      ))}
    </div>
  ),
};

export const ConfidenceStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-md p-md">
      {STATES.map((s) => (
        <GraphNode key={s} type="person" label="João Silva" state={s} subtitle={s} />
      ))}
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-md p-md">
      <GraphNode type="organization" label="Acme" state="accepted" />
      <GraphNode type="organization" label="Acme" state="accepted" selected />
    </div>
  ),
};
