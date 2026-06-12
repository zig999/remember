// TC-02 acceptance criteria covered:
//  - "Vitest: chunkV1 is deterministic (same input twice = identical output)"
//  - "Vitest: offsets use code-point counting for multi-byte Unicode characters"
//  - "Chunker correctly handles all source types listed by BR-06"
//
// Strategy: unit tests against `chunkV1` only — no DB, no Fastify. Synthetic
// inputs exercise the BR-03 determinism, the BR-05 code-point offsets, and
// the BR-06 source-type hard boundaries.

import { describe, expect, it } from "vitest";

import { CHUNK_HARD_MAX, CHUNKING_VERSION } from "../../../modules/ingestion/chunker/config.js";
import { chunkV1, type SourceType } from "../../../modules/ingestion/chunker/v1.js";

describe("chunkV1 — determinism (BR-03)", () => {
  it("produces identical output across two invocations with the same input", () => {
    const content = "Reunião do Projeto Apollo realizada em 2026-06-11. Participantes: João e Maria.";
    const a = chunkV1(content, "ata");
    const b = chunkV1(content, "ata");
    expect(a).toEqual(b);
    // Defensive: at least one chunk for non-empty content.
    expect(a.length).toBeGreaterThan(0);
  });

  it("is deterministic for a multi-block PDF input", () => {
    const content = "página 1 conteúdo\fpágina 2 conteúdo\fpágina 3 conteúdo";
    const a = chunkV1(content, "pdf");
    const b = chunkV1(content, "pdf");
    expect(a).toEqual(b);
    expect(a.length).toBe(3);
  });

  it("each emitted chunk declares chunking_version === 'v1' (BR-04)", () => {
    const chunks = chunkV1("conteúdo simples", "ata");
    for (const c of chunks) {
      expect(c.chunking_version).toBe(CHUNKING_VERSION);
    }
  });
});

describe("chunkV1 — code-point offsets (BR-05)", () => {
  it("counts emoji as one position (Unicode code points, not UTF-16 units)", () => {
    // 🙂 is U+1F642 — outside the BMP, encoded as a surrogate pair in UTF-16
    // (length 2 in `string.length`). Our offsets must treat it as 1 position.
    const content = "Olá 🙂 mundo.";
    const chunks = chunkV1(content, "ata");
    expect(chunks.length).toBe(1);
    const c = chunks[0]!;
    expect(c.offset_start).toBe(0);
    // Code points: "O","l","á"," ","🙂"," ","m","u","n","d","o","." = 12 cps.
    expect(c.offset_end).toBe(12);
    expect(c.text).toBe(content);
  });

  it("counts accented characters as one position each", () => {
    const content = "ação é café";
    const chunks = chunkV1(content, "ata");
    expect(chunks.length).toBe(1);
    const c = chunks[0]!;
    expect(c.offset_start).toBe(0);
    expect(c.offset_end).toBe([...content].length);
    expect(c.offset_end).toBe(11);
  });

  it("offset_end equals total code-point count for single-chunk inputs", () => {
    const content = "Tom Müller anunciou a sucessão na 中文 conferência.";
    const chunks = chunkV1(content, "artigo");
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.offset_end).toBe([...content].length);
  });

  it("text field is the verbatim slice between offset_start and offset_end", () => {
    const content = "página A\fpágina B com emoji 🙂\fpágina C final";
    const chunks = chunkV1(content, "pdf");
    expect(chunks.length).toBe(3);
    const reconstruct = (cs: typeof chunks): string => {
      const cps: string[] = [];
      for (const c of cs) {
        for (const ch of c.text) cps.push(ch);
      }
      // We cannot necessarily reconstruct the original because we dropped the
      // form-feed boundaries. But each chunk's text MUST match the slice of
      // the original between its offsets.
      void cps;
      return "";
    };
    void reconstruct;
    const original = [...content];
    for (const c of chunks) {
      const slice = original.slice(c.offset_start, c.offset_end).join("");
      expect(c.text).toBe(slice);
    }
  });
});

describe("chunkV1 — hard boundaries by source_type (BR-06)", () => {
  it("`pdf`: splits on form-feed (U+000C)", () => {
    const content = "página 1\fpágina 2\fpágina 3";
    const chunks = chunkV1(content, "pdf");
    expect(chunks.length).toBe(3);
    expect(chunks[0]!.text).toBe("página 1");
    expect(chunks[1]!.text).toBe("página 2");
    expect(chunks[2]!.text).toBe("página 3");
    // chunk_index ascending, contiguous from 0.
    expect(chunks.map((c) => c.chunk_index)).toEqual([0, 1, 2]);
  });

  it("`email`: splits at the header/body boundary (first blank line)", () => {
    const content = "From: a@example\nTo: b@example\nSubject: Olá\n\nMensagem do corpo, linha 1.\nLinha 2.";
    const chunks = chunkV1(content, "email");
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // Headers chunk contains the From/To/Subject lines.
    expect(chunks[0]!.text).toContain("From: a@example");
    expect(chunks[0]!.text).toContain("Subject: Olá");
    // Body chunk contains the body.
    const tail = chunks[chunks.length - 1]!;
    expect(tail.text).toContain("Mensagem do corpo");
  });

  it("`chat`: starts a new chunk on each speaker line", () => {
    const content = "João: Bom dia.\nMaria: Bom dia para você também.\nJoão: Vamos começar?";
    const chunks = chunkV1(content, "chat");
    expect(chunks.length).toBe(3);
    expect(chunks[0]!.text.startsWith("João:")).toBe(true);
    expect(chunks[1]!.text.startsWith("Maria:")).toBe(true);
    expect(chunks[2]!.text.startsWith("João:")).toBe(true);
  });

  it("`transcricao`: treats bracketed timestamp + speaker as a new turn", () => {
    const content = "[00:01] João: abertura da pauta.\n[00:15] Maria: comentário rápido.\n[00:30] João: fechamento.";
    const chunks = chunkV1(content, "transcricao");
    expect(chunks.length).toBe(3);
  });

  it("`ata`, `artigo`, `outro`: no hard boundary — single chunk under CHUNK_HARD_MAX", () => {
    const content = "Texto médio sem boundaries. Linha 1.\nLinha 2 segue.\nLinha 3 também.";
    for (const t of ["ata", "artigo", "outro"] satisfies SourceType[]) {
      const chunks = chunkV1(content, t);
      expect(chunks.length).toBe(1);
      expect(chunks[0]!.text).toBe(content);
    }
  });
});

describe("chunkV1 — oversize fallback (BR-07)", () => {
  it("splits a block above CHUNK_HARD_MAX into sentence-level chunks", () => {
    // Build a block that exceeds CHUNK_HARD_MAX (4000) by repeating a
    // sentence-terminated chunk many times.
    const sentence = "Esta é uma frase pequena terminada em ponto. ";
    let content = "";
    while ([...content].length < CHUNK_HARD_MAX + 200) {
      content += sentence;
    }
    const chunks = chunkV1(content, "ata");
    expect(chunks.length).toBeGreaterThan(1);
    // No emitted chunk can exceed CHUNK_HARD_MAX (modulo BR-07 carve-out for
    // a single mega-sentence — not exercised here because we used short ones).
    for (const c of chunks) {
      expect(c.offset_end - c.offset_start).toBeLessThanOrEqual(CHUNK_HARD_MAX);
    }
    // Sum of chunks must equal total code-point count.
    const total = chunks.reduce((acc, c) => acc + (c.offset_end - c.offset_start), 0);
    expect(total).toBe([...content].length);
  });

  it("preserves a moderate-size block (below CHUNK_HARD_MAX) as one chunk", () => {
    const content = "Uma frase apenas, curta. ".repeat(20); // ~500 chars
    const chunks = chunkV1(content, "ata");
    expect(chunks.length).toBe(1);
  });
});

describe("chunkV1 — degenerate inputs", () => {
  it("returns an empty array on an empty content (defensive — Zod blocks this upstream)", () => {
    expect(chunkV1("", "ata")).toEqual([]);
  });

  it("returns one chunk for content of length 1", () => {
    const chunks = chunkV1("X", "ata");
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.offset_start).toBe(0);
    expect(chunks[0]!.offset_end).toBe(1);
    expect(chunks[0]!.text).toBe("X");
  });
});
