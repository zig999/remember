/**
 * AppToaster — Storybook stories.
 *
 * The toast is styled as a GlassSurface `level="panel"` (translucent + frosted
 * blur + glass border/shadow — see AppToaster). sonner portals each toast to
 * `document.body` and positions it `fixed` top-right, so the stories render
 * the real <AmbientBackdrop> full-bleed underneath: the frosted blur is only
 * visible when there is treated content behind the glass (mirrors the
 * GlassSurface stories' `withAmbientBackdrop` rule).
 *
 * - Playground — buttons fire each toast type; inspect the glass surface live.
 * - GlassShowcase — play function fires two toasts so the frosted stack is
 *   visible in the canvas and asserted (also runs as a Vitest browser test).
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { useEffect, type ReactElement } from "react";
import { toast } from "sonner";
import { expect, userEvent, within } from "storybook/test";
import { AppToaster } from "./AppToaster";
import { AmbientBackdrop } from "./AmbientBackdrop";

/**
 * Set `data-theme="dark"` on <html> defensively so the backdrop tokens resolve
 * over the dark cityscape — matching the GlassSurface Panel/Dark & Modal/Dark
 * stories. The app is dark-only; AppToaster pins sonner's own data-theme to
 * "dark" so the toast renders as DARK frosted glass.
 */
const withDarkTheme: Decorator = (Story) => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);
  return <Story />;
};

const meta: Meta<typeof AppToaster> = {
  title: "Eternal/Shell/AppToaster",
  component: AppToaster,
  parameters: { layout: "fullscreen" },
  decorators: [withDarkTheme],
};

export default meta;
type Story = StoryObj<typeof AppToaster>;

const triggerClass =
  "rounded-md border border-border bg-surface px-md py-sm text-xs text-foreground hover:bg-elevated";

/** Backdrop + trigger buttons + the toaster under test. */
const Demo = (): ReactElement => (
  <div className="relative min-h-screen p-2xl">
    <AmbientBackdrop />
    <div className="flex flex-wrap gap-md">
      <button
        type="button"
        className={triggerClass}
        onClick={() =>
          toast("Documento ingerido", {
            description: "5 fragmentos extraídos, 3 consolidados.",
          })
        }
      >
        Padrão
      </button>
      <button
        type="button"
        className={triggerClass}
        onClick={() => toast.success("Atributo consolidado")}
      >
        Sucesso
      </button>
      <button
        type="button"
        className={triggerClass}
        onClick={() => toast.error("Algo deu errado. Tente novamente.")}
      >
        Erro
      </button>
      <button
        type="button"
        className={triggerClass}
        onClick={() => toast.warning("Confiança incerta (0.40–0.74)")}
      >
        Aviso
      </button>
      <button
        type="button"
        className={triggerClass}
        onClick={() => toast.info("Run de ingestão em andamento")}
      >
        Info
      </button>
    </div>
    <AppToaster />
  </div>
);

export const Playground: Story = {
  render: () => <Demo />,
};

export const GlassShowcase: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Erro" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Sucesso" }));
    // Toasts portal to document.body, outside the story canvas root.
    const portal = within(document.body);
    expect(
      await portal.findByText("Algo deu errado. Tente novamente."),
    ).toBeTruthy();
    expect(await portal.findByText("Atributo consolidado")).toBeTruthy();
  },
};
