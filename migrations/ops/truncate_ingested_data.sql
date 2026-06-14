-- ============================================================================
-- ops/truncate_ingested_data.sql — RESET DOS DADOS INGERIDOS (mantém ontologia)
-- PostgreSQL 17 (Neon).
--
-- ⚠️ DESTRUTIVO — apaga TODOS os dados ingeridos/derivados. NÃO é parte do
--    bootstrap (por isso vive em ops/, fora da sequência numerada 0001…). Rodar
--    APENAS sob demanda e com APROVAÇÃO EXPLÍCITA do dono (Safety Rule do CLAUDE.md).
--
-- O QUE APAGA (14 tabelas): camada de origem, auditoria, extração, grafo
-- consolidado, proveniência e curadoria.
-- O QUE PRESERVA: a ONTOLOGIA / catálogo — node_type, link_type, link_type_rule,
--    attribute_key, attribute_valid_value (intactos).
--
-- CASCADE + RESTART IDENTITY: a ordem de FK é resolvida pelo CASCADE; os ids
-- seriais (se houver) reiniciam. Após este reset o catálogo continua válido —
-- pode-se ingerir de novo imediatamente.
-- ============================================================================

TRUNCATE
  provenance,
  fragment_source,
  node_attribute,
  knowledge_link,
  node_alias,
  knowledge_node,
  entity_match_review,
  curation_action,
  compliance_deletion,
  information_fragment,
  tool_call,
  llm_run,
  raw_chunk,
  raw_information
  RESTART IDENTITY CASCADE;
