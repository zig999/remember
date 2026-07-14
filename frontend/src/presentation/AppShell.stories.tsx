/**
 * Presentation / AppShell — the full 3-region frame in context.
 *
 * Renders the real `AppShell` (`src/shell/AppShell.tsx`): fixed Header + Footer
 * (glass) over the ambient landscape backdrop (`public/backdrop/cityscape-dusk.png`,
 * from `images/background.png`), with placeholder workspace content between them.
 * Uses `layout: "fullscreen"` so the fixed frame fills the Storybook canvas.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "@/shell/AppShell";
import { withRouter } from "../../.storybook/decorators/withRouter";
import { withQueryClient, seedShellHealthy } from "../../.storybook/decorators/withQueryClient";

const meta: Meta<typeof AppShell> = {
  title: "Eternal/Presentation/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    a11y: { element: "#storybook-root" },
  },
  decorators: [withRouter(), withQueryClient(seedShellHealthy)],
};
export default meta;
type Story = StoryObj<typeof AppShell>;

export const Default: Story = {
  name: "Header · Footer · Backdrop",
  render: () => (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center p-2xl">
        <p className="font-sans text-lg font-semibold tracking-tight text-foreground">Área de trabalho</p>
      </div>
    </AppShell>
  ),
};
