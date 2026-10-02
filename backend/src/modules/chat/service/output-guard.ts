import type { Logger } from "pino";

import { CHAT_PROMPT_MARKER_V1 } from "../prompts/v1.js";

const MARKER_VERSION = "v1" as const;

export interface OutputGuardDecision {
  readonly drop: boolean;
}

export function inspectDelta(delta: string, logger: Logger): OutputGuardDecision {
  if (delta.length > 0 && delta.includes(CHAT_PROMPT_MARKER_V1)) {
    logger.warn(
      { event: "chat.output_guard_drop", marker_version: MARKER_VERSION },
      "chat output guard dropped a delta containing the system-prompt marker"
    );
    return { drop: true };
  }
  return { drop: false };
}
