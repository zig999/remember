import { z } from "zod";

import { DocumentEntitySchema } from "./llm-run.dto.js";

export const PreliminaryReadingResponseSchema = z.object({
  summary: z.string(),
  entities: z.array(DocumentEntitySchema),
});
export type PreliminaryReadingResponseDto = z.infer<
  typeof PreliminaryReadingResponseSchema
>;
