// MCP `ingest.propose_fragment` input/output contract.
//
// Layer 1 (structural) of the 5-layer validation. The DB CHECK on
// `information_fragment.text` (≤ 1000 chars) is mirrored here so the failure
// surfaces as a typed `STRUCTURAL_INVALID` instead of a SQLSTATE error from pg.

import { z } from "zod";

export const ProposeFragmentInputSchema = z.object({
  text: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  chunk_ids: z.array(z.string().uuid()).min(1),
});
export type ProposeFragmentInput = z.infer<typeof ProposeFragmentInputSchema>;

export interface ProposeFragmentResult {
  readonly fragment_id: string;
  readonly status: "proposed";
}
