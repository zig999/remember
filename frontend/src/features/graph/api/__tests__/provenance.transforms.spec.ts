/**
 * Phase A/C provenance transforms — unit tests (dev_tc_001).
 *
 * What these tests pin (Golden Rule 9):
 *  - Confidence percent formatting is the contract the panel uses to render
 *    the "92%" label on inline + lazy provenance entries. A regression that
 *    flips to a decimal display would silently misinform the user.
 *  - `received_at` is a full ISO instant in Phase A (date-only label) and in
 *    Phase C (date + time label). The two formatters must remain consistent
 *    — both pt-BR.
 *  - The lazy `ProvenanceResponse` shape rendered by Phase C carries
 *    `chunk_index`, `offset_start–offset_end`, `excerpt`, source_type,
 *    received_at, metadata.title, metadata.document_date — each transform
 *    must surface them in the camelCase shape the components expect.
 */
import { describe, expect, it } from "vitest";

import {
  formatConfidenceLabel,
  formatReceivedAtLabel,
  toProvenanceEntryView,
} from "../_transforms";
import {
  formatReceivedAtDateTime,
  toProvenanceResponse,
} from "../provenance.transforms";
import type {
  ProvenanceEntryWire,
} from "../node-detail.types";
import type {
  ProvenanceResponseWire,
} from "../provenance.types";

describe("formatConfidenceLabel", () => {
  it("formats 0.92 as '92%' (integer percent, no decimals)", () => {
    expect(formatConfidenceLabel(0.92)).toBe("92%");
  });

  it("rounds 0.925 → '93%' (math.round half-up)", () => {
    expect(formatConfidenceLabel(0.925)).toBe("93%");
  });

  it("returns null for undefined / null / NaN (spec — no false 0%)", () => {
    expect(formatConfidenceLabel(undefined)).toBeNull();
    expect(formatConfidenceLabel(null)).toBeNull();
    expect(formatConfidenceLabel(Number.NaN)).toBeNull();
  });
});

describe("formatReceivedAtLabel (Phase A — DD/MM/YYYY)", () => {
  it("formats an ISO instant to pt-BR date label", () => {
    const out = formatReceivedAtLabel("2026-06-11T18:30:00Z");
    // pt-BR DD/MM/YYYY — exact day may shift by ±1 in TZ-shifted CI environments
    // but the format pattern (two digits / two digits / four digits) is stable.
    expect(out).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("returns null for undefined or null input", () => {
    expect(formatReceivedAtLabel(undefined)).toBeNull();
    expect(formatReceivedAtLabel(null)).toBeNull();
  });

  it("returns the raw string on parse failure (never throws)", () => {
    expect(formatReceivedAtLabel("not-a-date")).toBe("not-a-date");
  });
});

describe("toProvenanceEntryView (Phase A inline transform)", () => {
  const WIRE: ProvenanceEntryWire = {
    fragment_id: "frag-1",
    fragment_text: "Maria coordenara o Apollo.",
    confidence: 0.87,
    raw_information_id: "raw-1",
    source_type: "ata",
    received_at: "2026-06-11T18:30:00Z",
    excerpt: "...Maria coordenara...",
  };

  it("maps every wire field into the camelCase surface shape", () => {
    const v = toProvenanceEntryView(WIRE);
    expect(v.fragmentId).toBe("frag-1");
    expect(v.fragmentText).toBe("Maria coordenara o Apollo.");
    expect(v.confidence).toBe(0.87);
    expect(v.confidenceLabel).toBe("87%");
    expect(v.rawInformationId).toBe("raw-1");
    expect(v.sourceType).toBe("ata");
    expect(v.receivedAtLabel).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(v.excerpt).toContain("Maria");
  });

  it("defaults missing optional fields to null (no `undefined` leaks)", () => {
    const v = toProvenanceEntryView({
      fragment_id: "frag-2",
      fragment_text: "Texto.",
    });
    expect(v.confidence).toBeNull();
    expect(v.confidenceLabel).toBeNull();
    expect(v.rawInformationId).toBeNull();
    expect(v.sourceType).toBeNull();
    expect(v.receivedAtLabel).toBeNull();
    expect(v.excerpt).toBeNull();
  });
});

describe("formatReceivedAtDateTime (Phase C — DD/MM/YYYY HH:mm)", () => {
  it("formats an ISO instant to pt-BR date + time", () => {
    const out = formatReceivedAtDateTime("2026-06-11T18:30:00Z");
    // pt-BR short dateStyle (`DD/MM/YYYY`) + short timeStyle (`HH:mm`).
    expect(out).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });

  it("returns the raw string on parse failure (defensive)", () => {
    expect(formatReceivedAtDateTime("xyz")).toBe("xyz");
  });
});

describe("toProvenanceResponse (Phase C — full chain transform)", () => {
  const WIRE: ProvenanceResponseWire = {
    fragments: [
      {
        id: "frag-1",
        text: "O go-live ocorrera em 15/07.",
        confidence: 0.91,
        status: "accepted",
        chunks: [
          {
            id: "chunk-1",
            chunk_index: 3,
            offset_start: 100,
            offset_end: 200,
            excerpt: "...trecho...",
            locator: { page: 1 },
            raw_information: {
              id: "raw-1",
              source_type: "ata",
              received_at: "2026-06-11T18:30:00Z",
              metadata: { title: "Ata 1", document_date: "2026-06-11" },
            },
          },
        ],
      },
    ],
  };

  it("maps fragments + chunks + raw_information into the surface shape", () => {
    const r = toProvenanceResponse(WIRE);
    expect(r.fragments).toHaveLength(1);
    const f = r.fragments[0]!;
    expect(f.id).toBe("frag-1");
    expect(f.confidenceLabel).toBe("91%");
    expect(f.chunks).toHaveLength(1);
    const c = f.chunks[0]!;
    expect(c.chunkIndex).toBe(3);
    expect(c.offsetRangeLabel).toBe("chars 100–200");
    expect(c.rawInformation.sourceType).toBe("ata");
    expect(c.rawInformation.title).toBe("Ata 1");
    // documentDate is YYYY-MM-DD → DD/MM/YYYY label.
    expect(c.rawInformation.documentDateLabel).toBe("11/06/2026");
    expect(c.rawInformation.receivedAtLabel).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("defaults metadata.title / document_date to null when absent", () => {
    const r = toProvenanceResponse({
      fragments: [
        {
          id: "f",
          text: "t",
          confidence: 0.5,
          status: "accepted",
          chunks: [
            {
              id: "c",
              chunk_index: 0,
              offset_start: 0,
              offset_end: 10,
              excerpt: "x",
              raw_information: {
                id: "r",
                source_type: "outro",
                received_at: "2026-06-11T18:30:00Z",
              },
            },
          ],
        },
      ],
    });
    const c = r.fragments[0]!.chunks[0]!;
    expect(c.rawInformation.title).toBeNull();
    expect(c.rawInformation.documentDateLabel).toBeNull();
    expect(c.locator).toEqual({});
  });
});
