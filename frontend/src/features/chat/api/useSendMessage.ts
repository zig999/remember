import { useCallback, useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { getEnv } from "@/lib/env";
import { useAuthStore } from "@/state/auth";
import {
  mapWireToGraphDelta,
  useGraphStore,
} from "@/features/graph";
import type {
  ChatContentBlock,
  ChatMessage,
  ChatMessageRole,
} from "../types";
import {
  streamChat,
  type ChatSSEFrame,
} from "./chat-stream";
import { conversationKeys } from "./keys";
import { useChatTurnStore, type ChatStatus } from "../state/chat-turn";

export interface SendMessageVariables {
  readonly conversationId: string;
  readonly content: string;
  readonly model?: string;
}

export interface SendMessageResult {
  readonly stopReason: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly idempotencyKey: string;
}

function buildOptimisticUserMessage(args: {
  conversationId: string;
  content: string;
  idempotencyKey: string;
}): ChatMessage {
  const block: ChatContentBlock = { type: "text", text: args.content };
  const role: ChatMessageRole = "user";
  return {
    id: `optimistic-${args.idempotencyKey}`,
    conversation_id: args.conversationId,
    role,
    content: [block],
    stop_reason: null,
    idempotency_key: args.idempotencyKey,
    model: null,
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    createdAt: new Date(),
  };
}

interface MessagesCachePage {
  readonly items: ReadonlyArray<ChatMessage>;
  readonly nextCursor: string | null;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function useSendMessage(): UseMutationResult<
  SendMessageResult,
  Error,
  SendMessageVariables
> {
  const queryClient = useQueryClient();

  const setAbortController = useChatTurnStore((s) => s.setAbortController);
  const setIdempotencyKey = useChatTurnStore((s) => s.setIdempotencyKey);
  const setStreaming = useChatTurnStore((s) => s.setStreaming);
  const appendText = useChatTurnStore((s) => s.appendText);
  const addToolChip = useChatTurnStore((s) => s.addToolChip);
  const updateLastToolChip = useChatTurnStore((s) => s.updateLastToolChip);
  const resetTurn = useChatTurnStore((s) => s.reset);
  const setChatStatus = useChatTurnStore((s) => s.setChatStatus);

  const actionsRef = useRef({
    setAbortController,
    setIdempotencyKey,
    setStreaming,
    appendText,
    addToolChip,
    updateLastToolChip,
    resetTurn,
    setChatStatus,
  });
  actionsRef.current = {
    setAbortController,
    setIdempotencyKey,
    setStreaming,
    appendText,
    addToolChip,
    updateLastToolChip,
    resetTurn,
    setChatStatus,
  };

  const mutationFn = useCallback(
    async (vars: SendMessageVariables): Promise<SendMessageResult> => {
      const actions = actionsRef.current;
      const idempotencyKey = newIdempotencyKey();
      const controller = new AbortController();

      actions.resetTurn();
      actions.setIdempotencyKey(idempotencyKey);
      actions.setAbortController(controller);
      actions.setStreaming(true);

      const optimistic = buildOptimisticUserMessage({
        conversationId: vars.conversationId,
        content: vars.content,
        idempotencyKey,
      });
      const messagesKey = conversationKeys.messages(vars.conversationId);
      queryClient.setQueryData<MessagesCachePage | undefined>(
        messagesKey,
        (prev) => {
          if (prev === undefined) {
            return { items: [optimistic], nextCursor: null };
          }
          return { ...prev, items: [...prev.items, optimistic] };
        },
      );

      const { VITE_BFF_URL } = getEnv();
      const url = joinUrl(
        VITE_BFF_URL,
        `/api/v1/conversations/${encodeURIComponent(vars.conversationId)}/messages`,
      );
      const token = useAuthStore.getState().accessToken;
      const headers: Record<string, string> = {
        "Idempotency-Key": idempotencyKey,
      };
      if (token !== null) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: { content: string; model?: string } = {
        content: vars.content,
      };
      if (vars.model !== undefined) body.model = vars.model;

      let stopReason: string | null = null;
      let errorCode: string | null = null;
      let errorMessage: string | null = null;
      let graphReplacedThisTurn = false;

      try {
        const stream = streamChat(url, body, {
          headers,
          signal: controller.signal,
        });
        for await (const frame of stream) {
          if (frame.type === "graph_delta") {
            const delta = mapWireToGraphDelta(frame);
            if (delta.nodes.length > 0) {
              const gs = useGraphStore.getState();
              if (graphReplacedThisTurn) {
                gs.addNodes(delta);
              } else {
                gs.replaceNodes(delta);
                graphReplacedThisTurn = true;
              }
            }
            continue;
          }
          dispatchFrame(frame, actions);
          if (frame.type === "done") {
            stopReason = frame.stop_reason;
          } else if (frame.type === "error") {
            errorCode = frame.code;
            errorMessage = frame.message;
          }
        }
      } finally {
        actions.setStreaming(false);
        actions.setAbortController(null);
      }

      void queryClient.invalidateQueries({ queryKey: messagesKey });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.usage(vars.conversationId),
      });

      return {
        stopReason,
        errorCode,
        errorMessage,
        idempotencyKey,
      };
    },
    [queryClient],
  );

  return useMutation({ mutationFn });
}

const GRAPH_TOOLS: ReadonlySet<string> = new Set<string>([
  "traverse",
  "get_node",
  "list_nodes",
  "search",
  "ingest_directed",
]);

function isGraphTool(toolName: string): boolean {
  return GRAPH_TOOLS.has(toolName);
}

interface TurnActions {
  readonly appendText: (delta: string) => void;
  readonly addToolChip: (chip: {
    tool: string;
    argsSummary: string;
    ok: boolean | null;
  }) => void;
  readonly updateLastToolChip: (ok: boolean) => void;
  readonly setChatStatus: (next: ChatStatus) => void;
}

function dispatchFrame(frame: ChatSSEFrame, actions: TurnActions): void {
  switch (frame.type) {
    case "llm_start":
      actions.setChatStatus("thinking");
      return;
    case "text_delta":
      actions.appendText(frame.delta);
      actions.setChatStatus("streaming");
      return;
    case "tool_start":
      actions.addToolChip({
        tool: frame.tool,
        argsSummary: frame.argsSummary,
        ok: null,
      });
      actions.setChatStatus("tool_running");
      if (isGraphTool(frame.tool)) {
        useGraphStore.getState().setStatus("loading");
      }
      return;
    case "tool_result":
      actions.updateLastToolChip(frame.ok);
      actions.setChatStatus("streaming");
      return;
    case "graph_delta":
      return;
    case "done":
      useGraphStore.getState().settleTurn("done");
      actions.setChatStatus("idle");
      return;
    case "error":
      useGraphStore.getState().settleTurn("error");
      actions.setChatStatus("error");
      return;
  }
}
