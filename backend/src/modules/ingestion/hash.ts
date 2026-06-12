// SHA-256 helpers used by the ingestion domain.
//
// BR-01 (`content_hash`) and BR-08 (`idempotency_key`) of
// `ingestion.back.md`. Both produce a 64-char lowercase hex string. UTF-8
// encoding is explicit on every `.update()` so the result is portable across
// platforms with different default encodings.

import { createHash } from "node:crypto";

/**
 * `sha256(content)` -- 64 char lowercase hex string.
 *
 * Used as `raw_information.content_hash` (BR-01); the DB CHECK constraint on
 * the column enforces the same regex.
 */
export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Compose the LLMRun idempotency key (BR-08, A18).
 *
 * `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`,
 * concatenated WITHOUT a separator. The order is exactly as defined in §8 of
 * v7 and as documented in `ingestion.back.md` BR-08. Bumping any operand
 * yields a different key and forces a new `llm_run` row on the same source.
 */
export function composeIdempotencyKey(args: {
  content_hash: string;
  prompt_version: string;
  model: string;
  chunking_version: string;
}): string {
  const h = createHash("sha256");
  h.update(args.content_hash, "utf8");
  h.update(args.prompt_version, "utf8");
  h.update(args.model, "utf8");
  h.update(args.chunking_version, "utf8");
  return h.digest("hex");
}
