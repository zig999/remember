import { create } from "zustand";
import type { ToolCallData } from "../types";

export type ChatStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "tool_running"
  | "error";

export interface ChatTurnState {
  streamingText: string;
  toolChips: ReadonlyArray<ToolCallData>;
  abortController: AbortController | null;
  idempotencyKey: string | null;
  isStreaming: boolean;
  chatStatus: ChatStatus;

  reset: () => void;
  setAbortController: (ac: AbortController | null) => void;
  appendText: (delta: string) => void;
  setIdempotencyKey: (key: string | null) => void;
  setStreaming: (next: boolean) => void;
  addToolChip: (chip: ToolCallData) => void;
  updateLastToolChip: (ok: boolean) => void;
  setChatStatus: (next: ChatStatus) => void;
}

const initialState = {
  streamingText: "",
  toolChips: [] as ReadonlyArray<ToolCallData>,
  abortController: null as AbortController | null,
  idempotencyKey: null as string | null,
  isStreaming: false,
  chatStatus: "idle" as ChatStatus,
};

export const useChatTurnStore = create<ChatTurnState>((set) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  setAbortController: (abortController) => set({ abortController }),

  appendText: (delta) =>
    set((state) => ({ streamingText: state.streamingText + delta })),

  setIdempotencyKey: (idempotencyKey) => set({ idempotencyKey }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  addToolChip: (chip) =>
    set((state) => ({ toolChips: [...state.toolChips, chip] })),

  updateLastToolChip: (ok) =>
    set((state) => {
      if (state.toolChips.length === 0) return state;
      const next = state.toolChips.slice();
      const lastIdx = next.length - 1;
      const last = next[lastIdx];
      if (last === undefined) return state;
      next[lastIdx] = { ...last, ok };
      return { toolChips: next };
    }),

  setChatStatus: (chatStatus) => set({ chatStatus }),
}));
