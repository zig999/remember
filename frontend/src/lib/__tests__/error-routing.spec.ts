// @vitest-environment node
/**
 * Tests for `lib/error-routing.ts` — the single error-code → UI behaviour
 * map (front.md §5, front.back.md BR-17).
 *
 * Why these tests exist (Golden Rule 9): the routing decision is the only
 * thing that prevents two different features from drifting to two different
 * UX responses to the same BFF code. If a row of the §5 table regresses,
 * the regression is silent in dev (some feature still toasts) and only
 * surfaces in QA. These tests pin every row.
 */
import { describe, it, expect } from "vitest";
import { routeError, isConversationResourceKey } from "../error-routing";
import { EnvelopeError } from "../http";

function makeError(code: string, message = "msg", details?: unknown): EnvelopeError {
  return new EnvelopeError({ code, httpStatus: 0, message, details });
}

describe("routeError()", () => {
  it("AUTH_UNAUTHORIZED → redirect to /sign-in?reason=session_expired", () => {
    expect(routeError(makeError("AUTH_UNAUTHORIZED"))).toEqual({
      kind: "redirect",
      to: "/sign-in?reason=session_expired",
    });
  });

  // TC-11: token-loss codes alias to the same redirect — the BFF JWT
  // middleware emits AUTH_TOKEN_EXPIRED / AUTH_TOKEN_INVALID on stale or
  // tampered bearers; both must terminate the session loudly.
  it("AUTH_TOKEN_EXPIRED → redirect to /sign-in?reason=session_expired", () => {
    expect(routeError(makeError("AUTH_TOKEN_EXPIRED"))).toEqual({
      kind: "redirect",
      to: "/sign-in?reason=session_expired",
    });
  });

  it("AUTH_TOKEN_INVALID → redirect to /sign-in?reason=session_expired", () => {
    expect(routeError(makeError("AUTH_TOKEN_INVALID"))).toEqual({
      kind: "redirect",
      to: "/sign-in?reason=session_expired",
    });
  });

  it("AUTH_FORBIDDEN → boundary", () => {
    expect(routeError(makeError("AUTH_FORBIDDEN"))).toMatchObject({ kind: "boundary" });
  });

  it("VALIDATION_INVALID_FORMAT → set-error (no toast)", () => {
    expect(routeError(makeError("VALIDATION_INVALID_FORMAT", "Campo X"))).toMatchObject({
      kind: "set-error",
      message: "Campo X",
    });
  });

  it("VALIDATION_INVALID_FORMAT forwards details when present", () => {
    const r = routeError(makeError("VALIDATION_INVALID_FORMAT", "x", { field: "name" }));
    expect(r).toMatchObject({ kind: "set-error", details: { field: "name" } });
  });

  it("RESOURCE_NOT_FOUND (no context) → inline-empty", () => {
    expect(routeError(makeError("RESOURCE_NOT_FOUND"))).toMatchObject({
      kind: "inline-empty",
    });
  });

  // TC-11: a missing conversation drops the ?conversation= search param
  // back to /chat AND tells the operator via a warning toast — otherwise
  // the workspace re-queries the same ghost id every revalidation.
  it("RESOURCE_NOT_FOUND with conversation context → toast-and-navigate /chat", () => {
    expect(
      routeError(makeError("RESOURCE_NOT_FOUND"), { isConversationResource: true }),
    ).toEqual({
      kind: "toast-and-navigate",
      tone: "warning",
      message: "Conversa não encontrada.",
      to: "/chat",
    });
  });

  it("RESOURCE_NOT_FOUND with isConversationResource=false → inline-empty (no nav)", () => {
    // Negative path: an unrelated 404 (e.g. a graph node) must NOT navigate.
    expect(
      routeError(makeError("RESOURCE_NOT_FOUND"), { isConversationResource: false }),
    ).toMatchObject({ kind: "inline-empty" });
  });

  it("RESOURCE_GONE → inline-gone with LGPD message", () => {
    expect(routeError(makeError("RESOURCE_GONE"))).toMatchObject({
      kind: "inline-gone",
      message: "Esta fonte foi removida por conformidade.",
    });
  });

  it("BUSINESS_* → warning toast", () => {
    expect(routeError(makeError("BUSINESS_DUPLICATE", "Já existe"))).toEqual({
      kind: "toast",
      tone: "warning",
      message: "Já existe",
    });
    expect(routeError(makeError("BUSINESS_RUN_ALREADY_OPEN"))).toMatchObject({
      kind: "toast",
      tone: "warning",
    });
  });

  it("SYSTEM_* → danger toast", () => {
    expect(routeError(makeError("SYSTEM_UPSTREAM"))).toMatchObject({
      kind: "toast",
      tone: "danger",
    });
    expect(routeError(makeError("SYSTEM_TIMEOUT"))).toMatchObject({
      kind: "toast",
      tone: "danger",
    });
  });

  it("SYSTEM_NETWORK → warning toast (offline copy)", () => {
    expect(routeError(makeError("SYSTEM_NETWORK"))).toMatchObject({
      kind: "toast",
      tone: "warning",
      message: "Sem conexão.",
    });
  });

  it("SYSTEM_ABORTED → silent (user-driven cancel)", () => {
    expect(routeError(makeError("SYSTEM_ABORTED"))).toEqual({ kind: "silent" });
  });

  it("unknown code → fail-loud danger toast", () => {
    expect(routeError(makeError("WAT_IS_THIS"))).toMatchObject({
      kind: "toast",
      tone: "danger",
    });
  });
});

/**
 * Why these tests exist: `isConversationResourceKey` is the bridge between
 * the TanStack `queryKey` shape and the routing context. If it mis-classifies,
 * either a 404 on the conversation LIST will navigate away (bad), or a 404 on
 * the detail/messages/usage stays inline (the bug TC-11 fixes).
 */
describe("isConversationResourceKey()", () => {
  it("matches the detail key shape ['conversations', id]", () => {
    expect(isConversationResourceKey(["conversations", "abc-123"])).toBe(true);
  });

  it("matches the messages key shape ['conversations', id, 'messages']", () => {
    expect(isConversationResourceKey(["conversations", "abc-123", "messages"])).toBe(true);
  });

  it("matches the usage key shape ['conversations', id, 'usage']", () => {
    expect(isConversationResourceKey(["conversations", "abc-123", "usage"])).toBe(true);
  });

  it("does NOT match the list root ['conversations', 'list', filters]", () => {
    expect(
      isConversationResourceKey(["conversations", "list", { includeArchived: false }]),
    ).toBe(false);
  });

  it("does NOT match the all root ['conversations']", () => {
    expect(isConversationResourceKey(["conversations"])).toBe(false);
  });

  it("does NOT match unrelated namespaces", () => {
    expect(isConversationResourceKey(["nodes", "abc"])).toBe(false);
    expect(isConversationResourceKey(["search", "query"])).toBe(false);
  });

  it("rejects empty id and non-string ids", () => {
    expect(isConversationResourceKey(["conversations", ""])).toBe(false);
    expect(isConversationResourceKey(["conversations", 42])).toBe(false);
    expect(isConversationResourceKey(["conversations", null])).toBe(false);
  });
});
