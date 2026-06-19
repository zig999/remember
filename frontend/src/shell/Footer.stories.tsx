/**
 * Footer — Storybook stories. Rendered `relative` (not fixed) so it sits in flow.
 * The as_of segment is live (client store + Popover); health/curation/run come
 * via props (the live BFF hooks land in Phase 2b).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer } from "./Footer";
import { withRouter } from "../../.storybook/decorators/withRouter";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: { a11y: { element: "#storybook-root" } },
  decorators: [
    withRouter(),
    (Story) => (
      <div className="bg-primary p-md">
        <Story />
      </div>
    ),
  ],
  args: { className: "relative" },
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const Checking: Story = { args: { health: "checking" } };
export const Online: Story = { args: { health: "ok" } };
export const Offline: Story = { args: { health: "down" } };
export const Busy: Story = {
  name: "Online · pendências · run",
  args: {
    health: "ok",
    curationPending: 3,
    activeRun: { label: "Extraindo… 18 fatos" },
  },
};
