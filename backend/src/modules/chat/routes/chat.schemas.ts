// Zod schemas for the chat REST surface (v2.0 — stateful conversations).
//
// Mirrors `docs/specs/domains/chat/openapi.yaml` (#/components/schemas/...) and
// the back-spec BR-01..BR-40. Validation failures propagate as `ZodError` and
// are translated to HTTP 422 `VALIDATION_INVALID_FORMAT` by the global error
// handler (`backend/src/middleware/error-handler.ts` — `classify(...)`).
//
// Boundary rule (chat.back.md §1.1 + BR-23): this file owns the PRE-STREAM
// validation. Anything that escapes here is treated as a post-stream condition
// by the route handler.

import { z } from "zod";

// ---------------------------------------------------------------------------
// v1 carry-over — ChatMessage / ChatTurnRequest
//
// The v1 stateless POST /api/v1/chat surface is REMOVED in v2.0 (chat.back.md
// §1.1, openapi.yaml v2.0.0). Existing exports are KEPT for backward
// compatibility of imports — they are unused by `conversations.routes.ts` and
// can be removed in a follow-up cleanup (logged as spec_divergence in
// TC-003 delivery).
// ---------------------------------------------------------------------------

/** Allowed roles on a persisted chat_message row. v2.0 (BR-02). */
export const ChatRoleSchema = z.enum(["user", "assistant"]);

/** Per-message schema — `{ role, content }`. v1 surface, kept for backward compat. */
export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().min(1, "content must be a non-empty string"),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export interface BuildChatTurnRequestSchemaOptions {
  readonly maxHistoryMessages: number;
}

/** v1 carry-over — `POST /api/v1/chat` body. Unused in v2.0. */
export function buildChatTurnRequestSchema(
  opts: BuildChatTurnRequestSchemaOptions
) {
  return z
    .object({
      messages: z
        .array(ChatMessageSchema)
        .min(1, "messages must contain at least 1 entry")
        .max(
          opts.maxHistoryMessages,
          `messages must contain at most ${opts.maxHistoryMessages} entries`
        ),
      model: z.string().min(1).optional(),
    })
    .refine((v) => v.messages[0]?.role === "user", {
      message: "first message must have role=user",
      path: ["messages", 0, "role"],
    });
}

export type ChatTurnRequest = z.infer<
  ReturnType<typeof buildChatTurnRequestSchema>
>;

// ---------------------------------------------------------------------------
// v2 — Conversation CRUD bodies (BR-30, BR-36)
// ---------------------------------------------------------------------------

/**
 * `POST /api/v1/conversations` body. BR-30 — body is OPTIONAL; an empty body
 * `{}` creates a conversation with `title = NULL` (title may be auto-distilled
 * later, BR-34).
 */
export const CreateConversationRequest = z.object({
  title: z.string().min(1).max(200).optional(),
});
export type CreateConversationInput = z.infer<typeof CreateConversationRequest>;

/**
 * `PATCH /api/v1/conversations/:id` body. BR-36 — at least one of `title`
 * or `archived_at` must be present; empty body -> 422
 * `VALIDATION_REQUIRED_FIELD`. `null` clears `title`, un-archives on
 * `archived_at`.
 */
export const UpdateConversationRequest = z
  .object({
    title: z.union([z.string().min(1).max(200), z.null()]).optional(),
    archived_at: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .refine(
    (body) => body.title !== undefined || body.archived_at !== undefined,
    {
      // The `.refine` failure renders as `VALIDATION_INVALID_FORMAT` via the
      // global ZodError handler. The route handler also catches the empty-body
      // case explicitly (request.body === undefined) and surfaces it as
      // `VALIDATION_REQUIRED_FIELD` to match BR-36.
      message:
        "VALIDATION_REQUIRED_FIELD: at least one of title or archived_at must be present",
    }
  );
export type UpdateConversationInput = z.infer<typeof UpdateConversationRequest>;

// ---------------------------------------------------------------------------
// v2 — sendMessage body (BR-01)
// ---------------------------------------------------------------------------

export interface BuildSendMessageRequestSchemaOptions {
  /** Upper bound on `content.length` (BR-01). Pass `env.MAX_CONTENT_LENGTH`. */
  readonly maxContentLength: number;
}

/**
 * `POST /api/v1/conversations/:id/messages` body (BR-01). The user provides
 * ONE `content` string and an optional `model` override. The server reconstructs
 * the conversation history server-side (BR-31) — the client MUST NOT send
 * any `messages[]`.
 */
export function buildSendMessageRequestSchema(
  opts: BuildSendMessageRequestSchemaOptions
) {
  return z.object({
    content: z
      .string()
      .min(1, "content must be a non-empty string")
      .max(
        opts.maxContentLength,
        `content must be at most ${opts.maxContentLength} characters`
      ),
    model: z.string().min(1).optional(),
  });
}
export type SendMessageInput = z.infer<
  ReturnType<typeof buildSendMessageRequestSchema>
>;

// ---------------------------------------------------------------------------
// v2 — listConversations / listMessages query params
// ---------------------------------------------------------------------------

/** `GET /api/v1/conversations` query string. BR-35. */
export const ListConversationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  include_archived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(false),
});
export type ListConversationsInput = z.infer<typeof ListConversationsQuery>;

/** `GET /api/v1/conversations/:id/messages` query string. BR-39. */
export const ListMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
});
export type ListMessagesInput = z.infer<typeof ListMessagesQuery>;

// ---------------------------------------------------------------------------
// v2 — header + param schemas
// ---------------------------------------------------------------------------

/**
 * `Idempotency-Key` header (BR-26). RFC 4122 UUID. Missing or non-UUID -> 422
 * (rendered separately by the route handler so the error code can differ:
 * `VALIDATION_REQUIRED_FIELD` vs `VALIDATION_INVALID_FORMAT`).
 */
export const IdempotencyKeyHeader = z.string().uuid();

/** `:id` path parameter for conversation-scoped endpoints. */
export const ConversationIdParam = z.object({ id: z.string().uuid() });
export type ConversationIdInput = z.infer<typeof ConversationIdParam>;

// ---------------------------------------------------------------------------
// Graph view persistence (BR-42)
// ---------------------------------------------------------------------------

/** Position record for a single graph node. */
const NodePosition = z.object({ x: z.number(), y: z.number() });

/**
 * `PUT /conversations/:id/graph` request body — discriminated union v1|v2.
 *
 * Snapshot shape: { version, nodes, links, positions, user_pinned, [layout_algorithm] }.
 * Size cap on nodes/links (max 2000 each) bounds the JSONB blob.
 *
 * v1 — legacy snapshots (pre tree/radial layouts).
 * v2 — adds `layout_algorithm` (`'force' | 'tree' | 'radial'`) for the
 *      tree/radial layout feature. The FE's `getSnapshot` emits v2; the FE's
 *      `hydrate` owns the back-compat default for v1 rows, so the BE MUST
 *      persist v1 verbatim (no synthetic `layout_algorithm` injection).
 */
// Snapshot nodes/links are the FE's React Flow view state — richer and more
// volatile than the `graph_delta` wire shape — so we validate the invariant the
// BE actually relies on (each entry is an object keyed by a string `id`) and
// `.passthrough()` the presentation-only fields rather than coupling to the
// FE's exact shape. Replaces the prior `z.any()` (no per-element validation).
const GraphSnapshotNode = z.object({ id: z.string() }).passthrough();
const GraphSnapshotLink = z.object({ id: z.string() }).passthrough();

const GraphViewSnapshotBaseFields = {
  nodes: z
    .array(GraphSnapshotNode)
    .max(2000, "nodes must contain at most 2000 entries"),
  links: z
    .array(GraphSnapshotLink)
    .max(2000, "links must contain at most 2000 entries"),
  positions: z.record(z.string(), NodePosition),
  user_pinned: z.array(z.string()),
} as const;

const GraphViewSnapshotV1 = z.object({
  version: z.literal(1),
  ...GraphViewSnapshotBaseFields,
});

const GraphViewSnapshotV2 = z.object({
  version: z.literal(2),
  ...GraphViewSnapshotBaseFields,
  layout_algorithm: z.enum(["force", "tree", "radial"]),
});

export const SaveGraphViewRequest = z.discriminatedUnion("version", [
  GraphViewSnapshotV1,
  GraphViewSnapshotV2,
]);
export type SaveGraphViewRequestType = z.infer<typeof SaveGraphViewRequest>;
