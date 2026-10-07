# Scope: entity-edit-frontend

O contexto `entity-workspace` inteiro, no alvo `frontend`: elementos `entity-edit-session` e `attribute-field`, as 21 regras de `rules/entity-workspace/`, os contratos `entity-screen`, `bff-entity-reads` e `bff-entity-edit`, e os 3 cenários de `scenarios/entity-workspace/`.
A tela lista nós, abre o formulário gerado do catálogo, revisa as alterações, exige motivo, envia a edição após 5 segundos sem desfazer e trata conflito.
Fora do escopo: o backend, renomear entidade e editar aliases.

Decisões de superfície da pessoa (não são fatos de domínio):
- A tela fica nas rotas `/entities` (lista) e `/entities/$nodeId` (formulário), dentro do layout protegido, carregadas com lazy.
- Não há entrada no menu do cabeçalho nem botão no painel de detalhe do grafo: a navegação ainda não foi especificada; a tela é acessada pelo endereço.
- O backend desta funcionalidade é entregue em outra sessão. Desenvolver e testar contra respostas simuladas (MSW), seguindo exatamente os contratos `bff-entity-reads` e `bff-entity-edit` e as respostas do `entity-editing`. Nenhuma chamada a backend real; nada em `backend/` é alterado.
- O alvo `frontend` declara `edits_freely`, mas esta entrega muda o que a pessoa pode fazer, então segue a rota completa.
