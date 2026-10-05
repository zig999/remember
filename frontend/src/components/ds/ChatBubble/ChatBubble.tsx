import type { FC, ReactElement } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { transitionGlassModal } from "@/lib/motion";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { chatBubble } from "./ChatBubble.variants";
import type { ChatBubbleProps } from "./ChatBubble.types";

const STOP_NOTICE_BY_REASON: Readonly<Record<string, string>> = {
  cancelled: "Resposta interrompida",
};

function ToolChipStub({
  tool,
  ok,
}: {
  readonly tool: string;
  readonly ok: boolean | null;
}): ReactElement {
  const tone =
    ok === null
      ? "border-border-glass text-muted-foreground"
      : ok
        ? "border-border-accepted text-state-accepted-fg"
        : "border-border-error text-state-disputed-fg";
  return (
    <span
      data-testid="tool-chip-stub"
      data-tool={tool}
      data-ok={ok === null ? "pending" : ok ? "ok" : "error"}
      className={cn(
        "inline-flex items-center gap-xs rounded-pill border bg-surface-glass-ambient px-sm py-xs text-xs",
        tone,
      )}
    >
      {tool}
    </span>
  );
}

function StreamingCursorStub(): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-testid="streaming-cursor"
      className="ml-[1px] inline-block animate-pulse text-foreground"
    >
      {"▍"}
    </span>
  );
}

export const ChatBubble: FC<ChatBubbleProps> = ({
  variant,
  content,
  streaming = false,
  error = false,
  stopReason,
  animate = true,
  toolChips,
  className,
  ref,
  ...rest
}) => {
  const prefersReducedMotion = useReducedMotion() === true;
  const motionAllowed = animate && !prefersReducedMotion;

  const stopNotice =
    stopReason !== undefined ? STOP_NOTICE_BY_REASON[stopReason] : undefined;

  const ariaBusy = streaming ? "true" : undefined;

  const glassAccent = error ? "error" : "none";

  const glassFill = variant === "user" ? "ambient" : "ambient-accent";

  return (
    <div
      ref={ref}
      data-variant={variant}
      data-state={
        error
          ? "error"
          : streaming
            ? "streaming"
            : stopNotice !== undefined
              ? "stopped"
              : "idle"
      }
      className={cn(chatBubble({ variant }), className)}
      {...(ariaBusy !== undefined ? { "aria-busy": ariaBusy } : {})}
      {...rest}
    >
      {toolChips !== undefined && toolChips.length > 0 ? (
        <div
          data-testid="tool-chips"
          className="flex flex-wrap items-center gap-xs"
        >
          {toolChips.map((chip, i) => (
            <ToolChipStub key={`${chip.tool}:${i}`} tool={chip.tool} ok={chip.ok} />
          ))}
        </div>
      ) : null}

      <GlassSurface
        level="modal"
        accent={glassAccent}
        fill={glassFill}
        radius="rounded-sm"
        animate={motionAllowed}
        className="px-md py-sm"
        data-motion-source={
          motionAllowed && transitionGlassModal !== undefined
            ? "transitionGlassModal"
            : undefined
        }
      >
        <p
          data-testid="bubble-content"
          className="whitespace-pre-wrap break-words text-xs text-foreground"
        >
          {content}
          {streaming ? <StreamingCursorStub /> : null}
        </p>
      </GlassSurface>

      {stopNotice !== undefined ? (
        <p
          data-testid="stop-notice"
          className="text-xs text-muted-foreground"
        >
          {stopNotice}
        </p>
      ) : null}
    </div>
  );
};
