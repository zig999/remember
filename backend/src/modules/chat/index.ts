// Public surface of the chat module — the bootstrap (`app.ts`) consumes only
// what is re-exported here.

export { registerChatRoutes } from "./routes/chat.routes.js";
export type { ChatRouteDeps } from "./routes/chat.routes.js";

export {
  buildChatTurnRequestSchema,
  ChatMessageSchema,
  ChatRoleSchema,
} from "./routes/chat.schemas.js";
export type {
  BuildChatTurnRequestSchemaOptions,
  ChatMessageInput,
  ChatTurnRequest,
} from "./routes/chat.schemas.js";

export { CHAT_TOOL_NAMES } from "./service/tool-catalog.js";
