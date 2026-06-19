/**
 * CommandPalette — Storybook story. Forces the palette open (via the store) so
 * the wired ⌘K palette renders; withRouter supplies useNavigate for the actions.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { CommandPalette } from "./CommandPalette";
import { useCommandPaletteStore } from "@/state/command-palette";
import { withRouter } from "../../.storybook/decorators/withRouter";

function OpenPalette() {
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  useEffect(() => {
    setOpen(true);
    return () => setOpen(false);
  }, [setOpen]);
  return <CommandPalette />;
}

const meta: Meta = {
  title: "Components/CommandPalette",
  parameters: { layout: "fullscreen", a11y: { element: "#storybook-root" } },
  decorators: [withRouter()],
};
export default meta;
type Story = StoryObj;

export const Open: Story = { render: () => <OpenPalette /> };
