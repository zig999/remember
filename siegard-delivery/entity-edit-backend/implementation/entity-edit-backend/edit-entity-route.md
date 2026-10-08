---
target: backend
title: Publicar edit-entity por REST
summary: Rota REST autenticada POST /api/v1/nodes/{node_id}/edit que valida caminho e corpo antes do serviço de edição, responde 200 sem envelope e renderiza as recusas pelo mapeamento de erros compartilhado.
task: sha256:4aa8946dda506f878e98f4bb821f0b8b336e4974f71771d20c64e70708d2263a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-entity-route-build
files:
- path: src/modules/curation/routes/edit-entity.routes.ts
  effect: Serve POST /nodes/:node_id/edit, que o escopo autenticado de /api/v1 expõe como /api/v1/nodes/{node_id}/edit. Valida o node_id do caminho com NodeIdPathSchema e o corpo (reason, changes) com EditEntityBodySchema antes de chamar editEntityService. Responde HTTP 200 com { node_id, action_id, applied } sem envelope. Toda recusa de validação, de negócio ou de infraestrutura vira o envelope pelo mapeador compartilhado.
- path: src/modules/curation/routes/send-error.ts
  effect: Hospeda o sendError que antes era privado de curation.routes.ts. Aplica mapErrorToHttpResponse a uma resposta Fastify e registra em nível error somente quando o mapeamento pede (500/503). Recusas de negócio e de validação saem em warn, sem log de erro. Agora é compartilhado pelas rotas de curadoria e pela rota de edição.
- path: src/modules/curation/routes/curation.routes.ts
  effect: Perde a definição local de sendError e passa a importá-la de ./send-error.js. Comentários removidos pela regra de comentários. O comportamento das rotas de curadoria não muda.
- path: src/modules/curation/index.ts
  effect: Reexporta registerEditEntityRoute e EditEntityRouteDeps para o bootstrap. Comentários removidos.
- path: src/app.ts
  effect: Registra registerEditEntityRoute no escopo /api/v1 que já tem o hook de autenticação do dono, dentro do bloco que exige os dois catálogos. A rota não entra em CURATION_TOOL_NAMES nem em nenhuma lista de ferramentas MCP.
criteria:
- criterion: An accepted edit answers HTTP 200.
  met: true
  how: O handler em edit-entity.routes.ts envia o resultado do serviço com a constante ACCEPTED_STATUS = 200.
- criterion: The accepted answer carries node_id, action_id and applied with no envelope.
  met: true
  how: O handler envia diretamente o EditEntityResult { node_id, action_id, applied }. Não há envelope { ok, result } nem esquema de resposta Fastify que remova campos.
- criterion: A body the request schema refuses answers HTTP 422 with VALIDATION_INVALID_FORMAT.
  met: true
  how: parseEditRequest roda EditEntityBodySchema.parse antes do serviço. O ZodError cai em sendError, e mapZodError responde 422 VALIDATION_INVALID_FORMAT com a mensagem 'Request payload failed validation.'. As mensagens custom do schema não coincidem com os códigos da lista de prioridade, então não viram BUSINESS_*.
- criterion: A shape refusal's details carry issues of path and message.
  met: true
  how: 'mapZodError devolve details: { issues: [{ path, message }] }, com path unido por ''.'' (zodIssuesAsDetails em src/modules/curation/mcp/error-envelope.ts).'
- criterion: An edit naming no held node answers HTTP 404 with RESOURCE_NOT_FOUND.
  met: true
  how: loadActiveNodeForEdit lança ResourceNotFoundError (404, RESOURCE_NOT_FOUND, details com o node_id). O handler passa o erro por sendError, e mapErrorToHttpResponse usa err.statusCode.
- criterion: An edit refused for an unknown attribute key answers HTTP 422 with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: resolveAttributeKey lança BusinessError (statusCode 422) com esse código. mapErrorToHttpResponse responde com o status da própria classe, 422, e não consulta codeToHttpStatus, onde o código vale 404. A tabela compartilhada não foi alterada, então as outras superfícies mantêm seu status.
- criterion: An edit refused as a conflict answers HTTP 409 with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: O serviço lança ConflictError (409) com esse código. O mapeador o renderiza com o status e o código do erro, sem mudança.
- criterion: An edit that cannot reach the store answers HTTP 503 with SYSTEM_SERVICE_UNAVAILABLE.
  met: true
  how: Um erro de conexão do pg (ECONNREFUSED, 08xxx etc.) cai em isPgUnavailable em mapErrorToHttpResponse e vira serviceUnavailableError(), status 503. O código 57014, de statement timeout, está no mesmo conjunto, então o timeout também responde 503.
- criterion: The unavailable answer carries the message "A backing service is temporarily unavailable.".
  met: true
  how: serviceUnavailableError() em src/shared/error-mapping.ts fixa essa mensagem.
- criterion: An edit that fails for an unexpected cause answers HTTP 500 with SYSTEM_INTERNAL_ERROR.
  met: true
  how: Um erro que o mapeador não reconhece termina em internalError(), que responde 500 SYSTEM_INTERNAL_ERROR.
- criterion: The internal-failure answer carries the message "Internal server error.".
  met: true
  how: internalError() fixa essa mensagem.
- criterion: The internal-failure answer does not carry the cause.
  met: true
  how: O envelope de internalError() não tem details nem mensagem da causa. A causa só vai ao log do servidor (cause_message em send-error.ts), nunca à resposta.
- criterion: A request without a valid owner bearer token is refused without the edit running.
  met: true
  how: A rota é registrada em app.ts sobre o escopo com addHook('preHandler', auth.preHandler), o mesmo das demais rotas de curadoria. O hook recusa a requisição antes do handler, então o serviço não roda.
- criterion: A refusal for a business or validation cause is not logged at error level.
  met: true
  how: mapErrorToHttpResponse devolve logLevel 'warn' para ResourceNotFoundError, ConflictError, BusinessError, ValidationError e ZodError. sendError só chama logger.error quando logLevel é 'error', o que só acontece para 500 e 503.
- criterion: No language-model tool surface lists a tool that edits an entity.
  met: true
  how: A rota é só REST. Não foi tocado CURATION_TOOL_NAMES, a lista de ferramentas de registerCurationMcpTransport em app.ts nem curation-toolset.ts.
- criterion: An accepted edit's applied entry for a first value carries the effect first_value.
  met: true
  how: O serviço devolve applied.map(appliedEntry), e appliedEntry converte cada hífen do efeito em sublinhado (first-value vira first_value). A rota envia o resultado sem reprocessar.
- criterion: The edit is served for the POST method.
  met: true
  how: A rota é declarada com app.post.
- criterion: The edit is served at the path /api/v1/nodes/{node_id}/edit.
  met: true
  how: O caminho relativo é /nodes/:node_id/edit, registrado direto no escopo /api/v1 em app.ts, sem prefixo extra.
- criterion: The edit is applied to the node whose identity the path's node_id segment names.
  met: true
  how: parseEditRequest lê params.node_id com NodeIdPathSchema (UUID) e o passa como nodeId a editEntityService. Um node_id mal formado dá 422 VALIDATION_INVALID_FORMAT antes de qualquer acesso ao banco.
- criterion: The edit's reason is read from the reason field of the JSON request body.
  met: true
  how: EditEntityBodySchema.parse(request.body ?? {}) entrega body.reason ao serviço.
- criterion: The edit's changes are read from the changes field of the JSON request body.
  met: true
  how: O mesmo parse entrega body.changes ao serviço.
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/routes/edit-entity.routes.ts
  - src/modules/curation/routes/send-error.ts
  - src/app.ts
  how: O método, o caminho, a leitura de reason e changes e a resposta 200 sem envelope vêm do contrato e estão em edit-entity.routes.ts. As recusas de formato (corpo e node_id) passam por mapZodError, e as demais por mapErrorToHttpResponse. A recusa de chave de atributo desconhecida sai em 422 pelo statusCode da classe BusinessError. O serviço é o único lugar onde as outras recusas de negócio (BUSINESS_NODE_NOT_ACTIVE, BUSINESS_INVALID_ATTRIBUTE_VALUE, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_ENTITY_EDIT_DISPUTED, BUSINESS_ENTITY_EDIT_NO_CHANGES) são decididas, e a rota as repassa sem alteração. Loja inalcançável e statement timeout viram 503 por isPgUnavailable. Qualquer outra causa vira 500 sem a causa.
- node: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
  encoded_at:
  - src/modules/curation/routes/edit-entity.routes.ts
  how: A conversão de hífen para sublinhado já existe em appliedEntry (entity-edit-action.ts), no serviço. A rota a honra enviando o resultado do serviço sem esquema de resposta e sem reescrever os efeitos.
- node: domain/knowledge-base/edit-effect
  how: A enumeração está declarada em src/modules/curation/dto/edit-entity.dto.ts, entregue por tarefa anterior. Esta tarefa não declara nem altera o conjunto de valores, só entrega a grafia de fio que a regra de sublinhado define.
- node: constraints/entity-editing-is-not-a-language-model-tool
  how: A rota é só REST. Não há ferramenta MCP de edição e nenhuma whitelist ou toolset foi alterado (CURATION_TOOL_NAMES, curation-toolset.ts e a lista de curação em app.ts).
- node: constraints/every-operation-requires-owner-authentication
  encoded_at:
  - src/app.ts
  how: A rota é registrada em app.ts no escopo /api/v1 com o hook preHandler da autenticação do dono, como as demais operações. O handler não reverifica o token, seguindo a convenção das rotas de curadoria.
- node: constraints/unreachable-store-answers-unavailable
  encoded_at:
  - src/modules/curation/routes/send-error.ts
  how: sendError aplica mapErrorToHttpResponse, que responde SYSTEM_SERVICE_UNAVAILABLE com 503 quando isPgUnavailable reconhece conexão recusada, perdida ou statement timeout (57014).
- node: constraints/internal-failure-withholds-cause
  encoded_at:
  - src/modules/curation/routes/send-error.ts
  how: A causa de qualquer erro não reconhecido só vai ao log do servidor. A resposta é o envelope fixo de internalError(), 'Internal server error.' sem details.
- node: constraints/expected-refusals-not-logged-as-errors
  encoded_at:
  - src/modules/curation/routes/send-error.ts
  how: sendError registra em nível error só quando o mapeador devolve logLevel 'error', ou seja, 500 e 503. Recusas de validação e de negócio saem em warn e não geram log de erro. A exceção da construção do provedor de modelo no chat não alcança esta rota.
inferences:
- inferred: O node_id do caminho é validado com NodeIdPathSchema, o schema de UUID já usado pelas rotas de curadoria, e sua falha responde 422 VALIDATION_INVALID_FORMAT.
  from: O contrato recusa com VALIDATION_INVALID_FORMAT qualquer campo que não seja identificador bem formado e a identidade do nó viaja no caminho. A nota UNDERDETERMINED da tarefa pede esse tratamento, e entity-match.dto.ts já declara o schema.
- inferred: O caminho é validado antes do corpo, e as duas falhas saem como o mesmo 422 de formato.
  from: A ordem de precedência não está nos nós. Sem corpo em um nó mal formado, o resultado observável é o mesmo envelope de formato, e a ordem das duas leituras é escolha de implementação.
- inferred: Um corpo ausente é tratado como {} antes do parse, e então recusado como formato.
  from: A convenção das rotas de curadoria (request.body ?? {}) e a regra EDG-01 do padrão, que recusa entrada ausente no limite de validação.
- inferred: A rota é registrada direto no escopo autenticado /api/v1, fora do prefixo /curation.
  from: O caminho publicado /api/v1/nodes/{node_id}/edit do contrato. As rotas de curadoria vivem sob /curation, e as de leitura de nós, em /api/v1/nodes, sem conflito de método.
- inferred: O serviço recebe o catálogo do ingestion (ingestionCatalog) como catalog.
  from: EditEntityServiceDeps.catalog é do tipo CatalogSnapshot de ingestion/catalog/catalog.js, e é o único catálogo com o domínio de valores fechado, como registra o inventário.
- inferred: Extrair sendError de curation.routes.ts para send-error.ts, em vez de duplicá-lo ou exportá-lo de uma rota.
  from: A regra MNT-03 (chamar, não copiar) e a convenção do inventário de que as rotas de curadoria compartilham um sendError que chama mapErrorToHttpResponse.
divergences:
- from: Comentários nos arquivos src/modules/curation/routes/curation.routes.ts e src/modules/curation/index.ts, que existiam antes desta entrega.
  departure: Os comentários desses dois arquivos foram removidos por completo, incluindo cabeçalhos e blocos de seção.
  why: A regra do projeto diz que o código-fonte não carrega comentários, e quem edita um arquivo o entrega sem eles. Os dois arquivos foram editados por esta tarefa.
preserved:
- Todas as rotas existentes de curadoria em /api/v1/curation (queue, metrics, entity-matches resolve, nodes/merge, disputes/resolve, items confirm/reject/correct) mantêm caminhos, status e envelopes. sendError só mudou de arquivo.
- codeToHttpStatus não foi alterado, então BUSINESS_UNKNOWN_ATTRIBUTE_KEY continua 404 nas outras superfícies.
- O fallback de métricas de curadoria (500 vira 503) em curation.routes.ts continua usando mapErrorToHttpResponse como antes.
- As listas CURATION_TOOL_NAMES e de ferramentas do transporte MCP de curadoria em app.ts, e as asserções de contagem delas, ficam intactas.
- A rota GET /api/v1/nodes/:node_id e as demais leituras de nós do knowledge-graph continuam sem conflito, pois a nova rota é POST em /nodes/:node_id/edit.
- O manipulador global de erros (error-handler.ts) e a autenticação (auth.ts) não foram tocados.
deferred:
- what: A mensagem do serviço de edição (EDIT_ROUTE em edit-entity.service.ts) e o handler global classify duplicam em parte a renderização de erros de mapErrorToHttpResponse, e a codeToHttpStatus ainda diz 404 para BUSINESS_UNKNOWN_ATTRIBUTE_KEY enquanto o contrato de edição diz 422.
  why: Unificar a renderização ou alterar a tabela compartilhada muda comportamento de outras superfícies, o que está fora do objetivo desta tarefa. A edição já responde 422 pelo statusCode da classe BusinessError.
---
## What it is
Rota REST autenticada POST /api/v1/nodes/{node_id}/edit que valida caminho e corpo antes do serviço de edição, responde 200 sem envelope e renderiza as recusas pelo mapeamento de erros compartilhado.

## Notes
Inferred: O node_id do caminho é validado com NodeIdPathSchema, o schema de UUID já usado pelas rotas de curadoria, e sua falha responde 422 VALIDATION_INVALID_FORMAT.
Inferred: O caminho é validado antes do corpo, e as duas falhas saem como o mesmo 422 de formato.
Inferred: Um corpo ausente é tratado como {} antes do parse, e então recusado como formato.
Inferred: A rota é registrada direto no escopo autenticado /api/v1, fora do prefixo /curation.
Inferred: O serviço recebe o catálogo do ingestion (ingestionCatalog) como catalog.
Inferred: Extrair sendError de curation.routes.ts para send-error.ts, em vez de duplicá-lo ou exportá-lo de uma rota.
Departure: Os comentários desses dois arquivos foram removidos por completo, incluindo cabeçalhos e blocos de seção.
Deferred: A mensagem do serviço de edição (EDIT_ROUTE em edit-entity.service.ts) e o handler global classify duplicam em parte a renderização de erros de mapErrorToHttpResponse, e a codeToHttpStatus ainda diz 404 para BUSINESS_UNKNOWN_ATTRIBUTE_KEY enquanto o contrato de edição diz 422.
