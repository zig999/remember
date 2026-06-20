// Public surface of the chat module — the bootstrap (`app.ts`) consumes only
// what is re-exported here.
//
// v2.0 (chat.back.md §1.1): the stateful 9-endpoint surface lives in
// `routes/conversations.routes.ts`. The v1 stateless `POST /api/v1/chat`
// route is removed.

export { registerChatRoutes } from "./routes/conversations.routes.js";
export type { ChatRouteDeps } from "./routes/conversations.routes.js";

export {
  buildSendMessageRequestSchema,
  ChatMessageSchema,
  ChatRoleSchema,
  ConversationIdParam,
  CreateConversationRequest,
  IdempotencyKeyHeader,
  ListConversationsQuery,
  ListMessagesQuery,
  UpdateConversationRequest,
} from "./routes/chat.schemas.js";
export type {
  BuildSendMessageRequestSchemaOptions,
  ChatMessageInput,
  ConversationIdInput,
  CreateConversationInput,
  ListConversationsInput,
  ListMessagesInput,
  SendMessageInput,
  UpdateConversationInput,
} from "./routes/chat.schemas.js";

export { CHAT_TOOL_NAMES } from "./service/tool-catalog.js";
