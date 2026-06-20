// Conversation CRUD service for the chat domain (chat.back.md v2.0.0 §1.1).
//
// Owns the read/write surface for the `chat_conversation` aggregate root
// consumed by UC-01 (create), UC-04 (list/get/update/delete), UC-08 (usage).
// All DB access is delegated to `chat.repository` (TC-01) and wrapped in the
// shared `withTransaction` / `withReadOnly` helpers from
// `modules/curation/service/transaction.ts` — the chat domain owns NO new
// transaction primitives (chat.back.md §3 "Reuse, not redefine").
//
// BR map (chat.back.md v2.0.0 §4):
//   BR-22  conversation lookup miss -> ConversationNotFoundError (404)
//   BR-30  create body invariants — validated at the route layer (Zod);
//          service accepts an already-validated `{ title: string | null }`
//   BR-35  cursor pagination — base64url-encoded JSON `{ created_at, id }`,
//          decoded here; malformed cursor -> InvalidCursorError (422)
//   BR-36  PATCH — service receives an already-validated patch; null returned
//          by the repository -> ConversationNotFoundError
//   BR-37  cascade DELETE — repository returns rowCount; 0 -> ConversationNotFoundError
//   BR-40  aggregate usage — confirm conversation exists FIRST (BR-22), then
//          run the single-statement aggregation
//
// Path-of-the-conversation: routes -> service (this file) -> repository ->
// pg client. The service is the layer that owns business invariants the
// repository does not encode (cursor opaque format, 404-vs-200 mapping).

import type { Pool } from "pg";

import {
  withReadOnly,
  withTransaction,
} from "../../curation/service/transaction.js";
import * as repo from "../repository/chat.repository.js";
import type {
  ConversationListPage,
  ConversationRow,
  ConversationUsage,
} from "../repository/chat.repository.js";
import { ConversationNotFoundError } from "./errors.js";

// ---------------------------------------------------------------------------
// Cursor (BR-35)
// ---------------------------------------------------------------------------

/** Decoded cursor shape — matches the repository's `cursor` input. */
export interface ConversationCursor {
  readonly createdAt: string;
  readonly id: string;
}

/**
 * Thrown by `decodeCursor` when the input string is not valid base64url JSON
 * with the expected `{ created_at, id }` shape (BR-35). The route handler
 * surfaces this as 422 `VALIDATION_INVALID_FORMAT` with
 * `details.param = "cursor"`. We use a dedicated class so the route layer
 * can branch on it without parsing the underlying JSON error.
 */
export class InvalidCursorError extends Error {
  public readonly statusCode = 422;
  public readonly code = "VALIDATION_INVALID_FORMAT" as const;
  public readonly param = "cursor" as const;

  constructor(detail: string) {
    super(`invalid cursor: ${detail}`);
    this.name = "InvalidCursorError";
  }
}

/**
 * Encode a `(created_at, id)` pair as the opaque cursor string returned in
 * `next_cursor` (BR-35). Uses base64url so the value is URL-safe without
 * escaping. The shape uses snake_case `created_at` to mirror the wire format
 * the SPA receives — keeping the encoded payload self-describing.
 */
export function encodeCursor(createdAt: string, id: string): string {
  const json = JSON.stringify({ created_at: createdAt, id });
  return Buffer.from(json, "utf8").toString("base64url");
}

/**
 * Decode an opaque cursor string back to its `(createdAt, id)` pair (BR-35).
 * Throws `InvalidCursorError` on any failure (malformed base64, malformed
 * JSON, wrong shape). The route handler maps to 422.
 */
export function decodeCursor(raw: string): ConversationCursor {
  let json: string;
  try {
    json = Buffer.from(raw, "base64url").toString("utf8");
  } catch (_err) {
    void _err;
    throw new InvalidCursorError("not valid base64url");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (_err) {
    void _err;
    throw new InvalidCursorError("not valid JSON");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { created_at?: unknown }).created_at !== "string" ||
    typeof (parsed as { id?: unknown }).id !== "string"
  ) {
    throw new InvalidCursorError("expected shape { created_at, id }");
  }
  const obj = parsed as { created_at: string; id: string };
  return { createdAt: obj.created_at, id: obj.id };
}

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export interface CreateConversationInput {
  /** Zod-validated; `null` is accepted (BR-30 — title is optional at create). */
  readonly title: string | null;
}

export interface ListConversationsInput {
  /** Route layer enforces [1, 100], default 20 (BR-35). */
  readonly limit: number;
  /** Opaque base64url JSON cursor; `null` for the first page. */
  readonly cursor: string | null;
  /** Defaults `false` at the route layer (BR-35). */
  readonly includeArchived: boolean;
}

export interface ListConversationsResult {
  readonly items: ConversationRow[];
  /** Opaque cursor for the next page, or `null` when no more pages. */
  readonly nextCursor: string | null;
}

export interface UpdateConversationInput {
  /** `undefined` = do not change; `null` = clear; string = set. (BR-36) */
  readonly title?: string | null;
  /** `undefined` = do not change; `null` = un-archive; ISO ts = archive. (BR-36) */
  readonly archived_at?: string | null;
}

/**
 * Insert a new conversation (UC-01 / BR-30). Returns the persisted row with
 * server-assigned `id`, `created_at`, `updated_at`; `archived_at` and
 * `summary_rolling` initialised to NULL.
 */
export async function createConversation(
  pool: Pool,
  input: CreateConversationInput
): Promise<ConversationRow> {
  return withTransaction(pool, (client) =>
    repo.insertConversation(client, { title: input.title })
  );
}

/**
 * List conversations with cursor pagination (UC-04 / BR-35). Decodes the
 * incoming opaque cursor, fetches `limit + 1` rows (the repository handles
 * the `+1`), and builds the outbound `next_cursor` from the last row when
 * `hasMore`.
 */
export async function listConversations(
  pool: Pool,
  input: ListConversationsInput
): Promise<ListConversationsResult> {
  const decoded = input.cursor === null ? null : decodeCursor(input.cursor);
  const page: ConversationListPage = await withReadOnly(pool, (client) =>
    repo.listConversations(client, {
      limit: input.limit,
      cursor: decoded,
      includeArchived: input.includeArchived,
    })
  );
  // The cursor encodes the LAST row of the page when more exist — the
  // composite key `(created_at, id)` continues the DESC scan from there.
  const last = page.items[page.items.length - 1];
  const nextCursor =
    page.hasMore && last !== undefined
      ? encodeCursor(last.created_at, last.id)
      : null;
  return { items: page.items, nextCursor };
}

/**
 * Read a single conversation (UC-04 / BR-22). Maps the repository's null
 * return to `ConversationNotFoundError`, which the route handler renders as
 * 404 `RESOURCE_NOT_FOUND`.
 */
export async function getConversation(
  pool: Pool,
  id: string
): Promise<ConversationRow> {
  const row = await withReadOnly(pool, (client) =>
    repo.getConversationById(client, id)
  );
  if (row === null) throw new ConversationNotFoundError(id);
  return row;
}

/**
 * Apply a PATCH to a conversation (UC-04 / BR-36). The route layer enforces
 * that the body carries at least one field; the repository interprets
 * `undefined` as "do not change". Missing row -> `ConversationNotFoundError`.
 *
 * The `set_updated_at` trigger on `chat_conversation` bumps `updated_at`
 * automatically — the service never sets it explicitly.
 */
export async function updateConversation(
  pool: Pool,
  id: string,
  patch: UpdateConversationInput
): Promise<ConversationRow> {
  const row = await withTransaction(pool, (client) =>
    repo.updateConversation(client, id, patch)
  );
  if (row === null) throw new ConversationNotFoundError(id);
  return row;
}

/**
 * Delete a conversation and cascade to its messages + tool calls (UC-04 /
 * BR-37). Cascade is enforced by `ON DELETE CASCADE` on the FKs (DDL §2.3,
 * §2.4) — the service issues a single statement and reads `rowCount`. Zero
 * rows -> `ConversationNotFoundError`; one row -> success (the route
 * responds 204).
 */
export async function deleteConversation(
  pool: Pool,
  id: string
): Promise<void> {
  const rowCount = await withTransaction(pool, (client) =>
    repo.deleteConversation(client, id)
  );
  if (rowCount === 0) throw new ConversationNotFoundError(id);
}

/**
 * Aggregate token + message + tool-call counts for a conversation (UC-08 /
 * BR-40). Confirms the conversation exists FIRST (BR-22) so the response
 * differs between 404 (absent) and 200 with zero counts (empty
 * conversation). The two reads share no transaction boundary because the
 * BFF is single-owner — there is no concurrent writer that could race the
 * existence check against the aggregation.
 */
export async function getConversationUsage(
  pool: Pool,
  id: string
): Promise<ConversationUsage> {
  return withReadOnly(pool, async (client) => {
    const exists = await repo.getConversationById(client, id);
    if (exists === null) throw new ConversationNotFoundError(id);
    return repo.getConversationUsage(client, id);
  });
}
