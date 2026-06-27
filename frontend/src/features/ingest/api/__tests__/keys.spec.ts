/**
 * `ingestKeys` — key factory shape contract (spec §4 Cache keys).
 *
 * The Task Contract pins the exact tuple shapes; consumers (this TC's hooks
 * plus TC-05 graph assembly) match `as const` literals for prefix
 * invalidation. Drift here breaks invalidation downstream.
 */
import { describe, expect, it } from "vitest";
import { ingestKeys } from "../keys";

describe("ingestKeys — factory shape", () => {
  it("all is a frozen single-element ingest prefix", () => {
    expect(ingestKeys.all).toEqual(["ingest"]);
  });

  it("run(id) returns [ingest, run, id]", () => {
    expect(ingestKeys.run("abc-123")).toEqual(["ingest", "run", "abc-123"]);
  });

  it("traverse(nodeId) returns [ingest, traverse, nodeId]", () => {
    expect(ingestKeys.traverse("node-1")).toEqual([
      "ingest",
      "traverse",
      "node-1",
    ]);
  });

  it("two run() calls with the same id are array-equal (cache equality)", () => {
    expect(ingestKeys.run("x")).toEqual(ingestKeys.run("x"));
  });
});
