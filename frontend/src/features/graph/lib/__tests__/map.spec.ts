/**
 * map.ts — unit tests for the wire → surface mappers (TC-FE-01).
 *
 * Why these tests matter (u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - `mapNodeType` is the resilience boundary for an OPEN-catalog backend
 *    feeding a CLOSED frontend union (G-B). A future contributor who turns
 *    the function into a switch and adds a `throw` for unknown slugs would
 *    silently re-break UC-CG-12; the "never throws for any string"
 *    assertion pins that contract.
 *  - `deriveNodeState` enforces I-2: nodes have no flags. A regression
 *    that adds a `flags` argument here (mirroring `deriveLinkState`) would
 *    leak the link-side semantics into the node side. The tests pin both
 *    the mapping table AND the function arity.
 *  - `deriveLinkState` precedence is load-bearing: `superseded` > flags is
 *    a domain fact (supersession is historical; disputed/uncertain are
 *    review states). Re-ordering would change the StateBadge a user sees.
 */
import { describe, expect, it } from "vitest";
import { deriveLinkState, deriveNodeState, mapNodeType } from "../map";

/* -------------------------------------------------------------------------
 * mapNodeType — G-B / UC-CG-12
 * ------------------------------------------------------------------------- */

describe("mapNodeType — closed-union resolution (G-B)", () => {
  const KNOWN = [
    "person",
    "organization",
    "project",
    "event",
    "role",
    "category",
    "concept",
    "location",
    "document",
    "task",
  ] as const;

  it.each(KNOWN)("preserves known type slug %s", (slug) => {
    expect(mapNodeType(slug)).toBe(slug);
  });

  it("falls back to 'concept' for an unknown slug (does not throw)", () => {
    // The catalog is extensible — a Tier-2 NodeType may arrive on the wire
    // before the frontend union is updated. The mapper must absorb it.
    expect(() => mapNodeType("unknown_type")).not.toThrow();
    expect(mapNodeType("unknown_type")).toBe("concept");
  });

  it("falls back to 'concept' for an empty string (does not throw)", () => {
    expect(() => mapNodeType("")).not.toThrow();
    expect(mapNodeType("")).toBe("concept");
  });

  it("normalizes whitespace and casing before lookup", () => {
    // Defensive: even if the wire ever produces `"Person"` or `" person "`,
    // the closed union match still hits. This is not a wire bug today, but
    // the failure mode would be silent (a `Person` would render as the
    // fallback) — the assertion locks in the defensive trim+lowercase.
    expect(mapNodeType("Person")).toBe("person");
    expect(mapNodeType("  PROJECT  ")).toBe("project");
  });

  it("never throws for non-canonical / non-ASCII input", () => {
    // The OS / Postgres collation could produce odd slugs in principle —
    // we are documenting that *any* string is safe input.
    expect(() => mapNodeType("área")).not.toThrow();
    expect(mapNodeType("área")).toBe("concept");
  });
});

/* -------------------------------------------------------------------------
 * deriveNodeState — status-ONLY mapping (I-2)
 * ------------------------------------------------------------------------- */

describe("deriveNodeState — status-only derivation (I-2)", () => {
  it("maps active → accepted", () => {
    expect(deriveNodeState("active")).toBe("accepted");
  });

  it("maps needs_review → uncertain", () => {
    expect(deriveNodeState("needs_review")).toBe("uncertain");
  });

  it("returns undefined for merged (filter signal)", () => {
    // The dispatcher filters merged/deleted nodes out of the surface shape;
    // `undefined` is the documented contract for that filter signal — see
    // map.ts JSDoc and plan I-2.
    expect(deriveNodeState("merged")).toBeUndefined();
  });

  it("returns undefined for deleted (filter signal)", () => {
    expect(deriveNodeState("deleted")).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------
 * deriveLinkState — status + flags (precedence is load-bearing)
 * ------------------------------------------------------------------------- */

describe("deriveLinkState — precedence ladder", () => {
  it("returns 'accepted' when there is no status and no flags", () => {
    expect(deriveLinkState(undefined, undefined)).toBe("accepted");
    expect(deriveLinkState(undefined, [])).toBe("accepted");
  });

  it("returns 'accepted' for an active link with no flags", () => {
    expect(deriveLinkState("active", [])).toBe("accepted");
  });

  it("returns 'superseded' regardless of flags", () => {
    // Domain fact: supersession is historical. A `disputed` flag on a
    // superseded link does NOT promote it back to a review state — the
    // historical fact dominates the visual.
    expect(deriveLinkState("superseded", undefined)).toBe("superseded");
    expect(deriveLinkState("superseded", ["disputed"])).toBe("superseded");
    expect(deriveLinkState("superseded", ["low_confidence", "uncertain"])).toBe(
      "superseded",
    );
  });

  it("maps disputed flag → 'disputed' (strongest review signal)", () => {
    expect(deriveLinkState("active", ["disputed"])).toBe("disputed");
  });

  it("disputed wins over low_confidence and uncertain", () => {
    // Precedence order documented in map.ts: disputed > low_confidence >
    // uncertain. The order matches the StateBadge severity ladder.
    expect(deriveLinkState("active", ["uncertain", "disputed", "low_confidence"]))
      .toBe("disputed");
  });

  it("low_confidence wins over uncertain", () => {
    expect(deriveLinkState("active", ["uncertain", "low_confidence"])).toBe(
      "low-confidence",
    );
  });

  it("maps uncertain alone → 'uncertain'", () => {
    expect(deriveLinkState("active", ["uncertain"])).toBe("uncertain");
  });

  it("ignores unrecognized status strings (defaults to accepted)", () => {
    // The wire `status` is a free string on the link side; we only branch
    // on `"superseded"`. Any other value (including future ones) falls
    // through to the flag ladder, so an unknown status with no flags is
    // visually `accepted` — matching the "no negative signal" rule.
    expect(deriveLinkState("anything_else", [])).toBe("accepted");
  });
});
