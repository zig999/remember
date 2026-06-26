// Unit tests for the chat-summary prompt registry + v2 module (BR-46, NEW
// v2.9). These cover:
//
//   - Registry resolution: `selectChatSummaryPromptModule('v2')` returns the
//     v2 module; `'v1'` resolves for back-compat; unknown values throw
//     `UnknownChatSummaryPromptVersionError`.
//   - v2 module surface: `system` is a non-empty pt-BR string; `buildUserTurn`
//     returns a single user message whose composed text contains the prior
//     summary, the slice rendering, and the "Tarefa:" task line.
//   - `buildUserTurn(null, slice)` renders "(vazio)" for the prior-summary
//     section (first refresh of a conversation, BR-46).
//   - `buildUserTurn` is byte-stable for the same inputs (regression guard
//     for any future caching invariant on the path).

import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

import {
  DEFAULT_CHAT_SUMMARY_PROMPT_VERSION,
  selectChatSummaryPromptModule,
  UnknownChatSummaryPromptVersionError,
} from "../chat-summary/index.js";

describe("selectChatSummaryPromptModule (BR-46 registry)", () => {
  it("returns a module with both `system` and `buildUserTurn` for 'v2'", async () => {
    const mod = selectChatSummaryPromptModule("v2");
    expect(mod.version).toBe("v2");
    expect(typeof mod.system).toBe("string");
    expect(mod.system.length).toBeGreaterThan(0);
    expect(typeof mod.buildUserTurn).toBe("function");
  });

  it("resolves 'v1' for back-compat (not reachable via BR-33 v2.9 but registered)", async () => {
    // BR-46 module-registry rule: `v1` remains exported. Service code should
    // not select it in production, but a future revision may re-use it; the
    // registry MUST keep it resolvable.
    const mod = selectChatSummaryPromptModule("v1");
    expect(mod.version).toBe("v1");
    expect(typeof mod.system).toBe("string");
    expect(typeof mod.buildUserTurn).toBe("function");
  });

  it("throws UnknownChatSummaryPromptVersionError on an unregistered version", async () => {
    // BR-46: fail-closed at boot — an unknown version is a config error.
    expect(() => selectChatSummaryPromptModule("v999")).toThrow(
      UnknownChatSummaryPromptVersionError
    );
    expect(() => selectChatSummaryPromptModule("")).toThrow(
      UnknownChatSummaryPromptVersionError
    );
  });

  it("default version matches what env.ts uses (v2)", async () => {
    // Tracks the env default. If a future revision bumps the env default
    // without bumping this export the test catches the drift.
    expect(DEFAULT_CHAT_SUMMARY_PROMPT_VERSION).toBe("v2");
  });
});

describe("chat-summary v2 module — buildUserTurn (BR-46)", () => {
  const mod = selectChatSummaryPromptModule("v2");

  const sliceFixture: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: [{ type: "text", text: "Quem e o Antonio?" }],
    },
    {
      role: "assistant",
      content: [{ type: "text", text: "Antonio e gerente do projeto Apollo." }],
    },
  ];

  it("returns a single user message whose text contains the prior summary, the slice, and the task line", async () => {
    const prev =
      "O dono falou sobre o projeto Apollo. Decidiu adiar o lancamento.";
    const turn = mod.buildUserTurn(prev, sliceFixture);

    expect(turn).toHaveLength(1);
    expect(turn[0]!.role).toBe("user");
    // Anthropic content can be string OR block array; v2 returns an array.
    const blocks = turn[0]!.content;
    expect(Array.isArray(blocks)).toBe(true);
    const composed = (blocks as Array<{ text: string }>)[0]!.text;

    expect(composed).toContain("Resumo anterior:");
    expect(composed).toContain(prev);
    expect(composed).toContain("Mensagens novas a incorporar (ordem cronologica):");
    expect(composed).toContain("Quem e o Antonio?");
    expect(composed).toContain("Antonio e gerente do projeto Apollo.");
    expect(composed).toContain("Tarefa: atualize o resumo anterior");
  });

  it("renders '(vazio)' for summary_prev=null (BR-46 first-refresh contract)", async () => {
    const turn = mod.buildUserTurn(null, sliceFixture);
    const composed = (turn[0]!.content as Array<{ text: string }>)[0]!.text;
    expect(composed).toContain("Resumo anterior:");
    expect(composed).toContain("(vazio)");
    // Must NOT contain a stray "null" token where the prior summary would go.
    expect(composed).not.toMatch(/Resumo anterior:\s*null/);
  });

  it("is byte-stable for the same inputs (regression guard for future caching)", async () => {
    // BR-46 caching invariant + module determinism: same inputs -> identical
    // output. Mutating the inputs in any way would break the (hypothetical)
    // prefix cache hit AND any test fixture that relies on the rendered text.
    const prev = "Resumo qualquer.";
    const a = mod.buildUserTurn(prev, sliceFixture);
    const b = mod.buildUserTurn(prev, sliceFixture);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("renders '(nenhuma)' when the slice is empty (defensive)", async () => {
    // The service guards against an empty slice before calling the module,
    // but the module itself must produce a coherent template when handed []
    // (used by unit fixtures and future call sites).
    const turn = mod.buildUserTurn("prev", []);
    const composed = (turn[0]!.content as Array<{ text: string }>)[0]!.text;
    expect(composed).toContain("Mensagens novas a incorporar");
    expect(composed).toContain("(nenhuma)");
  });

  it("renders tool_use blocks as '<tool>: <args>' instead of echoing raw JSON", async () => {
    // BR-46 row serialisation rule: tool_use blocks become `<name>: <args>`.
    // This keeps the composed text compact and human-readable for the
    // summariser persona (which is asked NOT to echo raw arguments).
    const slice: Anthropic.Messages.MessageParam[] = [
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_x",
            name: "search",
            input: { q: "Antonio" },
          },
        ],
      },
    ];
    const composed = (mod
      .buildUserTurn(null, slice)[0]!
      .content as Array<{ text: string }>)[0]!.text;
    expect(composed).toContain("search: ");
    expect(composed).toContain("Antonio");
  });
});

describe("chat-summary v2 module — system text invariants", () => {
  it("system text is pt-BR and references the soft cap", async () => {
    const mod = selectChatSummaryPromptModule("v2");
    expect(mod.system).toContain("pt-BR");
    expect(mod.system).toContain("Sintetizador");
    // Soft cap of ~8 sentences is part of the persona — tests catch a future
    // accidental drop of the directive.
    expect(mod.system).toMatch(/8 frases/);
  });

  it("system text is byte-stable across reads (module-scope literal)", async () => {
    const a = selectChatSummaryPromptModule("v2").system;
    const b = selectChatSummaryPromptModule("v2").system;
    expect(a).toBe(b);
  });
});
