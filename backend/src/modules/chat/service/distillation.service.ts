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
//     correct utility prompt — `selectChatSummaryPromptModule` (BR-46;
//     versioned registry under `modules/chat/prompts/chat-summary/`) for the
//     rolling-summary fold, `selectTitlePromptModule` for the title.
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
import { selectTitlePromptModule } from "../prompts/index.js";
import { selectChatSummaryPromptModule } from "../prompts/chat-summary/index.js";
import { sanitizeAnthropicSequence } from "./message-sequence.js";

/**
 * BR-33 v2.9 step 4 — hard cap on the final `summary_new` written to
 * `chat_conversation.summary_rolling`. Output longer than this is REFUSED:
 * `summary_prev` stays unchanged for this refresh and the function logs
 * WARN `chat.summary_refresh_overflow`. The cap is a defensive guard against
 * a misbehaving model — the persona instructs ~8 sentences (BR-46), which
 * comfortably fits inside 2000 chars in pt-BR prose.
 */
const SUMMARY_MAX_CHARS = 2000;

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
 * just the fields used — tests build a small literal instead of a full
 * fixture.
 */
export interface DistillationEnv {
  readonly CHAT_UTILITY_MODEL: string;
  /**
   * BR-31 v2.9 — number of recent REAL TURNS (NOT message rows) the
   * context-builder keeps in-window. The distillation service consumes this
   * field's TURN semantics directly: it is the K passed to
   * `countRealTurnsOlderThanRecentWindow` (overflow gate, BR-33 v2.9 step 1)
   * and to `listOlderMessagesForSummaryBounded` (bounded overlap slice,
   * BR-33 v2.9 step 2).
   */
  readonly CHAT_RECENT_WINDOW: number;
  /**
   * BR-33 v2.9 DEPRECATION — this field is registered for back-compat at the
   * env layer but its VALUE is IGNORED by `maybeRefreshSummary`. The legacy
   * turn-count gate is retired; the new gate is refresh-on-overflow (BR-33
   * v2.9 step 1). Kept on the interface so the existing call site (which
   * forwards a 5-field literal) compiles unchanged; remove together with the
   * env field in a follow-up cleanup.
   */
  readonly CHAT_SUMMARY_AFTER_TURNS: number;
  readonly CHAT_SUMMARY_ENABLED: boolean;
  readonly CHAT_TITLE_ENABLED: boolean;
  /**
   * BR-33 v2.9 step 2 — hard cap on the number of `chat_message` rows the
   * fold pulls into the `bounded_overlap_slice` per refresh. Cut on REAL-turn
   * boundaries by the repository slicer (`listOlderMessagesForSummaryBounded`).
   * Default 40 in `env.ts`.
   */
  readonly CHAT_SUMMARY_OVERLAP_M: number;
  /**
   * BR-46 — chat-summary prompt module version (default `v2` — incremental
   * fold). Unknown values trigger `UnknownChatSummaryPromptVersionError` at
   * the first refresh; the route registrar may probe it at boot to fail
   * earlier.
   */
  readonly CHAT_SUMMARY_PROMPT_VERSION: string;
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
 * BR-33 v2.9 — refresh `chat_conversation.summary_rolling` via INCREMENTAL
 * FOLD when at least one real turn has fallen out of the recent window.
 *
 * Policy (chat.back.md BR-33 v2.9):
 *
 *   1. **Gate (refresh-on-overflow).** If `env.CHAT_SUMMARY_ENABLED === false`,
 *      return. Otherwise read `repository.countRealTurnsOlderThanRecentWindow
 *      (conversation_id, env.CHAT_RECENT_WINDOW)` under `withReadOnly`. If
 *      the count is 0 (no overflow), return. `env.CHAT_SUMMARY_AFTER_TURNS`
 *      is RETIRED — its value is NOT consulted.
 *   2. **Slice (`bounded_overlap_slice`).** Read
 *      `repository.listOlderMessagesForSummaryBounded(conversation_id,
 *      env.CHAT_RECENT_WINDOW, env.CHAT_SUMMARY_OVERLAP_M)` under
 *      `withReadOnly`. The repository cuts the start on a REAL-turn anchor;
 *      the slice is Anthropic-valid by construction. If the slice is empty
 *      (defensive — the gate should guarantee ≥ 1 turn) return.
 *   3. **Fold (incremental).** Resolve `mod =
 *      selectChatSummaryPromptModule(env.CHAT_SUMMARY_PROMPT_VERSION)` (BR-46;
 *      throws on unknown version — caught and surfaced as WARN
 *      `chat.summary_refresh_failure { phase: 'model_call' }`). Read
 *      `summary_prev = conversation.summary_rolling` via
 *      `repository.getConversationById` (may be `null` on the conversation's
 *      very first refresh). Call `anthropic.messages.create({ model:
 *      env.CHAT_UTILITY_MODEL, stream: false, system: mod.system, messages:
 *      mod.buildUserTurn(summary_prev, slice), max_tokens: 512 })`.
 *   4. **Oversize refusal (HARD CAP 2000 chars).** Extract the response text
 *      and trim. If `summary_new.length > SUMMARY_MAX_CHARS`, log WARN
 *      `chat.summary_refresh_overflow { conversation_id, chars }` and return
 *      WITHOUT writing — `summary_prev` stays unchanged. If the trimmed
 *      output is empty, return silently (defensive).
 *   5. **Persist (idempotent).** `repository.updateSummaryRolling` under
 *      `withTransaction`. The `set_updated_at` trigger bumps `updated_at`.
 *      The UPDATE is idempotent on the row (last refresh wins; concurrent
 *      refresh on the same conversation is impossible per BR-28).
 *   6. **Observability.** On success, log INFO `chat.summary_refresh_fold`
 *      with `prev_chars`, `new_messages`, `new_chars`, `prompt_version`.
 *
 * **Never throws into the caller.** Every exception is caught, logged WARN
 * `chat.summary_refresh_failure { conversation_id, phase, reason }` where
 * `phase ∈ {fetch_slice, model_call, persist}`, and silently swallowed. The
 * HTTP response has already terminated by the time this runs.
 */
export async function maybeRefreshSummary(
  input: DistillationInput
): Promise<void> {
  const { pool, conversationId, anthropic, env, logger } = input;
  const startedAt = Date.now();
  // Tracks the current step so the WARN log carries an accurate `phase`
  // discriminator (BR-33 v2.9 never-throws contract). Mutates as we progress.
  let phase: "fetch_slice" | "model_call" | "persist" = "fetch_slice";

  try {
    // BR-33 short-circuit: disabled => permanent NULL.
    if (!env.CHAT_SUMMARY_ENABLED) return;

    // Step 1 — refresh-on-overflow gate. Single read under `withReadOnly`.
    // The legacy turn-count gate (`CHAT_SUMMARY_AFTER_TURNS`) is RETIRED in
    // v2.9 (BR-33 v2.9 deprecation note). When no real turn has overflowed
    // the recent window, there is nothing to fold yet.
    const overflowCount = await withReadOnly(pool, (client) =>
      repo.countRealTurnsOlderThanRecentWindow(
        client,
        conversationId,
        env.CHAT_RECENT_WINDOW
      )
    );
    if (overflowCount === 0) return;

    // Step 2 — bounded overlap slice. The repository cuts the start on a
    // REAL-turn anchor (BR-33 v2.9 step 2.c); the slice is Anthropic-valid by
    // construction. We do NOT call `sanitizeAnthropicSequence` here because
    // the bounded slicer's guarantees (start on anchor, ASC chronological)
    // are stronger than what the sanitiser provides — running it would be a
    // defensive no-op at best, OR would mask a slicer regression at worst.
    const olderSlice = await withReadOnly(pool, (client) =>
      repo.listOlderMessagesForSummaryBounded(
        client,
        conversationId,
        env.CHAT_RECENT_WINDOW,
        env.CHAT_SUMMARY_OVERLAP_M
      )
    );
    if (olderSlice.length === 0) {
      // Defensive: overflowCount > 0 implies there is at least one anchor
      // older than the boundary, so the bounded slice should be non-empty.
      // An empty slice here means a race or a defect; refuse to call the
      // model with [] (Anthropic rejects empty messages[]).
      return;
    }

    // Read `summary_prev` AFTER the slice — the conversation row is small
    // (one round-trip) and we do not need it if the slice was empty.
    const conversation = await withReadOnly(pool, (client) =>
      repo.getConversationById(client, conversationId)
    );
    const summary_prev: string | null = conversation?.summary_rolling ?? null;

    // Step 3 — incremental fold.
    phase = "model_call";

    // Resolve the prompt module BEFORE mapping the slice — an unknown
    // version is a config error and we want the WARN log to surface it under
    // `phase: 'model_call'` (the unfortunate truth that we even tried to call
    // the model). `selectChatSummaryPromptModule` throws
    // `UnknownChatSummaryPromptVersionError` — caught by the outer catch.
    const mod = selectChatSummaryPromptModule(env.CHAT_SUMMARY_PROMPT_VERSION);

    // Cast the persisted jsonb `content` (`unknown[]` at the repo seam) to
    // the Anthropic message content shape. BR-29 v2.2 wrote Anthropic-shaped
    // blocks faithfully, so the cast is sound by construction.
    const newMessages: Anthropic.Messages.MessageParam[] = olderSlice.map(
      (row) => ({
        role: row.role,
        content: row.content as Anthropic.Messages.MessageParam["content"],
      })
    );

    const composedMessages = mod.buildUserTurn(summary_prev, newMessages);

    const response = await anthropic.messages.create({
      model: env.CHAT_UTILITY_MODEL,
      system: mod.system,
      max_tokens: SUMMARY_MAX_TOKENS,
      messages: composedMessages,
      stream: false,
    });

    const summary_new = extractText(response).trim();
    if (summary_new === "") return;

    // Step 4 — oversize refusal. `summary_prev` stays unchanged; the next
    // overflow trigger re-runs the fold with the same `summary_prev` plus
    // whatever slice will exist then (BR-33 v2.9 step 4). NO write here.
    if (summary_new.length > SUMMARY_MAX_CHARS) {
      logger.warn(
        {
          event: "chat.summary_refresh_overflow",
          conversation_id: conversationId,
          chars: summary_new.length,
        },
        "chat summary refresh refused — output exceeds 2000 chars"
      );
      return;
    }

    // Step 5 — persist (idempotent UPDATE).
    phase = "persist";
    await withTransaction(pool, (client) =>
      repo.updateSummaryRolling(client, conversationId, summary_new)
    );

    // Step 6 — observability. `chat.summary_refresh_fold` carries the
    // dimensions an operator needs to verify the bounded-cost invariant
    // (prev_chars ≤ ~2000; new_messages ≤ CHAT_SUMMARY_OVERLAP_M).
    logger.info(
      {
        event: "chat.summary_refresh_fold",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        prev_chars: summary_prev?.length ?? 0,
        new_messages: olderSlice.length,
        new_chars: summary_new.length,
        prompt_version: env.CHAT_SUMMARY_PROMPT_VERSION,
      },
      "chat summary refresh (incremental fold) succeeded"
    );
  } catch (err) {
    // BR-33 v2.9 — NEVER throw. Log WARN with the `phase` discriminator and
    // return. `summary_prev` (whatever it was at refresh start) stays
    // unchanged on every failure path — the next overflow trigger will retry.
    logger.warn(
      {
        event: "chat.summary_refresh_failure",
        conversation_id: conversationId,
        latency_ms: Date.now() - startedAt,
        phase,
        reason: errName(err),
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
