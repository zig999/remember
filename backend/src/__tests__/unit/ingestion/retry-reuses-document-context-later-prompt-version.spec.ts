import { expect, it, vi } from "vitest";

import { DocumentContextStatusSchema } from "../../../modules/ingestion/dto/llm-run.dto.js";
import { DOCUMENT_CONTEXT } from "./run-document-context-fixture.js";
import { extractRun, failedRunWorld, retryRun } from "./retried-run-world.js";

const LATER_PROMPT_VERSION = "v6";
const PROMPT_VERSION_WITH_A_MODULE = "v5";
const HELD_STATUS = "single-chunk";

vi.mock("../../../modules/ingestion/prompts/index.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../../modules/ingestion/prompts/index.js")>();
  return {
    ...original,
    selectPromptModule: (promptVersion: string) =>
      original.selectPromptModule(
        promptVersion === LATER_PROMPT_VERSION
          ? PROMPT_VERSION_WITH_A_MODULE
          : promptVersion
      ),
  };
});

it("leaves the document context status as it was when a retried run under a later prompt version holding a document context is extracted with no preliminary reading", async () => {
  const world = failedRunWorld({ status: HELD_STATUS, context: DOCUMENT_CONTEXT });
  world.run["prompt_version"] = LATER_PROMPT_VERSION;
  await retryRun(world);

  await extractRun(world);

  expect(
    DocumentContextStatusSchema.nullable().parse(world.run["document_context_status"])
  ).toBe(HELD_STATUS);
});
