import type Anthropic from "@anthropic-ai/sdk";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type { UserPromptArgs } from "./extraction.v1.js";
import * as v1 from "./extraction.v1.js";
import * as v2 from "./extraction.v2.js";
import * as v3 from "./extraction.v3.js";
import * as v4 from "./extraction.v4.js";
import * as v5 from "./extraction.v5.js";

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

const V4: PromptModule = {
  version: v4.PROMPT_VERSION,
  MAX_TOKENS: v4.MAX_TOKENS,
  system: v4.system,
  user: v4.user,
};

const V5: PromptModule = {
  version: v5.PROMPT_VERSION,
  MAX_TOKENS: v5.MAX_TOKENS,
  system: v5.system,
  user: v5.user,
};

export const DEFAULT_PROMPT_VERSION: string = v4.PROMPT_VERSION;

const REGISTRY: Readonly<Record<string, PromptModule>> = {
  [v1.PROMPT_VERSION]: V1,
  [v2.PROMPT_VERSION]: V2,
  [v3.PROMPT_VERSION]: V3,
  [v4.PROMPT_VERSION]: V4,
  [v5.PROMPT_VERSION]: V5,
};

export class UnknownPromptVersionError extends Error {
  constructor(public readonly promptVersion: string) {
    super(
      `Unknown prompt_version '${promptVersion}': no prompt module is registered for it ` +
        `(BR-26). Known versions: ${Object.keys(REGISTRY).join(", ")}.`
    );
    this.name = "UnknownPromptVersionError";
  }
}

export function selectPromptModule(promptVersion: string): PromptModule {
  const module = REGISTRY[promptVersion];
  if (module === undefined) {
    throw new UnknownPromptVersionError(promptVersion);
  }
  return module;
}
