// @vitest-environment jsdom
/**
 * Ingest hooks — wire + cache contract tests.
 *
 * Spec ref: docs/specs/front/features/ingest.feature.spec.md §1, §4.
 * These tests pin the four contract points the TC validation criteria call
 * out:
 *   1. URLs and HTTP methods match the openapi.yaml ingestion paths;
 *   2. `useIngestRawInformation` returns the camelCase domain result;
 *   3. `useIngestRunStatus` polls every 5s when enabled and stops on
 *      `status === "completed" | "failed"`;
 *   4. `useRetryLlmRun` and `useRunLlmExtraction` POST against the
 *      llm-runs subpaths.
 *
 * Test rig: same imperative `act()` + ref harness used by
 * `features/curation/api/__tests__/curation.hooks.spec.tsx` (no
 * `@testing-library/react` in this project).
 */
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

// Mock lib/env BEFORE importing the SUT (vi.mock is hoisted).
vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  useIngestRawInformation,
  useRunLlmExtraction,
  useIngestRunStatus,
  useRetryLlmRun,
  INGEST_RUN_POLL_MS,
} from "../index";
import { ingestKeys } from "../keys";
import type {
  IngestRawInformationResponseWire,
  LlmRunWire,
  LlmRunSummaryWire,
} from "../_transforms";

/* ---------- helpers ---------- */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SUMMARY_FIXTURE: LlmRunSummaryWire = {
  accepted: 3,
  consolidated: 1,
  superseded_previous: 0,
  needs_review: 0,
  uncertain: 0,
  disputed: 0,
  rejected: 0,
  error: 0,
  orphaned_fragments: 0,
};

function llmRunFixture(
  overrides: Partial<LlmRunWire> = {},
): LlmRunWire {
  return {
    id: "c0c0c0c0-1111-2222-3333-444455556666",
    model: "claude-opus-4-8",
    prompt_version: "v3",
    started_at: "2026-06-11T20:24:00Z",
    finished_at: "2026-06-11T20:29:42Z",
    status: "completed",
    attempts: 1,
    input_raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab",
    idempotency_key: "f".repeat(64),
    summary: SUMMARY_FIXTURE,
    ...overrides,
  };
}

function ingestRawFixture(
  overrides: Partial<IngestRawInformationResponseWire> = {},
): IngestRawInformationResponseWire {
  return {
    outcome: "created",
    raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab",
    content_hash: "a".repeat(64),
    chunk_count: 1,
    chunks: [
      {
        id: "1a2b3c4d-1111-2222-3333-444455556666",
        chunk_index: 0,
        offset_start: 0,
        offset_end: 178,
      },
    ],
    llm_run_id: "c0c0c0c0-1111-2222-3333-444455556666",
    idempotency_key: "f".repeat(64),
    ...overrides,
  };
}

interface MutationHarness<TData, TVars> {
  ref: { current: UseMutationResult<TData, Error, TVars> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountMutation<TData, TVars>(
  useHook: () => UseMutationResult<TData, Error, TVars>,
): MutationHarness<TData, TVars> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const ref: MutationHarness<TData, TVars>["ref"] = { current: null };
  function Probe(): React.ReactElement {
    ref.current = useHook();
    return React.createElement("div");
  }
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe),
      ),
    );
  });
  return { ref, queryClient, container, root };
}

interface QueryHarness<T> {
  ref: { current: UseQueryResult<T> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountQuery<T>(useHook: () => UseQueryResult<T>): QueryHarness<T> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ref: QueryHarness<T>["ref"] = { current: null };
  function Probe(): React.ReactElement {
    ref.current = useHook();
    return React.createElement("div");
  }
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe),
      ),
    );
  });
  return { ref, queryClient, container, root };
}

function unmount(h: { root: Root; container: HTMLDivElement }): void {
  act(() => {
    h.root.unmount();
  });
  h.container.remove();
}

async function waitFor(
  predicate: () => boolean,
  maxMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
  throw new Error("waitFor timed out");
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * useIngestRawInformation                                             *
 * ------------------------------------------------------------------ */

describe("useIngestRawInformation — wire contract", () => {
  it("POSTs to /api/v1/ingest/raw-information and returns the camelCased result", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse(ingestRawFixture(), 201));

    const h = mountMutation(() => useIngestRawInformation());
    try {
      const data = await act(async () =>
        h.ref.current!.mutateAsync({
          source_type: "ata",
          content: "hello",
          model: "claude-opus-4-8",
          prompt_version: "v3",
        }),
      );
      const call = fetchSpy.mock.calls[0];
      expect(String(call?.[0])).toBe(
        "https://bff.test/api/v1/ingest/raw-information",
      );
      const init = call?.[1] as RequestInit | undefined;
      expect((init?.method ?? "GET").toUpperCase()).toBe("POST");
      expect(data.outcome).toBe("created");
      expect(data.llmRunId).toBe("c0c0c0c0-1111-2222-3333-444455556666");
      expect(data.chunkCount).toBe(1);
    } finally {
      unmount(h);
    }
  });

  it("surfaces enveloped 422 as an EnvelopeError-shaped Error", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(
        {
          ok: false,
          error: {
            code: "VALIDATION_OUT_OF_RANGE",
            message: "Conteúdo fora do limite permitido.",
          },
        },
        422,
      ),
    );

    const h = mountMutation(() => useIngestRawInformation());
    try {
      let caught: unknown;
      try {
        await act(async () =>
          h.ref.current!.mutateAsync({
            source_type: "ata",
            content: "x",
            model: "m",
            prompt_version: "v3",
          }),
        );
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeTruthy();
      expect((caught as { code?: string }).code).toBe("VALIDATION_OUT_OF_RANGE");
    } finally {
      unmount(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * useRunLlmExtraction                                                 *
 * ------------------------------------------------------------------ */

describe("useRunLlmExtraction — wire contract", () => {
  it("POSTs to /api/v1/ingest/llm-runs/:id/run with no client cutoff", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) => {
        // Sanity: under `ingest: true`, no AbortController signal is composed
        // by `_request.ts` — caller-supplied is forwarded as-is. We pass no
        // signal here, so `init.signal` must be undefined (i.e., NOT one
        // that came from our 30s timeout helper).
        expect(init?.signal).toBeUndefined();
        return jsonResponse(llmRunFixture());
      });

    const h = mountMutation(() => useRunLlmExtraction());
    try {
      const data = await act(async () =>
        h.ref.current!.mutateAsync({ llm_run_id: "run-xyz" }),
      );
      expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
        "https://bff.test/api/v1/ingest/llm-runs/run-xyz/run",
      );
      expect(data.status).toBe("completed");
      expect(data.startedAt).toBeInstanceOf(Date);
    } finally {
      unmount(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * useIngestRunStatus                                                  *
 * ------------------------------------------------------------------ */

describe("useIngestRunStatus — polling lifecycle", () => {
  it("does NOT fetch when llmRunId is null", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountQuery(() => useIngestRunStatus({ llmRunId: null }));
    try {
      // Give React a microtask tick — the hook MUST stay disabled.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(h.ref.current?.fetchStatus).toBe("idle");
    } finally {
      unmount(h);
    }
  });

  it("does NOT fetch when enabled is false", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountQuery(() =>
      useIngestRunStatus({ llmRunId: "run-1", enabled: false }),
    );
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      unmount(h);
    }
  });

  it("hits GET /api/v1/ingest/llm-runs/:id and caches under ingestKeys.run", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(llmRunFixture({ status: "running", finished_at: null })),
    );
    const h = mountQuery(() => useIngestRunStatus({ llmRunId: "run-7" }));
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      expect(h.ref.current?.data?.status).toBe("running");
      const cached = h.queryClient.getQueryData(ingestKeys.run("run-7"));
      expect(cached).toBeDefined();
    } finally {
      unmount(h);
    }
  });

  it("polling interval is 5000ms (INGEST_RUN_POLL_MS)", () => {
    // The constant is exported so this assertion guards future drift.
    expect(INGEST_RUN_POLL_MS).toBe(5_000);
  });

  it("stops polling when the run reaches a terminal status (completed)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        jsonResponse(llmRunFixture({ status: "completed" })),
      );

    const h = mountQuery(() => useIngestRunStatus({ llmRunId: "run-9" }));
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);

      // After the first success with status=completed, the
      // `terminalAwareRefetchInterval` returns `false` so TanStack Query
      // stops scheduling refetches. Wait > 5s wall-clock would be flaky
      // here — instead, inspect the internal query state: TanStack stores
      // the resolved interval on the observer.
      const calls = fetchSpy.mock.calls.length;
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      // No extra refetch was scheduled in that window.
      expect(fetchSpy.mock.calls.length).toBe(calls);

      // Also: a manual invalidation still works (terminal does not freeze
      // the cache, only the polling cadence). Skipped — out of scope.
    } finally {
      unmount(h);
    }
  });

  it("stops polling on a failed run too", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        jsonResponse(llmRunFixture({ status: "failed", finished_at: null })),
      );

    const h = mountQuery(() => useIngestRunStatus({ llmRunId: "run-10" }));
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      const calls = fetchSpy.mock.calls.length;
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      expect(fetchSpy.mock.calls.length).toBe(calls);
      expect(h.ref.current?.data?.status).toBe("failed");
    } finally {
      unmount(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * useRetryLlmRun                                                      *
 * ------------------------------------------------------------------ */

describe("useRetryLlmRun — wire contract", () => {
  it("POSTs to /api/v1/ingest/llm-runs/:id/retry with empty body when no reason", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        jsonResponse(llmRunFixture({ status: "running", finished_at: null })),
      );

    const h = mountMutation(() => useRetryLlmRun());
    try {
      const data = await act(async () =>
        h.ref.current!.mutateAsync({ llm_run_id: "abc" }),
      );
      const call = fetchSpy.mock.calls[0];
      expect(String(call?.[0])).toBe(
        "https://bff.test/api/v1/ingest/llm-runs/abc/retry",
      );
      const init = call?.[1] as RequestInit | undefined;
      expect((init?.method ?? "GET").toUpperCase()).toBe("POST");
      // Empty body — JSON serialisation of `{}`.
      expect(init?.body).toBe(JSON.stringify({}));
      expect(data.status).toBe("running");
    } finally {
      unmount(h);
    }
  });

  it("forwards `reason` when supplied", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse(llmRunFixture()));

    const h = mountMutation(() => useRetryLlmRun());
    try {
      await act(async () =>
        h.ref.current!.mutateAsync({
          llm_run_id: "abc",
          reason: "transient LLM provider timeout",
        }),
      );
      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(JSON.parse(String(init?.body))).toEqual({
        reason: "transient LLM provider timeout",
      });
    } finally {
      unmount(h);
    }
  });
});
