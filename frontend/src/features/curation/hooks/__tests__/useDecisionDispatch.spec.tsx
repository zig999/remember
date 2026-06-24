/**
 * useDecisionDispatch — controller tests (TC-06).
 *
 * Why each test (Rule 9 — encode the WHY):
 *
 *  - dispatchDestructive removes the item optimistically AND advances the
 *    selection BEFORE the BFF is touched. If we deferred the optimistic
 *    remove until commit, the curator would briefly see two items checked
 *    while the toast counted down — a perceived freeze.
 *  - ZERO BFF requests during the 5s window — the central acceptance
 *    criterion. We assert by spying on the mutation hook's mutateAsync
 *    and confirming it is not called until the timer expires.
 *  - Undo cancels the timer, restores the item, and dismisses the toast.
 *    Spec says "no CurationAction" — we assert mutateAsync was NEVER
 *    called.
 *  - Timer expiry triggers exactly one POST (the destructive payload).
 *  - 409 vanish: optimistic remove + warning toast + advance, NO inline
 *    error (FL-CURATION-06). A test that asserted serverError !== null
 *    after a 409 would catch a regression that turned the panel into a
 *    dead-end.
 *  - 422 REASON_REQUIRED projects serverError so the panel can highlight
 *    the field. We do NOT advance — the user must fix the field.
 *  - Non-destructive dispatch commits immediately and advances on 200.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { EnvelopeError } from "../../../../lib/http";

/* ---------------- mocks ---------------- */

// vi.mock factories are hoisted ABOVE every top-level statement — including
// `const`s. `vi.hoisted` produces values during the hoist phase, BEFORE the
// mock factories run, so the factories can safely close over these spies.
const mocks = vi.hoisted(() => {
  // `vi` is available inside vi.hoisted (the SAME vi instance the rest of the
  // file uses).
  return {
    entityMatchSpy: vi.fn(),
    disputeSpy: vi.fn(),
    confirmSpy: vi.fn(),
    rejectSpy: vi.fn(),
    correctSpy: vi.fn(),
    sonnerCustomSpy: vi.fn(),
    sonnerDismissSpy: vi.fn(),
    sonnerWarningSpy: vi.fn(),
    sonnerSuccessSpy: vi.fn(),
    sonnerInfoSpy: vi.fn(),
    sonnerErrorSpy: vi.fn(),
    setSelectedItemSpy: vi.fn(),
    incrementResolvedSpy: vi.fn(),
  };
});

const {
  entityMatchSpy,
  disputeSpy,
  confirmSpy,
  rejectSpy,
  correctSpy,
  sonnerCustomSpy,
  sonnerDismissSpy,
  sonnerWarningSpy,
  sonnerSuccessSpy,
  sonnerInfoSpy,
  sonnerErrorSpy,
  setSelectedItemSpy,
  incrementResolvedSpy,
} = mocks;

vi.mock("../../api/curation.hooks", () => {
  function buildHook(spy: ReturnType<typeof vi.fn>) {
    return (): UseMutationResult<unknown, Error, unknown> => {
      return {
        mutateAsync: spy as unknown as UseMutationResult<
          unknown,
          Error,
          unknown
        >["mutateAsync"],
      } as unknown as UseMutationResult<unknown, Error, unknown>;
    };
  }
  return {
    useResolveEntityMatch: buildHook(mocks.entityMatchSpy),
    useResolveDispute: buildHook(mocks.disputeSpy),
    useConfirmItem: buildHook(mocks.confirmSpy),
    useRejectItem: buildHook(mocks.rejectSpy),
    useCorrectItem: buildHook(mocks.correctSpy),
  };
});

vi.mock("sonner", () => ({
  toast: {
    custom: (...args: unknown[]) => (mocks.sonnerCustomSpy as (...a: unknown[]) => unknown)(...args),
    dismiss: (...args: unknown[]) => (mocks.sonnerDismissSpy as (...a: unknown[]) => unknown)(...args),
    warning: (...args: unknown[]) => (mocks.sonnerWarningSpy as (...a: unknown[]) => unknown)(...args),
    success: (...args: unknown[]) => (mocks.sonnerSuccessSpy as (...a: unknown[]) => unknown)(...args),
    info: (...args: unknown[]) => (mocks.sonnerInfoSpy as (...a: unknown[]) => unknown)(...args),
    error: (...args: unknown[]) => (mocks.sonnerErrorSpy as (...a: unknown[]) => unknown)(...args),
  },
}));

vi.mock("../../state/curation-store", () => {
  function useCurationStore<T>(selector: (s: unknown) => T): T {
    const fakeState = {
      setSelectedItem: mocks.setSelectedItemSpy,
      incrementResolved: mocks.incrementResolvedSpy,
    };
    return selector(fakeState);
  }
  return { useCurationStore };
});

import { useDecisionDispatch } from "../useDecisionDispatch";

/* ---------------- harness ---------------- */

interface HookRef {
  current: ReturnType<typeof useDecisionDispatch> | null;
}

function HookHarness({
  hookRef,
  onItemRemove,
  onItemRestore,
  getNextItem,
}: {
  readonly hookRef: HookRef;
  readonly onItemRemove: (id: string) => void;
  readonly onItemRestore: (id: string) => void;
  readonly getNextItem: () => null;
}): null {
  hookRef.current = useDecisionDispatch({
    onItemRemove,
    onItemRestore,
    getNextItem,
  });
  return null;
}

let container: HTMLDivElement;
let root: Root;
let qc: QueryClient;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-24T00:00:00.000Z"));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  entityMatchSpy.mockReset();
  disputeSpy.mockReset();
  confirmSpy.mockReset();
  rejectSpy.mockReset();
  correctSpy.mockReset();
  sonnerCustomSpy.mockReset();
  sonnerDismissSpy.mockReset();
  sonnerWarningSpy.mockReset();
  sonnerSuccessSpy.mockReset();
  sonnerInfoSpy.mockReset();
  sonnerErrorSpy.mockReset();
  setSelectedItemSpy.mockReset();
  incrementResolvedSpy.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function mount(opts: {
  readonly hookRef: HookRef;
  readonly onItemRemove?: (id: string) => void;
  readonly onItemRestore?: (id: string) => void;
}): void {
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <HookHarness
          hookRef={opts.hookRef}
          onItemRemove={opts.onItemRemove ?? (() => {})}
          onItemRestore={opts.onItemRestore ?? (() => {})}
          getNextItem={() => null}
        />
      </QueryClientProvider>,
    );
  });
}

/* ---------------- tests ---------------- */

describe("useDecisionDispatch — UI-04 destructive flow", () => {
  it("optimistically removes + auto-advances BEFORE the BFF is touched (5s window has ZERO requests)", async () => {
    const onItemRemove = vi.fn();
    const hookRef: HookRef = { current: null };
    rejectSpy.mockResolvedValue({ item_kind: "link", item_id: "i1", resulting_status: "deleted", action_id: "a1" });
    mount({ hookRef, onItemRemove });

    act(() => {
      hookRef.current?.dispatchDestructive(
        {
          kind: "reject_item",
          body: { item_kind: "link", item_id: "i1", reason: "x" },
        },
        "i1",
        "Item removido",
      );
    });

    // Optimistic remove fired BEFORE timer expiry.
    expect(onItemRemove).toHaveBeenCalledWith("i1");
    // Selection advanced (UI-06 forward) — incrementResolved is also called.
    expect(setSelectedItemSpy).toHaveBeenCalledWith(null);
    expect(incrementResolvedSpy).toHaveBeenCalled();
    // UndoToast mounted via sonner.
    expect(sonnerCustomSpy).toHaveBeenCalled();
    // ZERO BFF requests yet.
    expect(rejectSpy).not.toHaveBeenCalled();

    // Advance to 4.9s — still no request.
    await act(async () => {
      vi.advanceTimersByTime(4_900);
    });
    expect(rejectSpy).not.toHaveBeenCalled();

    // Expire the timer (now 5.0s).
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(rejectSpy).toHaveBeenCalledTimes(1);
  });

  it("Undo cancels the timer + restores the item + dismisses the toast — no CurationAction", async () => {
    const onItemRemove = vi.fn();
    const onItemRestore = vi.fn();
    const hookRef: HookRef = { current: null };
    mount({ hookRef, onItemRemove, onItemRestore });

    act(() => {
      hookRef.current?.dispatchDestructive(
        {
          kind: "reject_item",
          body: { item_kind: "link", item_id: "i1", reason: "x" },
        },
        "i1",
        "Item removido",
      );
    });
    expect(sonnerCustomSpy).toHaveBeenCalled();

    // The owning consumer wires the toast's Desfazer → cancelPending.
    act(() => {
      hookRef.current?.cancelPending();
    });

    expect(onItemRestore).toHaveBeenCalledWith("i1");
    expect(sonnerDismissSpy).toHaveBeenCalled();

    // Even after the would-be deadline, no BFF request fires.
    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });
    expect(rejectSpy).not.toHaveBeenCalled();
  });

  it("commitPending fires the POST immediately (navigation-away teardown)", async () => {
    const hookRef: HookRef = { current: null };
    rejectSpy.mockResolvedValue({ item_kind: "link", item_id: "i1", resulting_status: "deleted", action_id: "a1" });
    mount({ hookRef });

    act(() => {
      hookRef.current?.dispatchDestructive(
        {
          kind: "reject_item",
          body: { item_kind: "link", item_id: "i1", reason: "x" },
        },
        "i1",
        "Item removido",
      );
    });
    expect(rejectSpy).not.toHaveBeenCalled();

    await act(async () => {
      hookRef.current?.commitPending();
      await Promise.resolve();
    });
    expect(rejectSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useDecisionDispatch — non-destructive dispatch (UI-05/UI-06)", () => {
  it("commits immediately and emits a success toast on 200", async () => {
    const hookRef: HookRef = { current: null };
    confirmSpy.mockResolvedValue({ item_kind: "link", item_id: "i1", resulting_status: "active", action_id: "a1" });
    mount({ hookRef });

    await act(async () => {
      hookRef.current?.dispatchNonDestructive({
        kind: "confirm_item",
        body: { item_kind: "link", item_id: "i1" },
      });
      await Promise.resolve();
    });
    // Allow the await-promise chain to settle.
    await act(async () => {
      await Promise.resolve();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(sonnerSuccessSpy).toHaveBeenCalled();
    expect(setSelectedItemSpy).toHaveBeenCalledWith(null);
    expect(incrementResolvedSpy).toHaveBeenCalled();
  });
});

describe("useDecisionDispatch — §6 error mapping", () => {
  it("409 REVIEW_NOT_PENDING: optimistic remove + warning toast + advance, NO inline error", async () => {
    const onItemRemove = vi.fn();
    const hookRef: HookRef = { current: null };
    confirmSpy.mockRejectedValue(
      new EnvelopeError({
        code: "BUSINESS_REVIEW_NOT_PENDING",
        httpStatus: 409,
        message: "Já resolvido em outro lugar.",
      }),
    );
    mount({ hookRef, onItemRemove });

    await act(async () => {
      hookRef.current?.dispatchNonDestructive({
        kind: "confirm_item",
        body: { item_kind: "link", item_id: "i1" },
      });
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(onItemRemove).toHaveBeenCalledWith("i1");
    expect(sonnerWarningSpy).toHaveBeenCalledWith("Já resolvido em outro lugar.");
    expect(setSelectedItemSpy).toHaveBeenCalledWith(null);
    expect(hookRef.current?.serverError).toBeNull();
    expect(hookRef.current?.stale).toBe(true);
  });

  it("422 REASON_REQUIRED projects serverError so the panel can highlight the field", async () => {
    const hookRef: HookRef = { current: null };
    rejectSpy.mockRejectedValue(
      new EnvelopeError({
        code: "BUSINESS_REASON_REQUIRED",
        httpStatus: 422,
        message: "Informe um motivo para continuar.",
      }),
    );
    mount({ hookRef });

    await act(async () => {
      hookRef.current?.dispatchDestructive(
        {
          kind: "reject_item",
          body: { item_kind: "link", item_id: "i1", reason: "" },
        },
        "i1",
        "Item removido",
      );
    });
    // Drain to expiry so the POST fires and rejects.
    await act(async () => {
      vi.advanceTimersByTime(6_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(rejectSpy).toHaveBeenCalled();
    expect(hookRef.current?.serverError?.code).toBe("BUSINESS_REASON_REQUIRED");
    expect(hookRef.current?.serverError?.message).toBe(
      "Informe um motivo para continuar.",
    );
  });

  it("500 SYSTEM_INTERNAL_ERROR shows a danger toast (no inline)", async () => {
    const hookRef: HookRef = { current: null };
    confirmSpy.mockRejectedValue(
      new EnvelopeError({
        code: "SYSTEM_INTERNAL_ERROR",
        httpStatus: 500,
        message: "boom",
      }),
    );
    mount({ hookRef });

    await act(async () => {
      hookRef.current?.dispatchNonDestructive({
        kind: "confirm_item",
        body: { item_kind: "link", item_id: "i1" },
      });
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(sonnerErrorSpy).toHaveBeenCalled();
  });
});
