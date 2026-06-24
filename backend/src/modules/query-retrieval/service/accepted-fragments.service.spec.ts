// Unit tests for `listAcceptedFragmentsService` (TC-be-002).
//
// The service is a thin wrapper around two repository functions. The tests
// stub the repository via a fake PoolClient that pattern-matches on SQL text
// (the same testing approach used elsewhere in this module).

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import type { PoolClient } from "pg";

import {
  listAcceptedFragmentsService,
  type ListAcceptedFragmentsInput,
} from "./accepted-fragments.service.js";

const silentLogger = pino({ level: "silent" });

interface FakeRow {
  fragment_id: string;
  fragment_text: string;
  fragment_confidence: string | number;
  fragment_llm_run_id: string;
  fragment_created_at: Date;
  raw_information_id: string;
  chunk_index: number;
  source_type: string;
  received_at: Date;
  document_title: string | null;
}

function buildFakeClient(opts: {
  total: number;
  rows: FakeRow[];
  onSelect?: (params: unknown[]) => void;
}): PoolClient {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      const text = String(sql);
      if (text.includes("COUNT(DISTINCT f.id)")) {
        return { rows: [{ total: opts.total }], rowCount: 1 };
      }
      if (text.includes("DISTINCT ON (f.id)")) {
        opts.onSelect?.(params);
        return { rows: opts.rows, rowCount: opts.rows.length };
      }
      return { rows: [], rowCount: 0 };
    }),
    release: () => undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("listAcceptedFragmentsService", () => {
  // Encodes WHY: when no rows match, the contract requires an empty list (not
  // null) with the requested pagination echoed back so the SPA can render the
  // empty state without re-deriving the page.
  it("returns an empty page with total=0 when no fragments match", async () => {
    const client = buildFakeClient({ total: 0, rows: [] });
    const input: ListAcceptedFragmentsInput = {
      raw_information_id: "11111111-1111-1111-1111-111111111111",
      limit: 20,
      offset: 0,
    };

    const result = await listAcceptedFragmentsService(client, input, silentLogger);

    expect(result).toEqual({
      total: 0,
      limit: 20,
      offset: 0,
      items: [],
    });
    // Skips the page query when total=0 (one DB roundtrip saved per empty filter).
    expect(
      (client.query as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBe(1);
  });

  // Encodes WHY: confidence is stored as numeric (pg returns string) — the
  // wire schema demands `number`. Date columns must serialise as ISO-8601
  // because the OpenAPI declares `format: date-time`.
  it("maps a fragment row to the wire shape (confidence as number, dates as ISO-8601)", async () => {
    const createdAt = new Date("2026-06-11T18:31:14Z");
    const receivedAt = new Date("2026-06-11T18:30:00Z");
    const row: FakeRow = {
      fragment_id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      fragment_text: "Apollo errata 16/07/2026.",
      fragment_confidence: "0.92", // string — as pg returns numeric
      fragment_llm_run_id: "22222222-2222-2222-2222-222222222222",
      fragment_created_at: createdAt,
      raw_information_id: "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      chunk_index: 0,
      source_type: "ata",
      received_at: receivedAt,
      document_title: "Ata Apollo",
    };
    const client = buildFakeClient({ total: 1, rows: [row] });

    const result = await listAcceptedFragmentsService(
      client,
      {
        llm_run_id: "22222222-2222-2222-2222-222222222222",
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
    const item = result.items[0]!;
    expect(item.fragment_id).toBe(row.fragment_id);
    expect(item.text).toBe(row.fragment_text);
    expect(item.confidence).toBe(0.92);
    expect(typeof item.confidence).toBe("number");
    expect(item.llm_run_id).toBe(row.fragment_llm_run_id);
    expect(item.created_at).toBe("2026-06-11T18:31:14.000Z");
    expect(item.source).toEqual({
      raw_information_id: row.raw_information_id,
      chunk_index: 0,
      source_type: "ata",
      received_at: "2026-06-11T18:30:00.000Z",
      document_title: "Ata Apollo",
    });
  });

  // Encodes WHY: nullable `document_title` is allowed by openapi (the
  // metadata field can be absent). The SPA picker label degrades gracefully.
  it("preserves a null document_title", async () => {
    const row: FakeRow = {
      fragment_id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0002",
      fragment_text: "Sem titulo.",
      fragment_confidence: 0.5,
      fragment_llm_run_id: "33333333-3333-3333-3333-333333333333",
      fragment_created_at: new Date("2026-06-11T18:31:14Z"),
      raw_information_id: "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0002",
      chunk_index: 2,
      source_type: "email",
      received_at: new Date("2026-06-11T18:30:00Z"),
      document_title: null,
    };
    const client = buildFakeClient({ total: 1, rows: [row] });

    const result = await listAcceptedFragmentsService(
      client,
      {
        llm_run_id: "33333333-3333-3333-3333-333333333333",
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    expect(result.items[0]!.source.document_title).toBeNull();
  });

  // Encodes WHY: pagination parameters are forwarded VERBATIM to the page
  // query (positions 3/4 — `$3` LIMIT, `$4` OFFSET) and echoed back in the
  // response (so the SPA can construct the URL of the next page).
  it("forwards limit/offset to the page query and echoes them in the response", async () => {
    let capturedParams: unknown[] | undefined;
    const client = buildFakeClient({
      total: 5,
      rows: [],
      onSelect: (params) => {
        capturedParams = params;
      },
    });

    const result = await listAcceptedFragmentsService(
      client,
      {
        llm_run_id: "44444444-4444-4444-4444-444444444444",
        limit: 50,
        offset: 25,
      },
      silentLogger
    );

    expect(result.limit).toBe(50);
    expect(result.offset).toBe(25);
    expect(capturedParams?.[2]).toBe(50);
    expect(capturedParams?.[3]).toBe(25);
  });

  // Encodes WHY: when only one of the two filters is provided, the other
  // must be passed as SQL NULL (not the empty string, not undefined) so the
  // `($1::uuid IS NULL OR ...)` bridge becomes a no-op.
  it("passes a missing filter as null to the repository", async () => {
    let capturedParams: unknown[] | undefined;
    const client = buildFakeClient({
      total: 1,
      rows: [],
      onSelect: (params) => {
        capturedParams = params;
      },
    });

    await listAcceptedFragmentsService(
      client,
      {
        raw_information_id: "55555555-5555-5555-5555-555555555555",
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    expect(capturedParams?.[0]).toBeNull();
    expect(capturedParams?.[1]).toBe("55555555-5555-5555-5555-555555555555");
  });
});
