import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { useEditEntity } from "../edit.hooks";
import type {
  EditAcceptedWire,
  EditOutcome,
  EditVariables,
  EntityEditWire,
} from "../../types";
import { factsOf, type FailureFacts } from "./support";

export const SOME_EDIT: EntityEditWire = {
  reason: "Corrigir o status do projeto",
  changes: [
    {
      attribute_key: "status_text",
      kind: "set",
      value: "Em andamento",
      item_id: null,
      valid_from: null,
      valid_to: null,
    },
  ],
};

export const ACCEPTED_WIRE: EditAcceptedWire = {
  node_id: "n-1",
  action_id: "act-1",
  applied: [
    {
      attribute_key: "status_text",
      effect: "created",
      item_id: "i-1",
      predecessor_id: null,
    },
  ],
};

export const SOME_VARIABLES: EditVariables = {
  nodeId: "n-1",
  edit: {
    reason: "Corrigir o status do projeto",
    changes: [
      { attributeKey: "status_text", kind: "set", value: "Em andamento" },
    ],
  },
};

export function refusalBody(
  code: string,
  message: string,
  details: unknown,
): unknown {
  return { ok: false, error: { code, message, details } };
}

export async function failureOf(call: Promise<unknown>): Promise<FailureFacts> {
  try {
    await call;
  } catch (error) {
    return factsOf(error);
  }
  throw new Error("the edit answered without failing");
}

export function sentBody(index = 0): Record<string, unknown> {
  const call = vi.mocked(globalThis.fetch).mock.calls[index];
  const body = call?.[1]?.body;
  if (typeof body !== "string") {
    throw new Error("the request sent no text body");
  }
  return JSON.parse(body) as Record<string, unknown>;
}

export type RunEdit = (variables: EditVariables) => Promise<EditOutcome>;

export interface MountedEdit {
  readonly queryClient: QueryClient;
  readonly run: RunEdit;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const placements: Placement[] = [];

function Probe(props: { readonly onReady: (run: RunEdit) => void }): null {
  const { mutateAsync } = useEditEntity();
  const { onReady } = props;
  useEffect(() => {
    onReady(mutateAsync);
  }, [onReady, mutateAsync]);
  return null;
}

export function mountEdit(): MountedEdit {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const handle: { run: RunEdit | null } = { run: null };
  const onReady = (run: RunEdit): void => {
    handle.run = run;
  };
  const root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Probe, { onReady }),
      ),
    );
  });
  placements.push({ root, container, queryClient });
  return {
    queryClient,
    run: (variables) => {
      const run = handle.run;
      if (run === null) throw new Error("the edit hook did not mount");
      return run(variables);
    },
  };
}

export function unmountEdits(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
}

export async function outcomeOf(
  mounted: MountedEdit,
  variables: EditVariables,
  advanceMs = 0,
): Promise<EditOutcome> {
  const box: { outcome: EditOutcome | null } = { outcome: null };
  await act(async () => {
    const pending = mounted.run(variables);
    if (advanceMs > 0) {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(advanceMs);
    }
    box.outcome = await pending;
  });
  if (box.outcome === null) throw new Error("the edit gave no outcome");
  return box.outcome;
}
