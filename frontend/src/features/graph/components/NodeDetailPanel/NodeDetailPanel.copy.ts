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

  attributeProvenanceSummary: (n: number) =>
    `Proveniência (${n} ${n === 1 ? "entrada" : "entradas"})`,

  relationshipsHeading: "Relações",
  relationshipsLoading: "Carregando relações…",
  relationshipsEmpty: "Nenhuma relação encontrada.",
  relationshipsError: "Não foi possível carregar as relações.",
  relationshipsRetry: "Tentar novamente",
  linkProvenanceSummary: (n: number) =>
    `Proveniência do link (${n} ${n === 1 ? "entrada" : "entradas"})`,
  directionOutgoingSr: "direção: destino",
  directionIncomingSr: "direção: origem",

  originSummary: "Ver origem completa",
  originLoading: "Carregando origem…",
  originError: "Não foi possível carregar a origem.",
  originNotFound: "Origem não encontrada.",
  originDeleted: "Documento original removido por conformidade.",
  originRetry: "Tentar novamente",

  originalInputSummary: "Texto original do operador",
  originalInputRedacted: "Texto original redigido.",
  originalInputRedactedAria: "Texto original redigido por conformidade.",
});

export type NodeDetailCopy = typeof NODE_DETAIL_COPY;
