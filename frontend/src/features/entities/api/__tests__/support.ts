import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { vi } from "vitest";
import { http } from "../../../../lib/http";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

export interface RecordedRequest {
  readonly url: URL;
  readonly method: string;
  readonly authorization: string | null;
  readonly signal: AbortSignal | undefined;
}

export type Responder = (
  request: RecordedRequest,
  attempt: number,
) => Promise<Response>;

export interface Snapshot<T> {
  readonly status: "pending" | "success" | "error";
  readonly data: T | undefined;
  readonly error: unknown;
}

export interface Mounted<T> {
  readonly queryClient: QueryClient;
  readonly snapshot: () => Snapshot<T>;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const placements: Placement[] = [];

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

export function stubFetch(responder: Responder): RecordedRequest[] {
  const requests: RecordedRequest[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const request: RecordedRequest = {
      url: new URL(String(input)),
      method: init?.method ?? "GET",
      authorization: new Headers(init?.headers).get("Authorization"),
      signal: init?.signal ?? undefined,
    };
    requests.push(request);
    return responder(request, requests.length);
  });
  return requests;
}

export function answers(build: () => Response): Responder {
  return () => Promise.resolve(build());
}

export function failsWith(error: unknown): Responder {
  return () => Promise.reject(error);
}

export function answersAfter(ms: number, build: () => Response): Responder {
  return (request) =>
    new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(build()), ms);
      const signal = request.signal;
      if (signal === undefined) return;
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason);
        },
        { once: true },
      );
    });
}

export function mountQuery<T>(useHook: () => UseQueryResult<T>): Mounted<T> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Probe(): null {
    useHook();
    return null;
  }
  const root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Probe),
      ),
    );
  });
  placements.push({ root, container, queryClient });
  return {
    queryClient,
    snapshot: () => {
      const query = queryClient.getQueryCache().getAll()[0];
      if (query === undefined) {
        return { status: "pending", data: undefined, error: null };
      }
      return {
        status: query.state.status,
        data: query.state.data as T | undefined,
        error: query.state.error,
      };
    },
  };
}

export function unmountAll(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
}

export async function waitUntil(
  predicate: () => boolean,
  maxMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (predicate()) return;
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });
    });
  }
  throw new Error("waitUntil timed out");
}

export async function settled<T>(mounted: Mounted<T>): Promise<Snapshot<T>> {
  await waitUntil(() => mounted.snapshot().status !== "pending");
  return mounted.snapshot();
}

export async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

export interface FailureFacts {
  readonly httpStatus: unknown;
  readonly code: unknown;
  readonly message: unknown;
  readonly details: unknown;
}

export function factsOf(error: unknown): FailureFacts {
  if (typeof error !== "object" || error === null) {
    throw new Error("the read did not fail with a failure object");
  }
  const failure = error as Record<string, unknown>;
  if (typeof failure["code"] !== "string") {
    throw new Error("the read did not fail with a coded failure");
  }
  return {
    httpStatus: failure["httpStatus"],
    code: failure["code"],
    message: failure["message"],
    details: failure["details"],
  };
}

async function failureFromHttp(
  path: string,
  responder: Responder,
): Promise<unknown> {
  stubFetch(responder);
  try {
    await http(path, { method: "GET" });
  } catch (error) {
    return error;
  }
  throw new Error("the http function answered without failing");
}

export async function compareFailures(
  path: string,
  responder: Responder,
  useRead: () => UseQueryResult<unknown>,
): Promise<{ viaRead: FailureFacts; viaHttp: FailureFacts }> {
  stubFetch(responder);
  const state = await settled(mountQuery(useRead));
  unmountAll();
  const viaRead = factsOf(state.error);
  const viaHttp = factsOf(await failureFromHttp(path, responder));
  return { viaRead, viaHttp };
}
