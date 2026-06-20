// Unit tests for the in-process turn registry — BR-28.
//
// The registry is a module-scoped singleton. We use `clearForTests()` in
// `beforeEach` to isolate cases — every other test in this file would
// otherwise pollute the same Map.

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as registry from "../turn-registry.js";

describe("turn-registry (BR-28)", () => {
  beforeEach(() => {
    registry.clearForTests();
  });
  afterEach(() => {
    registry.clearForTests();
  });

  it("get() returns undefined for an unknown conversation", () => {
    // BR-38: cancel of a non-existent in-flight turn must be distinguishable
    // from a registered turn. The registry's `get` returns undefined for
    // unknown keys.
    expect(registry.get("11111111-1111-1111-1111-111111111111")).toBeUndefined();
  });

  it("register() then get() returns the same AbortController instance", () => {
    // BR-28: the controller registered for a conversation is the SAME
    // controller cancelTurn must look up — identity matters because
    // controller.abort() must affect the in-flight stream.
    const id = "22222222-2222-2222-2222-222222222222";
    const controller = new AbortController();
    registry.register(id, controller);
    expect(registry.get(id)).toBe(controller);
  });

  it("release() removes the entry so the next register() can succeed", () => {
    // BR-28: the sendMessage finally-block releases the entry on terminal
    // frame OR iterator throw. After release, get() must return undefined
    // (a subsequent same-key send can then register a fresh controller).
    const id = "33333333-3333-3333-3333-333333333333";
    registry.register(id, new AbortController());
    registry.release(id);
    expect(registry.get(id)).toBeUndefined();
    expect(registry.size()).toBe(0);
  });

  it("release() of an unknown id is a silent no-op", () => {
    // Defensive — release lives in a finally-block that may run before
    // register did. It MUST NOT throw.
    expect(() =>
      registry.release("44444444-4444-4444-4444-444444444444")
    ).not.toThrow();
  });

  it("size() reflects concurrent in-flight turns across distinct conversations", () => {
    // BR-28 is PER conversation — two distinct conversations may each have
    // their own in-flight turn at the same time.
    registry.register("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", new AbortController());
    registry.register("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", new AbortController());
    expect(registry.size()).toBe(2);
  });

  it("calling abort() on the registered controller is observable to its holder", () => {
    // BR-38 + BR-12: cancelTurn looks up the controller and calls abort();
    // the sendMessage handler that holds the SAME controller observes
    // `signal.aborted === true`. This test exercises the seam — registry
    // does not own abort semantics; it only stores references.
    const id = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const controller = new AbortController();
    registry.register(id, controller);
    const found = registry.get(id);
    expect(found).toBeDefined();
    expect(found?.signal.aborted).toBe(false);
    found?.abort();
    expect(controller.signal.aborted).toBe(true);
  });
});
