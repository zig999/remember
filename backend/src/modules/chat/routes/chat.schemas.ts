// Zod schemas for the chat REST surface.
//
// Mirrors `docs/specs/domains/chat/openapi.yaml` (#/components/schemas/
// ChatTurnRequest) and the back-spec BR-01..BR-04. Validation failures
// propagate as `ZodError` and are translated to HTTP 422
// `VALIDATION_INVALID_FORMAT` by the global error handler
// (`backend/src/middleware/error-handler.ts` — `classify(...)`).
//
// Boundary rule (chat.back.md §1.1 + BR-23): this file owns the PRE-STREAM
// validation — empty / oversized history, role mismatch, non-string content,
// non-`user` first message. Anything that escapes here is treated as a
// post-stream condition by the route handler.

import { z } from "zod";

// ---------------------------------------------------------------------------
// ChatMessage — one entry of the public conversation history.
// ---------------------------------------------------------------------------

/**
 * Allowed roles on the PUBLIC history. The transient
 * `assistant(tool_use)` / `user(tool_result)` blocks the agentic loop
 * synthesises during iteration are NOT serialised back to the client
 * (BR-03). They live only inside the in-loop history fed to Anthropic.
 */
export const ChatRoleSchema = z.enum(["user", "assistant"]);

/** Per-message schema — `{ role, content }`. BR-03 + BR-04. */
export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().min(1, "content must be a non-empty string"),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

// ---------------------------------------------------------------------------
// ChatTurnRequest — the public POST /api/v1/chat body.
//
// Factory: the maximum history length (BR-01) is read from env at boot, so
// the schema is built once at route registration with the resolved ceiling.
// Building the schema as a factory keeps the env coupling at the edge and
// avoids re-instantiation per request.
// ---------------------------------------------------------------------------

export interface BuildChatTurnRequestSchemaOptions {
  /** Upper bound on `messages.length` (BR-01). Pass `env.MAX_HISTORY_MESSAGES`. */
  readonly maxHistoryMessages: number;
}

/**
 * Build the body schema for `POST /api/v1/chat`. BR-01 (length bound), BR-02
 * (first message is `user`), BR-03 (roles), BR-04 (non-empty content) are
 * enforced here. The optional `model` is a free string — no allow-list at the
 * BFF (chat.back.md §7 "No pre-flight model allow-list").
 */
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

/**
 * Concrete inferred type of the request. Built from a fresh factory instance
 * so type users (the route handler) see the post-refine shape without taking
 * a dependency on the runtime `maxHistoryMessages` value.
 */
export type ChatTurnRequest = z.infer<
  ReturnType<typeof buildChatTurnRequestSchema>
>;
