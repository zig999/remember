/**
 * NodeDetailPanel — frozen pt-BR copy (TC-FE-08 + dev_tc_001).
 *
 * Single shared module so that the main panel and its progressive-disclosure
 * sub-components (`NodeAttributeRow`, `NodeRelationshipRow`,
 * `NodeProvenanceChain`) read from one source. CLAUDE.md `i18n: false` —
 * strings live directly here and tests import from this module rather than
 * duplicating literals.
 */

export const NODE_DETAIL_COPY = Object.freeze({
  loading: "Carregando detalhes…",
  errorNotFound: "Nó não encontrado.",
  errorDeleted: "Este nó foi removido por conformidade.",
  errorGeneric: "Não foi possível carregar os detalhes. Tente novamente.",
  retry: "Tentar novamente",
  close: "Fechar detalhes do nó",
  aliasesHeading: "Aliases",
  attributesHeading: "Atributos",
  attrColKey: "Atributo",
  attrColValue: "Valor",
  attrColState: "Estado",
  noAttributes: "Nenhum atributo registrado.",
  noAliases: "Nenhum alias adicional.",
  curate: "Curar",

  /* ---------- Phase A — inline attribute provenance ---------- */
  /** `<summary>` template for the inline attribute provenance disclosure. */
  attributeProvenanceSummary: (n: number) =>
    `Proveniência (${n} ${n === 1 ? "entrada" : "entradas"})`,

  /* ---------- Phase B — relationships section ---------- */
  relationshipsHeading: "Relações",
  relationshipsLoading: "Carregando relações…",
  relationshipsEmpty: "Nenhuma relação encontrada.",
  relationshipsError: "Não foi possível carregar as relações.",
  relationshipsRetry: "Tentar novamente",
  linkProvenanceSummary: (n: number) =>
    `Proveniência do link (${n} ${n === 1 ? "entrada" : "entradas"})`,
  directionOutgoingSr: "direção: destino",
  directionIncomingSr: "direção: origem",

  /* ---------- Phase C — lazy full origin ---------- */
  originSummary: "Ver origem completa",
  originLoading: "Carregando origem…",
  originError: "Não foi possível carregar a origem.",
  originNotFound: "Origem não encontrada.",
  originDeleted: "Documento original removido por conformidade.",
  originRetry: "Tentar novamente",

  /* ---------- Phase C — original_input capture (TC-04, v2.1) ---------- */
  /** `<summary>` label for the verbatim user-turn disclosure. */
  originalInputSummary: "Texto original do operador",
  /** Muted indicator shown when `original_input === '[REDACTED]'`. */
  originalInputRedacted: "Texto original redigido.",
  /** aria-label tied to the redaction indicator for screen readers. */
  originalInputRedactedAria: "Texto original redigido por conformidade.",
});

export type NodeDetailCopy = typeof NODE_DETAIL_COPY;
