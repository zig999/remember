// Unit tests for the shared error-envelope mapper.
//
// Validates BR-24 (knowledge-graph.back.md / query-retrieval.back.md):
//   - Every known business sentinel from both domains is mapped to its
//     documented `error.code` + HTTP status verbatim (no drift from the
//     previous inline REST mappers).
//   - pg connectivity failures collapse to SYSTEM_SERVICE_UNAVAILABLE / 503.
//   - Unknown errors collapse to SYSTEM_INTERNAL_ERROR / 500 WITHOUT leaking
//     `err.message`.
//   - `mapErrorToEnvelope` returns the same envelope as
//     `mapErrorToHttpResponse(...).envelope` (the two forms share one core).
//
// These tests are the QA's safety net during the REST → MCP parity work
// (BR-26): a change here that breaks an existing code is a behaviour
// regression, not a refactor.

import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";

import {
  ErrorEnvelope,
  isPgUnavailable,
  mapErrorToEnvelope,
  mapErrorToHttpResponse,
} from "./error-envelope.js";

import {
  InvalidTraverseDepthError,
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownAttributeKeyError,
  UnknownLinkTypeError,
  UnknownNodeTypeError,
} from "../service/errors.js";
import {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  InvalidSearchLayerError,
  InvalidSearchQueryError,
  RawInformationDeletedError,
} from "../../query-retrieval/service/errors.js";

// Tiny helper: pg shape is "anything with .code = SQLSTATE | errno string".
function pgError(code: string, message = "pg test error"): Error & { code: string } {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}

describe("mapErrorToEnvelope", () => {
  // -------------------------------------------------------------------------
  // knowledge-graph business errors — BR-24 (knowledge-graph.back.md)
  // -------------------------------------------------------------------------

  it("maps ResourceNotFoundError -> 404 RESOURCE_NOT_FOUND with merged extras", () => {
    // BR-24: known business sentinel exposes a typed `code` field; the mapper
    // surfaces it verbatim and merges route-scoped extras into `details`.
    const err = new ResourceNotFoundError("KnowledgeNode", "abc-123");
    const result = mapErrorToHttpResponse(err, { node_id: "abc-123" });

    expect(result.statusCode).toBe(404);
    expect(result.logLevel).toBe("warn");
    expect(result.envelope).toEqual({
      ok: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "KnowledgeNode abc-123 not found.",
        details: { entity: "KnowledgeNode", id: "abc-123", node_id: "abc-123" },
      },
    });
  });

  it("maps NodeDeletedError -> 410 BUSINESS_NODE_DELETED", () => {
    const err = new NodeDeletedError("node-7");
    const result = mapErrorToHttpResponse(err, { node_id: "node-7" });

    expect(result.statusCode).toBe(410);
    expect(result.envelope.error.code).toBe("BUSINESS_NODE_DELETED");
    expect(result.envelope.error.details).toEqual({ node_id: "node-7" });
  });

  it("maps UnknownNodeTypeError -> 422 BUSINESS_UNKNOWN_NODE_TYPE", () => {
    const err = new UnknownNodeTypeError("Nonexistent");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_UNKNOWN_NODE_TYPE");
    expect(result.envelope.error.details).toEqual({ node_type: "Nonexistent" });
  });

  it("maps UnknownLinkTypeError -> 422 BUSINESS_UNKNOWN_LINK_TYPE", () => {
    const err = new UnknownLinkTypeError("rel_xyz");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
    expect(result.envelope.error.details).toEqual({ link_type: "rel_xyz" });
  });

  it("maps InvalidTraverseDepthError -> 422 BUSINESS_INVALID_TRAVERSE_DEPTH", () => {
    const err = new InvalidTraverseDepthError(5, 3);
    const result = mapErrorToHttpResponse(err, { node_id: "n1" });

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_INVALID_TRAVERSE_DEPTH");
    expect(result.envelope.error.details).toEqual({
      depth: 5,
      max: 3,
      node_id: "n1",
    });
  });

  it("maps UnknownAttributeKeyError -> 404 BUSINESS_UNKNOWN_ATTRIBUTE_KEY", () => {
    const err = new UnknownAttributeKeyError("Person", "favourite_colour");
    const result = mapErrorToHttpResponse(err, { node_id: "p1", key: "favourite_colour" });

    expect(result.statusCode).toBe(404);
    expect(result.envelope.error.code).toBe("BUSINESS_UNKNOWN_ATTRIBUTE_KEY");
    expect(result.envelope.error.details).toEqual({
      node_type: "Person",
      key: "favourite_colour",
      node_id: "p1",
    });
  });

  // -------------------------------------------------------------------------
  // query-retrieval business errors — BR-24 (query-retrieval.back.md)
  // -------------------------------------------------------------------------

  it("maps InvalidSearchQueryError -> 422 with the error's own structured details", () => {
    // The error class carries a pre-built `details` object — the mapper must
    // pass it through verbatim (NOT merge route extras). This preserves
    // pre-refactor behaviour of `handleSearchError`.
    const err = new InvalidSearchQueryError("too_long", { length: 1234 });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_INVALID_SEARCH_QUERY");
    expect(result.envelope.error.details).toEqual({ length: 1234 });
  });

  it("maps InvalidSearchLayerError -> 422 with invalid + allowed", () => {
    const err = new InvalidSearchLayerError("bogus");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_INVALID_SEARCH_LAYER");
    expect(result.envelope.error.details).toEqual({
      invalid: "bogus",
      allowed: ["fragment", "node", "chunk"],
    });
  });

  it("maps FragmentNotAcceptedError -> 404 BUSINESS_FRAGMENT_NOT_ACCEPTED", () => {
    const err = new FragmentNotAcceptedError("frag-1", "proposed");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(404);
    expect(result.envelope.error.code).toBe("BUSINESS_FRAGMENT_NOT_ACCEPTED");
    expect(result.envelope.error.details).toEqual({
      fragment_id: "frag-1",
      status: "proposed",
    });
  });

  it("maps RawInformationDeletedError -> 410 with ISO timestamp", () => {
    const deletedAt = new Date("2026-06-14T10:00:00.000Z");
    const err = new RawInformationDeletedError("raw-9", deletedAt);
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(410);
    expect(result.envelope.error.code).toBe("BUSINESS_RAW_INFORMATION_DELETED");
    expect(result.envelope.error.details).toEqual({
      raw_information_id: "raw-9",
      deleted_at: "2026-06-14T10:00:00.000Z",
    });
  });

  it("maps EmptyProvenanceError -> 500 with generic message and NO details", () => {
    // Legacy-data inconsistency — the operator audit-log keeps the anchor id
    // server-side; the wire response is the generic 500 envelope.
    const err = new EmptyProvenanceError("link", "lnk-3");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.logLevel).toBe("error");
    expect(result.envelope).toEqual({
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Internal server error.",
      },
    });
    expect(result.envelope.error.details).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Cross-cutting: Zod / pg / unknown
  // -------------------------------------------------------------------------

  it("maps ZodError -> 422 VALIDATION_INVALID_FORMAT with normalised issues", () => {
    let captured: ZodError | undefined;
    try {
      z.object({ name: z.string() }).parse({ name: 42 });
    } catch (err) {
      captured = err as ZodError;
    }
    if (captured === undefined) throw new Error("ZodError not thrown by test setup");

    const result = mapErrorToHttpResponse(captured);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("VALIDATION_INVALID_FORMAT");
    expect(result.envelope.error.message).toBe("Request payload failed validation.");
    expect(Array.isArray(result.envelope.error.details)).toBe(true);
    const issues = result.envelope.error.details as Array<{ path: string; message: string }>;
    expect(issues[0]?.path).toBe("name");
  });

  it("maps pg ECONNREFUSED -> 503 SYSTEM_SERVICE_UNAVAILABLE", () => {
    // Matches BR-18 (knowledge-graph.back.md). The MCP transport (which does
    // not go through the Fastify error handler) MUST surface 503 / service-
    // unavailable just like REST does.
    const err = pgError("ECONNREFUSED", "connect ECONNREFUSED 127.0.0.1:5432");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(503);
    expect(result.logLevel).toBe("error");
    expect(result.envelope.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    expect(result.envelope.error.message).toBe(
      "A backing service is temporarily unavailable."
    );
  });

  it("maps pg SQLSTATE 57014 (statement timeout) -> 503 SYSTEM_SERVICE_UNAVAILABLE", () => {
    // 57014 = query_canceled (statement timeout). BR-18 treats it as
    // "backing service sick".
    const err = pgError("57014", "canceling statement due to statement timeout");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(503);
    expect(result.envelope.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
  });

  it("maps unknown error -> 500 SYSTEM_INTERNAL_ERROR without leaking err.message", () => {
    // Regression guard: pre-refactor handlers re-threw unknowns to the global
    // Fastify handler, which masks the cause message. The MCP path has no such
    // handler; the shared mapper MUST mask it directly.
    const err = new Error("super secret internal detail: PII inside");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(result.envelope.error.message).toBe("Internal server error.");
    // CRITICAL: never include the original message anywhere in the envelope.
    expect(JSON.stringify(result.envelope)).not.toContain("super secret");
  });

  it("maps null / undefined / primitives -> 500 SYSTEM_INTERNAL_ERROR", () => {
    // pg detection guards against non-object inputs; the unknown branch must
    // accept them too.
    for (const sample of [null, undefined, 42, "string-thrown", false]) {
      const result = mapErrorToHttpResponse(sample);
      expect(result.statusCode).toBe(500);
      expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    }
  });

  // -------------------------------------------------------------------------
  // Forms parity: mapErrorToEnvelope must equal http.envelope.
  // -------------------------------------------------------------------------

  it("mapErrorToEnvelope returns the same envelope as mapErrorToHttpResponse(...).envelope", () => {
    // BR-24 single-source guarantee: REST and MCP must surface the SAME
    // envelope. The two public entry points share one classification core.
    const cases: unknown[] = [
      new NodeDeletedError("n-1"),
      new InvalidSearchQueryError("empty_after_parse", { reason: "stopword" }),
      pgError("ECONNREFUSED"),
      new Error("anything"),
    ];

    for (const err of cases) {
      const full = mapErrorToHttpResponse(err);
      const env: ErrorEnvelope = mapErrorToEnvelope(err);
      expect(env).toEqual(full.envelope);
    }
  });
});

describe("isPgUnavailable", () => {
  it.each([
    ["ECONNREFUSED"],
    ["ETIMEDOUT"],
    ["ENOTFOUND"],
    ["ECONNRESET"],
    ["57P03"],
    ["57014"],
    ["08000"],
    ["08003"],
    ["08006"],
  ])("recognises %s", (code) => {
    expect(isPgUnavailable(pgError(code))).toBe(true);
  });

  it("rejects non-objects, missing code, and unrelated codes", () => {
    expect(isPgUnavailable(null)).toBe(false);
    expect(isPgUnavailable(undefined)).toBe(false);
    expect(isPgUnavailable("ECONNREFUSED")).toBe(false); // string, not object
    expect(isPgUnavailable(new Error("no code"))).toBe(false);
    expect(isPgUnavailable(pgError("23505"))).toBe(false); // unique_violation, not unavailable
  });
});
