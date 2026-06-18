// Prompt registry — dispatches `llm_run.prompt_version` to the prompt module
// that builds that run's prompts (BR-26).
//
// Until this registry existed, the extraction orchestrator imported v1
// statically, so `prompt_version` was RECORDED in the audit trail but did NOT
// drive behaviour — every run used v1 regardless of the string it declared.
// That is a traceability gap (the audit claims a version the prompt never
// honoured). The registry closes it: the version field now maps to the prompt.
//
// An unknown version is a configuration error, NOT a silent fallback: BR-26
// step 2 mandates "load the extraction.${prompt_version} module; fail with 500
// SYSTEM_INTERNAL_ERROR if the module is missing". `selectPromptModule` throws
// `UnknownPromptVersionError`; the extraction orchestrator runs it inside its
// run-scoped try, so the run is flipped to `failed` and the error surfaces (it
// must never silently run a different prompt than the audit trail records).

import type Anthropic from "@anthropic-ai/sdk";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type { UserPromptArgs } from "./extraction.v1.js";
import * as v1 from "./extraction.v1.js";
import * as v2 from "./extraction.v2.js";
import * as v3 from "./extraction.v3.js";

/** The slice of a prompt module the extraction orchestrator consumes. */
export interface PromptModule {
  readonly version: string;
  readonly MAX_TOKENS: number;
  system(catalog: CatalogSnapshot): string;
  user(args: UserPromptArgs): Anthropic.Messages.TextBlockParam[];
}

const V1: PromptModule = {
  version: v1.PROMPT_VERSION,
  MAX_TOKENS: v1.MAX_TOKENS,
  system: v1.system,
  user: v1.user,
};

const V2: PromptModule = {
  version: v2.PROMPT_VERSION,
  MAX_TOKENS: v2.MAX_TOKENS,
  system: v2.system,
  user: v2.user,
};

const V3: PromptModule = {
  version: v3.PROMPT_VERSION,
  MAX_TOKENS: v3.MAX_TOKENS,
  system: v3.system,
  user: v3.user,
};

/** Recommended version for NEW runs — callers SHOULD send this at intake. */
export const DEFAULT_PROMPT_VERSION: string = v3.PROMPT_VERSION;

const REGISTRY: Readonly<Record<string, PromptModule>> = {
  [v1.PROMPT_VERSION]: V1,
  [v2.PROMPT_VERSION]: V2,
  [v3.PROMPT_VERSION]: V3,
};

/** Thrown when `prompt_version` names no registered module (BR-26 step 2). */
export class UnknownPromptVersionError extends Error {
  constructor(public readonly promptVersion: string) {
    super(
      `Unknown prompt_version '${promptVersion}': no prompt module is registered for it ` +
        `(BR-26). Known versions: ${Object.keys(REGISTRY).join(", ")}.`
    );
    this.name = "UnknownPromptVersionError";
  }
}

/**
 * Resolve a prompt module by `llm_run.prompt_version`. Throws
 * `UnknownPromptVersionError` for an unregistered version (BR-26 step 2 — fail
 * loud, never silently substitute a different prompt than the run declares).
 */
export function selectPromptModule(promptVersion: string): PromptModule {
  const module = REGISTRY[promptVersion];
  if (module === undefined) {
    throw new UnknownPromptVersionError(promptVersion);
  }
  return module;
}
