// MCP `ingest.propose_fragment` input/output contract.
//
// Layer 1 (structural) of the 5-layer validation. The DB CHECK on
// `information_fragment.text` (≤ 1000 chars) is mirrored here so the failure
// surfaces as a typed `STRUCTURAL_INVALID` instead of a SQLSTATE error from pg.

import { z } from "zod";

export const ProposeFragmentInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      "The factual claim, quoted verbatim from the chunk. One assertion only; max 1000 characters."
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence 0–1 that this claim is correctly extracted. ≥0.75 stored active; 0.40–0.74 kept but flagged uncertain; <0.40 dropped."
    ),
  chunk_ids: z
    .array(z.string().uuid())
    .min(1)
    .describe(
      "Source chunk id(s). During an ingestion run the server injects the current chunk automatically — you do not need to send this."
    ),
});
export type ProposeFragmentInput = z.infer<typeof ProposeFragmentInputSchema>;

export interface ProposeFragmentResult {
  readonly fragment_id: string;
  readonly status: "proposed";
}
