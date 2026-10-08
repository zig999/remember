# Scope: entity-edit-backend

Escopo (verbatim do dono): a operação `edit-entity` do contexto `knowledge-base`, que o dono usa para editar os atributos de um nó de conhecimento: contrato `contracts/knowledge-base/entity-editing`, as regras `rules/knowledge-base/entity-edit-*`, `stable-key-change-states-no-validity`, as regras ampliadas `attribute-key-for-node-type`, `attribute-value-parses`, `attribute-value-in-allowed-values` e `validity-start-before-end`, os elementos `entity-edit`, `attribute-change`, `attribute-change-kind`, `applied-change`, `edit-effect` e `live-assertion-status`, o valor `edit-entity` de `curation-action-kind`, as restrições `entity-edit-is-atomic` e `entity-editing-is-not-a-language-model-tool`, e os cenários `scenarios/knowledge-base/` correspondentes. Fora do escopo: qualquer coisa do contexto `entity-workspace` (é o frontend) e renomear entidade ou editar aliases.

Pedido do dono (verbatim): "Quero este escopo entregue de ponta a ponta, do planejamento à revisão (/plan-work, /implement-task em cada tarefa entregável, /review-change)."

Alvo: backend.
