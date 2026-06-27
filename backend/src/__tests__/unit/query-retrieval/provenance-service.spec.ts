// Unit tests for the provenance walk service — BR-16 / BR-17 / BR-18 / BR-19.
//
// The precedence is pinned here so future refactors cannot accidentally
// switch the order of the checks:
//   1. anchor row missing             -> RESOURCE_NOT_FOUND (404)
//   2. fragment anchor non-accepted   -> BUSINESS_FRAGMENT_NOT_ACCEPTED (404)
//   3. any underlying raw tombstoned  -> BUSINESS_RAW_INFORMATION_DELETED (410)
//   4. chain assembled but empty      -> SYSTEM_INTERNAL_ERROR (500) + WARN log
//   5. else                           -> 200 ProvenanceResponse

import { describe, expect, it } from "vitest";
import pino from "pino";

import {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  RawInformationDeletedError,
} from "../../../modules/query-retrieval/service/errors.js";
import { ResourceNotFoundError } from "../../../modules/knowledge-graph/service/errors.js";
import {
  getProvenanceByFragmentService,
  getProvenanceByLinkService,
} from "../../../modules/query-retrieval/service/provenance.service.js";

const silentLogger = pino({ level: "silent" });

function buildFakeClient(
  responder: (sql: string, params: unknown[]) => { rows: unknown[]; rowCount: number }
): import("pg").PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []) =>
      responder(String(sql), params),
    release: () => {},
  } as unknown as import("pg").PoolClient;
}

describe("getProvenanceByLinkService — BR-16 (404 when link absent)", () => {
  it("throws ResourceNotFoundError when the link does not exist", async () => {
    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM knowledge_link") && sql.includes("EXISTS")) {
        return { rows: [{ exists: false }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      getProvenanceByLinkService(
        client,
        "99999999-9999-9999-9999-999999999999",
        silentLogger
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe("getProvenanceByLinkService — BR-17 (410 on tombstoned raw)", () => {
  it("throws RawInformationDeletedError when the chain reaches a tombstoned raw", async () => {
    const rawId = "11111111-1111-1111-1111-111111111111";
    const deletedAt = new Date("2026-05-14T12:01:00Z");

    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM knowledge_link") && sql.includes("EXISTS")) {
        return { rows: [{ exists: true }], rowCount: 1 };
      }
      if (sql.includes("FROM provenance p") && sql.includes("p.link_id")) {
        return {
          rows: [
            {
              fragment_id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
              fragment_text: "Some text",
              fragment_confidence: 0.9,
              fragment_status: "accepted",
              raw_chunk_id: "cc1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
              chunk_index: 0,
              offset_start: 0,
              offset_end: 10,
              excerpt: "Some text",
              locator: null,
              raw_information_id: rawId,
              source_type: "ata",
              received_at: new Date(),
              metadata: {},
              original_input: null,
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.includes("FROM compliance_deletion")) {
        return {
          rows: [{ raw_information_id: rawId, performed_at: deletedAt }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      getProvenanceByLinkService(
        client,
        "12345678-1234-1234-1234-123456789012",
        silentLogger
      )
    ).rejects.toMatchObject({
      code: "BUSINESS_RAW_INFORMATION_DELETED",
      rawInformationId: rawId,
    });
  });
});

describe("getProvenanceByLinkService — BR-19 (500 on empty chain)", () => {
  it("throws EmptyProvenanceError when the chain is empty on an existing anchor", async () => {
    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM knowledge_link") && sql.includes("EXISTS")) {
        return { rows: [{ exists: true }], rowCount: 1 };
      }
      if (sql.includes("FROM provenance p")) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("FROM compliance_deletion")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      getProvenanceByLinkService(
        client,
        "12345678-1234-1234-1234-123456789012",
        silentLogger
      )
    ).rejects.toBeInstanceOf(EmptyProvenanceError);
  });
});

describe("getProvenanceByFragmentService — BR-16 (404 BUSINESS_FRAGMENT_NOT_ACCEPTED)", () => {
  it("throws FragmentNotAcceptedError when the fragment status != accepted", async () => {
    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM information_fragment") && sql.includes("WHERE id = $1")) {
        return {
          rows: [
            {
              id: "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
              status: "rejected",
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      getProvenanceByFragmentService(
        client,
        "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        silentLogger
      )
    ).rejects.toMatchObject({
      code: "BUSINESS_FRAGMENT_NOT_ACCEPTED",
      status: "rejected",
    });
  });

  it("throws ResourceNotFoundError when the fragment id is unknown", async () => {
    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM information_fragment") && sql.includes("WHERE id = $1")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      getProvenanceByFragmentService(
        client,
        "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        silentLogger
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe("getProvenanceByFragmentService — original_input round-trip (v1.4.0)", () => {
  // WHY: the provenance walk now surfaces `raw_information.original_input`
  // (verbatim chat turn) so the SPA can render the operator's pristine text
  // in the provenance chain. Two invariants are pinned here so a refactor
  // that drops the SELECT column or the mapping step fails loudly.

  it("returns original_input = null when the raw row has no captured turn", async () => {
    const fragmentId = "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0010";
    const chunkId = "cc1c1e2f-0e57-4d3f-99b1-1d22ce5e0010";
    const rawId = "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0010";

    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM information_fragment") && sql.includes("WHERE id = $1")) {
        return { rows: [{ id: fragmentId, status: "accepted" }], rowCount: 1 };
      }
      if (sql.includes("FROM information_fragment f") && sql.includes("JOIN fragment_source")) {
        return {
          rows: [
            {
              fragment_id: fragmentId,
              fragment_text: "Some text",
              fragment_confidence: 0.9,
              fragment_status: "accepted",
              raw_chunk_id: chunkId,
              chunk_index: 0,
              offset_start: 0,
              offset_end: 9,
              excerpt: "Some text",
              locator: null,
              raw_information_id: rawId,
              source_type: "ata",
              received_at: new Date("2026-06-11T18:30:00Z"),
              metadata: {},
              original_input: null,
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.includes("FROM compliance_deletion")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    const body = await getProvenanceByFragmentService(
      client,
      fragmentId,
      silentLogger
    );

    expect(body.fragments[0]?.chunks[0]?.raw_information.original_input).toBeNull();
  });

  it("returns original_input = verbatim text when the raw row was captured from chat", async () => {
    const fragmentId = "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0011";
    const chunkId = "cc1c1e2f-0e57-4d3f-99b1-1d22ce5e0011";
    const rawId = "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0011";
    const verbatim = "Cria o projeto Acompanahr";

    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM information_fragment") && sql.includes("WHERE id = $1")) {
        return { rows: [{ id: fragmentId, status: "accepted" }], rowCount: 1 };
      }
      if (sql.includes("FROM information_fragment f") && sql.includes("JOIN fragment_source")) {
        return {
          rows: [
            {
              fragment_id: fragmentId,
              fragment_text: "Acompanhar projeto",
              fragment_confidence: 0.91,
              fragment_status: "accepted",
              raw_chunk_id: chunkId,
              chunk_index: 0,
              offset_start: 0,
              offset_end: 26,
              excerpt: "Acompanhar projeto",
              locator: null,
              raw_information_id: rawId,
              source_type: "chat",
              received_at: new Date("2026-06-11T18:30:00Z"),
              metadata: { conversation_id: "c1", message_id: "m1" },
              original_input: verbatim,
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.includes("FROM compliance_deletion")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    const body = await getProvenanceByFragmentService(
      client,
      fragmentId,
      silentLogger
    );

    // Pin BOTH the verbatim survival (typo `Acompanahr` not silently
    // normalised) AND the source_type carries the chat marker.
    expect(body.fragments[0]?.chunks[0]?.raw_information.original_input).toBe(
      verbatim
    );
    expect(body.fragments[0]?.chunks[0]?.raw_information.source_type).toBe(
      "chat"
    );
  });
});

describe("getProvenanceByFragmentService — 200 (successful chain)", () => {
  it("returns a non-empty fragments[] with chunks[] on the happy path", async () => {
    const fragmentId = "ff1c1e2f-0e57-4d3f-99b1-1d22ce5e0001";
    const chunkId = "cc1c1e2f-0e57-4d3f-99b1-1d22ce5e0001";
    const rawId = "7a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001";

    const client = buildFakeClient((sql) => {
      if (sql.includes("FROM information_fragment") && sql.includes("WHERE id = $1")) {
        return { rows: [{ id: fragmentId, status: "accepted" }], rowCount: 1 };
      }
      if (sql.includes("FROM information_fragment f") && sql.includes("JOIN fragment_source")) {
        return {
          rows: [
            {
              fragment_id: fragmentId,
              fragment_text: "Maria Oliveira coordena Apollo.",
              fragment_confidence: 0.92,
              fragment_status: "accepted",
              raw_chunk_id: chunkId,
              chunk_index: 0,
              offset_start: 0,
              offset_end: 31,
              excerpt: "Maria Oliveira coordena Apollo.",
              locator: { page: 1 },
              raw_information_id: rawId,
              source_type: "ata",
              received_at: new Date("2026-06-11T18:30:00Z"),
              metadata: { title: "Ata Apollo" },
              original_input: null,
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.includes("FROM compliance_deletion")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    const body = await getProvenanceByFragmentService(
      client,
      fragmentId,
      silentLogger
    );

    expect(body.fragments.length).toBe(1);
    expect(body.fragments[0]?.id).toBe(fragmentId);
    expect(body.fragments[0]?.status).toBe("accepted");
    expect(body.fragments[0]?.chunks.length).toBe(1);
    expect(body.fragments[0]?.chunks[0]?.id).toBe(chunkId);
    expect(body.fragments[0]?.chunks[0]?.raw_information.id).toBe(rawId);
    expect(body.fragments[0]?.chunks[0]?.raw_information.metadata).toEqual({
      title: "Ata Apollo",
    });
  });
});
