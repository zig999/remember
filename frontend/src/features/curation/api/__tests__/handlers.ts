/**
 * Curation API — mock response handlers.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §1 (consumed
 *    endpoints), §6 (curation REST bare-body on 2xx; KG/QR enveloped).
 *  - dev_tc_003 task contract — "MSW handlers cover all endpoints (happy
 *    path 200 + key error codes: 409, 410, 422, 404)".
 *
 * Rationale (why hand-rolled handlers instead of `msw`):
 *  - MSW is NOT in `frontend/package.json`. Adding it is a new top-level
 *    dependency that should be approved by the user (CLAUDE.md "Surgical
 *    Changes"). Existing tests in features/chat and features/graph use
 *    `vi.spyOn(globalThis, "fetch")` directly — see
 *    `features/graph/api/__tests__/useNodeDetail.spec.tsx`.
 *  - These handlers provide the SAME ergonomics as MSW (a request-shape
 *    matcher + a response factory) but plug into `vi.spyOn(globalThis,
 *    "fetch")` so tests need no new dependency. The shape is portable:
 *    if MSW is added later, each `Handler` here maps 1:1 to
 *    `http.get(...)` / `http.post(...)`.
 *
 * Usage in tests:
 *
 *   import { mockResponse, handlers } from "../__tests__/handlers";
 *   vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
 *     const url = String(input);
 *     const method = (init?.method ?? "GET").toUpperCase();
 *     return handlers.dispatch(url, method);
 *   });
 *
 *   // Override a single endpoint per-test:
 *   handlers.set("GET", /\/api\/v1\/curation\/queue/, () => mockResponse({...}));
 */

/* ------------------------------------------------------------------ *
 * Wire fixtures (mirror openapi.yaml examples)                        *
 * ------------------------------------------------------------------ */

export const FIXTURE_ENTITY_MATCH_QUEUE_ITEM = {
  kind: "entity_match" as const,
  node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
  node_type: "Project",
  canonical_name: "Apollo",
  candidates: [
    {
      candidate_node_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      canonical_name: "Projeto Apollo",
      similarity: 0.78,
    },
  ],
  created_at: "2026-06-10T14:02:13Z",
};

export const FIXTURE_DISPUTE_QUEUE_ITEM = {
  kind: "disputed" as const,
  item_kind: "attribute" as const,
  scope: {
    node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
    attribute_key: "deadline",
    source_node_id: null,
    target_node_id: null,
    link_type: null,
  },
  sides: [
    {
      item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      value: "2026-07-15",
      target_node_id: null,
      valid_from: "2026-01-10",
      valid_to: null,
      valid_from_source: "document" as const,
      confidence: 0.82,
      status: "disputed" as const,
    },
    {
      item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc",
      value: "2026-07-20",
      target_node_id: null,
      valid_from: "2026-01-10",
      valid_to: null,
      valid_from_source: "stated" as const,
      confidence: 0.88,
      status: "disputed" as const,
    },
  ],
  created_at: "2026-06-11T09:30:00Z",
};

export const FIXTURE_REVIEW_QUEUE_LIST = {
  total: 2,
  limit: 20,
  offset: 0,
  items: [FIXTURE_ENTITY_MATCH_QUEUE_ITEM, FIXTURE_DISPUTE_QUEUE_ITEM],
};

export const FIXTURE_CURATION_METRICS = {
  accept_rate: 0.91,
  reject_rate_by_code: {
    VALIDATION_INVALID_FORMAT: 0.02,
    BUSINESS_REVIEW_NOT_PENDING: 0.01,
  },
  needs_review_count: 7,
  uncertain_count: 23,
  disputed_count: 4,
  entity_match_queue_count: 7,
  disputed_queue_count: 3,
  computed_at: "2026-06-24T12:15:43Z",
};

export const FIXTURE_RESOLVE_ENTITY_MATCH_RESPONSE = {
  node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
  decision: "merge_into" as const,
  resulting_status: "merged" as const,
  target_node_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  affected: {
    links_repointed: 3,
    attributes_repointed: 2,
    aliases_copied: 2,
    path_compressed_nodes: 0,
  },
  action_id: "ccccccc1-cccc-cccc-cccc-cccccccccccc",
};

export const FIXTURE_MERGE_NODES_RESPONSE = {
  survivor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  absorbed_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
  affected: {
    links_repointed: 5,
    attributes_repointed: 4,
    aliases_copied: 3,
    path_compressed_nodes: 1,
  },
  action_id: "ccccccc2-cccc-cccc-cccc-cccccccccccc",
};

export const FIXTURE_RESOLVE_DISPUTE_RESPONSE = {
  item_kind: "attribute" as const,
  decision: "prefer_one" as const,
  items: [
    {
      item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      resulting_status: "deleted" as const,
      valid_from: "2026-01-10",
      valid_to: null,
    },
    {
      item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc",
      resulting_status: "active" as const,
      valid_from: "2026-01-10",
      valid_to: null,
    },
  ],
  action_id: "ccccccc3-cccc-cccc-cccc-cccccccccccc",
};

export const FIXTURE_ITEM_ACTION_RESPONSE = {
  item_kind: "attribute" as const,
  item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  resulting_status: "active" as const,
  action_id: "ccccccc4-cccc-cccc-cccc-cccccccccccc",
};

export const FIXTURE_CORRECT_ITEM_RESPONSE = {
  item_kind: "attribute" as const,
  predecessor_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  new_item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd",
  action_id: "ccccccc5-cccc-cccc-cccc-cccccccccccc",
};

export const FIXTURE_PROVENANCE_RESPONSE = {
  fragments: [
    {
      id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      text: "Maria Oliveira coordenara a implantacao do Projeto Apollo.",
      confidence: 0.92,
      status: "accepted",
      chunks: [
        {
          id: "cc1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
          chunk_index: 0,
          offset_start: 0,
          offset_end: 1742,
          excerpt: "Aos onze dias do mes de junho de 2026, reuniram-se ...",
          locator: { page: 1 },
          raw_information: {
            id: "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
            source_type: "ata",
            received_at: "2026-06-11T18:30:00Z",
            metadata: {
              title: "Ata da reuniao Apollo",
              document_date: "2026-06-11",
            },
          },
        },
      ],
    },
  ],
};

export const FIXTURE_ACCEPTED_FRAGMENT_LIST = {
  total: 1,
  limit: 20,
  offset: 0,
  items: [
    {
      fragment_id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      text: "O go-live do Projeto Apollo passa para 16/07/2026 conforme errata.",
      confidence: 0.92,
      llm_run_id: "11111111-1111-1111-1111-111111111111",
      created_at: "2026-06-11T18:31:14Z",
      source: {
        raw_information_id: "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        chunk_index: 0,
        source_type: "ata",
        received_at: "2026-06-11T18:30:00Z",
        document_title: "Ata da reuniao Apollo (errata)",
      },
    },
  ],
};

export const FIXTURE_NODE_DETAIL = {
  node: {
    id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
    node_type: "Project",
    canonical_name: "Projeto Apollo",
    status: "active" as const,
    merged_into_node_id: null,
  },
  aliases: [
    {
      id: "8a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      alias: "Projeto Apollo",
      kind: "canonical" as const,
      created_at: "2026-06-11T18:42:00Z",
    },
  ],
  attributes: [
    {
      id: "a11c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      attribute_key: "deadline",
      value_type: "date" as const,
      value: "2026-07-15",
      valid_from: "2026-01-10",
      valid_to: null,
      recorded_at: "2026-06-11T18:42:00Z",
      superseded_at: null,
      status: "active" as const,
      effective_status: "active" as const,
      is_current: true,
      is_in_effect: true,
      confidence: 0.92,
      valid_from_source: "document" as const,
      flags: [],
      supersedes_attribute_id: null,
      provenance: [],
    },
  ],
};

export const FIXTURE_LINK_HISTORY = {
  versions: [
    {
      id: "ddddddd1-dddd-dddd-dddd-dddddddddddd",
      source_node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      target_node_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      link_type: "participates_in",
      link_inverse_name: "has_participant",
      valid_from: "2026-01-10",
      valid_to: null,
      recorded_at: "2026-06-11T18:42:00Z",
      superseded_at: null,
      status: "active" as const,
      effective_status: "active" as const,
      is_current: true,
      is_in_effect: true,
      confidence: 0.92,
      valid_from_source: "document" as const,
      supersedes_link_id: null,
    },
  ],
};

export const FIXTURE_ATTRIBUTE_HISTORY = {
  versions: [FIXTURE_NODE_DETAIL.attributes[0]],
};

/* ------------------------------------------------------------------ *
 * Response builders                                                   *
 * ------------------------------------------------------------------ */

/** Build a 2xx JSON Response with a bare body (curation REST, no envelope). */
export function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build a 2xx JSON Response wrapped in the standard envelope (KG / QR). */
export function mockOkEnvelope(result: unknown, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, result }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build an error JSON Response with the standard error envelope.
 *
 *  - For curation REST: status >= 400, body `{ error: { code, message, details? } }`.
 *  - For KG / QR: status >= 400, body `{ ok: false, error: {...} }`.
 *
 *  The two shapes are interoperable (the inner `error` object is identical).
 *  We emit the KG/QR shape (`ok: false`) by default — it includes the
 *  curation shape as a subset, and `lib/http.ts` only looks at `error.code`. */
export function mockError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Response {
  const body =
    details !== undefined
      ? { ok: false, error: { code, message, details } }
      : { ok: false, error: { code, message } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* ------------------------------------------------------------------ *
 * Route table — register one handler per (method, urlPattern) pair.    *
 * ------------------------------------------------------------------ */

export type HandlerFn = (url: URL, method: string) => Response | Promise<Response>;

export interface HandlerEntry {
  readonly method: string;
  readonly pattern: RegExp;
  readonly fn: HandlerFn;
}

class HandlerRegistry {
  private entries: HandlerEntry[] = [];

  /** Reset to the default happy-path handler set. */
  reset(): void {
    this.entries = [...DEFAULT_HANDLERS];
  }

  /** Add or replace a handler. Later additions win over earlier ones. */
  set(method: string, pattern: RegExp, fn: HandlerFn): void {
    this.entries.unshift({ method: method.toUpperCase(), pattern, fn });
  }

  /** Resolve a request to a response. Throws if no handler matches. */
  async dispatch(url: string, method: string): Promise<Response> {
    const u = new URL(url, "https://stub.local");
    const m = method.toUpperCase();
    for (const entry of this.entries) {
      if (entry.method !== m) continue;
      if (!entry.pattern.test(u.pathname)) continue;
      return entry.fn(u, m);
    }
    throw new Error(
      `[curation handlers] no handler for ${m} ${u.pathname}`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Default happy-path handler set                                      *
 * ------------------------------------------------------------------ */

const DEFAULT_HANDLERS: HandlerEntry[] = [
  // Curation REST — bare body on 2xx.
  {
    method: "GET",
    pattern: /^\/api\/v1\/curation\/queue\/?$/,
    fn: () => mockResponse(FIXTURE_REVIEW_QUEUE_LIST),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/curation\/metrics\/?$/,
    fn: () => mockResponse(FIXTURE_CURATION_METRICS),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/entity-matches\/[^/]+\/resolve\/?$/,
    fn: () => mockResponse(FIXTURE_RESOLVE_ENTITY_MATCH_RESPONSE),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/nodes\/merge\/?$/,
    fn: () => mockResponse(FIXTURE_MERGE_NODES_RESPONSE),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/disputes\/resolve\/?$/,
    fn: () => mockResponse(FIXTURE_RESOLVE_DISPUTE_RESPONSE),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/items\/confirm\/?$/,
    fn: () => mockResponse(FIXTURE_ITEM_ACTION_RESPONSE),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/items\/reject\/?$/,
    fn: () => mockResponse(FIXTURE_ITEM_ACTION_RESPONSE),
  },
  {
    method: "POST",
    pattern: /^\/api\/v1\/curation\/items\/correct\/?$/,
    fn: () => mockResponse(FIXTURE_CORRECT_ITEM_RESPONSE),
  },

  // Query-retrieval REST — enveloped.
  {
    method: "GET",
    pattern: /^\/api\/v1\/provenance\/links\/[^/]+\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_PROVENANCE_RESPONSE),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/provenance\/attributes\/[^/]+\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_PROVENANCE_RESPONSE),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/provenance\/fragments\/[^/]+\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_PROVENANCE_RESPONSE),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/fragments\/accepted\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_ACCEPTED_FRAGMENT_LIST),
  },

  // Knowledge-graph REST — enveloped.
  {
    method: "GET",
    pattern: /^\/api\/v1\/nodes\/[^/]+\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_NODE_DETAIL),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/links\/[^/]+\/history\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_LINK_HISTORY),
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/attributes\/[^/]+\/history\/?$/,
    fn: () => mockOkEnvelope(FIXTURE_ATTRIBUTE_HISTORY),
  },
];

/** Singleton — reset before each test that imports it. */
export const handlers = new HandlerRegistry();
handlers.reset();

/* ------------------------------------------------------------------ *
 * Convenience error builders for the most common spec error codes     *
 * ------------------------------------------------------------------ */

export const errorBuilders = {
  reviewNotPending: () =>
    mockError(
      409,
      "BUSINESS_REVIEW_NOT_PENDING",
      "Node is not in `needs_review` state",
      { node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001" },
    ),
  itemNotDisputed: () =>
    mockError(
      409,
      "BUSINESS_ITEM_NOT_DISPUTED",
      "All items must be in status=disputed",
    ),
  nodeDeleted: () =>
    mockError(410, "BUSINESS_NODE_DELETED", "KnowledgeNode is marked as deleted"),
  rawDeleted: () =>
    mockError(
      410,
      "BUSINESS_RAW_INFORMATION_DELETED",
      "underlying RawInformation was deleted by compliance_delete",
    ),
  resourceNotFound: () =>
    mockError(404, "RESOURCE_NOT_FOUND", "Item not found"),
  reasonRequired: () =>
    mockError(
      422,
      "BUSINESS_REASON_REQUIRED",
      "reason is required for destructive decisions",
    ),
  targetRequired: () =>
    mockError(
      422,
      "BUSINESS_TARGET_NODE_REQUIRED",
      "decision=merge_into requires target_node_id",
    ),
  dateUnjustified: () =>
    mockError(
      422,
      "BUSINESS_DATE_UNJUSTIFIED",
      "valid_from change requires a justification (stated|document|received) per section 6.5",
    ),
};
