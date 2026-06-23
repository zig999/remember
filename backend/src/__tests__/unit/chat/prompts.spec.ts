// TC-01 + TC-03 (v2.4) + TC-01 (v2.5) acceptance criteria covered:
//   - selectChatPromptModule('v1') returns the v1 module.
//   - selectChatPromptModule('v2') returns the v2 module (v2.4 / TC-03).
//   - selectChatPromptModule('v3') returns the v3 module (v2.5 / TC-01).
//   - selectChatPromptModule('unknown') throws UnknownChatPromptVersionError.
//   - Prompt module v1 exports CHAT_PROMPT_MARKER_V1 as a named string constant.
//   - Prompt module v2 re-exports the SAME marker token (BR-20 stable across
//     versions — TC-03).
//   - DEFAULT_CHAT_PROMPT_VERSION === 'v3' (BR-18 v3 — chat.back.md v2.5).
//   - v2.system() body carries the three pt-BR ingestion directives (TC-03).
//
// Spec refs: chat.back.md BR-18 v3 (prompt versioning + `system(catalog)`
// signature widening; ontology-aware v3), BR-20 (output guard marker exported
// from the prompt module — stable across versions).

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/knowledge-graph/catalog/catalog.js";
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
import {
  PROMPT_VERSION as V2_PROMPT_VERSION,
  system as v2System,
} from "../../../modules/chat/prompts/v2.js";

// Empty CatalogSnapshot used by tests that only need to exercise v1/v2 (both
// ignore the argument — BR-18 v3 backward-compat).
const EMPTY_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

describe("chat/prompts", () => {
  // BR-18: known version dispatches to the right module.
  it("selectChatPromptModule('v1') resolves to the v1 module", () => {
    const mod = selectChatPromptModule("v1");
    expect(mod.version).toBe(V1_PROMPT_VERSION);
    expect(mod.marker).toBe(CHAT_PROMPT_MARKER_V1);
    // v2.5 BR-18 v3: signature widened to `system(catalog)`; v1 ignores
    // the argument (backward-compat).
    expect(mod.system(EMPTY_CATALOG)).toBe(v1System(EMPTY_CATALOG));
  });

  // BR-18 v2.4: known version 'v2' dispatches to the v2 module.
  it("selectChatPromptModule('v2') resolves to the v2 module", () => {
    const mod = selectChatPromptModule("v2");
    expect(mod.version).toBe(V2_PROMPT_VERSION);
    // BR-20: marker is STABLE across versions — v2 carries the v1 marker.
    expect(mod.marker).toBe(CHAT_PROMPT_MARKER_V1);
    // v2.5 BR-18 v3: signature widened to `system(catalog)`; v2 ignores
    // the argument (backward-compat).
    expect(mod.system(EMPTY_CATALOG)).toBe(v2System(EMPTY_CATALOG));
  });

  // BR-18 v3 / chat.back.md v2.5: 'v3' is now registered (ontology-aware
  // prompt). Detailed v3 coverage lives in
  // modules/chat/prompts/__tests__/v3.spec.ts (Testing rows xix–xxiii).
  it("selectChatPromptModule('v3') resolves to the v3 module", () => {
    const mod = selectChatPromptModule("v3");
    expect(mod.version).toBe("v3");
    // BR-20: marker is STABLE across versions — v3 carries the v1 marker.
    expect(mod.marker).toBe(CHAT_PROMPT_MARKER_V1);
  });

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
    // v2.4: v2 is also listed among known versions.
    expect((err as Error).message).toMatch(/v2/);
  });

  // DEFAULT bumped from v2 to v3 in v2.5 (BR-18 v3 / chat.back.md §8).
  // v2.4 (TC-03) previously bumped from v1 to v2.
  it("DEFAULT_CHAT_PROMPT_VERSION equals v3", () => {
    expect(DEFAULT_CHAT_PROMPT_VERSION).toBe("v3");
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

  // BR-20 stability: v2.system() MUST plant the v1 marker at the head of the
  // body. The marker is inherited verbatim — no new marker token in v2.
  it("v2.system() includes the v1 marker token (BR-20 stable across versions)", () => {
    expect(v2System().includes(CHAT_PROMPT_MARKER_V1)).toBe(true);
  });

  // BR-18 v2.4 — v2 carries v1 verbatim + the three ingestion directives.
  it("v2.system() body starts with the v1 prompt verbatim", () => {
    expect(v2System().startsWith(v1System())).toBe(true);
  });

  // BR-18 v2.4 — directive 1: explicit Owner request required + signal
  // phrases + document-content-as-data clause (v7 §13).
  it("v2.system() requires explicit Owner request to call start_async_ingestion", () => {
    const body = v2System();
    expect(body).toMatch(/start_async_ingestion/);
    expect(body.toLowerCase()).toMatch(/explicitamente/);
    expect(body.toLowerCase()).toMatch(/ingerir/);
    expect(body.toLowerCase()).toMatch(/salvar este documento/);
    // The phrase may be wrapped across lines in the rendered body.
    expect(body.toLowerCase()).toMatch(/registrar\s+este\s+texto/);
    // Document content is DATA, never instruction — anchors §13 of v7.
    expect(body.toLowerCase()).toMatch(/dado, nunca instrucao/);
  });

  // BR-18 v2.4 — directive 2: status:"running" + inform Owner + offer
  // get_ingestion_status follow-up.
  it("v2.system() documents the async return contract and follow-up offer", () => {
    const body = v2System();
    expect(body).toMatch(/status:\s*"running"/);
    expect(body).toMatch(/get_ingestion_status/);
    expect(body.toLowerCase()).toMatch(/segundo plano/);
  });

  // BR-18 v2.4 — directive 3: NO auto-poll on get_ingestion_status inside
  // the same turn; status reported once on explicit request.
  it("v2.system() forbids auto-polling get_ingestion_status", () => {
    const body = v2System().toLowerCase();
    expect(body).toMatch(/sem auto-poll|nao faca polling|sem polling/);
    expect(body).toMatch(/uma unica vez/);
  });

  // BR-43: the model must NOT echo `content` back in natural language —
  // payload is audit-only (persisted in chat_tool_call.arguments).
  it("v2.system() forbids echoing the `content` argument in chat output", () => {
    const body = v2System().toLowerCase();
    expect(body).toMatch(/content/);
    expect(body).toMatch(/auditoria/);
  });

  // pt-BR contract: the new directives are pt-BR per BR-18 — no English
  // sentences slipped in. We pick a couple of pt-BR fingerprints in the v2
  // addition section.
  it("v2.system() addition is pt-BR", () => {
    const added = v2System().slice(v1System().length);
    expect(added.toLowerCase()).toMatch(/catalogo/);
    expect(added.toLowerCase()).toMatch(/ferramenta/);
    // Lazy negative: no obvious English keyword from the directive prose.
    expect(added.toLowerCase()).not.toMatch(/\bplease\b/);
    expect(added.toLowerCase()).not.toMatch(/\bonly call\b/);
  });
});
