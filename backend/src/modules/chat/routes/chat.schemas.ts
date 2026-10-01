import { z } from "zod";

export const ChatRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().min(1, "content must be a non-empty string"),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export interface BuildChatTurnRequestSchemaOptions {
  readonly maxHistoryMessages: number;
}

export function buildChatTurnRequestSchema(
  opts: BuildChatTurnRequestSchemaOptions
): z.ZodObject<{
  messages: z.ZodArray<typeof ChatMessageSchema>;
  model: z.ZodOptional<z.ZodString>;
}> {
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

export const CreateConversationRequest = z.object({
  title: z.string().min(1).max(200).optional(),
});
export type CreateConversationInput = z.infer<typeof CreateConversationRequest>;

export const UpdateConversationRequest = z
  .object({
    title: z.union([z.string().min(1).max(200), z.null()]).optional(),
    archived_at: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .refine(
    (body) => body.title !== undefined || body.archived_at !== undefined,
    {
      message:
        "VALIDATION_REQUIRED_FIELD: at least one of title or archived_at must be present",
    }
  );
export type UpdateConversationInput = z.infer<typeof UpdateConversationRequest>;

export interface BuildSendMessageRequestSchemaOptions {
  readonly maxContentLength: number;
}

export function buildSendMessageRequestSchema(
  opts: BuildSendMessageRequestSchemaOptions
): z.ZodObject<{
  content: z.ZodString;
  model: z.ZodOptional<z.ZodString>;
}> {
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

export const ListConversationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  include_archived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(false),
});
export type ListConversationsInput = z.infer<typeof ListConversationsQuery>;

export const ListMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
});
export type ListMessagesInput = z.infer<typeof ListMessagesQuery>;

export const IdempotencyKeyHeader = z.string().uuid();

export const ConversationIdParam = z.object({ id: z.string().uuid() });
export type ConversationIdInput = z.infer<typeof ConversationIdParam>;

const NodePosition = z.object({ x: z.number(), y: z.number() });

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
