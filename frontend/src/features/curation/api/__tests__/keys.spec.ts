/**
 * curationKeys / provenanceKeys / nodeKeys / historyKeys — factory shape +
 * uniqueness.
 *
 * Spec ref: docs/specs/front/features/curadoria.feature.spec.md §4 (Cache
 * keys). The factory shapes are normative — TC-04 through TC-07 import
 * them as the single source of truth for invalidation. These tests pin
 * the shape so a refactor cannot drift silently and cause silent cache
 * collisions or invalidation misses across the feature wave.
 *
 * Why pin both `all` AND each factory result: TanStack Query uses array
 * deep-equality for keys and treats `all` as a prefix when invalidating.
 * Drifting the `all` segment OR drifting the structure of any factory
 * would break the documented invalidation contract:
 *   - mutation onSuccess invalidates `curationKeys.all` to refresh queue
 *     and metrics simultaneously;
 *   - provenance / node / history are scoped per-id so a single
 *     correction can refresh just the affected entity, not the world.
 */
import { describe, expect, it } from "vitest";
import {
  curationKeys,
  provenanceKeys,
  nodeKeys,
  historyKeys,
} from "../keys";

describe("curationKeys", () => {
  it("exposes the three normative entries (all, queue, metrics)", () => {
    expect(curationKeys.all).toBeDefined();
    expect(typeof curationKeys.queue).toBe("function");
    expect(typeof curationKeys.metrics).toBe("function");
  });

  it("`all` is the literal prefix ['curation']", () => {
    expect(curationKeys.all).toEqual(["curation"]);
  });

  it("`queue` encodes the kind+page filter as part of the key", () => {
    const a = curationKeys.queue("entity_match", 0);
    const b = curationKeys.queue("disputed", 0);
    const c = curationKeys.queue("entity_match", 1);
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(a).toEqual([
      "curation",
      "queue",
      { kind: "entity_match", page: 0 },
    ]);
  });

  it("`queue` with undefined kind+page is the 'both queues, first page' key", () => {
    expect(curationKeys.queue()).toEqual([
      "curation",
      "queue",
      { kind: undefined, page: undefined },
    ]);
  });

  it("`metrics` is a stable singleton key", () => {
    expect(curationKeys.metrics()).toEqual(["curation", "metrics"]);
    // Two calls return arrays that are deep-equal — TanStack Query relies
    // on this so a re-render does not invent a new cache entry.
    expect(curationKeys.metrics()).toEqual(curationKeys.metrics());
  });

  it("queue and metrics both have `curation` as prefix (root invalidation works)", () => {
    const root = curationKeys.all;
    const queue = curationKeys.queue("entity_match", 0) as readonly unknown[];
    const metrics = curationKeys.metrics() as readonly unknown[];
    expect(queue.slice(0, root.length)).toEqual([...root]);
    expect(metrics.slice(0, root.length)).toEqual([...root]);
  });
});

describe("provenanceKeys", () => {
  it("exposes link / attribute / fragment factories", () => {
    expect(typeof provenanceKeys.link).toBe("function");
    expect(typeof provenanceKeys.attribute).toBe("function");
    expect(typeof provenanceKeys.fragment).toBe("function");
  });

  it("each variant produces a distinct key for the same id", () => {
    const id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const link = provenanceKeys.link(id);
    const attr = provenanceKeys.attribute(id);
    const frag = provenanceKeys.fragment(id);
    expect(link).not.toEqual(attr);
    expect(link).not.toEqual(frag);
    expect(attr).not.toEqual(frag);
    expect(link).toEqual(["provenance", "link", id]);
    expect(attr).toEqual(["provenance", "attribute", id]);
    expect(frag).toEqual(["provenance", "fragment", id]);
  });

  it("different ids produce distinct keys (no cross-talk)", () => {
    expect(provenanceKeys.link("a")).not.toEqual(provenanceKeys.link("b"));
  });
});

describe("nodeKeys", () => {
  it("`detail(id)` matches the spec literal", () => {
    const id = "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001";
    expect(nodeKeys.detail(id)).toEqual(["nodes", id, "detail"]);
  });

  it("different node ids produce distinct keys", () => {
    expect(nodeKeys.detail("a")).not.toEqual(nodeKeys.detail("b"));
  });
});

describe("historyKeys", () => {
  it("link / attribute history are distinct", () => {
    const id = "x";
    expect(historyKeys.link(id)).toEqual(["history", "link", id]);
    expect(historyKeys.attribute(id)).toEqual(["history", "attribute", id]);
    expect(historyKeys.link(id)).not.toEqual(historyKeys.attribute(id));
  });
});

describe("cross-factory isolation", () => {
  it("provenance vs. node vs. history use distinct top-level prefixes", () => {
    // No two factories share a top-level segment — this prevents an
    // `invalidateQueries` against one factory from accidentally
    // sweeping the others.
    const id = "x";
    expect((provenanceKeys.link(id) as readonly unknown[])[0]).toBe(
      "provenance",
    );
    expect((nodeKeys.detail(id) as readonly unknown[])[0]).toBe("nodes");
    expect((historyKeys.link(id) as readonly unknown[])[0]).toBe("history");
    expect((curationKeys.all as readonly unknown[])[0]).toBe("curation");
  });
});
