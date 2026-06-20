// Chat prompt registry — parallel pattern to
// `modules/ingestion/prompts/index.ts`. Dispatches `env.CHAT_PROMPT_VERSION`
// to the prompt module that owns that version's `system(...)` builder and its
// opaque marker token (BR-18 / BR-20).
//
// Why a registry? Two reasons (same rationale as ingestion):
//
//   1. Auditability — the active prompt version is RECORDED (logged in the
//      pino turn record §9) AND must drive behavior. Without a registry the
//      version field becomes vestigial: the audit claims a version the prompt
//      never honored. The registry closes that gap.
//   2. Boot-time fast failure — an unknown `CHAT_PROMPT_VERSION` is a
//      configuration error, NEVER a silent fallback. `selectChatPromptModule`
//      throws `UnknownChatPromptVersionError`; the route registrar runs it at
//      boot so a misconfigured deployment refuses to mount the chat route
//      rather than serving the wrong prompt.

import * as v1 from "./v1.js";

/** Slice of a prompt module the chat orchestrator consumes. */
export interface ChatPromptModule {
  /** Stable identifier (e.g. `"v1"`). */
  readonly version: string;
  /** Build the SYSTEM prompt body. */
  readonly system: () => string;
  /** Opaque marker token planted at the head of the prompt (BR-20). */
  readonly marker: string;
}

const V1: ChatPromptModule = {
  version: v1.PROMPT_VERSION,
  system: v1.system,
  marker: v1.CHAT_PROMPT_MARKER_V1,
};

/** Recommended default for NEW deployments — used when env is unset. */
export const DEFAULT_CHAT_PROMPT_VERSION: string = v1.PROMPT_VERSION;

const REGISTRY: Readonly<Record<string, ChatPromptModule>> = {
  [v1.PROMPT_VERSION]: V1,
};

/**
 * Thrown when `CHAT_PROMPT_VERSION` names no registered module. Raised at
 * route-registrar boot so a misconfigured deployment fails loudly before any
 * chat request is accepted (BR-18).
 */
export class UnknownChatPromptVersionError extends Error {
  constructor(public readonly promptVersion: string) {
    super(
      `Unknown CHAT_PROMPT_VERSION '${promptVersion}': no chat prompt module ` +
        `is registered for it. Known versions: ${Object.keys(REGISTRY).join(", ")}.`
    );
    this.name = "UnknownChatPromptVersionError";
  }
}

/**
 * Resolve a chat prompt module by version string. Throws
 * `UnknownChatPromptVersionError` for an unregistered version (BR-18 — fail
 * loud, never silently substitute a different prompt).
 */
export function selectChatPromptModule(promptVersion: string): ChatPromptModule {
  const module = REGISTRY[promptVersion];
  if (module === undefined) {
    throw new UnknownChatPromptVersionError(promptVersion);
  }
  return module;
}
