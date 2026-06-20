/**
 * ChatBubble — Storybook stories (TC-05).
 *
 * Mirrors the spec §4 state matrix (idle / streaming / error / stopped /
 * entering) plus the §6 variant axis (user / assistant). Every non-interactive
 * story doubles as a Vitest component test via addon-vitest browser mode.
 * addon-a11y verifies WCAG 2.2 AA on every story.
 *
 * Story families:
 *  - Variants  — UserBubble, AssistantBubble (the §6 alignment axis)
 *  - States    — Idle, Streaming, Error, Stopped (the §4 state matrix)
 *  - Motion    — Entering (interactive — toggles mount to replay the
 *                transitionGlassModal enter variant), ReducedMotionStatic
 *  - Slots     — WithToolChips, LongContent (max-width cap visual proof)
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactElement } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChatBubble } from "./ChatBubble";
import { withAmbientBackdrop } from "../../../../.storybook/decorators/withAmbientBackdrop";
import type { ToolCallData } from "@/features/chat/types";

const meta: Meta<typeof ChatBubble> = {
  title: "Components/ChatBubble",
  component: ChatBubble,
  parameters: {
    a11y: { element: "#storybook-root" },
  },
  args: {
    variant: "assistant",
    content: "Olá. Esta é uma mensagem do assistente.",
    streaming: false,
    error: false,
    animate: true,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["user", "assistant"] },
    content: { control: "text" },
    streaming: { control: "boolean" },
    error: { control: "boolean" },
    animate: { control: "boolean" },
    stopReason: {
      control: "select",
      options: [undefined, "cancelled", "end_turn", "max_tokens"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatBubble>;

/** Common container so the bubble has room to align (self-end / self-start). */
function PaneFrame({ children }: { readonly children: ReactElement }): ReactElement {
  return <div className="flex w-[640px] flex-col gap-md p-lg">{children}</div>;
}

/* ---------- Variants --------------------------------------------------- */

export const UserBubble: Story = {
  name: "Variant/User",
  args: {
    variant: "user",
    content: "Quem é o Rodrigo?",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

export const AssistantBubble: Story = {
  name: "Variant/Assistant",
  args: {
    variant: "assistant",
    content:
      "Rodrigo é um colaborador do projeto Apollo. Encontrei 3 documentos relacionados.",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

/* ---------- States ----------------------------------------------------- */

export const StateIdle: Story = {
  name: "State/Idle",
  args: {
    variant: "assistant",
    content: "Resposta consolidada — sem fluxo ativo.",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

export const StateStreaming: Story = {
  name: "State/Streaming",
  args: {
    variant: "assistant",
    content: "Estou pensando sobre isso e ",
    streaming: true,
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

export const StateError: Story = {
  name: "State/Error",
  args: {
    variant: "assistant",
    content: "Não foi possível concluir esta resposta.",
    error: true,
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

export const StateStopped: Story = {
  name: "State/Stopped",
  args: {
    variant: "assistant",
    content: "Estava chegando à conclusão quando ",
    stopReason: "cancelled",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

/* ---------- Motion ----------------------------------------------------- */

/**
 * Motion/Entering — interactive: a button toggles mount of the bubble so the
 * `transitionGlassModal` enter variant plays once on each mount. addon-vitest
 * captures the play-function interaction as a browser-mode test.
 */
export const MotionEntering: Story = {
  name: "Motion/Entering",
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: () => {
    function Demo(): ReactElement {
      const [mounted, setMounted] = useState(false);
      return (
        <PaneFrame>
          <div className="flex flex-col items-start gap-md">
            <button
              type="button"
              onClick={() => setMounted((m) => !m)}
              className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
              data-testid="bubble-toggle"
            >
              {mounted ? "Desmontar bolha" : "Montar bolha"}
            </button>
            {mounted ? (
              <ChatBubble
                variant="assistant"
                content="Bolha recém-montada."
                data-testid="motion-bubble"
              />
            ) : null}
          </div>
        </PaneFrame>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("bubble-toggle");
    await userEvent.click(btn);
    const bubble = await canvas.findByTestId("motion-bubble");
    expect(bubble).toBeTruthy();
    // The bubble itself is the wrapper; the inner glass carries the motion
    // marker. Query within the bubble for the glass element.
    const glass = bubble.querySelector("[data-level='modal']");
    expect(glass).toBeTruthy();
    expect(glass!.getAttribute("data-motion-variant")).toBe("glass-modal");
    expect(glass!.getAttribute("data-motion-source")).toBe(
      "transitionGlassModal",
    );
  },
};

export const MotionReducedMotion: Story = {
  name: "Motion/ReducedMotionStatic",
  args: {
    variant: "assistant",
    content: "Sem animação de entrada (prefers-reduced-motion: reduce).",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  parameters: { reducedMotion: "reduce" },
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

/* ---------- Slots ------------------------------------------------------ */

const SAMPLE_CHIPS: ReadonlyArray<ToolCallData> = [
  { tool: "search", argsSummary: "q=Rodrigo", ok: true },
  { tool: "get_node", argsSummary: "id=…", ok: true },
  { tool: "traverse", argsSummary: "from=…", ok: null },
];

export const WithToolChips: Story = {
  name: "Slot/WithToolChips",
  args: {
    variant: "assistant",
    content: "Consultei o grafo e encontrei estas referências:",
    toolChips: SAMPLE_CHIPS,
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};

export const LongContent: Story = {
  name: "Slot/LongContent",
  args: {
    variant: "assistant",
    content:
      "Esta é uma resposta longa que serve para demonstrar o cap de largura máxima (75ch) aplicado pela CVA do wrapper — sem o cap a bolha se espalharia por toda a largura da janela, prejudicando a legibilidade prosaica (CLAUDE.md u-fe-standards: text containers max-width 65–75ch). Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <PaneFrame>
      <ChatBubble {...args} />
    </PaneFrame>
  ),
};
