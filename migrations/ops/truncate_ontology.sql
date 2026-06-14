-- ============================================================================
-- ops/truncate_ontology.sql — RESET TOTAL DA ONTOLOGIA (recriar do zero)
-- PostgreSQL 17 (Neon).
--
-- ⚠️ DESTRUTIVO (mais que o truncate_ingested_data) — apaga a ONTOLOGIA inteira
--    (catálogo) E, OBRIGATORIAMENTE, todos os dados ingeridos que a referenciam.
--    NÃO é parte do bootstrap (vive em ops/). Rodar APENAS sob demanda e com
--    APROVAÇÃO EXPLÍCITA do dono (Safety Rule do CLAUDE.md).
--
-- POR QUE APAGA OS DADOS TAMBÉM: knowledge_node→node_type, node_attribute→
--    attribute_key, knowledge_link→link_type etc. apontam para ids do catálogo.
--    Recriar a ontologia gera ids novos; manter dados antigos deixaria FKs
--    inválidas. Logo, "recriar a ontologia do zero" implica um reset completo.
--
-- USO TÍPICO:
--   1) rodar este script;
--   2) rodar `0001_seed.sql` (re-popular a ontologia — é idempotente);
--   3) RESTART do BFF (recarrega o CatalogSnapshot);
--   4) re-ingerir os dados, se desejado.
--
-- (Se quiser apagar SÓ os dados e manter a ontologia, use
--  ops/truncate_ingested_data.sql.)
-- ============================================================================

TRUNCATE
  -- dados ingeridos / derivados (14)
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
  raw_information,
  -- ONTOLOGIA / catálogo (5)
  attribute_valid_value,
  attribute_key,
  link_type_rule,
  link_type,
  node_type
  RESTART IDENTITY CASCADE;
