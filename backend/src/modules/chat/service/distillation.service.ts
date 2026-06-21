// Fire-and-forget distillation jobs — rolling summary (BR-33) + title (BR-34).
//
// chat.back.md v2.0.0 §1.1 / BR-33 / BR-34: both jobs are scheduled by the
// route handler AFTER the HTTP response has terminated. They use the
// `env.CHAT_UTILITY_MODEL` Anthropic model (default `claude-haiku-4-5`) via
// non-streaming `messages.create(...)` (BR-33 step 4 / BR-34 step 4 —
// `stream: false`).
//
// CRITICAL CONTRACT (chat.back.md §1.1 + §7 "Fallback" column):
//
//   - Both functions return `Promise<void>` and NEVER throw. The caller does
//     NOT await them. Any error inside is caught and logged WARN with a
//     fixed log shape (`chat.summary_refresh_failure`,
//     `chat.title_distillation_failure`); counters
//     `chat_summary_refresh_total{ok=false}` / `chat_title_distillation_total
//     {ok=false}` would be incremented by an observability layer if one is
//     wired (v2 records the log entry; counter wiring is out of scope here).
//
//   - The HTTP request has already returned to the client by the time these
//     functions execute. Throwing or rejecting would only crash the unawaited
//     Promise — which Node treats as an unhandledRejection. We refuse to do
//     that and absorb every failure.
//
// What the functions ARE responsible for:
//
//   - Reading the policy precondition (count > threshold for BR-33;
//     `title IS NULL` for BR-34) — if not met, EARLY RETURN without making a
//     LLM call.
//   - Calling the utility model with the right slice of history and the
//     correct utility prompt (`selectSummaryPromptModule`,
//     `selectTitlePromptModule` — added to `modules/chat/prompts/index.ts` by
//     this TC).
//   - Persisting via the repository's idempotent updates
//     (`updateSummaryRolling`, `setTitleIfNull`) wrapped in `withTransaction`.

import type Anthropic from "@anthropic-ai/sdk";
import type { Logger } from "pino";
import type { Pool } from "pg";

import {
  withReadOnly,
  withTransaction,
} from "../../curation/service/transaction.js";
import * as repo from "../repository/chat.repository.js";
import {
  selectSummaryPromptModule,
  selectTitlePromptModule,
} from "../prompts/index.js";
import { sanitizeAnthropicSequence } from "./message-sequence.js";

// ---------------------------------------------------------------------------
// Anthropic utility-model surface — non-streaming `messages.create(...)`
// ---------------------------------------------------------------------------
//
// The existing `AnthropicLike` in `extraction.service.ts` exposes
// `messages.stream(...)`. The distillation jobs use the non-streaming path
// (BR-33 step 4 / BR-34 step 4: "stream: false"), so we define a parallel
// minimal interface here. The real `Anthropic` SDK client satisfies BOTH
// shapes; tests pass a structurally compatible stub.

/** Request shape for `Anthropic.messages.create(...)` consumed here. */
export interface UtilityMessageRequest {
  readonly model: string;
  readonly system: string;
  readonly max_tokens: number;
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
  // Anthropic's TS types want `stream` to be `false | undefined` for the
  // non-streaming overload — we always pass `false` explicitly so the
  // overload resolves deterministically.
  readonly stream: false;
}

/** Minimum surface the distillation jobs need from the SDK client. */
export interface AnthropicUtilityLike {
  readonly messages: {
    create(req: UtilityMessageRequest): Promise<Anthropic.Messages.Message>;
  };
}

// ---------------------------------------------------------------------------
// Public input contract
// ---------------------------------------------------------------------------

/**
 * Subset of `Env` the distillation jobs read. We narrow the dependency to
 * just the fields used — tests build a 5-field literal instead of a full
 * fixture.
 */
export interface DistillationEnv {
  readonly CHAT_UTILITY_MODEL: string;
  readonly CHAT_RECENT_WINDOW: number;
  readonly CHAT_SUMMARY_AFTER_TURNS: number;
  readonly CHAT_SUMMARY_ENABLED: boolean;
  readonly CHAT_TITLE_ENABLED: boolean;
}

export interface DistillationInput {
  readonly pool: Pool;
  readonly conversationId: string;
  readonly anthropic: AnthropicUtilityLike;
  readonly env: DistillationEnv;
  readonly logger: Logger;
}

// `max_tokens` ceilings for the two utility calls. Both prompts ask for short
// output (8 sentences / 80 chars); a generous ceiling guards against the
// model trailing off without bloating cost.
const SUMMARY_MAX_TOKENS = 600;
const TITLE_MAX_TOKENS = 64;
const TITLE_MAX_LENGTH = 80;

// ---------------------------------------------------------------------------
// BR-33 — rolling-summary refresh policy
// ---------------------------------------------------------------------------

/**
 * BR-33 — refresh `chat_conversation.summary_rolling` when the conversation
 * has crossed the user-turn threshold.
 *
 * Policy:
 *
 *   1. `repository.countUserTurns(conversation_id)` under `withReadOnly`.
 *   2. If `count <= env.CHAT_SUMMARY_AFTER_TURNS` OR
 *      `env.CHAT_SUMMARY_ENABLED === false`: return (no work).
 *   3. `repository.listOlderMessagesForSummary(conversation_id,
 *      env.CHAT_RECENT_WINDOW)` under `withReadOnly` — returns the slice
 *      strictly OLDER than the recent window.
 *   4. `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL,
 *      stream: false, system: selectSummaryPromptModule(), messages: <older> })`.
 *   5. Extract the text from the response; on empty -> return (silent drop).
 *   6. `repository.updateSummaryRolling(conversation_id, summary)` under
 *      `withTransaction`.
 *   7. Log INFO `chat.summary_refresh_success` on success.
 *
 * Errors at any step are caught, logged WARN, and silently swallowed.
 * NEVER throws.
 */
export async function maybeRefreshSummary(
  input: DistillationInput
): Promise<void> {
  const { pool, conversationId, anthropic, env, logger } = input;
  const startedAt = Date.now();

  try {
    // BR-33 short-circuit: disabled => permanent NULL.
    if (!env.CHAT_SUMMARY_ENABLED) return;

    const userTurns = await withReadOnly(pool, (client) =>
      repo.countUserTurns(client, conversationId)
    );
    if (userTurns <= env.CHAT_SUMMARY_AFTER_TURNS) return;

    const olderSlice = await withReadOnly(pool, (client) =>
      repo.listOlderMessagesForSummary(
        client,
        conversationId,
        env.CHAT_RECENT_WINDOW
      )
    );
    if (olderSlice.length === 0) return;

    // Cast the persisted jsonb `content` (`unknown[]` at the repo seam) to
    // the Anthropic message content shape. BR-29 wrote Anthropic-shaped
    // blocks, so the cast is sound by construction.
    const rawMessages: Anthropic.Messages.MessageParam[] = olderSlice.map(
      (row) => ({
        role: row.role,
        content: row.content as Anthropic.Messages.MessageParam["content"],
      })
    );

    // v2.2: the older slice is a COUNT-bounded cut that can begin or end mid
    // tool-turn (dangling `tool_result` at the front, dangling `tool_use` at
    // the back). Trim those so the utility-model call is a valid sequence —
    // otherwise it 400s (the historical `chat.title_distillation_failure` /
    // summary-refresh failure). If nothing valid remains, skip the call.
    const messages = sanitizeAnthropicSequence(rawMessages);
    if (messages.length === 0) return;

    const response = await anthropic.messages.create({
      model: env.CHAT_UTILITY_MODEL,
      system: selectSummaryPromptModule(),
      max_tokens: SUMMARY_MAX_TOKENS,
      messages,
      stream: false,
    });

    const summary = extractText(response).trim();
    if (summary === "") return;

    await withTransaction(pool, (client) =>
      repo.updateSummaryRolling(client, conversationId, summary)
    );

    logger.info(
      {
        event: "chat.summary_refresh_success",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        user_turns: userTurns,
        slice_size: olderSlice.length,
      },
      "chat summary refresh succeeded"
    );
  } catch (err) {
    // BR-33 — NEVER throw. Log WARN and return.
    logger.warn(
      {
        event: "chat.summary_refresh_failure",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        err_name: errName(err),
        err_message: errMessage(err),
      },
      "chat summary refresh failed"
    );
  }
}

// ---------------------------------------------------------------------------
// BR-34 — title distillation policy
// ---------------------------------------------------------------------------

/**
 * BR-34 — derive a short title for a conversation that has none.
 *
 * Policy:
 *
 *   1. `repository.getConversationById(conversation_id)` under `withReadOnly`;
 *      if `title IS NOT NULL` OR row absent: return.
 *   2. If `env.CHAT_TITLE_ENABLED === false`: return.
 *   3. `repository.getFirstUserAndAssistant(conversation_id)` under
 *      `withReadOnly`; if either side is null: return (the conversation
 *      doesn't yet have a completed turn).
 *   4. `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL,
 *      stream: false, system: selectTitlePromptModule(), messages: [user, asst] })`.
 *   5. Trim; if empty OR length > 80: silently drop (BR-34 step 5).
 *   6. `repository.setTitleIfNull(conversation_id, title)` under
 *      `withTransaction` — the `IF NULL` guard makes the operation idempotent.
 *   7. Log INFO `chat.title_distillation_success` on success.
 *
 * Errors at any step are caught, logged WARN, and silently swallowed.
 * NEVER throws.
 */
export async function maybeDistillTitle(
  input: DistillationInput
): Promise<void> {
  const { pool, conversationId, anthropic, env, logger } = input;
  const startedAt = Date.now();

  try {
    if (!env.CHAT_TITLE_ENABLED) return;

    const conversation = await withReadOnly(pool, (client) =>
      repo.getConversationById(client, conversationId)
    );
    if (conversation === null) return;
    if (conversation.title !== null) return;

    const pair = await withReadOnly(pool, (client) =>
      repo.getFirstUserAndAssistant(client, conversationId)
    );
    if (pair.user === null || pair.assistant === null) return;

    // `getFirstUserAndAssistant` already returns the first REAL user turn and
    // the first TERMINAL assistant answer (v2.2 repo filters), so this pair is
    // a valid sequence with no tool scaffolding. Sanitise anyway — cheap, and
    // it drops any empty-content edge before the call.
    const messages = sanitizeAnthropicSequence([
      {
        role: "user",
        content: pair.user.content as Anthropic.Messages.MessageParam["content"],
      },
      {
        role: "assistant",
        content:
          pair.assistant.content as Anthropic.Messages.MessageParam["content"],
      },
    ]);
    if (messages.length === 0) return;

    const response = await anthropic.messages.create({
      model: env.CHAT_UTILITY_MODEL,
      system: selectTitlePromptModule(),
      max_tokens: TITLE_MAX_TOKENS,
      messages,
      stream: false,
    });

    const candidate = extractText(response).trim();
    // BR-34 step 5 — silently drop on empty or over-length output. The model
    // is expected to obey the 80-char ceiling baked into the prompt; the
    // guard is defensive.
    if (candidate === "" || candidate.length > TITLE_MAX_LENGTH) return;

    await withTransaction(pool, (client) =>
      repo.setTitleIfNull(client, conversationId, candidate)
    );

    logger.info(
      {
        event: "chat.title_distillation_success",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        title_length: candidate.length,
      },
      "chat title distillation succeeded"
    );
  } catch (err) {
    // BR-34 — NEVER throw. Log WARN and return.
    logger.warn(
      {
        event: "chat.title_distillation_failure",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        err_name: errName(err),
        err_message: errMessage(err),
      },
      "chat title distillation failed"
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the concatenated text from an Anthropic non-streaming `Message`
 * response. The shape is `content: Array<{ type: "text", text: string } | ...>`;
 * we take every `text` block and join them. Non-text blocks (tool_use,
 * thinking) are not expected from a utility call without tools, but the
 * guard is defensive.
 */
function extractText(response: Anthropic.Messages.Message): string {
  if (!Array.isArray(response.content)) return "";
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("");
}

function errName(err: unknown): string {
  if (err instanceof Error) return err.name;
  return typeof err === "string" ? "string" : typeof err;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  // We deliberately do NOT JSON.stringify(err) — it could contain SDK
  // payloads with provider secrets. A short label is enough to differentiate
  // log entries.
  return "<non-error>";
}
