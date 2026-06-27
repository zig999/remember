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
-- ESCOPO: este script APENAS trunca as tabelas abaixo. Repopular a ontologia
--    (seeds) e reiniciar o BFF são passos separados, de responsabilidade do
--    operador — fora do escopo deste arquivo.
--
-- (Se quiser apagar SÓ os dados e manter a ontologia, use
--  ops/truncate_ingested_data.sql.)
-- ============================================================================

TRUNCATE
  -- dados ingeridos / derivados + histórico de chat (18)
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
  -- chat (subgrafo isolado; não alcançado por CASCADE a partir das tabelas acima)
  chat_graph_view,
  chat_tool_call,
  chat_message,
  chat_conversation,
  -- ONTOLOGIA / catálogo (5)
  attribute_valid_value,
  attribute_key,
  link_type_rule,
  link_type,
  node_type
  RESTART IDENTITY CASCADE;
