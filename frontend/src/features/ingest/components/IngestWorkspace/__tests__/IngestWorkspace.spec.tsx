/**
 * IngestWorkspace — unit tests (dev_tc_005).
 *
 * Coverage (mapped to acceptance criteria in tc-005.md):
 *  - UI-01 initial render — container-query split, IngestPanel left,
 *    GraphSpace right; submit disabled.
 *  - Happy path UI-03 → UI-05 → UI-08 → UI-07: form filled, submit,
 *    `ingestRawInformation` 201 created, `runLlmExtraction` 200 completed,
 *    assembly fires (replaceNodes via store), revealing → complete.
 *  - Idempotency path UI-04: 200 `noop_existing`, "Ver grafo existente"
 *    triggers assembly.
 *  - Error path UI-06 + retry: extraction returns 502, "Tentar novamente"
 *    re-runs the sequence.
 *  - Node selection UI-09: clicking a node mounts NodeDetailPanel in the
 *    right column; close restores GraphSpace.
 *
 * The api hooks (`useIngestRawInformation`, `useRunLlmExtraction`, …) are
 * mocked at the `features/ingest/api` boundary so the workspace's state
 * machine is exercised directly. The graph store is REAL — the
 * `replaceNodes`/`setStatus` calls reach the actual store; the workspace
 * observes `graphStatus` to advance from UI-08 → UI-07.
 *
 * `useIngestGraphAssembly` is replaced with an inert no-op. The tests drive
 * the graph store directly (mirroring what the real assembly hook would do
 * once `useQueries` settle) so we don't need MSW.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GraphSpaceProps } from "@/features/graph";

// Required by React's act() under raw jsdom (no @testing-library) — without
// this flag effects flush synchronously but `act` complains.
// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom doesn't ship ResizeObserver — React Flow / @xyflow react hooks
// reach for it on mount. Provide a no-op stub.
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.ResizeObserver = NoopResizeObserver;
if (!("scrollIntoView" in Element.prototype)) {
  // @ts-expect-error — augment the jsdom prototype for the test run only.
  Element.prototype.scrollIntoView = () => {};
}

// ---- Stub GraphSpace + NodeDetailPanel ------------------------------------
const lastGraphSpaceProps = vi.hoisted(() => ({
  current: null as GraphSpaceProps | null,
}));

async function graphMockFactory(
  importOriginal: () => Promise<typeof import("@/features/graph")>,
): Promise<typeof import("@/features/graph")> {
  const actual = await importOriginal();
  const FakeGraphSpace = (props: GraphSpaceProps) => {
    lastGraphSpaceProps.current = props;
    return (
      <div
        data-testid="graph-space"
        data-status={props.status}
        data-node-count={String(props.nodes.length)}
      >
        <button
          type="button"
          data-testid="fake-graph-space-select-first"
          onClick={() => {
            const first = props.nodes[0];
            if (first !== undefined) props.onNodeSelect?.(first.id);
          }}
        >
          select first node
        </button>
      </div>
    );
  };
  const FakeNodeDetailPanel = (props: {
    nodeId: string;
    onClose: () => void;
  }) => (
    <div data-testid="node-detail-panel" data-node-id={props.nodeId}>
      <button
        type="button"
        data-testid="node-detail-close"
        onClick={props.onClose}
      >
        Fechar
      </button>
    </div>
  );
  return {
    ...actual,
    GraphSpace: FakeGraphSpace,
    NodeDetailPanel: FakeNodeDetailPanel,
  } as typeof import("@/features/graph");
}

vi.mock("@/features/graph", (importOriginal) =>
  graphMockFactory(
    importOriginal as () => Promise<typeof import("@/features/graph")>,
  ),
);
vi.mock("../../../../graph", (importOriginal) =>
  graphMockFactory(
    importOriginal as () => Promise<typeof import("@/features/graph")>,
  ),
);
vi.mock("../../../../graph/index", (importOriginal) =>
  graphMockFactory(
    importOriginal as () => Promise<typeof import("@/features/graph")>,
  ),
);

// ---- Mock the ingest api boundary -----------------------------------------
type MutateImpl = (
  vars: unknown,
  opts?: {
    onSuccess?: (data: unknown) => void;
    onError?: (err: unknown) => void;
  },
) => void;

const ingestMutateImpl = vi.hoisted(() => ({
  current: null as MutateImpl | null,
}));
const runMutateImpl = vi.hoisted(() => ({
  current: null as MutateImpl | null,
}));
const retryMutateImpl = vi.hoisted(() => ({
  current: null as MutateImpl | null,
}));
const pollData = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock("../../../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api")>();
  return {
    ...actual,
    useIngestRawInformation: (() => ({
      mutate: (vars: unknown, opts?: Parameters<MutateImpl>[1]) => {
        ingestMutateImpl.current?.(vars, opts);
      },
    })) as unknown as typeof actual.useIngestRawInformation,
    useRunLlmExtraction: (() => ({
      mutate: (vars: unknown, opts?: Parameters<MutateImpl>[1]) => {
        runMutateImpl.current?.(vars, opts);
      },
    })) as unknown as typeof actual.useRunLlmExtraction,
    useRetryLlmRun: (() => ({
      mutate: (vars: unknown, opts?: Parameters<MutateImpl>[1]) => {
        retryMutateImpl.current?.(vars, opts);
      },
    })) as unknown as typeof actual.useRetryLlmRun,
    useIngestRunStatus: (() => ({
      data: pollData.current,
    })) as unknown as typeof actual.useIngestRunStatus,
    useIngestGraphAssembly: (() => ({
      isAssembling: false,
      hasError: false,
      settledCount: 0,
      totalCount: 0,
    })) as unknown as typeof actual.useIngestGraphAssembly,
  };
});

// Inert http — real assembly is mocked above but keep this defensive.
vi.mock("@/lib/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/http")>();
  return { ...actual, http: () => new Promise(() => {}) };
});

import { IngestWorkspace } from "../IngestWorkspace";
// Use relative paths for value imports to side-step vitest's mock-hoisted
// import resolution gap (alias `@/...` is fine for `import type` but the
// transform pipeline can race against tsconfigPaths when mock factories also
// resolve the same alias).
import { useGraphStore } from "../../../../graph";
import { EnvelopeError } from "../../../../../lib/http";

let container: HTMLDivElement;
let root: Root;

function renderWS(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <IngestWorkspace />
      </QueryClientProvider>,
    );
  });
}

function $(testid: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${testid}"]`) as HTMLElement | null;
}

/** Drive a controlled textarea — React's `_valueTracker` requires us to
 *  call the native HTMLTextAreaElement value setter, otherwise `onChange`
 *  reads the old value and the state never updates. */
function changeTextarea(el: HTMLTextAreaElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/** Drive a controlled `<select>` — same trick as the textarea. */
function changeSelect(el: HTMLSelectElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value",
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function clickButton(el: HTMLElement | null): void {
  if (el === null) throw new Error("button element is null");
  act(() => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ingestMutateImpl.current = null;
  runMutateImpl.current = null;
  retryMutateImpl.current = null;
  pollData.current = undefined;
  lastGraphSpaceProps.current = null;
  useGraphStore.getState().clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("IngestWorkspace — layout & initial render (UI-01)", () => {
  it("renders the 40/60 container-query split", () => {
    renderWS();
    const workspace = $("ingest-workspace");
    expect(workspace).not.toBeNull();
    const outer = workspace!;
    expect(outer.className).toContain("@container");
    const inner = outer.firstElementChild as HTMLElement;
    expect(inner.className).toContain("@lg:flex-row");
    const left = inner.children[0] as HTMLElement;
    const right = inner.children[1] as HTMLElement;
    expect(left.className).toContain("@lg:w-2/5");
    expect(right.className).toContain("@lg:w-3/5");
    expect(right.getAttribute("data-testid")).toBe("graph-space-panel");
  });

  it("renders IngestPanel on the left and GraphSpace on the right", () => {
    renderWS();
    expect($("ingest-panel")).not.toBeNull();
    expect($("graph-space")).not.toBeNull();
    expect($("node-detail-panel")).toBeNull();
  });

  it("Ingerir button is disabled until both content + source_type are filled", () => {
    renderWS();
    const submit = $("ingest-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    changeTextarea($("ingest-content") as HTMLTextAreaElement, "Texto de teste");
    expect(submit.disabled).toBe(true);

    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");
    expect(submit.disabled).toBe(false);
  });
});

describe("IngestWorkspace — happy path (UI-03 → UI-05 → UI-07)", () => {
  it("fires the full sequence and reaches the 'complete' phase", () => {
    renderWS();

    let ingestOnSuccess: ((data: unknown) => void) | undefined;
    ingestMutateImpl.current = (_vars, opts) => {
      ingestOnSuccess = opts?.onSuccess;
    };
    let runOnSuccess: ((data: unknown) => void) | undefined;
    runMutateImpl.current = (_vars, opts) => {
      runOnSuccess = opts?.onSuccess;
    };

    changeTextarea(
      $("ingest-content") as HTMLTextAreaElement,
      "Conteúdo do documento de ata.",
    );
    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");

    act(() => {
      ($("ingest-form") as HTMLFormElement).requestSubmit();
    });
    expect($("ingest-progress-copy")?.textContent).toBe(
      "Enviando documento…",
    );

    act(() => {
      ingestOnSuccess?.({
        outcome: "created",
        llmRunId: "run-1",
        rawInformationId: "raw-1",
        contentHash: "h",
        chunkCount: 1,
        idempotencyKey: "k",
      });
    });
    expect(useGraphStore.getState().status).toBe("loading");
    expect($("ingest-progress-copy")?.textContent).toContain(
      "Extraindo conhecimento",
    );

    act(() => {
      runOnSuccess?.({
        id: "run-1",
        model: "claude-opus-4-8",
        promptVersion: "v3",
        startedAt: "2026-01-01T00:00:00Z",
        finishedAt: "2026-01-01T00:00:10Z",
        status: "completed",
        attempts: 1,
        inputRawInformationId: "raw-1",
        idempotencyKey: "k",
        summary: {
          accepted: 3,
          consolidated: 1,
          supersededPrevious: 0,
          needsReview: 1,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          orphanedFragments: 0,
        },
        affectedNodes: [
          { id: "n1", canonicalName: "Projeto Apollo", nodeType: "project" },
        ],
      });
    });

    // Drive the graph store to simulate the real assembly hook's effects.
    act(() => {
      useGraphStore.getState().replaceNodes({
        sourceTool: "ingest_assembly",
        nodes: [{ id: "n1", type: "concept", label: "Projeto Apollo" }],
        links: [],
      });
      useGraphStore.getState().setStatus("revealing");
    });
    act(() => {
      useGraphStore.getState().setStatus("ready");
    });
    expect($("ingest-complete")).not.toBeNull();
    expect($("ingest-summary")).not.toBeNull();
    expect($("ingest-summary-row-accepted")?.textContent).toContain("3");
    expect($("ingest-needs-review-notice")).not.toBeNull();
  });
});

describe("IngestWorkspace — idempotency path (UI-04)", () => {
  it("shows the noop notice and triggers assembly on 'Ver grafo existente'", () => {
    renderWS();
    let ingestOnSuccess: ((data: unknown) => void) | undefined;
    ingestMutateImpl.current = (_vars, opts) => {
      ingestOnSuccess = opts?.onSuccess;
    };

    changeTextarea(
      $("ingest-content") as HTMLTextAreaElement,
      "Conteúdo repetido.",
    );
    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");
    act(() => {
      ($("ingest-form") as HTMLFormElement).requestSubmit();
    });

    act(() => {
      ingestOnSuccess?.({
        outcome: "noop_existing",
        llmRunId: "run-1",
        rawInformationId: "raw-1",
        contentHash: "h",
        chunkCount: 1,
        idempotencyKey: "k",
        affectedNodes: [
          { id: "n1", canonicalName: "Projeto Apollo", nodeType: "project" },
        ],
      });
    });

    expect($("ingest-noop-notice")).not.toBeNull();
    expect(useGraphStore.getState().status).toBe("loading");

    clickButton($("ingest-assemble-existing"));

    expect($("ingest-progress-copy")?.textContent).toContain("Compondo o grafo");
  });
});

describe("IngestWorkspace — error path (UI-06) + retry", () => {
  it("shows the error band on extraction 502 and retries via 'Tentar novamente'", () => {
    renderWS();
    let ingestOnSuccess: ((data: unknown) => void) | undefined;
    let runOnError: ((err: unknown) => void) | undefined;
    ingestMutateImpl.current = (_vars, opts) => {
      ingestOnSuccess = opts?.onSuccess;
    };
    runMutateImpl.current = (_vars, opts) => {
      runOnError = opts?.onError;
    };

    changeTextarea(
      $("ingest-content") as HTMLTextAreaElement,
      "Conteúdo de teste.",
    );
    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");
    act(() => {
      ($("ingest-form") as HTMLFormElement).requestSubmit();
    });
    act(() => {
      ingestOnSuccess?.({
        outcome: "created",
        llmRunId: "run-1",
        rawInformationId: "raw-1",
        contentHash: "h",
        chunkCount: 1,
        idempotencyKey: "k",
      });
    });

    act(() => {
      runOnError?.(
        new EnvelopeError({
          code: "SYSTEM_LLM_PROVIDER_UNAVAILABLE",
          httpStatus: 502,
          message: "O provedor de IA está indisponível.",
        }),
      );
    });

    expect($("ingest-error")).not.toBeNull();
    expect($("ingest-retry")).not.toBeNull();

    let retryOnSuccess: ((data: unknown) => void) | undefined;
    retryMutateImpl.current = (_vars, opts) => {
      retryOnSuccess = opts?.onSuccess;
    };
    let runOnSuccess2: ((data: unknown) => void) | undefined;
    runMutateImpl.current = (_vars, opts) => {
      runOnSuccess2 = opts?.onSuccess;
    };

    clickButton($("ingest-retry"));

    act(() => {
      retryOnSuccess?.({
        id: "run-1",
        status: "running",
        summary: {
          accepted: 0,
          consolidated: 0,
          supersededPrevious: 0,
          needsReview: 0,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          orphanedFragments: 0,
        },
      });
    });
    act(() => {
      runOnSuccess2?.({
        id: "run-1",
        status: "completed",
        summary: {
          accepted: 1,
          consolidated: 0,
          supersededPrevious: 0,
          needsReview: 0,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          orphanedFragments: 0,
        },
        affectedNodes: [],
      });
    });

    expect($("ingest-error")).toBeNull();
  });
});

describe("IngestWorkspace — polling resolution (BDD Scenario 3, BUG-02)", () => {
  it("transitions polling → revealing when a polled run resolves to 'completed'", () => {
    // Why this test exists: BDD Scenario 3 of ingest.feature.spec.md §3 — the
    // connection drops mid-run, the workspace silently switches to polling
    // (`useIngestRunStatus`), and when the polled status flips to 'completed'
    // the phase must advance to 'revealing'. Without this assertion the
    // polling effect could regress to a no-op and the progress copy would
    // hang on "Verificando extração…" forever.
    renderWS();

    let ingestOnSuccess: ((data: unknown) => void) | undefined;
    let runOnError: ((err: unknown) => void) | undefined;
    ingestMutateImpl.current = (_vars, opts) => {
      ingestOnSuccess = opts?.onSuccess;
    };
    runMutateImpl.current = (_vars, opts) => {
      runOnError = opts?.onError;
    };

    changeTextarea(
      $("ingest-content") as HTMLTextAreaElement,
      "Conteúdo do documento.",
    );
    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");
    act(() => {
      ($("ingest-form") as HTMLFormElement).requestSubmit();
    });
    act(() => {
      ingestOnSuccess?.({
        outcome: "created",
        llmRunId: "run-1",
        rawInformationId: "raw-1",
        contentHash: "h",
        chunkCount: 1,
        idempotencyKey: "k",
      });
    });

    // Simulate the LLM connection dropping — anything that isn't 409/422 and
    // isn't a "real" SYSTEM_LLM_PROVIDER_UNAVAILABLE counts as a drop per
    // `isConnectionDropError`. Use SYSTEM_NETWORK explicitly.
    act(() => {
      runOnError?.(
        new EnvelopeError({
          code: "SYSTEM_NETWORK",
          httpStatus: 0,
          message: "Conexão interrompida.",
        }),
      );
    });
    expect($("ingest-progress-copy")?.textContent).toContain(
      "Verificando extração",
    );

    // Now the polled status resolves to 'completed'. Update `pollData.current`
    // (the mock backing `useIngestRunStatus`) and force a re-render so the
    // hook returns the new `data` reference — the orchestration hook's
    // `useEffect` will then transition phase to 'revealing'.
    pollData.current = {
      id: "run-1",
      model: "claude-opus-4-8",
      promptVersion: "v3",
      startedAt: "2026-01-01T00:00:00Z",
      finishedAt: "2026-01-01T00:00:10Z",
      status: "completed",
      attempts: 1,
      inputRawInformationId: "raw-1",
      idempotencyKey: "k",
      summary: {
        accepted: 2,
        consolidated: 0,
        supersededPrevious: 0,
        needsReview: 0,
        uncertain: 0,
        disputed: 0,
        rejected: 0,
        error: 0,
        orphanedFragments: 0,
      },
      affectedNodes: [],
    };
    // Force a re-render. The orchestration hook subscribes to graph store
    // status — bouncing it through a distinct value forces a fresh render
    // and the mocked `useIngestRunStatus` returns the updated pollData.
    act(() => {
      useGraphStore.getState().setStatus("error");
    });
    act(() => {
      useGraphStore.getState().setStatus("loading");
    });

    // Phase has advanced to 'revealing' — observable via the progress copy.
    expect($("ingest-progress-copy")?.textContent).toContain(
      "Compondo o grafo",
    );
  });
});

describe("IngestWorkspace — reset clears form (BUG-05)", () => {
  it("clicking 'Ingerir outro documento' from a terminal state clears content/sourceType and disables submit", () => {
    renderWS();

    let ingestOnSuccess: ((data: unknown) => void) | undefined;
    ingestMutateImpl.current = (_vars, opts) => {
      ingestOnSuccess = opts?.onSuccess;
    };

    // Fill form and submit so we land on UI-04 (`noop_existing`) — that path
    // exposes the `ingest-reset` button next to `ingest-assemble-existing`
    // and does not depend on the extraction mutation succeeding.
    changeTextarea(
      $("ingest-content") as HTMLTextAreaElement,
      "Conteúdo duplicado.",
    );
    changeSelect($("ingest-source-type") as HTMLSelectElement, "ata");

    const submit = $("ingest-submit") as HTMLButtonElement;
    // Before submit, the button is enabled (both fields filled).
    expect(submit.disabled).toBe(false);

    act(() => {
      ($("ingest-form") as HTMLFormElement).requestSubmit();
    });
    act(() => {
      ingestOnSuccess?.({
        outcome: "noop_existing",
        llmRunId: "run-1",
        rawInformationId: "raw-1",
        contentHash: "h",
        chunkCount: 1,
        idempotencyKey: "k",
        affectedNodes: [],
      });
    });
    expect($("ingest-noop-notice")).not.toBeNull();

    // Click "Ingerir outro documento" inside the noop notice.
    clickButton($("ingest-reset"));

    // After reset: textarea is empty, source-type is placeholder, submit is
    // disabled, and the noop notice is gone.
    const textareaAfter = $("ingest-content") as HTMLTextAreaElement;
    const selectAfter = $("ingest-source-type") as HTMLSelectElement;
    const submitAfter = $("ingest-submit") as HTMLButtonElement;
    expect(textareaAfter.value).toBe("");
    expect(selectAfter.value).toBe("");
    expect(submitAfter.disabled).toBe(true);
    expect($("ingest-noop-notice")).toBeNull();
  });
});

describe("IngestWorkspace — node selection (UI-09)", () => {
  it("mounts NodeDetailPanel when a node is selected and restores GraphSpace on close", () => {
    renderWS();

    act(() => {
      useGraphStore.getState().replaceNodes({
        sourceTool: "ingest_assembly",
        nodes: [{ id: "n1", type: "concept", label: "Apollo" }],
        links: [],
      });
      useGraphStore.getState().setStatus("ready");
    });

    expect($("node-detail-panel")).toBeNull();

    clickButton($("fake-graph-space-select-first"));

    const panel = $("node-detail-panel");
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute("data-node-id")).toBe("n1");
    expect($("graph-space")).toBeNull();

    clickButton($("node-detail-close"));
    expect($("node-detail-panel")).toBeNull();
    expect($("graph-space")).not.toBeNull();
  });
});
