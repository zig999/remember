// Context reconstruction for a chat turn — BR-31.
//
// chat.back.md v2.0.0 §1.1 / BR-31: the BFF reconstructs the model's history
// from server-owned state. The client body (BR-01 v2) carries only the
// current `content` string; the user row has already been inserted by the
// route handler (BR-29 step 3). This module reads:
//
//   1. The (already-loaded) conversation row, to access `summary_rolling`.
//   2. The last `env.CHAT_RECENT_WINDOW` messages via
//      `repository.listRecentMessages` (already sorted ASC by the repo).
//
// And assembles the Anthropic-shaped context:
//
//   - `system`: the chat system prompt body (passed in by the caller —
//     keeps the builder env-independent, see chat.back.md §1.1 TC-02 note).
//   - `messages`: optional synthetic `summary_rolling` block prepended to the
//     recent window. The synthetic block uses role `user` with a leading
//     header so the model treats the recap as a recap, not as an instruction
//     (BR-31 step 3).
//
// What this module is NOT:
//   - Not a writer. Runs under `withReadOnly`.
//   - Not env-aware. The caller resolves `env.CHAT_PROMPT_VERSION` ->
//     `selectChatPromptModule(...)` and threads `systemPrompt` + `recentLimit`
//     in. Keeps test setup straightforward (no `loadEnv()` in unit tests).

import type Anthropic from "@anthropic-ai/sdk";
import type { Pool } from "pg";

import { withReadOnly } from "../../curation/service/transaction.js";
import * as repo from "../repository/chat.repository.js";
import type {
  ConversationRow,
  MessageRow,
} from "../repository/chat.repository.js";

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
   * Pre-built system prompt — caller resolves the version-dispatched module
   * (`selectChatPromptModule(env.CHAT_PROMPT_VERSION).system()`). Passing
   * the string keeps this module decoupled from `loadEnv()` and from the
   * prompt registry; unit tests pass a fixture string directly.
   */
  readonly systemPrompt: string;
  /**
   * Maximum number of recent messages to read (BR-31 step 4 — typically
   * `env.CHAT_RECENT_WINDOW`, default 10). Must be >= 1; smaller values are
   * a programmer error and would defeat the point of the builder.
   */
  readonly recentLimit: number;
}

/**
 * Output of `buildModelContext` — shaped to be spread directly into the
 * Anthropic `messages.stream(...)` / `messages.create(...)` request. The
 * caller adds `model`, `max_tokens`, `tools`, `tool_choice`, etc.
 */
export interface ModelContext {
  readonly system: string;
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Reconstruct the Anthropic request context for the next turn (BR-31).
 * Steps:
 *
 *   1. `system`: caller-supplied prompt string.
 *   2. If `conversation.summary_rolling !== null`: prepend a synthetic
 *      `{ role: "user", content: [{ type: "text", text: <prefix><summary> }] }`
 *      block. The prefix is the constant exported above.
 *   3. Read the last `recentLimit` messages via `listRecentMessages` (already
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
  for (const row of recent) {
    messages.push({
      role: row.role,
      content: row.content as Anthropic.Messages.MessageParam["content"],
    });
  }

  return {
    system: input.systemPrompt,
    messages,
  };
}
