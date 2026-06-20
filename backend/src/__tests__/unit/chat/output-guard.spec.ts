// TC-02 acceptance criteria covered:
//   - Delta NOT containing the marker: passes through (drop=false), no log.
//   - Delta containing the marker: dropped (drop=true), pino WARN emitted with
//     {event: 'chat.output_guard_drop', marker_version: 'v1'} and NO delta body.
//
// Spec refs: chat.back.md BR-20 (output guard, marker via named constant from
// the prompt module, single String.prototype.includes check, WARN log without
// delta content).

import { describe, expect, it, vi } from "vitest";
import pino, { type Logger } from "pino";

import { inspectDelta } from "../../../modules/chat/service/output-guard.js";
import { CHAT_PROMPT_MARKER_V1 } from "../../../modules/chat/prompts/v1.js";

/** Build a silent pino logger with a spy on `.warn`. */
function makeLoggerWithSpy(): { logger: Logger; warn: ReturnType<typeof vi.fn> } {
  const warn = vi.fn();
  // Silent base logger so the test output stays clean; we override `.warn`.
  const base = pino({ level: "silent" });
  const logger: Logger = Object.assign(base, { warn }) as unknown as Logger;
  return { logger, warn };
}

describe("chat/output-guard", () => {
  // BR-20: clean delta passes through unchanged.
  it("delta without marker: drop=false, no log emitted", () => {
    const { logger, warn } = makeLoggerWithSpy();
    const result = inspectDelta("Olá, posso ajudar?", logger);
    expect(result.drop).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  // BR-20: delta containing the marker is dropped + WARN logged.
  it("delta with marker: drop=true, WARN with marker_version, NO delta content", () => {
    const { logger, warn } = makeLoggerWithSpy();
    const leaked = `text before ${CHAT_PROMPT_MARKER_V1} text after`;
    const result = inspectDelta(leaked, logger);
    expect(result.drop).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    // The first arg is the structured payload; the second is the message.
    const [payload, message] = warn.mock.calls[0] as [Record<string, unknown>, string];
    expect(payload).toEqual({
      event: "chat.output_guard_drop",
      marker_version: "v1",
    });
    // Critical: neither the delta body nor the marker itself is in the log.
    const serialised = `${JSON.stringify(payload)} ${message}`;
    expect(serialised).not.toContain("text before");
    expect(serialised).not.toContain("text after");
    expect(serialised).not.toContain(CHAT_PROMPT_MARKER_V1);
  });

  // BR-20: marker check is substring-based (`String.prototype.includes`).
  it("delta exactly equal to the marker: drop=true", () => {
    const { logger, warn } = makeLoggerWithSpy();
    const result = inspectDelta(CHAT_PROMPT_MARKER_V1, logger);
    expect(result.drop).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  // BR-20: empty delta is a no-op.
  it("empty delta: drop=false, no log emitted", () => {
    const { logger, warn } = makeLoggerWithSpy();
    const result = inspectDelta("", logger);
    expect(result.drop).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  // Resilience: a delta with the marker prefix only (no surrounding text)
  // also drops. This guards against the model echoing the marker as a
  // standalone token at the start of a chunk.
  it("delta with only the marker as prefix: drop=true", () => {
    const { logger } = makeLoggerWithSpy();
    expect(inspectDelta(`${CHAT_PROMPT_MARKER_V1} rest`, logger).drop).toBe(true);
  });
});
