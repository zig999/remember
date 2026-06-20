// TC-01 acceptance criteria covered:
//   - selectChatPromptModule('v1') returns the v1 module.
//   - selectChatPromptModule('unknown') throws UnknownChatPromptVersionError.
//   - Prompt module v1 exports CHAT_PROMPT_MARKER_V1 as a named string constant.
//
// Spec refs: chat.back.md BR-18 (prompt versioning), BR-20 (output guard marker
// exported from the prompt module).

import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHAT_PROMPT_VERSION,
  selectChatPromptModule,
  UnknownChatPromptVersionError,
} from "../../../modules/chat/prompts/index.js";
import {
  CHAT_PROMPT_MARKER_V1,
  PROMPT_VERSION as V1_PROMPT_VERSION,
  system as v1System,
} from "../../../modules/chat/prompts/v1.js";

describe("chat/prompts", () => {
  // BR-18: known version dispatches to the right module.
  it("selectChatPromptModule('v1') resolves to the v1 module", () => {
    const mod = selectChatPromptModule("v1");
    expect(mod.version).toBe(V1_PROMPT_VERSION);
    expect(mod.marker).toBe(CHAT_PROMPT_MARKER_V1);
    expect(mod.system()).toBe(v1System());
  });

  // BR-18: unknown version is a configuration error, never a silent fallback.
  it("selectChatPromptModule('unknown') throws UnknownChatPromptVersionError", () => {
    expect(() => selectChatPromptModule("vX")).toThrow(
      UnknownChatPromptVersionError
    );
  });

  it("UnknownChatPromptVersionError carries the offending version in its message", () => {
    let err: unknown;
    try {
      selectChatPromptModule("vZ");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnknownChatPromptVersionError);
    expect((err as UnknownChatPromptVersionError).promptVersion).toBe("vZ");
    expect((err as Error).message).toMatch(/Unknown CHAT_PROMPT_VERSION 'vZ'/);
    // It also lists the known versions so the operator can fix the env.
    expect((err as Error).message).toMatch(/v1/);
  });

  // DEFAULT mirrors env.ts default (BR-18 / chat.back.md §8).
  it("DEFAULT_CHAT_PROMPT_VERSION equals v1", () => {
    expect(DEFAULT_CHAT_PROMPT_VERSION).toBe("v1");
  });

  // BR-20: the marker is a named exported string constant — guard imports it
  // without ever reading the prompt body.
  it("CHAT_PROMPT_MARKER_V1 is a non-empty string", () => {
    expect(typeof CHAT_PROMPT_MARKER_V1).toBe("string");
    expect(CHAT_PROMPT_MARKER_V1.length).toBeGreaterThan(0);
  });

  // BR-20: the marker MUST appear in the rendered system prompt — otherwise
  // the output guard has nothing to scrub.
  it("v1.system() includes the marker token in its rendered body", () => {
    expect(v1System().includes(CHAT_PROMPT_MARKER_V1)).toBe(true);
  });

  // BR-18 required content — spot-check a few rules so future edits do not
  // silently weaken the persona.
  it("v1.system() asserts pt-BR, never-invent-ids, data-not-instruction, citation", () => {
    const body = v1System().toLowerCase();
    expect(body).toMatch(/pt-br/);
    expect(body).toMatch(/nunca invente identificadores/);
    expect(body).toMatch(/dado, nunca como\s*\n?\s*instrucao/);
    expect(body).toMatch(/cite a fonte/);
  });
});
