// Context reconstruction for a chat turn — BR-31.
//
// chat.back.md BR-31 v2.9 / BR-47 v2.9: the BFF reconstructs the model's
// history from server-owned state AND assembles the TWO-BLOCK `system` array
// (BlockA cached persona+tools+directives, BlockB dynamic datetime hint) on
// every turn. The client body (BR-01 v2) carries only the current `content`
// string; the user row has already been inserted by the route handler
// (BR-29 step 3). This module reads:
//
//   1. The (already-loaded) conversation row, to access `summary_rolling`.
//   2. The last `env.CHAT_RECENT_WINDOW` messages via
//      `repository.listRecentMessages` (already sorted ASC by the repo).
//
// And assembles the Anthropic-shaped context:
//
//   - `system`: a TWO-ELEMENT TextBlockParam array (BR-47 v2.9). BlockA
//     carries `cache_control: { type: "ephemeral" }`; BlockB carries the
//     rendered current datetime in `OWNER_TZ` and MUST NOT carry
//     `cache_control` (dynamic content would invalidate the prefix cache).
//   - `messages`: optional synthetic `summary_rolling` block prepended to the
//     recent window. The synthetic block uses role `user` with a leading
//     header so the model treats the recap as a recap, not as an instruction
//     (BR-31 step 3).
//
// What this module is NOT:
//   - Not a writer. Runs under `withReadOnly`.
//   - Not env-aware. The caller resolves `env.CHAT_PROMPT_VERSION` ->
//     `selectChatPromptModule(...)` and threads `blockAText`, `now`, `ownerTz`,
//     and `recentLimit` in. Keeps test setup straightforward (no `loadEnv()`
//     in unit tests).

import type Anthropic from "@anthropic-ai/sdk";
import type { Pool } from "pg";

import { withReadOnly } from "../../curation/service/transaction.js";
import * as repo from "../repository/chat.repository.js";
import type {
  ConversationRow,
  MessageRow,
} from "../repository/chat.repository.js";
import { renderDatetimeBlockB } from "./datetime-block.js";
import { sanitizeAnthropicSequence } from "./message-sequence.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Synthetic message prefix planted ahead of `summary_rolling` content
 * (BR-31 step 3). The opening header tells the model "this block is a recap,
 * not a user instruction" — critical so the model does not treat the
 * synthesised text as a new turn. EXPORTED so tests assert verbatim equality.
 */
export const SUMMARY_ROLLING_PREFIX =
  "[contexto da conversa anterior, sintetizado]\n\n" as const;

export interface BuildModelContextInput {
  /** BFF process pool — wrapped in `withReadOnly` by this module. */
  readonly pool: Pool;
  /**
   * The conversation row, already loaded by the caller (the route handler
   * always loads it for BR-22 / BR-25 / BR-28 first). Avoids a redundant
   * round-trip here.
   */
  readonly conversation: ConversationRow;
  /**
   * Pre-built BlockA text (BR-47 step 1) — caller resolves the version-
   * dispatched module (`selectChatPromptModule(env.CHAT_PROMPT_VERSION)
   * .system(catalog)`). This module wraps it as the FIRST `TextBlockParam`
   * of the returned `system` array, attaching `cache_control: { type:
   * "ephemeral" }` so the Anthropic prefix cache hits across turns and
   * iterations. Renamed from `systemPrompt` at v2.9 to match BR-47 step 1
   * terminology; the value still keeps this module decoupled from
   * `loadEnv()` and from the prompt registry.
   */
  readonly blockAText: string;
  /**
   * Wall-clock instant rendered into BlockB (BR-47 step 6). Captured ONCE per
   * turn by the route caller and passed verbatim so every `messages.create`
   * iteration of the same turn sees byte-identical BlockB text. The route
   * normally passes `new Date()` at the start of the turn.
   */
  readonly now: Date;
  /**
   * IANA timezone id used to render BlockB (BR-47 step 3) — typically
   * `env.OWNER_TZ` (default `"America/Sao_Paulo"`). `loadEnv` validates the
   * zone at boot (BR-47 step 4), so the value reaching this function in the
   * production path is always a known-good zone.
   */
  readonly ownerTz: string;
  /**
   * Maximum number of recent messages to read (BR-31 step 4 — typically
   * `env.CHAT_RECENT_WINDOW`). Must be >= 1; smaller values are
   * a programmer error and would defeat the point of the builder.
   */
  readonly recentLimit: number;
}

/**
 * Output of `buildModelContext` — shaped to be spread directly into the
 * Anthropic `messages.stream(...)` / `messages.create(...)` request. The
 * caller adds `model`, `max_tokens`, `tools`, `tool_choice`, etc.
 *
 * BR-47 v2.9: `system` is a TWO-ELEMENT `TextBlockParam` array. Index 0 is
 * BlockA (cached persona+tools+directives); index 1 is BlockB (dynamic
 * datetime hint, NOT cached).
 */
export interface ModelContext {
  readonly system: ReadonlyArray<Anthropic.Messages.TextBlockParam>;
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Reconstruct the Anthropic request context for the next turn (BR-31 v2.9).
 * Steps:
 *
 *   1. `system[0]` (BlockA): caller-supplied prompt string, wrapped as a
 *      `TextBlockParam` with `cache_control: { type: "ephemeral" }` (BR-47
 *      step 1 — Anthropic prefix-cache invariant).
 *   2. `system[1]` (BlockB): `renderDatetimeBlockB(now, ownerTz)` — a SHORT
 *      pt-BR string of the exact shape `"Data/hora atual do dono: <ISO-8601
 *      with offset> (<tz-id>)"`. NO `cache_control` (BR-47 step 2 — dynamic
 *      per turn).
 *   3. If `conversation.summary_rolling !== null`: prepend a synthetic
 *      `{ role: "user", content: [{ type: "text", text: <prefix><summary> }] }`
 *      block. The prefix is the constant exported above.
 *   4. Read the last `recentLimit` messages via `listRecentMessages` (already
 *      sorted ASC). Map them 1:1 to Anthropic message params: `role` stays
 *      `"user" | "assistant"`; the persisted jsonb `content` is passed
 *      through verbatim (the persistence layer already stored Anthropic-
 *      shaped content blocks, BR-29).
 *
 * The user row inserted in BR-29 step 3 IS the last element of the resulting
 * messages array — the route handler inserted it BEFORE calling this
 * function. We never re-read or reshape it here.
 */
export async function buildModelContext(
  input: BuildModelContextInput
): Promise<ModelContext> {
  // BR-47 steps 1+2 — assemble the two-block `system` array BEFORE the
  // (async) DB read so the wire-shape is constructed regardless of the
  // recent-window content. BlockA is byte-stable per process; BlockB is
  // byte-stable per turn (`input.now` is captured ONCE by the caller —
  // BR-47 step 6).
  const blockA: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text: input.blockAText,
    cache_control: { type: "ephemeral" },
  };
  const blockB: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text: renderDatetimeBlockB(input.now, input.ownerTz),
  };
  const system: ReadonlyArray<Anthropic.Messages.TextBlockParam> = [
    blockA,
    blockB,
  ];

  const recent: MessageRow[] = await withReadOnly(input.pool, (client) =>
    repo.listRecentMessages(client, input.conversation.id, input.recentLimit)
  );

  const messages: Anthropic.Messages.MessageParam[] = [];

  if (input.conversation.summary_rolling !== null) {
    // BR-31 step 3 — synthetic recap. Role `user` (not `assistant`) so the
    // model reads it as context, then receives the genuine recent assistant
    // turns afterwards. Single text block; matches Anthropic's message
    // content schema.
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: SUMMARY_ROLLING_PREFIX + input.conversation.summary_rolling,
        },
      ],
    });
  }

  // 1:1 map. The persisted `content` is `unknown[]` at the repo boundary
  // (jsonb -> JS) but is structurally `MessageParam["content"]` by
  // construction (BR-29 wrote Anthropic-shaped blocks). Cast at the seam.
  const windowMessages: Anthropic.Messages.MessageParam[] = recent.map(
    (row) => ({
      role: row.role,
      content: row.content as Anthropic.Messages.MessageParam["content"],
    })
  );

  // v2.2 (faithful multi-row persistence): the COUNT-bounded recent window can
  // begin or end in the MIDDLE of a tool-bearing turn (a leading
  // `user[tool_result]` whose `assistant[tool_use]` fell outside the window, a
  // trailing dangling `assistant[tool_use]`, or an empty-content row). Trim
  // those boundary artefacts so the replayed sequence is valid by construction
  // — otherwise Anthropic 400s and the turn surfaces as
  // BUSINESS_CHAT_PROVIDER_UNAVAILABLE. The current user turn (the row inserted
  // in BR-29 step 3) is the tail and is preserved (it is a real user message,
  // never trimmed).
  messages.push(...sanitizeAnthropicSequence(windowMessages));

  return {
    system,
    messages,
  };
}
