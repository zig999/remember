// Fastify routes for the chat module (chat.back.md v2.0.0 §1.1).
//
// Mounted by `app.ts` under the `/conversations` prefix inside the
// authenticated `/api/v1` scope. Exposes the nine operationIds from
// `docs/specs/domains/chat/openapi.yaml` v2.0.0:
//
//   POST   /                            createConversation     (BR-30)
//   GET    /                            listConversations      (BR-35)
//   GET    /:id                         getConversation        (BR-22)
//   PATCH  /:id                         updateConversation     (BR-36)
//   DELETE /:id                         deleteConversation     (BR-37)
//   POST   /:id/messages                sendMessage  (SSE; BR-22..BR-32 + BR-29 sequencing)
//   GET    /:id/messages                listMessages           (BR-39)
//   GET    /:id/usage                   getConversationUsage   (BR-40)
//   POST   /:id/cancel                  cancelTurn             (BR-38)
//
// This file owns ONLY the wire concerns:
//   - Zod parse of body / query / headers (BR-01/BR-04/BR-26/BR-30/BR-36).
//   - Kill-switch short-circuit on every endpoint (BR-14).
//   - Conversation lookup + archived check on every conversation-scoped path (BR-22 / BR-25).
//   - Idempotency check + turn-registry check on `sendMessage` (BR-27 / BR-28).
//   - The BR-29 persistence sequencing:
//       1. validate -> 2. load conv -> 3. archived -> 4. turn registry ->
//       5. idempotency -> 6. insertUserMessage tx -> 7. buildModelContext ->
//       8. reply.hijack() + SSE headers -> 9. runTurn loop ->
//      10. reply.raw.end() + release registry -> 11. insertAssistantMessage tx +
//          attachToolCallsToMessage -> 12. pino INFO -> 13. fire-and-forget
//          distillation (BR-33/BR-34).
//   - Mapping the typed chat sentinel errors to the REST envelope (BR-23 pre-stream).
//
// What this file does NOT own:
//   - The agentic loop, ceilings, tool dispatch, output guard, truncation,
//     args-summary builder, content-block accumulation — all live in
//     `service/chat-agent.service.ts`.
//   - DB SQL — delegated to `repository/chat.repository.ts`.
//   - Cursor decoding — delegated to `service/conversation.service.ts`.
//   - Distillation policy — delegated to `service/distillation.service.ts`.

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Logger } from "pino";
import type { Pool } from "pg";

import type { Env } from "../../../config/env.js";
import type { McpServer } from "../../../mcp/server.js";
import type { CatalogSnapshot } from "../../knowledge-graph/catalog/catalog.js";
import {
  withReadOnly,
  withTransaction,
} from "../../curation/service/transaction.js";
import * as chatRepo from "../repository/chat.repository.js";
import type {
  AssistantStopReason,
  MessageRow,
} from "../repository/chat.repository.js";
import {
  buildChatToolCatalog,
  CHAT_TOOL_NAMES,
  type ResolvedChatToolCatalog,
} from "../service/tool-catalog.js";
import {
  normalizeToolResult,
  type GraphDeltaWire,
} from "../service/graph-normalizer.js";
import {
  createChatAgentService,
  type ChatAgentServiceWithStats,
} from "../service/chat-agent.service.js";
import {
  ChatDisabledError,
  ChatProviderUnavailableError,
  ConversationArchivedError,
  IdempotencyMismatchError,
  TurnInProgressError,
  mapChatError,
} from "../service/errors.js";
import {
  decodeCursor,
  encodeCursor,
  InvalidCursorError,
} from "../service/conversation.service.js";
import { buildModelContext } from "../service/context-builder.js";
import {
  maybeDistillTitle,
  maybeRefreshSummary,
  type AnthropicUtilityLike,
} from "../service/distillation.service.js";
import { defaultAnthropicFactory } from "../../ingestion/service/extraction.service.js";
import type { AnthropicFactory } from "../../ingestion/service/extraction.service.js";
import * as turnRegistry from "../service/turn-registry.js";
import { selectChatPromptModule } from "../prompts/index.js";
import type {
  ChatEvent,
  ChatRunInput,
  DoneStopReason,
} from "../service/types.js";
import {
  ConversationIdParam,
  CreateConversationRequest,
  IdempotencyKeyHeader,
  ListConversationsQuery,
  ListMessagesQuery,
  SaveGraphViewRequest,
  UpdateConversationRequest,
  buildSendMessageRequestSchema,
} from "./chat.schemas.js";

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/**
 * Dependencies wired by `app.ts`. The `anthropicFactory` is intentionally
 * optional — production uses `defaultAnthropicFactory` (BR-21); tests inject
 * a stub.
 */
export interface ChatRouteDeps {
  readonly mcp: McpServer;
  readonly logger: Logger;
  readonly env: Env;
  readonly pool: Pool;
  readonly anthropicFactory?: AnthropicFactory;
  /** Optional wall-clock injection (tests). Defaults to `Date.now`. */
  readonly now?: () => number;
  /**
   * Optional catalog snapshot (TC-be-002). Required for the `graph_delta` SSE
   * projection — every link in a `graph_delta` carries `is_temporal` which the
   * normalizer resolves via `catalog.linkTypeByName`. When the catalog is
   * absent (e.g. tests that do not load it) the route silently skips graph
   * normalization: tool_result frames still emit, but no `graph_delta` frame
   * is generated. The eight non-SSE endpoints do NOT need the catalog.
   */
  readonly catalog?: CatalogSnapshot;
}

/**
 * Register the 9 conversation endpoints on the supplied scope (called from
 * `app.ts` inside the `/api/v1/conversations` scope).
 *
 * Boot ordering (chat.back.md §1.1 + §7): the `query` toolset is populated
 * by `registerQueryToolset` / `registerQueryRetrievalToolset` AFTER this
 * registrar runs. The chat-agent service is therefore built lazily on the
 * first `sendMessage` request and cached. The other 8 endpoints DO NOT
 * depend on the catalog — they only touch the DB.
 */
export async function registerChatRoutes(
  scoped: FastifyInstance,
  deps: ChatRouteDeps
): Promise<void> {
  // Lazy chat-agent container — only `sendMessage` needs it. Built on the
  // first request after the catalog has fully resolved (BR-05).
  let cachedService: ChatAgentServiceWithStats | undefined;
  // Lazy catalog cache — sticky on miss (BR-05).
  let catalogState: "unresolved" | "missing" | "resolved" = "unresolved";

  // Body schema for sendMessage — built once with the resolved MAX_CONTENT_LENGTH.
  const sendMessageSchema = buildSendMessageRequestSchema({
    maxContentLength: deps.env.MAX_CONTENT_LENGTH,
  });

  // Factory + utility client — wired once and shared across requests.
  const anthropicFactory: AnthropicFactory =
    deps.anthropicFactory ?? defaultAnthropicFactory;
  const now = deps.now ?? (() => Date.now());

  // Prompt registry — resolved LAZILY on the first `sendMessage` request so
  // tests that exercise the other 8 endpoints without setting
  // `CHAT_PROMPT_VERSION` still pass. An unknown version fails the first
  // sendMessage with a SYSTEM_INTERNAL_ERROR (BR-18 boot semantics preserved
  // by the chat-agent factory which ALSO calls `selectChatPromptModule`).
  let cachedPromptModule:
    | ReturnType<typeof selectChatPromptModule>
    | undefined;
  function getPromptModuleLazy(): ReturnType<typeof selectChatPromptModule> {
    if (cachedPromptModule === undefined) {
      cachedPromptModule = selectChatPromptModule(deps.env.CHAT_PROMPT_VERSION);
    }
    return cachedPromptModule;
  }

  /**
   * Lazy initialiser for the chat-agent service. Returns the service when the
   * catalog resolves; otherwise records the miss (BR-05) and returns
   * `undefined`. Idempotent — subsequent calls return the cached state.
   */
  function getChatAgentLazy(): ChatAgentServiceWithStats | undefined {
    if (cachedService !== undefined) return cachedService;
    if (catalogState === "missing") return undefined;
    const catalog = buildChatToolCatalog(deps.mcp);
    if (catalog === undefined) {
      catalogState = "missing";
      deps.logger.error(
        {
          event: "chat.catalog_unresolved",
          missing: computeMissingToolNames(deps.mcp),
          expected: [...CHAT_TOOL_NAMES],
        },
        "chat tool catalog is not fully resolved — sendMessage returns 503"
      );
      return undefined;
    }
    try {
      cachedService = buildChatService(catalog, deps, anthropicFactory);
    } catch (err) {
      if (err instanceof ChatDisabledError) {
        catalogState = "resolved";
        return undefined;
      }
      throw err;
    }
    catalogState = "resolved";
    return cachedService;
  }

  /**
   * Build (or fetch) the Anthropic SDK client used for the non-streaming
   * distillation calls. The same `anthropicFactory` powers both the turn loop
   * and the distillation jobs — keeps the SDK seam single.
   */
  let cachedUtilityClient: AnthropicUtilityLike | undefined;
  function getUtilityClient(): AnthropicUtilityLike | undefined {
    if (cachedUtilityClient !== undefined) return cachedUtilityClient;
    try {
      cachedUtilityClient = anthropicFactory(
        deps.env.ANTHROPIC_API_KEY
      ) as unknown as AnthropicUtilityLike;
    } catch (err) {
      // Distillation is best-effort — log + skip. The route does not throw.
      deps.logger.warn(
        {
          event: "chat.distillation_factory_failed",
          cause_message: err instanceof Error ? err.message : "unknown",
        },
        "chat distillation factory failed — skipping background jobs"
      );
      return undefined;
    }
    return cachedUtilityClient;
  }

  // -------------------------------------------------------------------------
  // POST / — createConversation (BR-30)
  // -------------------------------------------------------------------------
  scoped.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const body = CreateConversationRequest.parse(request.body ?? {});
      const conversation = await withTransaction(deps.pool, (client) =>
        chatRepo.insertConversation(client, { title: body.title ?? null })
      );
      return reply.code(201).send({ ok: true, result: conversation });
    }
  );

  // -------------------------------------------------------------------------
  // GET / — listConversations (BR-35)
  // -------------------------------------------------------------------------
  scoped.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const query = ListConversationsQuery.parse(request.query ?? {});
      let decodedCursor: { createdAt: string; id: string } | null = null;
      if (query.cursor !== undefined) {
        try {
          decodedCursor = decodeCursor(query.cursor);
        } catch (err) {
          if (err instanceof InvalidCursorError) {
            return reply.code(422).send({
              ok: false,
              error: {
                code: "VALIDATION_INVALID_FORMAT",
                message: err.message,
                details: { param: "cursor" },
              },
            });
          }
          throw err;
        }
      }
      const page = await withReadOnly(deps.pool, (client) =>
        chatRepo.listConversations(client, {
          limit: query.limit,
          cursor: decodedCursor,
          includeArchived: query.include_archived,
        })
      );
      const last = page.items[page.items.length - 1];
      const nextCursor =
        page.hasMore && last !== undefined
          ? encodeCursor(last.created_at, last.id)
          : null;
      return reply
        .code(200)
        .send({ ok: true, result: { items: page.items, next_cursor: nextCursor } });
    }
  );

  // -------------------------------------------------------------------------
  // GET /:id — getConversation (BR-22)
  // -------------------------------------------------------------------------
  scoped.get(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const conversation = await withReadOnly(deps.pool, (client) =>
        chatRepo.getConversationById(client, id)
      );
      if (conversation === null) {
        return sendNotFound(reply, id);
      }
      return reply.code(200).send({ ok: true, result: conversation });
    }
  );

  // -------------------------------------------------------------------------
  // PATCH /:id — updateConversation (BR-36)
  // -------------------------------------------------------------------------
  scoped.patch(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      // BR-36 step 1: empty body -> 422 VALIDATION_REQUIRED_FIELD.
      if (
        request.body === undefined ||
        request.body === null ||
        (typeof request.body === "object" &&
          Object.keys(request.body).length === 0)
      ) {
        return reply.code(422).send({
          ok: false,
          error: {
            code: "VALIDATION_REQUIRED_FIELD",
            message: "at least one of title or archived_at must be present",
            details: { body: "PATCH /conversations/:id" },
          },
        });
      }
      const patch = UpdateConversationRequest.parse(request.body);
      const updated = await withTransaction(deps.pool, (client) =>
        chatRepo.updateConversation(client, id, patch)
      );
      if (updated === null) {
        return sendNotFound(reply, id);
      }
      return reply.code(200).send({ ok: true, result: updated });
    }
  );

  // -------------------------------------------------------------------------
  // DELETE /:id — deleteConversation (BR-37)
  // -------------------------------------------------------------------------
  scoped.delete(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const rowCount = await withTransaction(deps.pool, (client) =>
        chatRepo.deleteConversation(client, id)
      );
      if (rowCount === 0) {
        return sendNotFound(reply, id);
      }
      return reply.code(204).send();
    }
  );

  // -------------------------------------------------------------------------
  // GET /:id/messages — listMessages (BR-39)
  // -------------------------------------------------------------------------
  scoped.get(
    "/:id/messages",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const query = ListMessagesQuery.parse(request.query ?? {});
      // BR-22 before query.
      const exists = await withReadOnly(deps.pool, (client) =>
        chatRepo.getConversationById(client, id)
      );
      if (exists === null) {
        return sendNotFound(reply, id);
      }
      const page = await withReadOnly(deps.pool, (client) =>
        chatRepo.listMessagesPaginated(client, id, {
          limit: query.limit,
          before: query.before ?? null,
        })
      );
      // BR-39: next_before = oldest item's created_at when hasMore.
      const oldest = page.items[0];
      const nextBefore =
        page.hasMore && oldest !== undefined ? oldest.created_at : null;
      return reply
        .code(200)
        .send({ ok: true, result: { items: page.items, next_before: nextBefore } });
    }
  );

  // -------------------------------------------------------------------------
  // GET /:id/usage — getConversationUsage (BR-40)
  // -------------------------------------------------------------------------
  scoped.get(
    "/:id/usage",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const usage = await withReadOnly(deps.pool, async (client) => {
        const exists = await chatRepo.getConversationById(client, id);
        if (exists === null) return null;
        return chatRepo.getConversationUsage(client, id);
      });
      if (usage === null) {
        return sendNotFound(reply, id);
      }
      return reply.code(200).send({ ok: true, result: usage });
    }
  );

  // -------------------------------------------------------------------------
  // GET /:id/graph — getConversationGraph (BR-42)
  // -------------------------------------------------------------------------
  scoped.get(
    "/:id/graph",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const result = await withReadOnly(deps.pool, async (client) => {
        const conversation = await chatRepo.getConversationById(client, id);
        if (conversation === null) return null;
        const graphView = await chatRepo.getConversationGraphView(client, id);
        return { found: true as const, snapshot: graphView?.snapshot ?? null };
      });
      if (result === null) {
        return sendNotFound(reply, id);
      }
      return reply.code(200).send({ ok: true, result: result.snapshot });
    }
  );

  // -------------------------------------------------------------------------
  // PUT /:id/graph — saveConversationGraph (BR-42)
  // -------------------------------------------------------------------------
  scoped.put(
    "/:id/graph",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const bodyParsed = SaveGraphViewRequest.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply.code(422).send({
          ok: false,
          error: {
            code: "VALIDATION_INVALID_FORMAT",
            message: "invalid graph view snapshot",
            details: bodyParsed.error.flatten(),
          },
        });
      }
      const snapshot = bodyParsed.data;
      const row = await withTransaction(deps.pool, async (client) => {
        const conversation = await chatRepo.getConversationById(client, id);
        if (conversation === null) return null;
        return chatRepo.upsertConversationGraphView(client, id, snapshot);
      });
      if (row === null) {
        return sendNotFound(reply, id);
      }
      return reply.code(200).send({ ok: true, result: { updated_at: row.updated_at } });
    }
  );

  // -------------------------------------------------------------------------
  // POST /:id/cancel — cancelTurn (BR-38)
  // -------------------------------------------------------------------------
  scoped.post(
    "/:id/cancel",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const conversation = await withReadOnly(deps.pool, (client) =>
        chatRepo.getConversationById(client, id)
      );
      if (conversation === null) {
        return sendNotFound(reply, id);
      }
      if (conversation.archived_at !== null) {
        const { statusCode, envelope } = mapChatError(
          new ConversationArchivedError()
        );
        return reply.code(statusCode).send(envelope);
      }
      const controller = turnRegistry.get(id);
      if (controller === undefined) {
        return reply.code(404).send({
          ok: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "no in-flight turn for this conversation",
            details: { id },
          },
        });
      }
      controller.abort("cancelled");
      return reply.code(202).send({ ok: true, result: { cancelled: true } });
    }
  );

  // -------------------------------------------------------------------------
  // POST /:id/messages — sendMessage  (SSE; BR-29 sequencing)
  // -------------------------------------------------------------------------
  scoped.post(
    "/:id/messages",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // ---- (1) Idempotency-Key header — checked FIRST per spec (BR-26 has
      //          precedence over conversation lookup). Missing -> 422
      //          VALIDATION_REQUIRED_FIELD; non-UUID -> 422
      //          VALIDATION_INVALID_FORMAT.
      const headerValue = (request.headers["idempotency-key"] ?? request.headers["Idempotency-Key"]) as
        | string
        | undefined;
      if (headerValue === undefined || headerValue === "") {
        return reply.code(422).send({
          ok: false,
          error: {
            code: "VALIDATION_REQUIRED_FIELD",
            message: "Idempotency-Key header is required",
            details: { header: "Idempotency-Key" },
          },
        });
      }
      const idempotencyParse = IdempotencyKeyHeader.safeParse(headerValue);
      if (!idempotencyParse.success) {
        return reply.code(422).send({
          ok: false,
          error: {
            code: "VALIDATION_INVALID_FORMAT",
            message: "Idempotency-Key must be a valid UUID",
            details: { header: "Idempotency-Key", received: headerValue },
          },
        });
      }
      const idempotencyKey = idempotencyParse.data;

      // ---- (2) Body parse (BR-01 / BR-04).
      const { id } = ConversationIdParam.parse(request.params ?? {});
      const body = sendMessageSchema.parse(request.body ?? {});
      const resolvedModel =
        body.model !== undefined && body.model.length > 0
          ? body.model
          : deps.env.CHAT_MODEL;

      // ---- (3) Kill-switch (BR-14).
      if (killSwitchTripped(deps.env)) {
        return sendKillSwitch(reply);
      }

      // ---- (4) Load conversation (BR-22).
      const conversation = await withReadOnly(deps.pool, (client) =>
        chatRepo.getConversationById(client, id)
      );
      if (conversation === null) {
        return sendNotFound(reply, id);
      }

      // ---- (5) Archived check (BR-25).
      if (conversation.archived_at !== null) {
        const { statusCode, envelope } = mapChatError(
          new ConversationArchivedError()
        );
        return reply.code(statusCode).send(envelope);
      }

      // ---- (6) Turn-in-progress check (BR-28).
      if (turnRegistry.get(id) !== undefined) {
        const { statusCode, envelope } = mapChatError(new TurnInProgressError());
        return reply.code(statusCode).send(envelope);
      }

      // ---- (7) Idempotency check (BR-27).
      const existingUserRow = await withReadOnly(deps.pool, (client) =>
        chatRepo.findUserByIdempotencyKey(client, id, idempotencyKey)
      );
      const persistedContentBlock = [
        { type: "text", text: body.content },
      ] as const;

      if (existingUserRow !== null) {
        const matches = userRowMatches(existingUserRow, body.content, resolvedModel);
        if (!matches) {
          const { statusCode, envelope } = mapChatError(
            new IdempotencyMismatchError()
          );
          return reply.code(statusCode).send(envelope);
        }
        // Match + identical (content, model). Look up the successor assistant row.
        const assistantSuccessor = await withReadOnly(deps.pool, (client) =>
          chatRepo.findAssistantSuccessor(
            client,
            id,
            existingUserRow.created_at
          )
        );
        if (assistantSuccessor !== null) {
          // UC-07: REPLAY path. Emit llm_start + text_delta + done; no
          // Anthropic call; no new rows.
          return await handleIdempotentReplay({
            reply,
            request,
            deps,
            conversationId: id,
            assistantRow: assistantSuccessor,
            requestId: String(request.id ?? ""),
            now,
          });
        }
        // No successor assistant row.
        if (turnRegistry.get(id) !== undefined) {
          const { statusCode, envelope } = mapChatError(
            new TurnInProgressError()
          );
          return reply.code(statusCode).send(envelope);
        }
        // Recovery path — the original turn died before persisting the
        // assistant row. Reuse the existing user row, skip insert (would
        // collide on UNIQUE PARTIAL), and run the loop.
      }

      // ---- (8) Acquire chat-agent service (BR-05 / BR-21 pre-stream).
      const chatService = getChatAgentLazy();
      if (chatService === undefined && catalogState === "missing") {
        return reply.code(404).send({
          ok: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "chat surface is not available on this deployment",
          },
        });
      }
      if (chatService === undefined) {
        // Catalog resolved but the kill-switch tripped at lazy build time
        // (CHAT_ENABLED was already false). The kill-switch check above
        // already covered the common case; this is defensive.
        return sendKillSwitch(reply);
      }

      // ---- (9) Insert the user row (BR-29 step 3).
      // The inserted row is not consumed downstream — the user row is
      // ALREADY at the tail of `modelContext.messages` via the recent-window
      // read below (BR-31 step 5: "the user row inserted in step 3 IS the
      // last element of the result by construction"). We persist for
      // durability; we do not re-thread the value.
      if (existingUserRow === null) {
        try {
          await withTransaction(deps.pool, (client) =>
            chatRepo.insertUserMessage(client, {
              conversation_id: id,
              content: [...persistedContentBlock],
              idempotency_key: idempotencyKey,
              model: resolvedModel,
            })
          );
        } catch (err) {
          if (isUniqueViolation(err)) {
            // BR-27: concurrent insert won the race. Re-read + resolve replay
            // vs mismatch in the same way we did pre-stream.
            const concurrent = await withReadOnly(deps.pool, (client) =>
              chatRepo.findUserByIdempotencyKey(client, id, idempotencyKey)
            );
            if (concurrent === null) {
              // Should not happen — the conflict came from the same key.
              throw err;
            }
            if (!userRowMatches(concurrent, body.content, resolvedModel)) {
              const { statusCode, envelope } = mapChatError(
                new IdempotencyMismatchError()
              );
              return reply.code(statusCode).send(envelope);
            }
            const successor = await withReadOnly(deps.pool, (client) =>
              chatRepo.findAssistantSuccessor(client, id, concurrent.created_at)
            );
            if (successor !== null) {
              return await handleIdempotentReplay({
                reply,
                request,
                deps,
                conversationId: id,
                assistantRow: successor,
                requestId: String(request.id ?? ""),
                now,
              });
            }
            // Concurrent winner is still running the loop -> 409
            // BUSINESS_TURN_IN_PROGRESS (BR-27 c-with-in-flight).
            const { statusCode, envelope } = mapChatError(
              new TurnInProgressError()
            );
            return reply.code(statusCode).send(envelope);
          }
          throw err;
        }
      }

      // ---- (10) Build the model context (BR-31).
      const modelContext = await buildModelContext({
        pool: deps.pool,
        conversation,
        systemPrompt: getPromptModuleLazy().system(),
        recentLimit: deps.env.CHAT_RECENT_WINDOW,
      });

      // ---- (11) Register controller in the turn registry (BR-28).
      const abortController = new AbortController();
      turnRegistry.register(id, abortController);
      const onSocketClose = (): void => {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      };
      request.raw.on("close", onSocketClose);

      // ---- (12) Get the AsyncIterable BEFORE hijack — a factory throw must
      //          still surface as the REST envelope (BR-21).
      const chatInput: ChatRunInput = {
        system: modelContext.system,
        messages: modelContext.messages,
        model: resolvedModel,
        abortSignal: abortController.signal,
      };
      let iterable: AsyncIterable<ChatEvent>;
      try {
        iterable = chatService.runTurn(chatInput);
      } catch (err) {
        request.raw.removeListener("close", onSocketClose);
        turnRegistry.release(id);
        if (err instanceof ChatProviderUnavailableError) {
          const { statusCode, envelope } = mapChatError(err);
          return reply.code(statusCode).send(envelope);
        }
        throw err;
      }

      // ---- (13) Hijack + SSE headers (BR-29 step 5).
      const turnStartedAt = now();
      reply.hijack();
      writeSseHeaders(reply);

      // ---- (14) Drain the iterable. Persist tool_call rows in-loop (BR-32)
      //          and the per-iteration (assistant, tool_result) message pair on
      //          `iteration_end` (BR-29 step 6.d). `pendingToolCallIds` holds
      //          the current iteration's tool_call rows; they are attached to
      //          that iteration's assistant row when the pair is persisted, then
      //          reset for the next iteration.
      const pendingToolCallIds: string[] = [];
      let assistantContent: ReadonlyArray<unknown> = [];
      let terminalKind: "done" | "error" | "none" = "none";
      let doneStopReason: DoneStopReason | undefined;
      let errorSyntheticStop:
        | "provider_error"
        | "internal_error"
        | undefined;
      let finalModel = resolvedModel;
      const toolsCalled: string[] = [];

      try {
        for await (const evt of iterable) {
          // v2.2 (BR-29 step 6.d): a tool-bearing iteration completed. Persist
          // the (assistant `[text?, tool_use]`, synthetic user `[tool_result]`)
          // pair as TWO atomic chat_message rows so the next turn's replay is a
          // valid Anthropic sequence, and attach this iteration's tool_call
          // audit rows to the assistant row. INTERNAL event — `continue` BEFORE
          // any wire framing so it never reaches the SSE stream.
          if (evt.type === "iteration_end") {
            try {
              await withTransaction(deps.pool, async (client) => {
                const { assistant } = await chatRepo.insertIterationPair(
                  client,
                  {
                    conversation_id: id,
                    assistant_content: [...evt.assistant_content],
                    tool_result_content: [...evt.tool_results],
                    model: finalModel,
                  }
                );
                if (pendingToolCallIds.length > 0) {
                  // Copy — `pendingToolCallIds` is reset right after this
                  // transaction; never hand the live array to the repo.
                  await chatRepo.attachToolCallsToMessage(
                    client,
                    [...pendingToolCallIds],
                    assistant.id
                  );
                }
              });
            } catch (err) {
              // Non-fatal: a failed pair-insert degrades future context replay
              // but must NOT abort the live stream (the SSE frames already
              // reached the client). Surfaced loud in the structured log.
              deps.logger.warn(
                {
                  event: "chat.iteration_pair_persist_failure",
                  conversation_id: id,
                  iteration: evt.iteration,
                  cause_message:
                    err instanceof Error ? err.message : "unknown",
                },
                "chat iteration (assistant, tool_result) pair persist failed"
              );
            }
            pendingToolCallIds.length = 0;
            continue;
          }

          // BR-32: persist tool_result events as chat_tool_call rows.
          if (evt.type === "tool_result") {
            try {
              const row = await withTransaction(deps.pool, (client) =>
                chatRepo.insertToolCall(client, {
                  conversation_id: id,
                  message_id: null,
                  tool_name: evt.tool,
                  arguments: evt.arguments,
                  result: evt.result,
                  is_error: evt.is_error,
                  error_message: evt.error_message,
                  duration_ms: evt.duration_ms,
                })
              );
              pendingToolCallIds.push(row.id);
            } catch (err) {
              deps.logger.warn(
                {
                  event: "chat.tool_call_persist_failure",
                  conversation_id: id,
                  tool_name: evt.tool,
                  cause_message: err instanceof Error ? err.message : "unknown",
                },
                "chat tool_call row persist failed"
              );
            }
          }
          if (evt.type === "tool_start") {
            toolsCalled.push(evt.tool);
          }

          // BR-09: project to the SSE wire frame — drop persistence-only fields.
          const wireFrame = projectSseFrame(evt);
          tryWrite(reply, wireFrame);

          // TC-be-002: synthesise a `graph_delta` frame AFTER the `tool_result`
          // frame for any tool that produces graph data (traverse / get_node /
          // list_nodes / search). The agentic loop does NOT yield this event —
          // it is a pure projection of the preceding `tool_result.result`,
          // owned by the route handler so the service stays free of SSE
          // framing concerns. Order is contractual (plan §4.1): graph_delta
          // ALWAYS follows the tool_result for the same tool call. Skipped
          // entirely when the tool failed (ok:false), when the catalog
          // snapshot is unavailable, or when the normalizer returns null
          // (non-graph-producing tool).
          if (evt.type === "tool_result" && evt.ok && deps.catalog !== undefined) {
            const graphDelta = await projectGraphDelta(
              evt.tool,
              evt.result,
              deps.catalog,
              deps.pool,
              deps.logger,
              id
            );
            if (graphDelta !== null) {
              const graphEvt = {
                type: "graph_delta" as const,
                source_tool: graphDelta.source_tool,
                nodes: graphDelta.nodes,
                links: graphDelta.links,
              };
              tryWrite(reply, projectSseFrame(graphEvt));
            }
          }

          if (evt.type === "done") {
            terminalKind = "done";
            doneStopReason = evt.stop_reason;
            assistantContent = evt.content;
            finalModel = evt.model;
          } else if (evt.type === "error") {
            terminalKind = "error";
            errorSyntheticStop = evt.synthetic_stop_reason;
            assistantContent = evt.content;
          }
        }
      } catch (err) {
        // BR-23 in-stream defensive: any uncaught exception in the loop is
        // mapped to a SYSTEM_INTERNAL_ERROR SSE error frame.
        deps.logger.error(
          {
            event: "chat.iterable_uncaught",
            conversation_id: id,
            cause_message: err instanceof Error ? err.message : "unknown",
          },
          "chat AsyncIterable threw — emitting synthetic error frame"
        );
        const synthetic = {
          type: "error" as const,
          code: "SYSTEM_INTERNAL_ERROR",
          message: "chat encountered an internal error",
        };
        tryWrite(reply, frameJson("error", synthetic));
        terminalKind = "error";
        errorSyntheticStop = "internal_error";
      }

      // ---- (15) reply.raw.end() + release the registry (BR-29 step 7).
      endRaw(reply, deps.logger);
      request.raw.removeListener("close", onSocketClose);
      turnRegistry.release(id);

      // ---- (16) Persist the assistant row + patch tool calls (BR-29 step 8).
      const latencyMs = now() - turnStartedAt;
      const stopReasonForRow = resolveAssistantStopReason({
        terminalKind,
        doneStopReason,
        errorSyntheticStop,
      });
      const stats = chatService.lastStats;
      const tokensIn = stats?.tokens_in ?? 0;
      const tokensOut = stats?.tokens_out ?? 0;
      let assistantRowId: string | null = null;
      try {
        const inserted = await withTransaction(deps.pool, async (client) => {
          const row = await chatRepo.insertAssistantMessage(client, {
            conversation_id: id,
            content: [...assistantContent],
            stop_reason: stopReasonForRow,
            model: finalModel,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            latency_ms: latencyMs,
          });
          // v2.2: normally empty here — a tool-bearing iteration attaches its
          // own tool_calls on `iteration_end`. Defensive: a terminal frame that
          // arrived with tool_calls still pending (e.g. max_iterations right
          // after a tool) attaches them to the closing assistant row.
          if (pendingToolCallIds.length > 0) {
            await chatRepo.attachToolCallsToMessage(
              client,
              pendingToolCallIds,
              row.id
            );
          }
          return row;
        });
        assistantRowId = inserted.id;
      } catch (err) {
        deps.logger.warn(
          {
            event: "chat.assistant_row_persist_failure",
            request_id: String(request.id ?? ""),
            conversation_id: id,
            cause_message: err instanceof Error ? err.message : "unknown",
          },
          "chat assistant row persist failed (SSE already closed)"
        );
      }

      // ---- (17) Emit the pino INFO turn record (BR-19).
      emitTurnLog({
        logger: deps.logger,
        requestId: String(request.id ?? ""),
        conversationId: id,
        messageId: assistantRowId,
        idempotentReplay: false,
        model: finalModel,
        iterations: stats?.iterations ?? 0,
        toolsCalled,
        tokensIn,
        tokensOut,
        stopReason: stopReasonForRow,
        latencyMs,
      });

      // ---- (18) Fire-and-forget distillation (BR-33 / BR-34).
      scheduleDistillation({
        pool: deps.pool,
        conversationId: id,
        env: deps.env,
        logger: deps.logger,
        utilityClient: getUtilityClient(),
      });
    }
  );
}

// ---------------------------------------------------------------------------
// Idempotent replay (UC-07 / BR-27)
// ---------------------------------------------------------------------------

interface IdempotentReplayArgs {
  readonly reply: FastifyReply;
  readonly request: FastifyRequest;
  readonly deps: ChatRouteDeps;
  readonly conversationId: string;
  readonly assistantRow: MessageRow;
  readonly requestId: string;
  readonly now: () => number;
}

/**
 * UC-07 — emit `llm_start{1}` + `text_delta(<full stored text>)` + `done`
 * frames and close the stream. No Anthropic call; no new rows.
 *
 * The replay path is NOT registered in the turn-registry (no active loop —
 * `cancelTurn` would be a no-op anyway).
 */
async function handleIdempotentReplay(
  args: IdempotentReplayArgs
): Promise<void> {
  const { reply, deps, conversationId, assistantRow, requestId, now } = args;
  const startedAt = now();
  reply.hijack();
  writeSseHeaders(reply);
  tryWrite(reply, frameJson("llm_start", { iteration: 1 }));
  const storedText = extractTextFromContent(assistantRow.content);
  if (storedText.length > 0) {
    tryWrite(reply, frameJson("text_delta", { delta: storedText }));
  }
  // We surface the stored stop_reason on the done frame. Synthetic
  // `provider_error` / `internal_error` markers are mapped back to
  // `end_turn` on the wire (BR-29 / openapi.yaml DoneEvent.stop_reason
  // does not include the synthetic markers — they only live on the row).
  const storedStop = mapStoredStopReason(assistantRow.stop_reason);
  tryWrite(
    reply,
    frameJson("done", {
      stop_reason: storedStop,
      model: assistantRow.model ?? "",
      tokens_in: assistantRow.tokens_in ?? 0,
      tokens_out: assistantRow.tokens_out ?? 0,
    })
  );
  endRaw(reply, deps.logger);

  const latencyMs = now() - startedAt;
  emitTurnLog({
    logger: deps.logger,
    requestId,
    conversationId,
    messageId: assistantRow.id,
    idempotentReplay: true,
    model: assistantRow.model ?? "",
    iterations: 1,
    toolsCalled: [],
    tokensIn: assistantRow.tokens_in ?? 0,
    tokensOut: assistantRow.tokens_out ?? 0,
    stopReason: storedStop,
    latencyMs,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function killSwitchTripped(env: Env): boolean {
  return env.CHAT_ENABLED === false;
}

function sendKillSwitch(reply: FastifyReply): FastifyReply {
  const { statusCode, envelope } = mapChatError(new ChatDisabledError());
  return reply.code(statusCode).send(envelope);
}

function sendNotFound(reply: FastifyReply, id: string): FastifyReply {
  return reply.code(404).send({
    ok: false,
    error: {
      code: "RESOURCE_NOT_FOUND",
      message: "conversation not found",
      details: { id },
    },
  });
}

function buildChatService(
  catalog: ResolvedChatToolCatalog,
  deps: ChatRouteDeps,
  anthropicFactory: AnthropicFactory
): ChatAgentServiceWithStats {
  return createChatAgentService({
    mcp: deps.mcp,
    logger: deps.logger,
    env: deps.env,
    catalog,
    anthropicFactory,
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  });
}

function computeMissingToolNames(mcp: McpServer): string[] {
  const missing: string[] = [];
  for (const name of CHAT_TOOL_NAMES) {
    if (mcp.getTool("query", name) === undefined) missing.push(name);
  }
  return missing;
}

function writeSseHeaders(reply: FastifyReply): void {
  // @fastify/cors sets Access-Control-Allow-Origin (and Vary) on the reply in
  // its onRequest hook, but reply.hijack() + reply.raw.writeHead() bypasses the
  // onSend phase that would normally flush them — so without copying them here
  // the browser blocks the SSE stream with a CORS error even though the
  // preflight passed. Credentials are off, so only ACAO + Vary are relevant.
  const acao = reply.getHeader("access-control-allow-origin");
  const vary = reply.getHeader("vary");
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    ...(acao !== undefined ? { "Access-Control-Allow-Origin": String(acao) } : {}),
    ...(vary !== undefined ? { Vary: String(vary) } : {}),
  });
}

/**
 * Project a ChatEvent to its OpenAPI-compliant SSE wire payload (BR-09 —
 * never emit raw tool arguments / result bodies; BR-29 — never emit the
 * assistant content blocks on the wire).
 */
function projectSseFrame(evt: ChatEvent): string {
  switch (evt.type) {
    case "llm_start":
      return frameJson("llm_start", { iteration: evt.iteration });
    case "text_delta":
      return frameJson("text_delta", { delta: evt.delta });
    case "tool_start":
      return frameJson("tool_start", {
        tool: evt.tool,
        args_summary: evt.args_summary,
      });
    case "tool_result":
      // Persistence-only fields stripped; SSE carries only {tool, ok}.
      return frameJson("tool_result", { tool: evt.tool, ok: evt.ok });
    case "done":
      // Persistence-only `content` stripped.
      return frameJson("done", {
        stop_reason: evt.stop_reason,
        model: evt.model,
        tokens_in: evt.tokens_in,
        tokens_out: evt.tokens_out,
      });
    case "error":
      return frameJson("error", { code: evt.code, message: evt.message });
    case "iteration_end":
      // v2.2 INTERNAL persistence event — the route handles it and `continue`s
      // before reaching here, so this is never invoked at runtime. Present only
      // to keep the switch exhaustive; emits nothing.
      return "";
    case "graph_delta":
      // TC-be-002 — `graph_delta` is synthesised by the route handler from a
      // preceding `tool_result` (see drain loop above). Wire shape mirrors
      // GraphDeltaWire (plan §4.1) verbatim; the normalizer already produced
      // the snake_case projection.
      return frameJson("graph_delta", {
        source_tool: evt.source_tool,
        nodes: evt.nodes,
        links: evt.links,
      });
  }
}

/**
 * Project a `tool_result` envelope to a `GraphDeltaWire`, or `null` when the
 * tool is not graph-producing. Wraps `normalizeToolResult` with:
 *   - a `withReadOnly(...)` boundary for the `search` hydration path (the
 *     only graph tool that needs DB access);
 *   - a defensive try/catch that logs + swallows normalization errors. A
 *     failure here MUST NOT abort the SSE stream — the tool_result has
 *     already been emitted; missing graph_delta is degraded UX, not a turn
 *     failure.
 *
 * @returns the delta, or `null` when (a) the tool is not graph-producing or
 *          (b) normalization threw.
 */
async function projectGraphDelta(
  toolName: string,
  result: unknown,
  catalog: CatalogSnapshot,
  pool: Pool,
  logger: Logger,
  conversationId: string
): Promise<GraphDeltaWire | null> {
  try {
    if (toolName === "search") {
      return await withReadOnly(pool, (client) =>
        normalizeToolResult(toolName, result, catalog, client)
      );
    }
    return await normalizeToolResult(toolName, result, catalog);
  } catch (err) {
    logger.warn(
      {
        event: "chat.graph_delta_normalize_failure",
        conversation_id: conversationId,
        tool_name: toolName,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "chat graph_delta normalization failed — skipping frame"
    );
    return null;
  }
}

function frameJson(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function tryWrite(reply: FastifyReply, frame: string): boolean {
  if (reply.raw.writableEnded || reply.raw.destroyed) return false;
  try {
    return reply.raw.write(frame);
  } catch {
    return false;
  }
}

function endRaw(reply: FastifyReply, logger: Logger): void {
  try {
    if (!reply.raw.writableEnded) {
      reply.raw.end();
    }
  } catch (err) {
    logger.debug(
      {
        event: "chat.raw_end_failed",
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "reply.raw.end() failed (socket already closed)"
    );
  }
}

/**
 * Compare an existing user row against the incoming `(content, model)` pair.
 * Comparison rules (BR-27 — "(content, model) comparison" paragraph):
 *   - `content`: unwrap the single-text-block jsonb shape and compare strings.
 *   - `model`: literal column value, treating NULL == NULL.
 */
function userRowMatches(
  row: MessageRow,
  incomingContent: string,
  incomingModel: string | null
): boolean {
  const storedText = extractTextFromContent(row.content);
  if (storedText !== incomingContent) return false;
  const storedModel = row.model;
  return storedModel === incomingModel;
}

/**
 * Extract the concatenated text from a persisted content blocks array.
 * The BFF writes user rows as `[{type:"text", text:<content>}]` (BR-29) and
 * assistant rows as Anthropic-shaped content blocks (BR-29). For the
 * comparator and the replay path we only need the text payload.
 */
function extractTextFromContent(content: unknown[] | unknown): string {
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (
      block !== null &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join("");
}

/**
 * pg unique-violation error code is `23505`. The `node-pg` driver surfaces it
 * via `(err as { code: string }).code`. We match on the exact string.
 */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { code?: unknown }).code === "string" &&
    (err as { code: string }).code === "23505"
  );
}

/**
 * Resolve the assistant-row `stop_reason` from the terminal SSE frame.
 *   - `done` -> the frame's `stop_reason`.
 *   - `error` -> the synthetic marker (`provider_error` / `internal_error`).
 *   - Defensive `none` -> `internal_error` (the iterable closed without a frame).
 */
function resolveAssistantStopReason(args: {
  terminalKind: "done" | "error" | "none";
  doneStopReason: DoneStopReason | undefined;
  errorSyntheticStop: "provider_error" | "internal_error" | undefined;
}): AssistantStopReason {
  if (args.terminalKind === "done") {
    return args.doneStopReason ?? "end_turn";
  }
  if (args.terminalKind === "error") {
    return args.errorSyntheticStop ?? "internal_error";
  }
  return "internal_error";
}

/**
 * Map a stored `stop_reason` column value back to a wire-safe `DoneStopReason`
 * (the synthetic `provider_error` / `internal_error` markers are NOT in the
 * OpenAPI DoneEvent enum — see openapi.yaml v2.0.0 DoneEvent description).
 * Used on the replay path.
 */
function mapStoredStopReason(
  stored: string | null
): DoneStopReason {
  switch (stored) {
    case "end_turn":
    case "max_tokens":
    case "stop_sequence":
    case "max_iterations":
    case "turn_timeout":
    case "cancelled":
      return stored;
    case "provider_error":
    case "internal_error":
    default:
      return "end_turn";
  }
}

// ---------------------------------------------------------------------------
// Turn log (BR-19)
// ---------------------------------------------------------------------------

interface EmitTurnLogArgs {
  readonly logger: Logger;
  readonly requestId: string;
  readonly conversationId: string;
  readonly messageId: string | null;
  readonly idempotentReplay: boolean;
  readonly model: string;
  readonly iterations: number;
  readonly toolsCalled: readonly string[];
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly stopReason: AssistantStopReason;
  readonly latencyMs: number;
}

function emitTurnLog(args: EmitTurnLogArgs): void {
  const aborted =
    args.stopReason === "cancelled" || args.stopReason === "turn_timeout";
  args.logger.info(
    {
      event: "chat.turn",
      request_id: args.requestId,
      actor: "owner" as const,
      route: "POST /api/v1/conversations/:id/messages",
      conversation_id: args.conversationId,
      message_id: args.messageId,
      model: args.model,
      iterations: args.iterations,
      tools_called: args.toolsCalled,
      tokens_in: args.tokensIn,
      tokens_out: args.tokensOut,
      stop_reason: args.stopReason,
      latency_ms: args.latencyMs,
      aborted,
      idempotent_replay: args.idempotentReplay,
      counter: {
        name: "chat_turn_total",
        labels: { stop_reason: args.stopReason },
        value: 1,
      },
    },
    "chat.turn"
  );
}

// ---------------------------------------------------------------------------
// Fire-and-forget distillation (BR-33 / BR-34)
// ---------------------------------------------------------------------------

interface ScheduleDistillationArgs {
  readonly pool: Pool;
  readonly conversationId: string;
  readonly env: Env;
  readonly logger: Logger;
  readonly utilityClient: AnthropicUtilityLike | undefined;
}

/**
 * Schedule the two background jobs WITHOUT awaiting them (BR-29 step 9 +
 * BR-33 + BR-34). Errors are absorbed by the jobs themselves; we attach a
 * defensive `.catch` so a rejected promise can never escalate to an
 * `unhandledRejection`.
 */
function scheduleDistillation(args: ScheduleDistillationArgs): void {
  const { pool, conversationId, env, logger, utilityClient } = args;
  if (utilityClient === undefined) return; // factory failed earlier; skip.
  const distillationEnv = {
    CHAT_UTILITY_MODEL: env.CHAT_UTILITY_MODEL,
    CHAT_RECENT_WINDOW: env.CHAT_RECENT_WINDOW,
    CHAT_SUMMARY_AFTER_TURNS: env.CHAT_SUMMARY_AFTER_TURNS,
    CHAT_SUMMARY_ENABLED: env.CHAT_SUMMARY_ENABLED,
    CHAT_TITLE_ENABLED: env.CHAT_TITLE_ENABLED,
  };
  maybeRefreshSummary({
    pool,
    conversationId,
    anthropic: utilityClient,
    env: distillationEnv,
    logger,
  }).catch((err) =>
    logger.warn(
      {
        event: "chat.summary_refresh_unhandled",
        conversation_id: conversationId,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "chat summary refresh produced an unhandled rejection"
    )
  );
  maybeDistillTitle({
    pool,
    conversationId,
    anthropic: utilityClient,
    env: distillationEnv,
    logger,
  }).catch((err) =>
    logger.warn(
      {
        event: "chat.title_distillation_unhandled",
        conversation_id: conversationId,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "chat title distillation produced an unhandled rejection"
    )
  );
}
