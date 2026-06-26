// Chat-summary prompt registry — parallel pattern to
// `modules/chat/prompts/index.ts` (BR-18) and `modules/ingestion/prompts/index.ts`.
// Dispatches `env.CHAT_SUMMARY_PROMPT_VERSION` to the prompt module that owns
// that version's `system` text and `buildUserTurn(summary_prev, new_messages)`
// composer (BR-46, NEW v2.9).
//
// Why a registry? Same rationale as BR-18:
//
//   1. Auditability — the active prompt version is RECORDED in the per-refresh
//      INFO log (`chat.summary_refresh_fold { prompt_version }`, BR-33 v2.9
//      step 6) AND must drive behaviour. Without a registry the version field
//      becomes vestigial: the audit claims a version the prompt never honored.
//      The registry closes that gap.
//   2. Boot-time fast failure — an unknown `CHAT_SUMMARY_PROMPT_VERSION` is a
//      configuration error, NEVER a silent fallback. `selectChatSummaryPromptModule`
//      throws `UnknownChatSummaryPromptVersionError`; the route registrar (or
//      a tighter boot probe) runs it so a misconfigured deployment refuses to
//      mount the chat route rather than silently substituting a different
//      prompt.
//
// `v2` is the incremental fold (BR-46, default — selected by BR-33 v2.9).
// `v1` is the legacy single-input summariser of v2.0 (registered for back-
// compat tests but NOT reachable via BR-33 v2.9).

import type Anthropic from "@anthropic-ai/sdk";

import * as v1 from "./v1.js";
import * as v2 from "./v2.js";

/**
 * Slice of a chat-summary prompt module the distillation service consumes.
 *
 * Module surface (chat.back.md BR-46):
 *
 *   - `version`     — stable identifier (e.g. `"v2"`).
 *   - `system`      — pt-BR system text; byte-stable for the process lifetime.
 *                     No `cache_control` is set on this path (BR-46 caching
 *                     invariant — distillation budget is small; absent caching
 *                     does not move the cost dial).
 *   - `buildUserTurn(summary_prev, new_messages)` — composes the messages[]
 *     to pass to `anthropic.messages.create`. Two named arguments:
 *       * `summary_prev: string | null` — existing `conversation.summary_rolling`
 *         (`null` on the conversation's very first refresh);
 *       * `new_messages: Anthropic.Messages.MessageParam[]` — the
 *         `bounded_overlap_slice` of BR-33 v2.9 step 2.
 */
export interface ChatSummaryPromptModule {
  readonly version: string;
  readonly system: string;
  buildUserTurn(
    summary_prev: string | null,
    new_messages: ReadonlyArray<Anthropic.Messages.MessageParam>
  ): Anthropic.Messages.MessageParam[];
}

/**
 * Recommended default for NEW deployments — used when env is unset. v2.9
 * makes `v2` the default (incremental fold). `v1` continues to resolve
 * through the registry for backward-compatibility (legacy single-input
 * summariser; not reachable via BR-33 v2.9 but kept registered).
 */
export const DEFAULT_CHAT_SUMMARY_PROMPT_VERSION: string = v2.PROMPT_VERSION;

const REGISTRY: Readonly<Record<string, ChatSummaryPromptModule>> = {
  [v1.PROMPT_VERSION]: v1.v1Module,
  [v2.PROMPT_VERSION]: v2.v2Module,
};

/**
 * Thrown when `CHAT_SUMMARY_PROMPT_VERSION` names no registered module.
 * Raised at the distillation call site (and at any boot-time probe) so a
 * misconfigured deployment fails loudly before any refresh fires (BR-46
 * module-registry rule).
 */
export class UnknownChatSummaryPromptVersionError extends Error {
  constructor(public readonly promptVersion: string) {
    super(
      `Unknown CHAT_SUMMARY_PROMPT_VERSION '${promptVersion}': no chat-summary ` +
        `prompt module is registered for it. Known versions: ` +
        `${Object.keys(REGISTRY).join(", ")}.`
    );
    this.name = "UnknownChatSummaryPromptVersionError";
  }
}

/**
 * Resolve a chat-summary prompt module by version string. Throws
 * `UnknownChatSummaryPromptVersionError` for an unregistered version (BR-46
 * — fail loud, never silently substitute a different prompt).
 */
export function selectChatSummaryPromptModule(
  promptVersion: string
): ChatSummaryPromptModule {
  const module = REGISTRY[promptVersion];
  if (module === undefined) {
    throw new UnknownChatSummaryPromptVersionError(promptVersion);
  }
  return module;
}
