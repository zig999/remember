-- ============================================================================
-- ops/truncate_ingested_data.sql — RESET DOS DADOS INGERIDOS (mantém ontologia)
-- PostgreSQL 17 (Neon).
--
-- ⚠️ DESTRUTIVO — apaga TODOS os dados ingeridos/derivados. NÃO é parte do
--    bootstrap (por isso vive em ops/, fora da sequência numerada 0001…). Rodar
--    APENAS sob demanda e com APROVAÇÃO EXPLÍCITA do dono (Safety Rule do CLAUDE.md).
--
-- O QUE APAGA (18 tabelas): camada de origem, auditoria, extração, grafo
-- consolidado, proveniência, curadoria E o histórico de chat (conversas +
-- snapshots de grafo por conversa). O chat é um subgrafo de FK isolado — não é
-- alcançado pelo CASCADE a partir das tabelas de domínio (nada fora do chat o
-- referencia), por isso é listado explicitamente; do contrário sobreviveriam
-- conversas e snapshots (chat_graph_view.snapshot guarda ids de nó por valor,
-- sem FK) apontando para um grafo que acabou de ser apagado.
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
  raw_information,
  -- chat (subgrafo isolado; não alcançado por CASCADE a partir das tabelas acima)
  chat_graph_view,
  chat_tool_call,
  chat_message,
  chat_conversation
  RESTART IDENTITY CASCADE;
