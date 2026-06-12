// Typed sentinel errors emitted by the query-retrieval services. The route
// layer maps each one to its HTTP status + `error.code` envelope. Unhandled
// errors propagate to the global Fastify error handler.
//
// All error codes registered in `docs/specs/_global/error-codes.md`.

/** BR-05 — parsed tsquery is empty (Zod cap on length, but stopword-only also lands here). */
export class InvalidSearchQueryError extends Error {
  public readonly statusCode = 422;
  public readonly code = "BUSINESS_INVALID_SEARCH_QUERY" as const;
  public readonly reason: "empty_after_trim" | "empty_after_parse" | "too_long";
  public readonly details: Record<string, unknown>;

  constructor(
    reason: "empty_after_trim" | "empty_after_parse" | "too_long",
    details: Record<string, unknown>
  ) {
    super(
      reason === "empty_after_parse"
        ? "query parsed by websearch_to_tsquery is empty"
        : reason === "empty_after_trim"
        ? "query is empty after trim"
        : "query exceeds 1000 characters"
    );
    this.name = "InvalidSearchQueryError";
    this.reason = reason;
    this.details = details;
  }
}

/** BR-04 — `layers[]` element outside `{fragment, node, chunk}`. */
export class InvalidSearchLayerError extends Error {
  public readonly statusCode = 422;
  public readonly code = "BUSINESS_INVALID_SEARCH_LAYER" as const;
  public readonly invalid: string;
  public readonly allowed = ["fragment", "node", "chunk"] as const;

  constructor(invalid: string) {
    super(`layers[] contains an unsupported value: '${invalid}'`);
    this.name = "InvalidSearchLayerError";
    this.invalid = invalid;
  }
}

/** BR-16 / partial-GIN — fragment exists but `status != 'accepted'`. */
export class FragmentNotAcceptedError extends Error {
  public readonly statusCode = 404;
  public readonly code = "BUSINESS_FRAGMENT_NOT_ACCEPTED" as const;
  public readonly fragmentId: string;
  public readonly status: string;

  constructor(fragmentId: string, status: string) {
    super(`InformationFragment ${fragmentId} is not in 'accepted' status.`);
    this.name = "FragmentNotAcceptedError";
    this.fragmentId = fragmentId;
    this.status = status;
  }
}

/** BR-17 — any underlying `raw_information` is tombstoned by `compliance_delete`. */
export class RawInformationDeletedError extends Error {
  public readonly statusCode = 410;
  public readonly code = "BUSINESS_RAW_INFORMATION_DELETED" as const;
  public readonly rawInformationId: string;
  public readonly deletedAt: Date;

  constructor(rawInformationId: string, deletedAt: Date) {
    super(
      `underlying RawInformation ${rawInformationId} was deleted by compliance_delete.`
    );
    this.name = "RawInformationDeletedError";
    this.rawInformationId = rawInformationId;
    this.deletedAt = deletedAt;
  }
}

/** BR-19 — empty provenance on an existing anchor (legacy-data inconsistency). */
export class EmptyProvenanceError extends Error {
  public readonly statusCode = 500;
  public readonly code = "SYSTEM_INTERNAL_ERROR" as const;
  public readonly anchorKind: "link" | "attribute" | "fragment";
  public readonly anchorId: string;

  constructor(anchorKind: "link" | "attribute" | "fragment", anchorId: string) {
    super(
      `provenance chain is empty for ${anchorKind} ${anchorId} (legacy-data inconsistency).`
    );
    this.name = "EmptyProvenanceError";
    this.anchorKind = anchorKind;
    this.anchorId = anchorId;
  }
}
