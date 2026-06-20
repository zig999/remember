// TC-01 acceptance criterion: ChatEvent, ChatRunInput, ChatAgentService,
// DoneStopReason, and AnthropicFactory are all exported from
// modules/chat/service/types.ts.
//
// This is a pure type-surface smoke test — types have no runtime, so we
// exercise them via TypeScript-level assertions (assignment + structural
// usage) that must compile. The `vitest run` step confirms typecheck passes
// indirectly; this file also runs as a trivial unit so the test runner
// reports its presence.
//
// Spec ref: chat.back.md §1.2 (ChatAgentService contract).

import { describe, expect, it } from "vitest";

import type {
  AnthropicFactory,
  ChatAgentService,
  ChatAgentServiceDeps,
  ChatEvent,
  ChatMessage,
  ChatRunInput,
  ChatRunStats,
  DoneStopReason,
} from "../../../modules/chat/service/types.js";

describe("chat/service/types — type surface", () => {
  it("ChatEvent discriminated union has all six variants", () => {
    // Structural construction — each variant must compile.
    const start: ChatEvent = { type: "llm_start", iteration: 1 };
    const delta: ChatEvent = { type: "text_delta", delta: "hello" };
    const toolStart: ChatEvent = {
      type: "tool_start",
      tool: "search",
      args_summary: 'query="hello"',
    };
    const toolResult: ChatEvent = { type: "tool_result", tool: "search", ok: true };
    const done: ChatEvent = {
      type: "done",
      stop_reason: "end_turn",
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 20,
    };
    const error: ChatEvent = {
      type: "error",
      code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE",
      message: "provider down",
    };
    // The discriminator survives — runtime sanity.
    expect([start.type, delta.type, toolStart.type, toolResult.type, done.type, error.type])
      .toEqual(["llm_start", "text_delta", "tool_start", "tool_result", "done", "error"]);
  });

  it("DoneStopReason covers the six spec values", () => {
    const reasons: DoneStopReason[] = [
      "end_turn",
      "max_tokens",
      "stop_sequence",
      "max_iterations",
      "turn_timeout",
      "cancelled",
    ];
    expect(reasons).toHaveLength(6);
  });

  it("ChatRunInput / ChatMessage / ChatRunStats / ChatAgentServiceDeps compile", () => {
    // Pure structural usage — if any field is missing, this file does not
    // compile and the test run fails.
    const ac = new AbortController();
    const msg: ChatMessage = { role: "user", content: "oi" };
    const input: ChatRunInput = {
      messages: [msg],
      model: "claude-opus-4-8",
      abortSignal: ac.signal,
    };
    expect(input.messages[0]?.role).toBe("user");

    const stats: ChatRunStats = {
      tokens_in: 0,
      tokens_out: 0,
      iterations: 0,
      tools_called: [],
      stop_reason: "end_turn",
    };
    expect(stats.iterations).toBe(0);

    // Just confirms the alias resolves — the value is never instantiated here.
    const stubFactory: AnthropicFactory = (apiKey: string) => {
      void apiKey;
      // The real return is `AnthropicLike`; tests substitute a stub. We never
      // call the factory in this smoke test.
      throw new Error("stub-not-callable");
    };
    expect(typeof stubFactory).toBe("function");

    // ChatAgentService — confirm it is an interface with `runTurn`.
    const svcStub: ChatAgentService = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      runTurn(_input: ChatRunInput): AsyncIterable<ChatEvent> {
        return (async function* () {
          yield { type: "done", stop_reason: "end_turn", model: "m", tokens_in: 0, tokens_out: 0 };
        })();
      },
    };
    expect(typeof svcStub.runTurn).toBe("function");

    // ChatAgentServiceDeps — confirm the required keys at least compile.
    type _DepsCheck = Pick<ChatAgentServiceDeps, "mcp" | "logger" | "env">;
    const _check: keyof _DepsCheck = "mcp";
    expect(_check).toBe("mcp");
  });
});
