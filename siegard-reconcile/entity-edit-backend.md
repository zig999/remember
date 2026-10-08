---
contract_version: siegard-reconcile/9
title: Review of the backend delivery of the owner's entity edit (entity-edit-backend)
summary: The 17 tasks of the entity-edit-backend initiative wrote these backend files, as their implementation
  and proof records state.
target: backend
files:
- path: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/integration/curation/edit-entity-route-harness.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/integration/curation/edit-entity-routing.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity-records.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity-world.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-action.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-node.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-note.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/app.ts
  change: 'written by the delivery of edit-entity-route: Registra registerEditEntityRoute no escopo /api/v1
    que já tem o hook de autenticação do dono, dentro do bloco que exige os dois catálogos. A rota não
    entra em CURATION_TOOL_NAMES nem em nenhuma lista de ferramentas MCP.'
- path: src/modules/compliance-audit/dto/curation-action.dto.ts
  change: 'written by the delivery of read-edit-entity-actions: CurationActionNameSchema now has edit_entity
    as its eighth member. The audit listing''s action query filter admits it, and any other text, including
    the hyphen spelling edit-entity, is still refused by the schema (VALIDATION_INVALID_FORMAT, HTTP 422,
    through the existing route parse). The four JSDoc comments in the file were removed under the no-comments
    rule, and nothing else in the file changed.'
- path: src/modules/curation/dto/edit-entity.dto.ts
  change: 'written by the delivery of assign-change-effect: Adds EditEffectSchema, a Zod enum of the six
    values of the edit-effect enumeration, and the inferred EditEffect type. The existing change schema
    and body schema are unchanged.; written by the delivery of edit-request-schema: New DTO file, with
    no comments. It exports EditEntityBodySchema and EditEntityBody. The reason is trimmed, at least 1
    and at most 1000 UTF-16 code units, and required as a string. changes is a required array of AttributeChangeSchema,
    and an empty array passes. Each change has a required string attribute_key and a required kind of
    "set" or "remove". value, item_id, valid_from and valid_to are each optional, and null parses as not
    stated, meaning undefined. item_id must be a UUID and the dates must be YYYY-MM-DD. A set change that
    states no value is refused at path changes.N.value. A remove change that states a value is refused
    at changes.N.value. A remove change that names no attribute is refused at changes.N.item_id. It also
    exports ENTITY_EDIT_REASON_MAX_LENGTH, AttributeChangeKindSchema, AttributeChangeSchema and the matching
    inferred types. Nothing coerces types.'
- path: src/modules/curation/index.ts
  change: 'written by the delivery of edit-entity-route: Reexporta registerEditEntityRoute e EditEntityRouteDeps
    para o bootstrap. Comentários removidos.'
- path: src/modules/curation/repository/curation.repository.ts
  change: 'written by the delivery of record-new-attribute: Adds insertNewAttribute, a parameterized INSERT
    into node_attribute that sets no supersedes_attribute_id and returns the new id. It also imports the
    ValidFromSource type. Every existing function is unchanged.; written by the delivery of record-operator-note:
    Adds acceptInformationFragment, a parameterized UPDATE that moves one fragment from proposed to accepted
    and returns the affected row count. Every existing function is unchanged.; written by the delivery
    of record-removal: Adds rejectAttributeAtEdit and AttributeRejectionArgs. The function updates one
    node_attribute row by id, setting status to deleted and superseded_at to a supplied edit moment. The
    update only matches a row whose status is active, uncertain or disputed. It touches no other row and
    reads no clock. Existing functions, including rejectItem, are unchanged.; written by the delivery
    of record-succession: insertNewAttribute writes supersedes_attribute_id (NewAttributeArgs gains supersedesAttributeId).
    New supersedeAttributeAtEdit sets status superseded, sets valid_to to the given date when one is given
    and otherwise keeps it, and sets superseded_at to the supplied moment or to null. It only touches
    a row in status active, uncertain or disputed and returns the number of rows updated. It reads no
    clock.; written by the delivery of refuse-stale-change: Adds loadAttributeIdsOfKeyForUpdate(client,
    { nodeId, attributeKeyId, statuses }), a parameterized SELECT ... FOR UPDATE returning the ids of
    a node''s attributes of one key whose status is in the given set. Nothing existing is changed.'
- path: src/modules/curation/routes/curation.routes.ts
  change: 'written by the delivery of edit-entity-route: Perde a definição local de sendError e passa
    a importá-la de ./send-error.js. Comentários removidos pela regra de comentários. O comportamento
    das rotas de curadoria não muda.'
- path: src/modules/curation/routes/edit-entity.routes.ts
  change: 'written by the delivery of edit-entity-route: Serve POST /nodes/:node_id/edit, que o escopo
    autenticado de /api/v1 expõe como /api/v1/nodes/{node_id}/edit. Valida o node_id do caminho com NodeIdPathSchema
    e o corpo (reason, changes) com EditEntityBodySchema antes de chamar editEntityService. Responde HTTP
    200 com { node_id, action_id, applied } sem envelope. Toda recusa de validação, de negócio ou de infraestrutura
    vira o envelope pelo mapeador compartilhado.'
- path: src/modules/curation/routes/send-error.ts
  change: 'written by the delivery of edit-entity-route: Hospeda o sendError que antes era privado de
    curation.routes.ts. Aplica mapErrorToHttpResponse a uma resposta Fastify e registra em nível error
    somente quando o mapeamento pede (500/503). Recusas de negócio e de validação saem em warn, sem log
    de erro. Agora é compartilhado pelas rotas de curadoria e pela rota de edição.'
- path: src/modules/curation/service/attribute-change-catalog.ts
  change: 'written by the delivery of check-change-key-and-value: New. checkChangeAgainstCatalog(catalog,
    nodeType, change) looks the change''s key up for the node''s type and refuses an absent one with a
    BusinessError BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key and the node type. Both set and remove
    changes get this check. For a set change it then refuses a value that does not read as the key''s
    value type with BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value. Last it refuses
    a value outside the key''s allowed values, compared exactly as written, with BUSINESS_INVALID_ATTRIBUTE_VALUE
    naming the attribute key, the value and the allowed values. The ingestion validators do the parsing
    and the domain comparison, and a key with no allowed values passes any text. Refusals are BusinessError,
    so they render as HTTP 422 through mapErrorToHttpResponse.; written by the delivery of check-change-validity:
    resolveAttributeKey is now exported and its body is unchanged, so the orchestration can obtain the
    AttributeKeyRow that checkChangeValidity takes without repeating the catalog lookup. Nothing else
    changed.'
- path: src/modules/curation/service/attribute-change-validity.ts
  change: 'written by the delivery of check-change-validity: New helper holding checkChangeValidity(attributeKey,
    change, editedAt). It refuses with a BusinessError (code BUSINESS_TEMPORAL_INCOHERENT, 422 via the
    existing table) in three cases. A change to a key whose is_temporal is not true states a validity
    start or end. A change states both a start and an end with the start not strictly before the end.
    A set change to a temporal key states an end and no start, and that end is not after the UTC calendar
    date of editedAt. It runs the three checks in that order. It writes nothing and reads no clock of
    its own.; written by the delivery of record-new-attribute: utcCalendarDateOf is now exported so the
    new-attribute helper reuses the one UTC-date derivation instead of copying it. Its behavior is unchanged.'
- path: src/modules/curation/service/edit-entity.service.ts
  change: 'written by the delivery of apply-entity-edit: New write service editEntityService(deps, nodeId,
    body). Inside one withTransaction it locks and loads the active node, then for each change in order
    resolves the key, checks the value against the catalog, checks validity, checks the change against
    the held attributes, decides the effect and records it. It records the operator note once, lazily,
    when the first effectful change is written. It then refuses an all-unchanged or empty edit with BUSINESS_ENTITY_EDIT_NO_CHANGES,
    records one curation action and answers { node_id, action_id, applied } with underscore effects. A
    store uniqueness violation becomes TemporalIncoherentError.'
- path: src/modules/curation/service/entity-edit-action.ts
  change: 'written by the delivery of apply-entity-edit: AppliedEntry and appliedEntry are now exported,
    so the answer''s applied entries use the same underscore spelling as the action payload. Behavior
    of recordEditAction is unchanged.; written by the delivery of record-edit-action: Declares AppliedChange
    and recordEditAction. Given the caller''s pg client, the edited node''s id, the reason and the applied
    changes, it inserts one curation_action row through the existing insertCurationAction. The row has
    action edit_entity, target kind node, the node id as target, the trimmed reason, and a payload object
    `{ applied: [...] }`. Each applied entry has exactly attribute_key, effect (hyphens turned into underscores),
    item_id and predecessor_id, in the order given. It returns the new action''s id and runs only on the
    connection it is handed.'
- path: src/modules/curation/service/entity-edit-attributes.ts
  change: 'written by the delivery of assign-change-effect: LIVE_STATUSES is now exported so the effect
    decision reuses the single definition of live statuses. The checks behave as before.; written by the
    delivery of refuse-disputed-change: checkNamedAttribute now calls assertDisputeLeftToCuration after
    the live-attribute check and before the supersession-time check. For a named attribute whose status
    is disputed, a remove change, or a set change stating a value other than the held one by strict string
    comparison (so case-only differences count), throws a ConflictError (HTTP 409 through the shared table)
    with code BUSINESS_ENTITY_EDIT_DISPUTED. The details carry attribute_key and item_id, which is the
    held item''s id. A set change stating the held value character for character, and any change naming
    an active or uncertain attribute, passes this check. The comparison that decided whether a set change
    states another value is now one helper, statesOtherValueThan, shared with the supersession-time check,
    so that check behaves as before.; written by the delivery of refuse-stale-change: Adds checkChangeAgainstHeldAttributes(client,
    { node, attributeKey }, change), the last check inside one change. A change naming an attribute loads
    that row FOR UPDATE and answers BUSINESS_ENTITY_EDIT_CONFLICT (409, attribute_key and item_id in the
    details) unless the row belongs to the edited node, to the change''s key, and holds a live status
    (active, uncertain or disputed). A set change that names an active or uncertain attribute carrying
    a supersession time and states any value other than the attribute''s own is refused with the same
    code. A set change naming no attribute, to a key that does not allow multiple current values, is refused
    with the same code (attribute_key only) when the node holds a live attribute of that key. Nothing
    else is refused here.'
- path: src/modules/curation/service/entity-edit-correction.ts
  change: 'written by the delivery of record-correction: Adds recordCorrection(client, input). It supersedes
    the predecessor with supersedeAttributeAtEdit, passing validTo null and supersededAt equal to the
    edit moment, so its validity end is never touched. It then records the new attribute through recordNewAttribute
    with supersedes set to the predecessor''s id, and copies the predecessor''s provenance onto it with
    copyProvenance. It returns the new attribute''s id. It refuses with an InvariantError when the predecessor
    was not live, before the new attribute is inserted. It runs in the caller''s transaction and reads
    no clock.'
- path: src/modules/curation/service/entity-edit-effect.ts
  change: 'written by the delivery of assign-change-effect: New. decideChangeEffect(attributeKey, change,
    attributesOfKey) is a pure function. It reads no clock, store or client. It returns removal for a
    remove change. For a set change it keeps only the attributes with a live status (active, uncertain,
    disputed) and decides from those. Naming no attribute: first-value when none is live; unchanged when
    the key allows multiple current values and an active or uncertain attribute holds the stated value
    character for character; addition otherwise, which includes the case where only a disputed attribute
    holds the value. Naming an attribute: unchanged when the value equals the named attribute''s own,
    whatever the stated validity; correction when the named attribute has a validity end and no supersession
    time, whatever its status and key; for a current attribute (no end, no supersession time), succession
    when the key is temporal and correction otherwise. It throws InvariantError for states the checks
    refuse before the decision: a second value for a single-current key, a named attribute that is not
    live, and a named attribute that carries a supersession time.'
- path: src/modules/curation/service/entity-edit-new-attribute.ts
  change: 'written by the delivery of record-new-attribute: recordNewAttribute(client, input) inserts
    one node_attribute for a set change and appends a provenance row to the edit''s fragment. The attribute
    is active, at confidence 1.0, created by the edit''s LLM run, supersedes no attribute and touches
    no other attribute. For a temporal key it records the stated validity start with basis stated, or
    the UTC calendar date of the edit moment with basis received when none is stated, and records the
    stated validity end or none. For a key that is not temporal it records no validity start, end or basis.
    It returns the new attribute''s id.; written by the delivery of record-succession: NewAttributeInput
    gains an optional supersedes id, which recordNewAttribute passes to the insert as supersedesAttributeId
    (null when absent, so a first value or an addition behaves as before). validityOf and RecordedValidity
    are now exported so the succession derives the same start the new attribute is recorded with.'
- path: src/modules/curation/service/entity-edit-node.ts
  change: 'written by the delivery of refuse-inactive-node: Exports loadActiveNodeForEdit(client, nodeId),
    which locks the knowledge node row through the existing loadNodesForUpdate. It throws ResourceNotFoundError
    (404) naming the node in the message and in details.node_id when no row is held. It throws ConflictError
    with BUSINESS_NODE_NOT_ACTIVE (409) naming the node and its current status, in the message and in
    details.node_id and details.status, when the status is needs_review, merged or deleted. It returns
    the locked row for an active node.'
- path: src/modules/curation/service/entity-edit-note.ts
  change: 'written by the delivery of record-operator-note: Adds recordOperatorNote(client, { nodeId,
    reason, editedAt }). On the caller''s client and transaction it trims the reason. It builds the note
    content from the reason, the edit moment and a fresh UUID nonce. It inserts one raw information of
    source type outro with metadata { operator_note: true, node_id }, and one chunk holding the whole
    content. It opens an llm_run of model operator and prompt version operator-edit-v1 on that raw information,
    then inserts a fragment anchored to the chunk with the trimmed reason as text and confidence 1.0,
    and accepts it. Last, it closes the run as completed. It returns the run, raw information, chunk and
    fragment ids. It reads no clock, calls no language model and opens no transaction.'
- path: src/modules/curation/service/entity-edit-removal.ts
  change: 'written by the delivery of record-removal: Adds recordRemoval(client, { attributeId, editedAt
    }). It rejects the named attribute at the edit moment inside the caller''s transaction. It throws
    InvariantError if the update did not match exactly one live row, the same guard recordCorrection and
    recordSuccession use. It touches no sibling attribute and no other key.'
- path: src/modules/curation/service/entity-edit-succession.ts
  change: 'written by the delivery of record-succession: New. recordSuccession(client, input) takes the
    usual new-attribute input plus the locked predecessor row. It reads the new attribute''s validity
    start from validityOf. It closes the predecessor with the new start as its validity end, unless the
    predecessor holds a start and the new start is not later than it. Where it gives no end, it sets the
    supersession time to the edit moment. Where it gives an end, it leaves the supersession time unset.
    It then records the new attribute through recordNewAttribute, naming the predecessor as the one it
    supersedes. It returns the new attribute''s id. It raises InvariantError if the key is not temporal
    or the predecessor was not live.'
- path: src/shared/error-mapping.ts
  change: 'written by the delivery of edit-refusal-codes: The shared code-to-HTTP-status table now holds
    five new entries. BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT and BUSINESS_ENTITY_EDIT_DISPUTED
    render 409. BUSINESS_ENTITY_EDIT_NO_CHANGES renders 422. BUSINESS_INVALID_ATTRIBUTE_VALUE renders
    422. It had no entry before, so a code-keyed render of it fell back to 500. The status-to-log-level
    derivation is unchanged: every status below 500 logs at warn, so the new refusals never log at error.
    The existing BUSINESS_UNKNOWN_ATTRIBUTE_KEY entry stays 404 for the retrieval surface. Every comment
    and doc block was removed from the file, as the no-comments rule requires of a file this edit writes.
    All exports, signatures and messages are unchanged, including the fixed 503 and 500 messages.'
nodes:
- node: constraints/answers-carry-allowed-origin
  conforms: true
  how: 'src/app.ts: held at the `fastifyCors` registration at the application root, lines 69-72 — await
    app.register(fastifyCors, { origin: corsOrigins, methods: ["GET", "POST", "PUT", "PATCH", "DELETE",
    "OPTIONS"], });'
  encoded_at:
  - src/app.ts
- node: constraints/curation-transports-answer-alike
  conforms: true
  how: 'src/modules/curation/routes/curation.routes.ts: held at Only the REST half sits here. Each write
    handler forwards the result of the shared service, and each refusal goes through sendError, whose
    mapper is shared with the MCP transport. — const result = await resolveEntityMatchService({ pool:
    deps.pool, logger: deps.logger }, params.node_id, body); return reply.status(200).send(result); ...
    return sendError(err, reply, deps.logger);

    src/shared/error-mapping.ts: held at codeToHttpStatus plus renderErrorEnvelope and toMcpToolResult,
    one mapping and one envelope shared by both transports — export function toMcpToolResult(envelope:
    ErrorEnvelope): McpToolErrorResult'
  encoded_at:
  - src/modules/curation/routes/curation.routes.ts
  - src/shared/error-mapping.ts
- node: constraints/curation-write-failure-logged
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/routes/curation.routes.ts read `nowhere`
    — The handlers only delegate with `return sendError(err, reply, deps.logger);`. The `curation_request_failed`
    logger.error call is declared in src/modules/curation/routes/send-error.ts, which the candidate index
    does not bind to this node, not in this file.'
  observed_at:
  - src/modules/curation/routes/curation.routes.ts
- node: constraints/entity-edit-is-atomic
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at editEntityService(), lines 275-277,
    the whole write inside one transaction — `return await withTransaction(deps.pool, (client) => editWithin(deps,
    client, nodeId, body) );`'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two kinds of assertion would close it. First: one accepted mixed edit (a set on a held
    attribute, a first value, and a supersession), checked against a store that then holds a raw information,
    a raw chunk, an information fragment, an LLM run, the new attributes, the superseded attributes marked
    superseded, provenance for each new attribute, and a curation action. Second: the same mixed edit
    with the failure injected in turn at each write (raw_information, raw_chunk, information_fragment,
    llm_run, the node_attribute insert, the supersession update, provenance, curation_action), each checked
    against a store equal to its snapshot from before the edit.'
  read_at:
    node: sha256:7516b37319af935e04e9a8c23e8f85a9b46612fc87a6d1b23c29d0eb37b2aec1
    proof:
    - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
      digest: sha256:15dd00774fd007f7c406d6d8ab39d4cfa00e6233e11b76737cbb52ca218e7301
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: 'src/app.ts: held at the `preHandler` hook of the `/api/v1` scope, line 82, which covers every
    route registered under it — scoped.addHook("preHandler", auth.preHandler);'
  encoded_at:
  - src/app.ts
- node: constraints/expected-refusals-not-logged-as-errors
  conforms: false
  how: 'src/shared/error-mapping.ts, renderErrorEnvelope, the logLevel derivation (line 120), together
    with the codeToHttpStatus entries BUSINESS_CHAT_DISABLED and BUSINESS_CHAT_INGEST_DISABLED (lines
    94 and 99): const logLevel: "warn" | "error" = statusCode >= 500 ? "error" : "warn"; — applied to
    BUSINESS_CHAT_DISABLED: 503, and to BUSINESS_CHAT_INGEST_DISABLED: 503, — The constraint says a refusal
    for a business cause is never logged at error level, except a failure to build the model provider
    at the start of a chat turn. Every BUSINESS_* code mapped to 5xx is logged at error. That includes
    the chat-disabled refusals, which are plain business refusals and not provider-build failures. A switched-off
    chat surface therefore raises error-level log noise that the owner decided it should not.'
  observed_at:
  - src/modules/curation/routes/send-error.ts
  - src/shared/error-mapping.ts
- node: constraints/failures-answer-one-envelope
  conforms: true
  how: 'src/shared/error-mapping.ts: held at ErrorEnvelope and renderErrorEnvelope, where details is carried
    only when given — details === undefined ? { code, message } : { code, message, details }'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/ingest-toolset-offers-no-async-ingestion
  conforms: true
  how: 'src/app.ts: held at the `toolNames` allowlist of the ingest MCP transport, lines 109-116, which
    names no tool that starts an ingestion and returns early. `INGEST_TOOL_NAMES` is defined in another
    file this pass did not read. — toolNames: [ ...INGEST_TOOL_NAMES, "ingest_document", "ingest_directed",
    "health", "get_ingestion_status", "list_recent_ingestions", ],'
  encoded_at:
  - src/app.ts
- node: constraints/ingestion-transports-answer-alike
  conforms: true
  how: 'src/shared/error-mapping.ts: held at codeToHttpStatus (the ingestion codes) with the shared envelope
    and MCP rendering — SYSTEM_LLM_PROVIDER_UNAVAILABLE: 502,'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/internal-failure-withholds-cause
  conforms: false
  how: 'the fact left part of its ground: still held in src/shared/error-mapping.ts, and src/modules/curation/routes/send-error.ts
    read `nowhere. The fixed message is built by the mapper in another file. This file sends the envelope
    it is given. It writes the cause only to the log, never to the reply.` — return reply.status(statusCode).send(envelope);
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/routes/send-error.ts
  - src/shared/error-mapping.ts
- node: constraints/mcp-failure-is-tool-error
  conforms: true
  how: 'src/shared/error-mapping.ts: held at toMcpToolResult — content: [{ type: "text", text: JSON.stringify(envelope.error)
    }], isError: true,'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/preflight-needs-no-authentication
  conforms: true
  how: 'src/app.ts: held at the application-root CORS registration at line 69, before and outside the
    scope that carries the authentication hook — await app.register(fastifyCors, { origin: corsOrigins,
    ... }); the hook is added only inside `app.register(async (scoped) => {`'
  encoded_at:
  - src/app.ts
- node: constraints/retrieval-transports-answer-alike
  conforms: true
  how: 'src/shared/error-mapping.ts: held at codeToHttpStatus (the retrieval codes) with the shared envelope
    and MCP rendering — BUSINESS_RAW_INFORMATION_DELETED: 410,'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/unreachable-store-answers-unavailable
  conforms: false
  how: 'the fact left part of its ground: still held in src/shared/error-mapping.ts, and src/modules/curation/routes/send-error.ts
    read `nowhere. This file does not classify an unreachable store or a timeout. The mapper does, in
    another file.` — const { statusCode, envelope, logLevel } = mapErrorToHttpResponse(err); — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/routes/send-error.ts
  - src/shared/error-mapping.ts
- node: contracts/knowledge-base/compliance-audit
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at ListCurationActionsQuerySchema,
    CurationActionSchema and CurationActionIdParamSchema hold the list and read curation-action request
    and answer shapes. The compliance-deletion operations are not in this file. — limit: z.coerce.number().int().min(1).max(100).default(50),
    ... target_id: UuidSchema.optional(), created_from: z.string().datetime({ offset: true }).optional(),
    ... items: z.array(CurationActionSchema)'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: contracts/knowledge-base/entity-editing
  conforms: false
  how: 'src/shared/error-mapping.ts, codeToHttpStatus, the BUSINESS_UNKNOWN_ATTRIBUTE_KEY entry (line
    66): BUSINESS_UNKNOWN_ATTRIBUTE_KEY: 404, — The entity-edit contract says this refusal is HTTP 422
    over REST. This table, the only place a code is turned into a status, says 404. Unless the edit route
    overrides the status, an edit that names a key the catalog does not hold answers a status the contract
    does not give. The retrieval contract (not in this node set) states 404 for the same code, so one
    code holds two statuses in the specification and one slot in the code.'
  observed_at:
  - src/app.ts
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/routes/edit-entity.routes.ts
  - src/modules/curation/routes/send-error.ts
  - src/modules/curation/service/attribute-change-catalog.ts
  - src/modules/curation/service/attribute-change-validity.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-node.ts
  - src/shared/error-mapping.ts
- node: domain/knowledge-base/applied-change
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-action.ts,
    and src/modules/curation/service/edit-entity.service.ts read `nowhere` — The file only imports `import
    type { AppliedChange, AppliedEntry } from "./entity-edit-action.js";` and declares no shape of its
    own for it. — a binding asserts the file answers for the node, so the pair that stopped holding it
    is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: domain/knowledge-base/assertion-status
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere. The file declares no enumeration of assertion statuses.` — It imports the type (`AssertionStatus`
    from "../dto/enums.dto.js") and uses the values in SQL literals such as `status IN (''active'', ''uncertain'',
    ''disputed'')`.; src/modules/curation/service/entity-edit-attributes.ts read `nowhere` — The file
    only imports the type: import type { AssertionStatus } from "../dto/enums.dto.js";; src/modules/curation/service/entity-edit-correction.ts
    read `nowhere` — The file declares no status enumeration. It passes the attribute along without naming
    a status.; src/modules/curation/service/entity-edit-effect.ts read `nowhere. The file does not declare
    the enumeration. It imports the type `AssertionStatus` and uses it to type `VALUE_HOLDING_STATUSES`.`
    — import type { AssertionStatus } from "../dto/enums.dto.js";'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: domain/knowledge-base/attribute-change
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/dto/edit-entity.dto.ts, and
    src/modules/curation/service/attribute-change-validity.ts read `nowhere` — The shape is declared in
    another file. This file only imports it, `import type { AttributeChange } from "../dto/edit-entity.dto.js";`,
    and reads its fields.; src/modules/curation/service/entity-edit-effect.ts read `nowhere. The file
    does not declare the shape. It imports `AttributeChange` and reads `kind`, `value` and `item_id`.`
    — import type { AttributeChange, EditEffect } from "../dto/edit-entity.dto.js";; src/modules/curation/service/entity-edit-new-attribute.ts
    read `nowhere` — The file only imports the shape: `import type { AttributeChange } from "../dto/edit-entity.dto.js";`
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/attribute-change-validity.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
- node: domain/knowledge-base/attribute-change-kind
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/dto/edit-entity.dto.ts, and
    src/modules/curation/service/entity-edit-attributes.ts read `nowhere` — The file only compares against
    the values: change.kind === "set" and change.kind === "remove". It declares no shape.; src/modules/curation/service/entity-edit-effect.ts
    read `nowhere. The file only compares `change.kind` with the literal "remove".` — if (change.kind
    === "remove") { — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: domain/knowledge-base/attribute-key
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/attribute-change-catalog.ts read
    `nowhere` — The file only imports the shape (`AttributeKeyRow` from "../../ingestion/catalog/catalog.js")
    and reads `attributeKey.value_type` and `attributeKey.key`. It declares no shape.; src/modules/curation/service/attribute-change-validity.ts
    read `nowhere` — The shape is declared in another file. This file only imports it, `import type {
    AttributeKeyRow } from "../../ingestion/catalog/catalog.js";`, and reads `is_temporal` and `key`.;
    src/modules/curation/service/entity-edit-effect.ts read `nowhere. The file imports `AttributeKeyRow`
    and reads `is_temporal`, `allows_multiple_current` and `key` from it.` — import type { AttributeKeyRow
    } from "../../ingestion/catalog/catalog.js";'
  observed_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  - src/modules/curation/service/attribute-change-validity.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: domain/knowledge-base/curation-action
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/compliance-audit/dto/curation-action.dto.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. CurationActionInsertArgs
    is a parameter shape for one insert, not the element''s declaration.` — `export interface CurationActionInsertArgs
    { readonly action: string; readonly target_kind: "node" | "link" | "attribute"; ...`; src/modules/curation/service/entity-edit-action.ts
    read `nowhere` — The file declares no shape for the curation action. It passes `{ action, target_kind,
    target_id, payload, reason }` to `insertCurationAction` imported from `../repository/curation.repository.js`.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: domain/knowledge-base/curation-action-filter
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at ListCurationActionsQuerySchema,
    which declares action, target_kind, target_id, created_from, created_to, limit and offset. — action:
    CurationActionNameSchema.optional(), target_kind: TargetKindSchema.optional(), created_to: z.string().datetime({
    offset: true }).optional(),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: domain/knowledge-base/curation-action-kind
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/compliance-audit/dto/curation-action.dto.ts,
    and src/modules/curation/service/entity-edit-action.ts read `nowhere` — The file declares one value,
    `export const ENTITY_EDIT_ACTION_KIND = "edit_entity";`, and no enumeration. The enumeration is declared
    in `compliance-audit/dto/curation-action.dto.ts`. — a binding asserts the file answers for the node,
    so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: domain/knowledge-base/curation-target-kind
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/compliance-audit/dto/curation-action.dto.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. The file declares no enumeration
    of target kinds.` — `readonly target_kind: "node" | "link" | "attribute";` is an inline parameter
    type, not a declaration of the enumeration.; src/modules/curation/service/entity-edit-action.ts read
    `nowhere` — The file declares one value, `export const ENTITY_EDIT_ACTION_TARGET_KIND = "node";`,
    and no enumeration. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: domain/knowledge-base/edit-effect
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/dto/edit-entity.dto.ts, and
    src/modules/curation/service/edit-entity.service.ts read `nowhere` — `EditEffect` is imported from
    "../dto/edit-entity.dto.js". The file declares no enumeration.; src/modules/curation/service/entity-edit-action.ts
    read `nowhere` — The file only imports the type: `import type { EditEffect } from "../dto/edit-entity.dto.js";`.
    The enumeration is declared in that DTO as `EditEffectSchema = z.enum([...])`. — a binding asserts
    the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: domain/knowledge-base/entity-edit
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/dto/edit-entity.dto.ts, and
    src/modules/curation/service/edit-entity.service.ts read `nowhere` — `EditEntityBody` is imported
    from "../dto/edit-entity.dto.js" and this file declares no shape for it.; src/modules/curation/service/entity-edit-action.ts
    read `nowhere` — The file''s `EditActionInput` carries `nodeId`, `reason` and `applied`. It is the
    input to recording the action and does not declare the entity edit''s `reason` and `changes`, which
    the request DTO `EditEntityBodySchema` declares.; src/modules/curation/service/entity-edit-note.ts
    read `nowhere. The file declares OperatorNoteInput, which carries only the reason and two other fields.
    It does not declare the entity edit''s shape (reason, changes).` — readonly nodeId: string; readonly
    reason: string; readonly editedAt: Date; — a binding asserts the file answers for the node, so the
    pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
  - src/modules/curation/service/entity-edit-note.ts
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere. The file declares no knowledge-link shape.` — DisputedLinkRow and ItemLockedRow are read
    projections of selected columns, not the element''s declaration. The table is named in queries such
    as `UPDATE knowledge_link`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/live-assertion-status
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-attributes.ts,
    and src/modules/curation/service/entity-edit-effect.ts read `nowhere. The live statuses are imported
    as `LIVE_STATUSES` from entity-edit-attributes.js. This file only filters by them.` — return LIVE_STATUSES.includes(held.status);
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere. The file declares no node-attribute shape.` — NewAttributeArgs and DisputedAttributeRow
    are parameter and read projections, not the element''s declaration.; src/modules/curation/service/entity-edit-correction.ts
    read `nowhere` — The file declares no shape for the attribute. It only passes `predecessor.id` and
    `attributeId` along.; src/modules/curation/service/entity-edit-effect.ts read `nowhere. The file does
    not declare the shape. It reads `value`, `status`, `valid_to`, `superseded_at` and `id` from the imported
    `ItemLockedRow`.` — import type { ItemLockedRow } from "../repository/curation.repository.js";; src/modules/curation/service/entity-edit-new-attribute.ts
    read `nowhere` — The file passes the attribute''s fields to `insertNewAttribute(client, { nodeId:
    target.node.id, ... })` and declares no node-attribute shape.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/modules/curation/service/entity-edit-node.ts: held at The constant ACTIVE_STATUS, which holds
    the enumeration''s `active` value. The enumeration''s shape is declared elsewhere. — const ACTIVE_STATUS
    = "active";'
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
- node: domain/knowledge-base/value-type
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere. The file declares no enumeration of value types.` — It uses the inline union `"date" | "number"
    | "text" | "bool"` in ItemLockedRow and NewAttributeArgs, which are projections rather than an enumeration
    declaration.; src/modules/curation/service/attribute-change-catalog.ts read `nowhere` — The file only
    passes `value_type: attributeKey.value_type` along and declares no enumeration of value types.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/attribute-change-catalog.ts
- node: rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at CurationActionNameSchema, which
    is the filter vocabulary of the listing and spells each kind with underscores. — "resolve_entity_match",
    ... "edit_entity",

    src/modules/curation/service/entity-edit-action.ts: held at the constant `ENTITY_EDIT_ACTION_KIND`,
    line 6, used as `action` in `recordEditAction` — export const ENTITY_EDIT_ACTION_KIND = "edit_entity";'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-node.ts read `nowhere.
    This file only passes `node.status` along in the message and details and does no spelling conversion.
    The row type is declared in the repository.` — { node_id: nodeId, status: node.status }'
  observed_at:
  - src/modules/curation/service/entity-edit-node.ts
- node: rules/knowledge-base/accept-rate
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ACCEPT_ACTIONS constant and
    the acceptRate computation in aggregateCurationMetrics — `const ACCEPT_ACTIONS = ["resolve_entity_match",
    "merge_nodes", "resolve_dispute", "confirm_item", "correct_item"] as const;` and `let acceptRate =
    0; if (totalActions > 0) { ... acceptRate = accepted / totalActions; }`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/adjust-periods-outcome
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at adjustItemPeriod — `SET valid_from
    = $2::date, valid_to = $3::date, status = ''active'' WHERE id = $1 AND status = ''disputed''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/alias-unique-per-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clause of copyAliases,
    which respects the uniqueness without declaring it — `ON CONFLICT (node_id, alias_norm) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-action.ts,
    and src/modules/curation/routes/edit-entity.routes.ts read `nowhere` — The file only forwards the
    service result: `return reply.status(ACCEPTED_STATUS).send(result);`. It does not spell any effect.;
    src/modules/curation/service/edit-entity.service.ts read `nowhere` — `applied: applied.map(appliedEntry),`
    only delegates the spelling to appliedEntry in entity-edit-action.js. — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/modules/curation/routes/edit-entity.routes.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
- node: rules/knowledge-base/attribute-key-for-node-type
  conforms: true
  how: 'src/modules/curation/service/attribute-change-catalog.ts: held at resolveAttributeKey, the lookup
    and the throw when it finds nothing. — const attributeKey = catalog.attributeKeyByNodeTypeAndKey.get(attributeKeyCacheKey(nodeType.id,
    attributeKeyName)); if (attributeKey === undefined) { throw new BusinessError(UNKNOWN_ATTRIBUTE_KEY_CODE,'
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clauses of copyProvenance
    and appendProvenanceFragment for attributes — `ON CONFLICT (attribute_id, fragment_id) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: 'src/modules/curation/service/attribute-change-catalog.ts: held at assertValueAllowed. It looks
    up the key''s domain, returns when there is none, and refuses when assertValueInDomain fails. The
    allowed values themselves are held by the catalog and by assertValueInDomain, which are in other files.
    — const domain = domainOf(catalog, attributeKey.id); if (domain === null) { return; } refuseOnValidationFailure(()
    => assertValueInDomain(value, domain),'
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/modules/curation/service/attribute-change-catalog.ts: held at assertValueReadsAsType. It calls
    parseAttributeValue and refuses when that fails. The date, number and bool reading expressions are
    not in this file. — () => parseAttributeValue({ value, value_type: attributeKey.value_type }),'
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
- node: rules/knowledge-base/audit-page-defaults
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at The limit and offset fields of
    ListCurationActionsQuerySchema. — limit: z.coerce.number().int().min(1).max(100).default(50), offset:
    z.coerce.number().int().min(0).default(0),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/audit-window-ordered
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at The superRefine of ListCurationActionsQuerySchema.
    — if (Date.parse(value.created_from) >= Date.parse(value.created_to)) {'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/confirmation-activates
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at confirmItem — `UPDATE node_attribute
    SET status = ''active'' WHERE id = $1 AND status = ''uncertain''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/confirmation-keeps-assertion-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at confirmItem, whose SET clause
    changes only status — `UPDATE knowledge_link SET status = ''active'' WHERE id = $1 AND status = ''uncertain''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/confirmation-requires-uncertain
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the status guard of confirmItem,
    which updates only an uncertain item and reports the count of rows reached — `WHERE id = $1 AND status
    = ''uncertain'' RETURNING id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/corrected-item-provenance
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyProvenance, which copies the
    predecessor''s fragments, and appendProvenanceFragment, which adds the cited one — `INSERT INTO provenance
    (attribute_id, fragment_id, created_at) SELECT $2, fragment_id, now() FROM provenance WHERE attribute_id
    = $1` and `INSERT INTO provenance (attribute_id, fragment_id, created_at) VALUES ($1, $2, now())`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/corrected-item-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at insertCorrectedRow — `COALESCE($2::text,
    value), COALESCE($3::date, valid_from), COALESCE($4::date, valid_to), ''active''::assertion_status,
    confidence, COALESCE($5::valid_from_source, valid_from_source), NULL,`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/correction-supersedes-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at supersedePredecessor, which leaves
    valid_to untouched, and insertCorrectedRow, which records the new active item naming the predecessor
    — `SET status = ''superseded'', superseded_at = now()` and the new row''s `$1::uuid` bound to `supersedes_attribute_id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/curation-action-reason-length
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at The reason field of CurationActionSchema.
    — reason: z.string().max(1000).nullable(),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/curation-request-checked-first
  conforms: true
  how: 'src/modules/curation/routes/curation.routes.ts: held at The write handlers, which parse the path
    and body before they call the service that reads any node, link, attribute or fragment. — body = MergeNodesBodySchema.parse(request.body
    ?? {}); ... const result = await mergeNodesService({ pool: deps.pool, logger: deps.logger }, body.survivor_id,
    body.absorbed_id, body.reason);'
  encoded_at:
  - src/modules/curation/routes/curation.routes.ts
- node: rules/knowledge-base/current-assertion
  conforms: true
  how: 'src/modules/curation/service/entity-edit-effect.ts: held at `isCurrent` in entity-edit-effect.ts.
    — return held.valid_to === null && held.superseded_at === null;'
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
- node: rules/knowledge-base/entity-edit-addition
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-effect.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. The file holds only the
    insert primitive, and which change is an addition is decided elsewhere.` — `export async function
    insertNewAttribute(client: PoolClient, args: NewAttributeArgs)` takes `supersedesAttributeId: string
    | null` from the caller.; src/modules/curation/service/entity-edit-new-attribute.ts read `nowhere`
    — `recordNewAttribute` records whatever it is handed and takes `supersedes?: string`. It never decides
    addition against first-value or succession, and it never names an effect. — a binding asserts the
    file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
- node: rules/knowledge-base/entity-edit-adds-no-second-current-value
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-attributes.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. The file holds no refusal.
    loadAttributeIdsOfKeyForUpdate only reads the attributes the decision is made over.` — `WHERE node_id
    = $1 AND attribute_key_id = $2 AND status = ANY($3::assertion_status[]) FOR UPDATE` — a binding asserts
    the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-attributes.ts
- node: rules/knowledge-base/entity-edit-change-check-order
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at checkChange(), lines 130-139, the
    order of the calls — `resolveAttributeKey(...)`, then `checkChangeAgainstCatalog(...)`, then `checkChangeValidity(attributeKey,
    change, scope.editedAt);`, then `await checkChangeAgainstHeldAttributes(scope.client, target, change);`'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
- node: rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
  conforms: true
  how: 'src/modules/curation/service/entity-edit-attributes.ts: held at assertSupersessionTimeLeavesValue()
    together with SUPERSESSION_TIME_STATUSES — const carriesSupersessionTime = held.superseded_at !==
    null && SUPERSESSION_TIME_STATUSES.includes(held.status); if (carriesSupersessionTime && statesOtherValueThan(held,
    change)) { throw conflictOf('
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-attributes.spec.ts
- node: rules/knowledge-base/entity-edit-changes-something
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at assertSomethingChanged(), lines 228-235
    — `if (applied.every((change) => change.effect === UNCHANGED_EFFECT)) { throw new BusinessError(NO_CHANGES_CODE,`'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity-refusals.spec.ts
- node: rules/knowledge-base/entity-edit-check-order
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at editWithin(), lines 243-245, the
    active node loaded first and then the changes in the order given — `const node = await loadActiveNodeForEdit(client,
    nodeId);` then `const applied = await applyChanges(scope, body.changes);` with `for (const change
    of changes) {`'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
- node: rules/knowledge-base/entity-edit-correction
  conforms: true
  how: 'src/modules/curation/service/entity-edit-correction.ts: held at recordCorrection, the supersedeAttributeAtEdit
    call followed by the recordNewAttribute call with `supersedes`. The effect label correction and the
    choice of this case are not stated in this file. — `const superseded = await supersedeAttributeAtEdit(client,
    {` ... `const attributeId = await recordNewAttribute(client, { ...recorded, supersedes: predecessor.id,
    });`

    src/modules/curation/service/entity-edit-effect.ts: held at the `isCurrent(named)` branch of `effectOfNamedSet`.
    A key that is not temporal yields correction. — return attributeKey.is_temporal ? "succession" : "correction";'
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: rules/knowledge-base/entity-edit-defaulted-start-precedes-end
  conforms: true
  how: 'src/modules/curation/service/attribute-change-validity.ts: held at assertDefaultedStartPrecedesEnd()
    — change.kind === "set" && change.valid_from === undefined; ... change.valid_to !== undefined && change.valid_to
    <= today'
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/attribute-change-validity.spec.ts
- node: rules/knowledge-base/entity-edit-ended-attribute-correction
  conforms: true
  how: "src/modules/curation/service/entity-edit-correction.ts: held at The same supersede-then-record\
    \ sequence in recordCorrection. It applies whatever the predecessor's key and leaves the predecessor's\
    \ own validity end untouched. Selecting the case is not in this file. — `validTo: null,` passed to\
    \ supersedeAttributeAtEdit, whose update is `valid_to = COALESCE($2::date, valid_to)` in curation.repository.ts,\
    \ so an existing validity end is kept.\nsrc/modules/curation/service/entity-edit-effect.ts: held at\
    \ the `hasEndWithoutSupersession(named)` branch of `effectOfNamedSet`, which sits before the temporal\
    \ test, so it applies whatever the key. — if (hasEndWithoutSupersession(named)) {\n    return \"correction\"\
    ;\n  }"
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: rules/knowledge-base/entity-edit-first-value
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-effect.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. The file only inserts a
    row with the caller''s supersedesAttributeId.` — `readonly supersedesAttributeId: string | null;`;
    src/modules/curation/service/edit-entity.service.ts read `nowhere` — The effect is decided in `effect:
    decideChangeEffect(attributeKey, change, attributes),` in another file. This file writes the first
    value through `return recordNewAttribute(scope.client, input);` without deciding it.; src/modules/curation/service/entity-edit-new-attribute.ts
    read `nowhere` — `supersedesAttributeId: input.supersedes ?? null` forwards the caller''s choice.
    The first-value effect is not decided in this file. — a binding asserts the file answers for the node,
    so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
- node: rules/knowledge-base/entity-edit-leaves-disputes-to-curation
  conforms: true
  how: 'src/modules/curation/service/entity-edit-attributes.ts: held at assertDisputeLeftToCuration()
    and disputedOf() — const changesHeld = change.kind === "remove" || statesOtherValueThan(held, change);
    if (held.status === DISPUTED_STATUS && changesHeld) { throw disputedOf(held, change); }'
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
- node: rules/knowledge-base/entity-edit-names-a-live-attribute
  conforms: true
  how: 'src/modules/curation/service/entity-edit-attributes.ts: held at checkNamedAttribute() and isLiveAttributeOf()
    — if (held === undefined || !isLiveAttributeOf(held, target)) { throw conflictOf( ... held.node_id
    === target.node.id && held.attribute_key_id === target.attributeKey.id && LIVE_STATUSES.includes(held.status)'
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'A table of remove changes against expected outcomes. A remove change naming each of
    these must come back as a conflict: a deleted attribute of the edited node and key, a live attribute
    of another key of the edited node, a live attribute of another node, and an identity where nothing
    is held. A remove change naming an active, an uncertain or a disputed attribute of the edited node
    and key must be accepted.'
  read_at:
    node: sha256:5b401258a7dd466cd04600f8b733b534dac5acc03db23684c9a7ac8adfd3c7c6
    proof:
    - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
      digest: sha256:32396607f14c64e76f782988af0bc1ebb50b5bf2ae352abdb541d12157c77175
- node: rules/knowledge-base/entity-edit-names-an-active-node
  conforms: true
  how: 'src/modules/curation/service/entity-edit-node.ts: held at The status check in loadActiveNodeForEdit.
    — if (node.status !== ACTIVE_STATUS) {'
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  decided_by: reading
  remainder: testable
  remainder_why: Submit an entity edit through the edit operation itself, not through the guard. Use one
    edit per non-active status (needs_review, merged, deleted) and one naming an absent identity. Each
    should be refused (BUSINESS_NODE_NOT_ACTIVE, or RESOURCE_NOT_FOUND for the absent one) and leave the
    node as it stood. The same edit naming an active node should be applied.
  read_at:
    node: sha256:e595b0e761738994e5d6127248d854853ade4d2fdf3ed0c76a4f8ec37152d717
    proof:
    - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
      digest: sha256:41355e0fa09b5116d529f1f696704665d6c27e281635b6e41238cfccbf1f07ca
- node: rules/knowledge-base/entity-edit-new-attribute-state
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-new-attribute.ts,
    and src/modules/curation/service/entity-edit-succession.ts read `nowhere. The file delegates the new
    attribute''s recording to recordNewAttribute and sets no status, confidence or run itself.` — return
    recordNewAttribute(client, { ...recorded, supersedes: predecessor.id }); — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/service/entity-edit-succession.ts
- node: rules/knowledge-base/entity-edit-note
  conforms: false
  how: 'src/modules/curation/service/edit-entity.service.ts, lazyNote(), line 86, together with the removal
    branch of recordChange(), lines 204-211. scope.noteOf is called only from writeNewAttribute(), line
    178.: `recorded ??= recordOperatorNote(client, input);` and, in the removal branch, `await recordRemoval(scope.client,
    {` with `attributeId: removedId,` and `editedAt: scope.editedAt,`. The only call of the note is `note:
    await scope.noteOf(),` inside writeNewAttribute. — The node says an accepted entity edit records one
    raw information, one raw chunk and one accepted information fragment whose text is the reason. This
    file records them only when a change writes a new attribute. An edit made only of remove changes,
    such as the scenario that empties one email, is accepted. It rejects the attribute and records its
    curation action, but it records no note. recordRemoval is handed only `attributeId` and `editedAt`,
    and recordEditAction only `nodeId`, `reason` and `applied`. Neither receives the note or `scope.noteOf`.
    The removal then has no raw information, chunk or fragment behind its reason. The decision log of
    entity-edit-removal says "the note for the same edit records that moment", which assumes the note
    exists for a removal. A reader who trusts the node will not find the case where the code skips it.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-note.ts
- node: rules/knowledge-base/entity-edit-note-confidence
  conforms: true
  how: 'src/modules/curation/service/entity-edit-note.ts: held at The OPERATOR_NOTE_CONFIDENCE constant,
    passed to insertFragmentWithSources. — export const OPERATOR_NOTE_CONFIDENCE = 1.0; ... confidence:
    OPERATOR_NOTE_CONFIDENCE,'
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-note.spec.ts
- node: rules/knowledge-base/entity-edit-note-content
  conforms: true
  how: 'src/modules/curation/service/entity-edit-note.ts: held at composeNoteContent, called from recordOperatorNote
    with randomUUID() as the nonce. — return [reason, editedAt.toISOString(), nonce].join(NOTE_CONTENT_SEPARATOR);
    ... const content = composeNoteContent(reason, input.editedAt, randomUUID());'
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity-records.spec.ts
  - src/__tests__/unit/curation/entity-edit-note.spec.ts
- node: rules/knowledge-base/entity-edit-note-run
  conforms: true
  how: 'src/modules/curation/service/entity-edit-note.ts: held at recordOperatorNote. It opens the run
    for the note''s raw information and records the fragment under that same run''s id. — const run =
    await openOperatorRun(client, source.rawInformationId, source.contentHash); ... llmRunId: run.id,'
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-note.spec.ts
- node: rules/knowledge-base/entity-edit-note-source
  conforms: true
  how: 'src/modules/curation/service/entity-edit-note.ts: held at OPERATOR_NOTE_SOURCE_TYPE and the metadata
    argument in insertNoteSource. — const OPERATOR_NOTE_SOURCE_TYPE: SourceType = "outro"; ... metadata:
    { operator_note: true, node_id: nodeId },'
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-note.spec.ts
- node: rules/knowledge-base/entity-edit-null-field-is-not-stated
  conforms: true
  how: 'src/modules/curation/dto/edit-entity.dto.ts: held at nullAsNotStated, applied through .nullish().transform
    to value, item_id, valid_from and valid_to. — function nullAsNotStated<T>(value: T | null | undefined):
    T | undefined { return value ?? undefined; }'
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity.dto.spec.ts
- node: rules/knowledge-base/entity-edit-provenance
  conforms: true
  how: 'src/modules/curation/service/entity-edit-correction.ts: held at The copyProvenance call in recordCorrection
    holds the second half, the predecessor''s provenance carried to the new attribute. The first half,
    the edit fragment''s provenance, is not in this file. — `await copyProvenance(client, "attribute",
    predecessor.id, attributeId);`

    src/modules/curation/service/entity-edit-new-attribute.ts: held at the appendProvenanceFragment call
    in recordNewAttribute. It holds the fragment half only. Provenance inherited from a superseded attribute
    is not carried here. — `await appendProvenanceFragment(client, "attribute", attributeId, note.fragmentId);`'
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two assertions would close it. First, an entity edit that sets an attribute the node
    does not yet hold, with the expected result that the new attribute's provenance holds the edit's information
    fragment. Second, a correction of an attribute holding several provenance rows, run against a store
    that evaluates the copy's selection (not a fake that copies every row whatever the statement says).
    Its expected result is that the new attribute's provenance holds each of those fragments as well as
    the edit's own.
  read_at:
    node: sha256:1c42c5cdfb9d646a862c6bcffaa7c7a5bbf60c6f46541f24c84a33d161f1360c
    proof:
    - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
      digest: sha256:670773ca4bd2c5f2597d3432a9e8e5f3cc90c971bd204d0cd723541470c8db19
- node: rules/knowledge-base/entity-edit-reason-length
  conforms: true
  how: 'src/modules/curation/dto/edit-entity.dto.ts: held at The ENTITY_EDIT_REASON_MAX_LENGTH constant
    and the .max(...) on reason. The lower bound of 1 and the trim come from ReasonRequiredSchema, declared
    in enums.dto.js, which is outside the file set and was not read. — export const ENTITY_EDIT_REASON_MAX_LENGTH
    = 1000; ... reason: ReasonRequiredSchema.max(ENTITY_EDIT_REASON_MAX_LENGTH),'
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity.dto.spec.ts
- node: rules/knowledge-base/entity-edit-reason-trimmed
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-action.ts,
    src/modules/curation/service/entity-edit-note.ts, and src/modules/curation/service/edit-entity.service.ts
    read `nowhere` — `reason: body.reason,` and `openEditScope(client, deps.catalog, node, body.reason)`
    pass the reason through untouched. No trim appears in the file. — a binding asserts the file answers
    for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
  - src/modules/curation/service/entity-edit-note.ts
- node: rules/knowledge-base/entity-edit-records-curation-action
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at editWithin(), lines 247-251, the
    call that records the action and returns its id. The kind and payload are built in entity-edit-action.js.
    — `const actionId = await recordEditAction(client, { nodeId: node.id, reason: body.reason, applied,
    });`

    src/modules/curation/service/entity-edit-action.ts: held at `recordEditAction` and `appliedEntry`,
    lines 36-57 — action: ENTITY_EDIT_ACTION_KIND, target_kind: ENTITY_EDIT_ACTION_TARGET_KIND, target_id:
    input.nodeId, payload: { applied: input.applied.map(appliedEntry) }, reason: input.reason.trim(),'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity-answer.spec.ts
  - src/__tests__/unit/curation/entity-edit-action.spec.ts
- node: rules/knowledge-base/entity-edit-removal
  conforms: true
  how: "src/modules/curation/repository/curation.repository.ts: held at rejectAttributeAtEdit — `SET status\
    \ = 'deleted', superseded_at = $2::timestamptz WHERE id = $1 AND status IN ('active', 'uncertain',\
    \ 'disputed')`\nsrc/modules/curation/service/edit-entity.service.ts: held at recordChange(), removal\
    \ branch, lines 204-211 — `await recordRemoval(scope.client, { attributeId: removedId, editedAt: scope.editedAt,\
    \ });` followed by `return { ...applied, item_id: null, predecessor_id: removedId };`\nsrc/modules/curation/service/entity-edit-effect.ts:\
    \ held at the first branch of `decideChangeEffect` returns the effect removal. Marking the attribute\
    \ deleted and giving it a supersession time is not in this file. — if (change.kind === \"remove\"\
    ) {\n    return \"removal\";\n  }\nsrc/modules/curation/service/entity-edit-removal.ts: held at Partly.\
    \ The moment of the edit becomes the supersession time at `rejectedAt: input.editedAt` in recordRemoval.\
    \ The deleted status and the effect removal are not stated in this file. This file only calls rejectAttributeAtEdit,\
    \ which is declared in another file. — const rejected = await rejectAttributeAtEdit(client, {\n  \
    \  attributeId: input.attributeId,\n    rejectedAt: input.editedAt,\n  });"
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-removal.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity-records.spec.ts
- node: rules/knowledge-base/entity-edit-removal-names-an-attribute
  conforms: true
  how: 'src/modules/curation/dto/edit-entity.dto.ts: held at The third check in the AttributeChangeSchema
    superRefine. — if (change.kind === "remove" && change.item_id === undefined) { ... message: "A remove
    change must name the attribute it removes.",'
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity.dto.spec.ts
- node: rules/knowledge-base/entity-edit-run
  conforms: true
  how: 'src/modules/curation/service/entity-edit-note.ts: held at OPERATOR_NOTE_MODEL, OPERATOR_NOTE_PROMPT_VERSION,
    openOperatorRun and completeOperatorRun. — export const OPERATOR_NOTE_MODEL = "operator"; export const
    OPERATOR_NOTE_PROMPT_VERSION = "operator-edit-v1"; ... outcome: "completed",'
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity-records.spec.ts
  - src/__tests__/unit/curation/entity-edit-note.spec.ts
- node: rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity
  conforms: true
  how: 'src/modules/curation/service/entity-edit-new-attribute.ts: held at the first branch of validityOf
    — `if (!attributeKey.is_temporal) { return NO_VALIDITY; }` with `NO_VALIDITY` holding `validFrom:
    null, validTo: null, validFromSource: null`'
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: an entity edit that replaces the held value of a key that is not temporal,
    once with no stated validity and once stating a start and an end. One expected result: the attribute
    the edit records holds no validity start, no validity end and no validity-start basis. The check must
    read those columns as stored, including any value written directly into the SQL rather than passed
    as a parameter.'
  read_at:
    node: sha256:39f90ba9b5f66681bddda2349e5a8df6179ac235cf47dcf0abdd09a75acbab28
    proof:
    - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
      digest: sha256:0ddf7ef4aa91ef6403a5de089f8916b025c28a2d747f474f3432e6334d93c92c
- node: rules/knowledge-base/entity-edit-start-defaults-to-today
  conforms: true
  how: 'src/modules/curation/service/attribute-change-validity.ts: held at utcCalendarDateOf(), which
    computes today as the UTC calendar date of the moment of the edit. The recording of the default start
    and its basis received is not in this file. — return moment.toISOString().slice(0, ISO_DATE_LENGTH);

    src/modules/curation/service/entity-edit-new-attribute.ts: held at the `change.valid_from === undefined`
    branch of validityOf — `validFrom: utcCalendarDateOf(editedAt),` and `validFromSource: DEFAULTED_START_BASIS,`
    with `const DEFAULTED_START_BASIS: ValidFromSource = "received";`'
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: an entity edit made through the edit entry point with the clock fixed at a known
    instant, setting a temporal key and stating no validity start. Expected result: the recorded attribute''s
    start equals that instant''s UTC calendar date, and its basis is received.'
  read_at:
    node: sha256:7acc7b1aa8d6013627c7eebf0542280988d87dbb6c40f5770057f6f40f400307
    proof:
    - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
      digest: sha256:0ddf7ef4aa91ef6403a5de089f8916b025c28a2d747f474f3432e6334d93c92c
- node: rules/knowledge-base/entity-edit-stated-end-is-held
  conforms: true
  how: 'src/modules/curation/service/entity-edit-new-attribute.ts: held at validityOf, the validTo constant
    — `const validTo = change.valid_to ?? null;`'
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result would close it: an entity edit''s set change to
    a key that is not temporal, stating a validity end, expecting the recorded attribute to hold that
    end, plus the same change stating no end, expecting no end. That test would fail against the behaviour
    the offered proof currently pins for non-temporal keys. The disagreement has to be settled in the
    specification before such a test, or a narrower statement of the node, can be written.'
  read_at:
    node: sha256:33b9f9ee4d7c2096e2600c2c36e919869694d73b0dbe51e97a802d18eb462411
    proof:
    - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
      digest: sha256:0ddf7ef4aa91ef6403a5de089f8916b025c28a2d747f474f3432e6334d93c92c
- node: rules/knowledge-base/entity-edit-stated-start-is-stated
  conforms: true
  how: 'src/modules/curation/service/entity-edit-new-attribute.ts: held at the final return of validityOf
    — `validFrom: change.valid_from, validTo, validFromSource: STATED_START_BASIS,` with `const STATED_START_BASIS:
    ValidFromSource = "stated";`'
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: a set change stating a validity start for a temporal key that already holds
    a current value, so the change replaces it. One expected result: the successor attribute is recorded
    with exactly that start and the basis "stated". A second assertion of the same shape would close the
    addition case: a set change with a stated start to a multi-valued key, expecting that start and the
    basis "stated".'
  read_at:
    node: sha256:54e8cc5d38e384976721a4f0445a1b6c717f4d3f51cf92004751a75caad46d59
    proof:
    - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
      digest: sha256:0ddf7ef4aa91ef6403a5de089f8916b025c28a2d747f474f3432e6334d93c92c
- node: rules/knowledge-base/entity-edit-succession
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/edit-entity.service.ts,
    src/modules/curation/service/entity-edit-effect.ts, src/modules/curation/service/entity-edit-succession.ts,
    and src/modules/curation/repository/curation.repository.ts read `nowhere. The file holds the supersede
    and insert primitives, and the choice of the succession effect is made elsewhere.` — `export async
    function supersedeAttributeAtEdit(client: PoolClient, args: AttributeSupersessionArgs)`; src/modules/curation/service/entity-edit-new-attribute.ts
    read `nowhere` — The file never decides succession. It receives `readonly supersedes?: string;` from
    its caller. — a binding asserts the file answers for the node, so the pair that stopped holding it
    is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/service/entity-edit-succession.ts
- node: rules/knowledge-base/entity-edit-succession-closes-the-previous
  conforms: true
  how: "src/modules/curation/service/entity-edit-succession.ts: held at validityEndGivenTo, lines 14-22,\
    \ and its use in recordSuccession. — if (predecessor.valid_from === null || newStart > predecessor.valid_from)\
    \ {\n    return newStart;\n  }\n  return null;"
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  decided_by: reading
  remainder: testable
  remainder_why: Run the succession so the statement it issues is actually executed against node_attribute,
    then read the superseded row back. Take a superseded attribute starting 2026-03-01. With a new start
    of 2026-03-02 the stored valid_to should be 2026-03-02. With a new start of 2026-03-01 or 2026-02-28
    the stored valid_to should be NULL. Take a superseded attribute with no start. With a new start of
    2026-09-01 the stored valid_to should be 2026-09-01.
  read_at:
    node: sha256:5ded99979006ed8652a95866675cae28009bd950657f5005a7a9b88caa9021f5
    proof:
    - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
      digest: sha256:444dfedb1e3efce7c77cd1894f1c1e58f8d3d352032e5a4c596ad85ef5ebd124
- node: rules/knowledge-base/entity-edit-supersession-time
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-correction.ts,
    src/modules/curation/service/entity-edit-succession.ts, and src/modules/curation/repository/curation.repository.ts
    read `nowhere. supersedeAttributeAtEdit writes the supersededAt it is given, and which moment or null
    is chosen elsewhere.` — `superseded_at = $3::timestamptz` with `readonly supersededAt: Date | null;`
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-succession.ts
- node: rules/knowledge-base/entity-edit-unchanged-records-nothing
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/edit-entity.service.ts,
    src/modules/curation/service/entity-edit-effect.ts, and src/modules/curation/service/entity-edit-attributes.ts
    read `nowhere` — This file only refuses. It has no branch that reports the effect unchanged. The nearest
    construct is statesOtherValueThan(), whose `change.value !== held.value` comparison only decides refusals.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: rules/knowledge-base/entity-edit-value-matches-the-kind
  conforms: true
  how: 'src/modules/curation/dto/edit-entity.dto.ts: held at The first two checks in the AttributeChangeSchema
    superRefine. — if (change.kind === "set" && !statesValue) { ... if (change.kind === "remove" && statesValue)
    {'
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/edit-entity.dto.spec.ts
- node: rules/knowledge-base/entity-match-queue-entry
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at listEntityMatchQueue — `WHERE
    kn.status = ''needs_review'' ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST`
    with `LEFT JOIN entity_match_review em ON em.node_id = kn.id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at deleteEntityMatchReviewByNode
    — `DELETE FROM entity_match_review WHERE node_id = $1 RETURNING id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/keep-separate-activates-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeStatusKeepSeparate —
    `UPDATE knowledge_node SET status = ''active'' WHERE id = $1 AND status = ''needs_review''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clauses of copyProvenance
    and appendProvenanceFragment for links — `ON CONFLICT (link_id, fragment_id) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-compresses-paths
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at pathCompressMergedInto — `UPDATE
    knowledge_node SET merged_into_node_id = $2 WHERE merged_into_node_id = $1`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-copies-aliases
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyAliases — `INSERT INTO node_alias
    (node_id, alias, kind, created_by_run_id, created_at) SELECT $2, alias, ''alias'', created_by_run_id,
    created_at FROM node_alias WHERE node_id = $1 ON CONFLICT (node_id, alias_norm) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-marks-absorbed-merged
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeMerged — `SET status
    = ''merged'', merged_into_node_id = $2 WHERE id = $1`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-repoints-assertions
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at repointLinks and repointAttributes
    — `WHERE source_node_id = $1 OR target_node_id = $1` and `UPDATE node_attribute SET node_id = $2 WHERE
    node_id = $1`, neither filtering by status'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-assertion-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the uncertainRes and disputedRes
    queries in aggregateCurationMetrics — `(SELECT count(*) FROM knowledge_link_resolved WHERE effective_status
    = ''uncertain'') + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status = ''uncertain'')`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-disputed-queue-count
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the disputedQueueRes query in
    aggregateCurationMetrics — `SELECT DISTINCT ''link'' AS k, source_node_id, target_node_id, link_type_id
    FROM knowledge_link WHERE status = ''disputed'' UNION ALL SELECT DISTINCT ''attribute'', node_id,
    attribute_key_id, NULL::uuid FROM node_attribute WHERE status = ''disputed''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-review-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the needsReviewRes query and the
    entityMatchQueueCount assignment in aggregateCurationMetrics — `WHERE status = ''needs_review''` and
    `const entityMatchQueueCount = needsReviewCount;`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at The limit field of ListCurationActionsQuerySchema.
    — limit: z.coerce.number().int().min(1).max(100).default(50),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/page-offset-non-negative
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at The offset field of ListCurationActionsQuerySchema.
    — offset: z.coerce.number().int().min(0).default(0),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/prefer-one-outcome
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at resolveDisputeWinner and resolveDisputeLosers
    — `SET status = ''active'' WHERE id = $1 AND status = ''disputed''` and `SET status = ''deleted'',
    superseded_at = now() WHERE id = ANY($1::uuid[]) AND status = ''disputed''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/reject-rate-by-code
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the rejectsRes query and the rejectRateByCode
    loop in aggregateCurationMetrics. The payload field name it reads is reported as unstated. — `rejectRateByCode[row.code]
    = Number(row.total) / totalActions;` over `WHERE action = ''reject_item'' AND payload ? ''error_code''
    GROUP BY 1`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/rejection-and-correction-require-live-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the status guards of rejectItem
    and supersedePredecessor — `WHERE id = $1 AND status IN (''active'', ''uncertain'', ''disputed'')`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/rejection-deletes
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at rejectItem — `SET status = ''deleted'',
    superseded_at = now() WHERE id = $1 AND status IN (''active'', ''uncertain'', ''disputed'')`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-order
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ORDER BY clauses of listEntityMatchQueue,
    listDisputedLinks and listDisputedAttributes, which hold the entity-match order and the per-item dispute
    order. The cross-kind order is not held here. — `ORDER BY kn.created_at ASC, kn.id ASC, em.similarity
    DESC NULLS LAST` and `ORDER BY kl.recorded_at ASC, kl.id ASC`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-page-windows-entries
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the LIMIT and OFFSET of listEntityMatchQueue,
    listDisputedLinks and listDisputedAttributes, each applied to its own rows — `LIMIT $1 OFFSET $2`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at countEntityMatchQueue, countDisputedLinks
    and countDisputedAttributes, which carry no page — `SELECT count(*)::text AS total FROM knowledge_node
    WHERE status = ''needs_review''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/stable-key-change-states-no-validity
  conforms: true
  how: 'src/modules/curation/service/attribute-change-validity.ts: held at assertStableKeyStatesNoValidity()
    — if (!attributeKey.is_temporal && statesValidity) {'
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/attribute-change-validity.spec.ts
- node: rules/knowledge-base/unrecorded-temporality-is-not-temporal
  conforms: true
  how: 'src/modules/curation/service/attribute-change-validity.ts: held at the negation in assertStableKeyStatesNoValidity(),
    which reads a key as not temporal whenever is_temporal is falsy — !attributeKey.is_temporal && statesValidity

    src/modules/curation/service/entity-edit-new-attribute.ts: held at the first branch of validityOf.
    `is_temporal` is a non-nullable boolean in AttributeKeyRow, so a falsy value is read as not temporal.
    — `if (!attributeKey.is_temporal) {`'
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
- node: rules/knowledge-base/validity-start-before-end
  conforms: true
  how: 'src/modules/curation/service/attribute-change-validity.ts: held at assertStartBeforeEnd() — if
    (change.valid_from >= change.valid_to) {'
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
- node: scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing
  conforms: true
  how: 'src/modules/curation/service/edit-entity.service.ts: held at assertSomethingChanged(), inside
    the transaction, so nothing is recorded. An empty list passes `every` vacuously. — `if (applied.every((change)
    => change.effect === UNCHANGED_EFFECT)) {`'
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: One input against one result. The input is an edit carrying a reason and an empty changes
    list, aimed at an active person node and submitted through the edit's request boundary (the route,
    with the body schema it applies). The expected result is a refusal answered as BUSINESS_ENTITY_EDIT_NO_CHANGES
    and not as a VALIDATION_* malformed-request code, with the store left exactly as it was before the
    edit.
  read_at:
    node: sha256:67c0952f78e4ac8d5b3e70cff548112e8aede6e80ec079152e70fa9154d7cfd4
    proof:
    - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
      digest: sha256:15dd00774fd007f7c406d6d8ab39d4cfa00e6233e11b76737cbb52ca218e7301
- node: scenarios/knowledge-base/backdated-start-supersedes-without-an-end
  conforms: true
  how: 'src/modules/curation/service/entity-edit-succession.ts: held at validityEndGivenTo returns null
    when the new start does not exceed the predecessor''s start, so the earlier attribute is given no
    validity end. The stated basis is recorded elsewhere. — newStart > predecessor.valid_from'
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result, through the owner''s project-edit entry point
    and not recordSuccession. Input: a project holding an active status_text that starts on 2026-10-01
    with no validity end, and an edit with a set change on status_text to another value, stating a validity
    start of 2026-09-01. Expected: the earlier status is superseded and has no validity end, and the new
    status starts on 2026-09-01 with the basis stated.'
  read_at:
    node: sha256:8120a422bb4853f4cc7e0fd4786d58b13e5ebc752f54b1890690bf91a090be6c
    proof:
    - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
      digest: sha256:444dfedb1e3efce7c77cd1894f1c1e58f8d3d352032e5a4c596ad85ef5ebd124
- node: scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/service/entity-edit-attributes.ts,
    and src/modules/curation/service/edit-entity.service.ts read `nowhere` — This file only calls `await
    checkChangeAgainstHeldAttributes(scope.client, target, change);`. The conflict is decided in entity-edit-attributes.js.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-attributes.ts
- node: scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
  conforms: false
  how: "the fact left part of its ground: still held in src/modules/curation/repository/curation.repository.ts,\
    \ and src/modules/curation/service/entity-edit-effect.ts read `nowhere. This file only returns the\
    \ effect removal for a remove change. It marks nothing deleted and does not scope the change to one\
    \ attribute.` — if (change.kind === \"remove\") {\n    return \"removal\";\n  }; src/modules/curation/service/entity-edit-removal.ts\
    \ read `nowhere. The only attribute rejected is the one named by `input.attributeId`, but the file\
    \ states no scenario and holds no status or effect.` — attributeId: input.attributeId, — a binding\
    \ asserts the file answers for the node, so the pair that stopped holding it is released by `--bind\
    \ ... --replace`, never restamped here"
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-effect.ts
  - src/modules/curation/service/entity-edit-removal.ts
- node: scenarios/knowledge-base/stable-key-edit-is-a-correction
  conforms: true
  how: 'src/modules/curation/service/entity-edit-correction.ts: held at recordCorrection holds the supersession
    that keeps no validity end of its own, and the new attribute that names the earlier one. Effect reporting
    is not in this file. — `validTo: null,` and `supersedes: predecessor.id,`

    src/modules/curation/service/entity-edit-effect.ts: held at the effect decision only, in the `isCurrent(named)`
    branch of `effectOfNamedSet`. Superseding the earlier attribute and recording the new one happen elsewhere.
    — return attributeKey.is_temporal ? "succession" : "correction";'
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  - src/modules/curation/service/entity-edit-effect.ts
- node: scenarios/knowledge-base/temporal-edit-without-a-date-starts-today
  conforms: true
  how: "src/modules/curation/service/entity-edit-succession.ts: held at The predecessor's validity end\
    \ is set to the new start in validityEndGivenTo. The default start of today and the basis received\
    \ come from validityOf in another file. — const newStart = validityOf(\n    input.target.attributeKey,\n\
    \    input.change,\n    input.editedAt\n  ).validFrom;"
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
unstated:
- file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  where: CONTRACT_ROWS, the `details` objects the expected refusals pin, lines 285, 293-296, 303-306,
    313-316, 323-327, 361-364, 393, 403-406 and 425-428.
  evidence: 'expected: refusedWith(404, NOT_FOUND_CODE, { node_id: ABSENT_NODE_ID }),

    expected: refusedWith(409, NOT_ACTIVE_CODE, { node_id: NEEDS_REVIEW_NODE_ID, status: "needs_review"
    }),

    expected: refusedWith(422, UNKNOWN_KEY_CODE, { attribute_key: UNCATALOGUED_KEY, node_type: "Project"
    }),

    expected: refusedWith(422, INVALID_VALUE_CODE, { value_type: "date", value: "not-a-date" }),

    allowed_values: expect.arrayContaining([PHASE_VALUE, OTHER_PHASE_VALUE]),'
  cost: The test fixes the wire field names of each refusal's `details`. Those names are `node_id`, `status`,
    `attribute_key`, `node_type`, `value_type`, `value`, `allowed_values` and `item_id`. The contract
    says only that the refusal "names" the node, the key and the node type, and so on, and it gives no
    field name. So a client of the edit route would look in the contract for the shape of `details`, find
    none, and have to read this test to learn it. A change of a name would be decided here and never reach
    the contract.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  where: namedBy(), lines 124-130, used by the it.each over PATH_NODES (lines 206-219)
  evidence: '`return answer.node_id ?? answer.error?.details?.node_id;`'
  cost: The test fixes the wire key `details.node_id` as the place a refusal names the node. The contract
    says only that the refusal is "naming the node". A reader who looks in the specification for where
    the refused node's identity travels finds no key, and the test is then the only place that decides
    it. A later change of that key would fail here with no node to say which side was decided.
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  where: the assertion of the raw information's source type, in the test "has source type other and metadata
    of operator_note true and the edited node's identity under node_id" (line 298)
  evidence: 'source_type: "outro",'
  cost: The spelling in which a source type of other is stored sits only in this test. The node says only
    "source type other". The rule that gives "outro" as the material's word governs how a source type
    crosses the wire, not how it is stored. Someone who changes the stored spelling reads the specification,
    finds no stored spelling there, and has no node that tells them this assertion is the one to update.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  where: the it.each over ENTITY_EDIT_BUSINESS_REFUSALS, lines 85-92, and the list declared at lines 11-17
  evidence: '"logs %s as a warning and never at error level" ... expect(result.logLevel).toBe("warn");'
  cost: The node says only that a business or validation refusal is never logged at error level. The test
    fixes the level at warn for each entity edit refusal code. A later change to info or debug stays inside
    the node and still fails this test. The next reader will take warn as a decision the business made,
    and will look in the specification for it and not find it. The node's decision log mentions warn only
    for the chat streaming case.
- file: src/app.ts
  where: the `/_self` route registered on the authenticated scope, lines 83-86
  evidence: 'scoped.get("/_self", async (request) => ({ ok: true, result: { user_id: request.user?.id
    ?? null }, }));'
  cost: The code serves an operation at GET /api/v1/_self that answers the caller's identity as `user_id`,
    null when none. No node of the specification names this operation or its answer. The access contract
    lists only authenticate-owner, route-request and read-health, so a client depends on an answer nobody
    decided.
- file: src/app.ts
  where: the `toolNames` allowlist of `registerIngestMcpTransport`, line 114
  evidence: '"get_ingestion_status",'
  cost: This allowlist names an ingest tool, `get_ingestion_status`, that no node holds. The ingestion
    contract holds `ingest_document`, `ingest_directed` and `list_recent_ingestions`, and `health` belongs
    to the access contract. A status tool is also what an asynchronous ingestion would need, and the ingest
    toolset is constrained not to offer one. The name's presence cannot be weighed against the specification.
- file: src/app.ts
  where: the fallback origins of `corsOrigins`, lines 65-68, passed as `origin` to `fastifyCors` at line
    69
  evidence: const corsOrigins = env.CORS_ORIGINS ?? [ "http://localhost:5173", "http://127.0.0.1:5173",
    ];
  cost: Which origins may call the system when no origin list is configured is decided only here. The
    specification states that an allowed origin is echoed back, and never which origins are allowed or
    what the default is. A reader looking in the specification for who may reach the API finds no answer.
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: TargetKindSchema, the last enumeration member (line 22)
  evidence: '"raw_information",'
  cost: The curation-target-kind node holds this member as `raw-information`. The only rule that writes
    hyphens as underscores for curation actions, a-curation-action-kind-is-written-with-underscores, covers
    the action kind and nothing else. The target-kind filter value a listing accepts is therefore decided
    only in this schema. The next reader looks in the specification for how `raw-information` is spelled
    on the wire and finds the hyphen form. A client that follows the node and sends `raw-information`
    is refused as outside the closed set.
- file: src/modules/curation/repository/curation.repository.ts
  where: the reject-rate query inside aggregateCurationMetrics, the rejectsRes statement
  evidence: '`SELECT (payload->>''error_code'') AS code,` ... `WHERE action = ''reject_item'' AND payload
    ? ''error_code''`'
  cost: The name of the payload field that carries a rejection's error code is stated only in this query.
    The node says only that a reject-item action's payload "carries" an error code. No node names the
    field or says what counts as one. A writer of reject-item payloads that spells the field differently
    drops out of the rate silently, and the next reader looks in the specification for the field's name
    and finds nothing.
- file: src/modules/curation/routes/curation.routes.ts
  where: the catch block of the GET /metrics handler, lines 80-98 (the logger.warn call)
  evidence: 'deps.logger.warn({ route: "GET /api/v1/curation/metrics", operation: "getCurationMetrics",
    transport: "rest", original_status: statusCode, outcome: degradedStatus, error_code: degradedEnvelope.error.code,
    ... cause_message: err instanceof Error ? err.message : String(err), }, "curation_metrics_degraded")'
  cost: The log name, the warn level, and the choice to log the cause of a degraded metrics read live
    only in this handler. Specification constraints do hold the logging facts of curation (a failed write
    is logged at error level as curation_request_failed), so the next reader looks for this one there
    and finds nothing. A person tuning alerts could not tell that a degraded read is logged at warn and
    a failed write at error.
- file: src/shared/error-mapping.ts
  where: codeToHttpStatus, the BUSINESS_CHAT_INGEST_DISABLED entry (line 99)
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: A refusal code and its HTTP status that no node in the specification holds. A reader looking in
    the specification for when chat ingestion is disabled, and what it answers, finds nothing. The decision
    lives only in this table.
- file: src/shared/error-mapping.ts
  where: codeToHttpStatus, the RESOURCE_ALREADY_EXISTS entry (line 55)
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: The code and its status exist only in this table. A reader who looks in the specification for
    what an "already exists" refusal answers finds no node that names the code or its status. The table
    becomes the place where that decision lives.
unbound:
- src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
- src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
- src/__tests__/integration/curation/edit-entity-route-harness.ts
- src/__tests__/integration/curation/edit-entity-routing.ts
- src/__tests__/integration/curation/edit-entity.routes.spec.ts
- src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
- src/__tests__/unit/curation/attribute-change-catalog.spec.ts
- src/__tests__/unit/curation/attribute-change-validity.spec.ts
- src/__tests__/unit/curation/edit-entity-answer.spec.ts
- src/__tests__/unit/curation/edit-entity-records.spec.ts
- src/__tests__/unit/curation/edit-entity-refusals.spec.ts
- src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
- src/__tests__/unit/curation/edit-entity-world.ts
- src/__tests__/unit/curation/edit-entity.dto.spec.ts
- src/__tests__/unit/curation/entity-edit-action.spec.ts
- src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
- src/__tests__/unit/curation/entity-edit-attributes.spec.ts
- src/__tests__/unit/curation/entity-edit-correction.spec.ts
- src/__tests__/unit/curation/entity-edit-effect.spec.ts
- src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
- src/__tests__/unit/curation/entity-edit-node.spec.ts
- src/__tests__/unit/curation/entity-edit-note.spec.ts
- src/__tests__/unit/curation/entity-edit-removal.spec.ts
- src/__tests__/unit/curation/entity-edit-succession.spec.ts
- src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
- src/modules/curation/index.ts
notes: 'Judged by 46 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/entity-edit-backend.returns/.

  Certification of constraints/entity-edit-is-atomic did not hold: the auditor answered `partial` — The
  "not at all" half is tested at one failure point only. One test makes the curation action insert fail
  during a mixed edit and asserts the whole store equals its snapshot from before the edit. Two other
  tests cover edits refused for an unknown key or a conflict, and both also assert the store is untouched.
  Three parts of the fact are not exercised. (1) The "together" half. No test reads the store after an
  accepted edit. The one accepted case ("is refused exactly when no change has an effect other than unchanged...")
  asserts only the outcome code. Nothing shows that the raw information, raw chunk, information fragment,
  LLM run, new and superseded attributes, provenance and curation action all take effect when the edit
  succeeds. (2) A failure at any other write. "is answered as a temporal incoherence" makes the node_attribute
  insert fail but asserts only the code, not the store. So nothing shows that the raw information, chunk,
  fragment and run written before that point are withdrawn. (3) The order of the writes. The single curation_action
  failure catches only records written before it. Two things claim it is the last write: the test''s describe
  text and the edit-entity-world fixture (mixedEdit, world.untouched). The test asserts neither. The pack
  does not offer the fixture as proof, and this audit did not open it. A write made after the curation
  action, outside the transaction, would therefore pass this test. So would a mixed edit that never produces
  one of the named record kinds.. The node is decided by reading, and a certification standing on it from
  an earlier reconciliation is released by the bind. The remainder is testable: Two kinds of assertion
  would close it. First: one accepted mixed edit (a set on a held attribute, a first value, and a supersession),
  checked against a store that then holds a raw information, a raw chunk, an information fragment, an
  LLM run, the new attributes, the superseded attributes marked superseded, provenance for each new attribute,
  and a curation action. Second: the same mixed edit with the failure injected in turn at each write (raw_information,
  raw_chunk, information_fragment, llm_run, the node_attribute insert, the supersession update, provenance,
  curation_action), each checked against a store equal to its snapshot from before the edit..

  Certification of contracts/knowledge-base/entity-editing did not hold: the auditor answered `partial`
  — Every refusal the contract lists has a row. Each row checks the stated status and code, the named
  details, and, for the format, unavailable and internal answers, the fixed message. The format rows also
  check the {path, message} issue shape and the "."-joined path. The accepted answer is only partly bound.
  The accepted row checks that the body has no envelope, that node_id is the edited node, and that applied
  has its six entries with their attribute_key, effect, and the nulls where an effect has none. But action_id
  is checked only as any string, and so is every non-null item_id. The contract says action_id is the
  identity of the curation action the edit recorded. A route that returned an action_id or item_id matching
  no recorded action or written attribute would still pass. That correspondence is the part left unexercised.
  Some parts of this judgment rest on helper files the pack did not offer and I did not open. The POST
  /api/v1/nodes/{node_id}/edit path is built inside sendEdit in edit-entity-route-harness.js. The "in
  the order given" half depends on the order of changes inside mixedEdit in edit-entity-world.js. The
  service module is replaced through vi.mock by a forwarding module in edit-entity-routing.js. Two describe
  blocks in this file assert things this node does not state. "an edit failing a format check and a later
  check" asserts that the format refusal wins over not-found, not-active and unknown-key. "a refusal for
  a business or validation cause" asserts that no error-level log is written. Neither ordering nor logging
  is in this node, so I do not cite them as proof here. Each asserts a fact that some other node has to
  hold.. The node is decided by reading, and a certification standing on it from an earlier reconciliation
  is released by the bind. The remainder is testable: One accepted edit against one expected result. action_id
  should equal the identity of the curation action that the edit recorded in the store. Each non-null
  item_id should equal the identity of the attribute row that its change wrote. Both are read back from
  the world after the request, instead of being checked as any string..

  Certification of domain/knowledge-base/applied-change held (src/__tests__/unit/curation/edit-entity-answer.spec.ts,
  src/__tests__/unit/curation/edit-entity-answer.spec.ts, src/__tests__/unit/curation/edit-entity-answer.spec.ts
  would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and
  a test-decided binding rests on a reading that did.

  Certification of domain/knowledge-base/assertion-status held (src/__tests__/unit/curation/entity-edit-effect.spec.ts
  would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and
  a test-decided binding rests on a reading that did.

  Certification of domain/knowledge-base/attribute-change did not hold: the auditor answered `partial`
  — The shape of the change is exercised as accept/refuse outcomes. The tests check that attribute_key
  is a required string and that kind is required and limited to set and remove. They check that value
  and item_id are strings. They check that valid_from and valid_to are refused unless written YYYY-MM-DD.
  They check that value, item_id and the validity fields may be left out. But the tests never read what
  a change carries. outcomeOf only records accepted or refused. "set stating every field" is accepted,
  but nothing is read back from what was parsed. nullableProjection compares two parses with each other,
  not with what the change stated. So a schema that accepted a change and then dropped or altered its
  value, its item_id (the current attribute it replaces or removes) or its validity would still pass every
  test. The node says the change carries one field of the entity form to the knowledge base, and that
  part is unexercised: no test in the offered proof follows a change past parsing. The date typing is
  only exercised by format. Nothing submits a well-formed impossible date such as 2024-13-45. Over-assertion,
  for a reader to route: the proof asserts more than this node states. The node types item_id as a plain
  string, but the test refuses "not-an-identifier". The node lists value and item_id as optional with
  no condition, but the tests require value exactly when kind is set, require item_id on remove, and refuse
  a value on remove. Those may be facts of another node. They are not this node''s. The reason, top-level
  body, refusal-message and issue-path tests in the same file concern the edit body around the change,
  not this value object.. The node is decided by reading, and a certification standing on it from an earlier
  reconciliation is released by the bind. The remainder is testable: Input: a set change that states attribute_key,
  kind, value, item_id, valid_from and valid_to. Expected result: the parsed change (and the edit applied
  from it) carries each of those exactly as stated. Do the same for a remove change: it should carry its
  item_id and its validity. Then one input of a YYYY-MM-DD string that is not a real date for valid_from,
  expected to be refused..

  Certification of domain/knowledge-base/attribute-change-kind did not hold: the auditor answered `partial`
  — The tests fully check that the enumeration''s values are exactly set and remove. "holds exactly set
  and remove as the change kinds" checks the full list of options. "accepts exactly the change kinds set
  and remove" accepts both and refuses add, SET, the empty string, null and a number. The node''s description
  also says what each kind asks for. A set puts a value in place. A remove takes away the attribute''s
  current value. The offered tests check only the outline of that meaning. A set must state a value. A
  remove must name an attribute and state no value. decideChangeEffect classifies a remove as "removal".
  No test in the offered proof applies a change and reads the result. Nothing checks that, after a set,
  the stated value is the attribute''s current value. Nothing checks that, after a remove, the named attribute
  no longer holds a current value. If either kind changed what it does to the stored attribute, every
  offered test would still pass. Tests outside the offered proof may cover the applied behavior, for example
  the apply-entity-edit delivery''s tests. They were not offered and are not cited here.. The node is
  decided by reading, and a certification standing on it from an earlier reconciliation is released by
  the bind. The remainder is testable: Two tests would close it. First, apply a set change with a given
  value to an entity''s attribute key, then read the key back. Expected: that value is the attribute''s
  current value. Second, apply a remove change that names a live attribute, then read the key back. Expected:
  the named attribute no longer holds a current value..

  Certification of domain/knowledge-base/curation-action-kind did not hold: the auditor answered `partial`
  — The node''s set is these eight kinds and no others. The proof checks the first half: "admits $written
  as the action filter" sends each of the eight kinds, in its underscore spelling, to ListCurationActionsQuerySchema
  and requires that it parse. If a kind were dropped, that test would fail. The "no others" half is never
  tested. The only values the set expects to be refused are the hyphen spellings of the same eight kinds.
  Nothing submits a kind outside the eight, so a ninth kind admitted by the schema would pass every test
  in the set. The proof also reaches the kinds only through the list endpoint''s query filter. Nothing
  in it records a curation action, so the node''s statement that these are the kinds an action records
  is tested only through the filter that reads them back. The test "refuses the hyphen spelling $enumerated
  as the action filter" also asserts more than the node states. The node writes its values with hyphens.
  This test requires those exact spellings to be refused, which makes the underscore wire spelling the
  thing being enforced. The node does not decide that spelling. A reader should route this as a finding;
  it adds no coverage of the node.. The node is decided by reading, and a certification standing on it
  from an earlier reconciliation is released by the bind. The remainder is testable: Two assertions would
  close it. First, a kind outside the eight, such as approve_item, is sent as the action filter and must
  be refused. Second, the set of action values the schema admits is asserted to equal exactly the eight
  kinds the node lists..

  Certification of domain/knowledge-base/edit-effect held (src/__tests__/unit/curation/entity-edit-effect.spec.ts,
  src/__tests__/integration/curation/edit-entity.routes.spec.ts, src/__tests__/integration/curation/edit-entity.routes.spec.ts
  would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and
  a test-decided binding rests on a reading that did.

  Certification of domain/knowledge-base/live-assertion-status did not hold: the auditor answered `partial`
  — The node states which statuses count as still held for two subjects, a knowledge link and a node attribute.
  For the node attribute the offered proof does decide the enumeration. A named attribute is treated as
  held for active, uncertain and disputed, and refused as no longer held for superseded and deleted. A
  single-current key whose only attribute is disputed still counts as holding a value, while one whose
  attributes are all superseded or deleted does not. The exported LIVE_STATUSES constant is asserted to
  be exactly active, uncertain and disputed. Nothing in the offered proof holds or reads a knowledge link
  at any status, so the link half of the fact goes unexercised. The LIVE_STATUSES and AssertionStatusSchema
  tests assert the values of exported constants. They would fail if the set changed, but not if the link
  path held its own list of statuses, so they do not close the link half. "holds exactly the five assertion
  statuses" also asserts the whole status vocabulary, superseded and deleted included. That is more than
  this node states: the node names only the three live statuses and defines the rest only as what it excludes..
  The node is decided by reading, and a certification standing on it from an earlier reconciliation is
  released by the bind. The remainder is testable: For each of the five statuses (active, uncertain, disputed,
  superseded, deleted), hold one knowledge link with that status and run the operation that decides whether
  a link is still held. The expected result is that active, uncertain and disputed links are treated as
  held, and superseded and deleted links are not..

  Certification of rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores held (src/__tests__/integration/curation/edit-entity.routes.spec.ts,
  src/__tests__/integration/curation/edit-entity.routes.spec.ts, src/__tests__/integration/curation/edit-entity.routes.spec.ts,
  src/__tests__/unit/curation/edit-entity-answer.spec.ts would fail if the fact stopped holding) and is
  not written: the judgment did not clear the node, and a test-decided binding rests on a reading that
  did.

  Certification of rules/knowledge-base/entity-edit-adds-no-second-current-value did not hold: the auditor
  answered `partial` — The decision is fully tested at the guard. The named test runs one set change that
  names no attribute against each case: a single-current key holding an active, an uncertain or a disputed
  attribute of the edited node is refused as a conflict. A single-current key whose attributes are all
  superseded or deleted is accepted. So is a single-current key holding no attribute, one held live only
  by another node, one whose live attribute is on another key, and a multiple-current key holding an active
  attribute. If the guard''s condition changed, this test would fail. The gap is that the test calls checkChangeAgainstHeldAttributes
  directly. Its stub client rejects any statement other than a SELECT from node_attribute, so no entity
  edit is ever attempted. The fact says the change MUST NOT be made. Suppose the entity edit stopped consulting
  this check before writing. The fact would then stop holding and the named test would still pass. So
  nothing in the offered proof shows that the refused change is actually not made.. The node is decided
  by reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: Test one input against one expected result. The input is an entity edit,
  sent through the edit''s own entry point, carrying a set change that names no attribute. It targets
  a key that does not allow multiple current values, on a node that already holds a live attribute of
  that key. The expected result is a refusal with BUSINESS_ENTITY_EDIT_CONFLICT, and afterwards the node
  holds exactly the one current attribute it held before..

  Certified rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time as decided
  by step `test`: src/__tests__/unit/curation/entity-edit-attributes.spec.ts (is refused as a conflict
  only when the attribute is active or uncertain and the change states a value other than its own); src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  (for a value change to an attribute carrying a supersession time names the change''s attribute key);
  src/__tests__/unit/curation/entity-edit-attributes.spec.ts (for a value change to an attribute carrying
  a supersession time names the attribute the change names); src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  (for a value change to an attribute carrying a supersession time is answered HTTP 409) would fail if
  the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-changes-something as decided by step `test`: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  (is refused exactly when no change has an effect other than unchanged, whether every change is unchanged
  or the list is empty); src/__tests__/unit/curation/edit-entity-refusals.spec.ts (records nothing when
  every one of its changes is unchanged); src/__tests__/unit/curation/edit-entity-refusals.spec.ts (is
  refused as changing nothing, with nothing recorded, when an active node is edited with a reason and
  an empty list of changes) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-defaulted-start-precedes-end as decided by step `test`: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (answers BUSINESS_TEMPORAL_INCOHERENT when the end is of today); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (answers BUSINESS_TEMPORAL_INCOHERENT when the end is earlier than today); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (answers accepted when the end is later than today); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (is not held to the defaulted-start rule when its end is not after today); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (is not refused when it states neither a validity start nor a validity end); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (takes today as the UTC calendar date when the server zone is behind UTC); src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (takes today as the UTC calendar date when the server zone is ahead of UTC) would fail if the fact stopped
  holding.

  Certification of rules/knowledge-base/entity-edit-first-value did not hold: the auditor answered `partial`
  — The test sends a set change with no attribute named. It goes to the phase key, and the node holds
  a phase attribute only in status superseded. The test asserts all three parts of the fact: the effect
  is first_value, one new attribute is recorded with status active, and its supersedes_attribute_id is
  null. It would fail if the effect changed, if the status changed, or if the new attribute named the
  superseded one as its predecessor. So the success path and the superseded case are proven. The fact''s
  condition is that the node holds no attribute of the key with a live status, and the test checks only
  one status outside the live set, which is superseded. Nothing in the set makes the same change when
  the node''s attribute of that key is in status deleted, which is the status a removal leaves behind.
  A key with no attribute at all is not tested either. An implementation that treated a deleted attribute
  as live would answer succession, or name the deleted attribute as the one it supersedes. This test would
  still pass in that case. That part of the fact is unexercised.. The node is decided by reading, and
  a certification standing on it from an earlier reconciliation is released by the bind. The remainder
  is testable: Input: a set change with no attribute named, to a key where the edited node''s only attribute
  has status deleted (superseded_at set). Expected result: effect first_value, exactly one new attribute
  with status active, and supersedes_attribute_id null. The same assertion should also be run for a key
  where the node holds no attribute at all..

  Certification of rules/knowledge-base/entity-edit-names-a-live-attribute did not hold: the auditor answered
  `partial` — The rule covers every change that names an attribute, and the tests prove it fully only
  for set changes. For a set change, the tests cover each part of the rule. The named attribute must belong
  to the edited node, so naming another node''s live attribute is refused. It must be of the change''s
  key, so naming the node''s live attribute of another key is refused. It must be held at all, so naming
  an identity where nothing is held is refused. Its status must be live: the tests accept active, uncertain
  and disputed and refuse superseded and deleted. Remove changes get much less. The only remove change
  in the set names a superseded attribute of the edited node and key. No remove change names a deleted
  attribute, another node''s attribute, an attribute of another key, or an identity where nothing is held.
  No remove change names a live attribute and is accepted. If removal checked only status, or skipped
  the node and key check, the rule would stop holding for remove changes and every test in the set would
  still pass. The tests also take as given that active, uncertain and disputed are exactly the live statuses.
  The status table would catch a change in how the code classifies them, but nothing in the offered proof
  checks that classification against the live-assertion-status node itself.. The node is decided by reading,
  and a certification standing on it from an earlier reconciliation is released by the bind. The remainder
  is testable: A table of remove changes against expected outcomes. A remove change naming each of these
  must come back as a conflict: a deleted attribute of the edited node and key, a live attribute of another
  key of the edited node, a live attribute of another node, and an identity where nothing is held. A remove
  change naming an active, an uncertain or a disputed attribute of the edited node and key must be accepted..

  Certification of rules/knowledge-base/entity-edit-names-an-active-node did not hold: the auditor answered
  `partial` — The proof runs only the node guard, loadActiveNodeForEdit, on a mocked client. It never
  runs an entity edit. Over that guard the fact is fully tested. The guard accepts a node held as active.
  It refuses with BUSINESS_NODE_NOT_ACTIVE a node held as needs_review, merged or deleted, and it refuses
  with RESOURCE_NOT_FOUND an identity where no node is held. The proof does not test that an entity edit
  goes through this guard. If the edit stopped calling the guard, or called it after writing, an edit
  naming a merged, deleted or needs_review node would succeed, and every test here would still pass. So
  "an entity edit MUST name an active node" is proven of the guard, not of the edit. Two more limits.
  The four statuses in the table are all the test lists, and the pack does not let me check them against
  the node-status vocabulary. The remaining tests in the file are about the refusal itself: that the message
  names the node and its status, the needs_review spelling, and the HTTP 404/409 mapping. None of them
  bears on whether the edit is held to an active node.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: Submit
  an entity edit through the edit operation itself, not through the guard. Use one edit per non-active
  status (needs_review, merged, deleted) and one naming an absent identity. Each should be refused (BUSINESS_NODE_NOT_ACTIVE,
  or RESOURCE_NOT_FOUND for the absent one) and leave the node as it stood. The same edit naming an active
  node should be applied..

  Certification of rules/knowledge-base/entity-edit-note held (src/__tests__/unit/curation/edit-entity-records.spec.ts,
  src/__tests__/unit/curation/entity-edit-note.spec.ts would fail if the fact stopped holding) and is
  not written: the judgment did not clear the node, and a test-decided binding rests on a reading that
  did.

  Certified rules/knowledge-base/entity-edit-note-confidence as decided by step `test`: src/__tests__/unit/curation/entity-edit-note.spec.ts
  (records the information fragment at confidence 1.0) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-note-content as decided by step `test`: src/__tests__/unit/curation/entity-edit-note.spec.ts
  (holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason
  and moment apart as two raw informations); src/__tests__/unit/curation/edit-entity-records.spec.ts (holds
  in each content the reason and the moment of the edit and differs between the two by a nonce of its
  own) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-note-run as decided by step `test`: src/__tests__/unit/curation/entity-edit-note.spec.ts
  (is the run the edit opened, never a run that already existed, for both the fragment and the raw information
  it is anchored in); src/__tests__/unit/curation/entity-edit-note.spec.ts (is one raw information, one
  chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the
  reason) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-note-source as decided by step `test`: src/__tests__/unit/curation/entity-edit-note.spec.ts
  (has source type other and metadata of operator_note true and the edited node''s identity under node_id)
  would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-null-field-is-not-stated as decided by step `test`: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (reads a null value, item, validity start or validity end exactly as the same field left out); src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (requires a change to state a value exactly when its kind is set); src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (requires a remove change to name an attribute and asks no such thing of a set change) would fail if
  the fact stopped holding.

  Certification of rules/knowledge-base/entity-edit-provenance did not hold: the auditor answered `partial`
  — The fact has two parts. One applies to every entity edit: the edit''s new attribute holds the provenance
  of the edit''s information fragment. The other applies only to corrections: the new attribute also holds
  every provenance of the attribute it supersedes. The offered file runs only the correction path (recordCorrection
  with a predecessor). No edit in it records a new attribute without superseding one, so the first part
  goes unexercised for every entity edit that is not a correction. Within the correction path, "every
  provenance of the attribute it supersedes" is only partly bound. The test''s fake client matches any
  statement shaped "INSERT INTO provenance ... SELECT". Its copyStatement then copies every provenance
  row of the predecessor itself and never evaluates the statement''s selection. An implementation whose
  copy selected only some of the superseded attribute''s provenance would still pass. The test fails only
  if the copy statement is removed entirely, or if its parameters name the wrong attributes. It does bind
  the edit''s own fragment on a correction, because that insert is parsed column by column. The file''s
  other tests (status, superseded_at, supersedes_attribute_id, valid_to, value, active state) assert nothing
  about provenance and do not bear on this fact.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: Two
  assertions would close it. First, an entity edit that sets an attribute the node does not yet hold,
  with the expected result that the new attribute''s provenance holds the edit''s information fragment.
  Second, a correction of an attribute holding several provenance rows, run against a store that evaluates
  the copy''s selection (not a fake that copies every row whatever the statement says). Its expected result
  is that the new attribute''s provenance holds each of those fragments as well as the edit''s own..

  Certified rules/knowledge-base/entity-edit-reason-length as decided by step `test`: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT)
  would fail if the fact stopped holding.

  Certification of rules/knowledge-base/entity-edit-reason-trimmed held (src/__tests__/unit/curation/edit-entity-records.spec.ts
  would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and
  a test-decided binding rests on a reading that did.

  Certified rules/knowledge-base/entity-edit-records-curation-action as decided by step `test`: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  (is one edit_entity action on the edited node carrying the reason and every applied entry in the order
  given); src/__tests__/unit/curation/entity-edit-action.spec.ts (is written edit_entity); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (is of the kind node); src/__tests__/unit/curation/entity-edit-action.spec.ts (is the edited node''s
  identity); src/__tests__/unit/curation/entity-edit-action.spec.ts (is the edit''s reason, inner whitespace
  kept); src/__tests__/unit/curation/entity-edit-action.spec.ts (is an object holding an applied list);
  src/__tests__/unit/curation/entity-edit-action.spec.ts (lists one entry for each applied change); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (lists the entries in the order the changes were given); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (gives each entry exactly attribute_key, effect, item_id and predecessor_id); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (gives an entry the values of the applied change it lists); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (writes the effect of a first-value entry as first_value); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (carries item_id as null on an unchanged entry rather than omitting it); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (carries predecessor_id as null on a first-value entry rather than omitting it); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (records one action for one accepted edit however many changes it applied); src/__tests__/unit/curation/entity-edit-action.spec.ts
  (records the edit_entity action on the edited node with the reason and every applied change) would fail
  if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-removal as decided by step `test`: src/__tests__/unit/curation/edit-entity-records.spec.ts
  (marks that attribute deleted with the moment of the edit as its supersession time, records no attribute,
  and has the effect removal) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-removal-names-an-attribute as decided by step `test`: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (requires a remove change to name an attribute and asks no such thing of a set change) would fail if
  the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-run as decided by step `test`: src/__tests__/unit/curation/edit-entity-records.spec.ts
  (is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language
  model); src/__tests__/unit/curation/entity-edit-note.spec.ts (is one run of model operator and prompt
  version operator-edit-v1, completed, with no network call to a language model) would fail if the fact
  stopped holding.

  Certification of rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity did not hold: the
  auditor answered `partial` — The fact applies "whatever the edit''s effect". The offered proof only
  records attributes through recordNewAttribute, which is the first-value-or-addition effect. For that
  effect, the test covers a key that is not temporal both when the change states no validity and when
  it states a start and an end. In both cases it checks that the recorded attribute holds no validity
  start, no validity end and no validity-start basis. Nothing in the proof records the attribute an entity
  edit makes when it replaces a value already held for a key that is not temporal. The proof also has
  no test of an addition to such a key that allows several current values. Those effects are not tested.

  The test''s fake client also has a weak spot. It reads a column only when the INSERT binds it to a $N
  parameter, and it drops any value written into the SQL text itself, such as a literal or a date computed
  from now(). If an implementation wrote a validity start or basis that way, the test would still pass..
  The node is decided by reading, and a certification standing on it from an earlier reconciliation is
  released by the bind. The remainder is testable: One input: an entity edit that replaces the held value
  of a key that is not temporal, once with no stated validity and once stating a start and an end. One
  expected result: the attribute the edit records holds no validity start, no validity end and no validity-start
  basis. The check must read those columns as stored, including any value written directly into the SQL
  rather than passed as a parameter..

  Certification of rules/knowledge-base/entity-edit-start-defaults-to-today did not hold: the auditor
  answered `partial` — The two named tests check what gets recorded for a set change to a temporal key
  that states no start. They pass recordNewAttribute an edit moment just after a UTC midnight while the
  server time zone is behind UTC, and one just before a UTC midnight while the server time zone is ahead
  of UTC. The first asserts that the start is that moment''s UTC calendar date and that the basis is received.
  The second asserts the UTC date again, from the opposite side. Together they would fail if the date
  came from the local zone, if it came from the wall clock instead of the moment passed in, or if the
  basis stopped being received. Neither test checks that the moment passed in is the moment the edit took
  place. Each test supplies editedAt as a fixed argument. So if the caller filled editedAt with any instant
  other than the edit''s own, the start would no longer be "today" and both tests would still pass. The
  "today" half of the fact is therefore not exercised by the offered proof. If a test outside this file
  pins it, that test was not offered and cannot be cited here.. The node is decided by reading, and a
  certification standing on it from an earlier reconciliation is released by the bind. The remainder is
  testable: Input: an entity edit made through the edit entry point with the clock fixed at a known instant,
  setting a temporal key and stating no validity start. Expected result: the recorded attribute''s start
  equals that instant''s UTC calendar date, and its basis is received..

  Certification of rules/knowledge-base/entity-edit-stated-end-is-held did not hold: the auditor answered
  `partial` — The fact is covered for temporal keys only. "is recorded holding that end, or none when
  it states none, whether or not it states a start" sends three set changes to the temporal deadline key:
  one stating a start and an end, one stating only an end, and one stating neither. It asserts the recorded
  attribute''s valid_to in all three, which is the stated end, the stated end, and none. If either half
  of the fact stopped holding for a temporal key, this test would fail.

  The node does not limit the fact to temporal keys. It says that a new attribute recorded from any entity
  edit''s set change holds the validity end the change states. No offered test sends a set change stating
  an end to a key that is not temporal and asserts that the end is held. The other offered test, "holds
  no validity start, no validity end and no basis, whether or not the change states a validity", asserts
  the opposite. It sends a change stating valid_to 2027-03-31 to the non-temporal cnpj key and requires
  the recorded attribute to hold no validity end.

  So for non-temporal keys, the fact as the node states it goes unexercised, and the offered proof pins
  behaviour that contradicts it. One of two things is true. Either another node limits validity to temporal
  keys, and this node''s statement is missing that limit. Or the delivered behaviour departs from this
  node. Which one holds is a person''s decision, and this audit does not make it.. The node is decided
  by reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: One input against one expected result would close it: an entity edit''s set
  change to a key that is not temporal, stating a validity end, expecting the recorded attribute to hold
  that end, plus the same change stating no end, expecting no end. That test would fail against the behaviour
  the offered proof currently pins for non-temporal keys. The disagreement has to be settled in the specification
  before such a test, or a narrower statement of the node, can be written..

  Certification of rules/knowledge-base/entity-edit-stated-start-is-stated did not hold: the auditor answered
  `partial` — The named test sends a set change that states a validity start to a temporal key that holds
  no value yet. It asserts that the attribute is recorded with that same start and with the basis "stated".
  It would fail if either half stopped holding for that case. But the offered proof only drives recordNewAttribute,
  which records a first value or an addition. The fact covers every set change, and nothing in the set
  sends a set change that states a start to a key that already holds a current value. So whether a replacement
  value is also recorded with the stated start and the basis "stated" goes unexercised. Nothing in the
  set sends a stated start through a multi-valued key''s addition either; only the single-valued deadline
  key with no held row is exercised. Two other tests in the file touch validity without bearing on this
  fact. "is recorded holding that end, or none when it states none, whether or not it states a start"
  asserts only the end. "holds no validity start, no validity end and no basis, whether or not the change
  states a validity" asserts that a non-temporal key records no start even when one is stated. The node
  does not say whether "a set change" includes changes to non-temporal keys, and that test settles the
  question in favour of recording nothing.. The node is decided by reading, and a certification standing
  on it from an earlier reconciliation is released by the bind. The remainder is testable: One input:
  a set change stating a validity start for a temporal key that already holds a current value, so the
  change replaces it. One expected result: the successor attribute is recorded with exactly that start
  and the basis "stated". A second assertion of the same shape would close the addition case: a set change
  with a stated start to a multi-valued key, expecting that start and the basis "stated"..

  Certification of rules/knowledge-base/entity-edit-succession held (src/__tests__/unit/curation/edit-entity-records.spec.ts
  would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and
  a test-decided binding rests on a reading that did.

  Certification of rules/knowledge-base/entity-edit-succession-closes-the-previous did not hold: the auditor
  answered `partial` — The tests check every case the fact names for the validity end the succession works
  out. A superseded attribute with no validity start gets the new start as its end. A new start one day
  after the superseded attribute''s start becomes its end. A new start on that start, or one day before
  it, leaves no end. A new attribute with no stated start takes the edit''s UTC calendar date, and that
  date becomes the end. That holds in a server zone behind UTC as well. What the tests read, though, is
  a stand-in for the database built inside the test file, not the stored attribute. That stand-in takes
  the validity end from the second parameter of the UPDATE on node_attribute and never reads the statement''s
  SET clause. Suppose the succession still passed the right value but stopped writing it to valid_to,
  wrote valid_to from some other source, or wrote NULL. The stand-in would still show the superseded attribute
  ending at the new start. In the other direction, reordering the statement''s parameters while keeping
  a correct SET clause would make the tests fail even though the behaviour is right. So the stand-in is
  tied to the order of the statement''s parameters, not to the outcome. The part left unexercised is the
  stored superseded attribute actually holding a validity end at the new start (or none, under the stated
  condition).. The node is decided by reading, and a certification standing on it from an earlier reconciliation
  is released by the bind. The remainder is testable: Run the succession so the statement it issues is
  actually executed against node_attribute, then read the superseded row back. Take a superseded attribute
  starting 2026-03-01. With a new start of 2026-03-02 the stored valid_to should be 2026-03-02. With a
  new start of 2026-03-01 or 2026-02-28 the stored valid_to should be NULL. Take a superseded attribute
  with no start. With a new start of 2026-09-01 the stored valid_to should be 2026-09-01..

  Certification of rules/knowledge-base/entity-edit-unchanged-records-nothing did not hold: the auditor
  answered `partial` — The "reported with the effect unchanged" half is fully exercised. One equality
  assertion covers a table of probes, so the test fails if any probe''s effect changes. In the named branch,
  active, uncertain and disputed attributes with the same value give unchanged, and superseded and deleted
  ones do not. Values that differ only in case or accents do not count as the same character for character.
  In the branch that names no attribute, active and uncertain values of a multiple-current key give unchanged.
  Disputed, superseded, different and case-differing values do not.

  The "records nothing" half is only partly exercised. The test counts only the rows returned by recordedAttributes,
  and it leaves out the row carrying the companion phase value. Every probe sends the unchanged change
  together with a phase set change, so an edit action is always recorded. Nothing checks whether that
  recorded action carries any trace of the unchanged change. Nothing checks whether the held attribute
  row is left as it was, for example its status or superseded_at. An implementation that recorded the
  unchanged change in the edit action, or rewrote the held row without inserting a new one, would still
  pass.

  The test also says that a named disputed attribute is live. I did not check that against the live-assertion-status
  node, because the pack limits the reading to the proof.

  Over-assertion finding: this single test also pins facts that belong to sibling rules. A named superseded
  or deleted attribute is refused with BUSINESS_ENTITY_EDIT_CONFLICT. Values differing in case or accents
  are a correction that records one row. Unnamed non-matching values are an addition or a first_value
  that records one row. If any of those sibling facts legitimately changes, this test fails even though
  this node still holds.. The node is decided by reading, and a certification standing on it from an earlier
  reconciliation is released by the bind. The remainder is testable: Two inputs would close it. First,
  an edit carrying only a set change that names a live attribute with exactly its held value. Second,
  an edit carrying only a set change that names none, whose value equals an active or uncertain value
  of a multiple-current key. Expected result for each: the effect is reported as unchanged, no attribute
  row is inserted, the held row is unaltered (same status, no superseded_at), and no edit action or other
  record carries any trace of the change..

  Certified rules/knowledge-base/entity-edit-value-matches-the-kind as decided by step `test`: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (requires a change to state a value exactly when its kind is set); src/__tests__/unit/curation/edit-entity.dto.spec.ts
  (carries each issue''s path joined by a dot, for a refinement issue and a field issue alike) would fail
  if the fact stopped holding.

  Certified rules/knowledge-base/stable-key-change-states-no-validity as decided by step `test`: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  (a change to a key that is not temporal is refused with BUSINESS_TEMPORAL_INCOHERENT when it states
  $label); src/__tests__/unit/curation/attribute-change-validity.spec.ts (a change that states no validity
  to a key that accepts none is not refused when the key $label) would fail if the fact stopped holding.

  Certification of scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing did
  not hold: the auditor answered `partial` — Two parts of the fact are exercised. First, an active node
  edited with a reason and an empty list of changes is refused with exactly BUSINESS_ENTITY_EDIT_NO_CHANGES.
  Second, nothing of the edit is recorded: the whole store (nodes, attributes, raw information, chunks,
  LLM runs, fragments, fragment sources, provenance, curation actions) must equal its seeded snapshot.

  One part is not exercised: "not as a malformed request". The proof reaches the edit through its fixture,
  edit-entity-world.ts, which the proof imports. I read that fixture to judge the proof. Its settledCode
  calls editEntityService directly with a body built by editOf as a plain object. The body never passes
  through the request body schema or the route, which is where a request is judged malformed. If that
  boundary started refusing an empty changes list as a malformed request (a VALIDATION_* answer), the
  owner''s edit would be refused as malformed and both tests would still pass. Only the individual changes
  are parsed (AttributeChangeSchema in setChange), and an empty list has none.

  Also, the given says the edited node is a person. The fixture''s active node is of type Project, so
  the refusal is never observed on a person node.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: One
  input against one result. The input is an edit carrying a reason and an empty changes list, aimed at
  an active person node and submitted through the edit''s request boundary (the route, with the body schema
  it applies). The expected result is a refusal answered as BUSINESS_ENTITY_EDIT_NO_CHANGES and not as
  a VALIDATION_* malformed-request code, with the store left exactly as it was before the edit..

  Certification of scenarios/knowledge-base/backdated-start-supersedes-without-an-end did not hold: the
  auditor answered `partial` — Both outcomes are exercised at the succession step. The named test starts
  from a status_text attribute that begins on 2026-10-01 and has no end, then sets another status with
  a stated start of 2026-09-01. It asserts that the earlier status becomes superseded with no validity
  end, and that the new status starts on 2026-09-01 with the basis stated. The validity-end table checks
  the same rule on the deadline key with a start one day before and a start on the predecessor''s start.
  The test of the superseded status checks that it is superseded even when it gets no end.

  The trigger is the part left unexercised: the owner editing the project. Every test calls recordSuccession
  directly and builds the predecessor itself. The change it passes names the attribute key "any", not
  the status. So nothing in the set shows that an edit of the project naming that status finds the status
  as the attribute to supersede. Nothing shows that the edit reaches the succession with the backdated
  start, and not refused or treated as having no predecessor. If the edit path stopped doing either, the
  fact would stop holding and every one of these tests would still pass.

  The "no validity end" result is also read through the test''s in-memory stand-in for the UPDATE statement.
  That stand-in keeps the row''s earlier null end when no end parameter is sent, so the assertion depends
  on the parameter order of the statement the code issues.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: One
  input against one expected result, through the owner''s project-edit entry point and not recordSuccession.
  Input: a project holding an active status_text that starts on 2026-10-01 with no validity end, and an
  edit with a set change on status_text to another value, stating a validity start of 2026-09-01. Expected:
  the earlier status is superseded and has no validity end, and the new status starts on 2026-09-01 with
  the basis stated..

  Certification of scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict held (src/__tests__/unit/curation/edit-entity-refusals.spec.ts,
  src/__tests__/unit/curation/edit-entity-refusals.spec.ts would fail if the fact stopped holding) and
  is not written: the judgment did not clear the node, and a test-decided binding rests on a reading that
  did.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) constraints/entity-edit-is-atomic, constraints/entity-editing-is-not-a-language-model-tool,
  constraints/every-operation-requires-owner-authentication, constraints/expected-refusals-not-logged-as-errors,
  constraints/internal-failure-withholds-cause, constraints/unreachable-store-answers-unavailable, contracts/knowledge-base/compliance-audit,
  contracts/knowledge-base/entity-editing, domain/knowledge-base/applied-change, domain/knowledge-base/assertion-status,
  domain/knowledge-base/attribute-change, domain/knowledge-base/attribute-change-kind, domain/knowledge-base/attribute-key,
  domain/knowledge-base/curation-action, domain/knowledge-base/curation-action-filter, domain/knowledge-base/curation-action-kind,
  domain/knowledge-base/curation-target-kind, domain/knowledge-base/edit-effect, domain/knowledge-base/entity-edit,
  domain/knowledge-base/live-assertion-status, domain/knowledge-base/node-attribute, domain/knowledge-base/node-status,
  domain/knowledge-base/value-type, rules/knowledge-base/a-curation-action-kind-is-written-with-underscores,
  rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores, rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores,
  rules/knowledge-base/attribute-key-for-node-type, rules/knowledge-base/attribute-value-in-allowed-values,
  rules/knowledge-base/attribute-value-parses, rules/knowledge-base/current-assertion, rules/knowledge-base/entity-edit-addition,
  rules/knowledge-base/entity-edit-adds-no-second-current-value, rules/knowledge-base/entity-edit-change-check-order,
  rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time, rules/knowledge-base/entity-edit-changes-something,
  rules/knowledge-base/entity-edit-check-order, rules/knowledge-base/entity-edit-correction, rules/knowledge-base/entity-edit-defaulted-start-precedes-end,
  rules/knowledge-base/entity-edit-ended-attribute-correction, rules/knowledge-base/entity-edit-first-value,
  rules/knowledge-base/entity-edit-leaves-disputes-to-curation, rules/knowledge-base/entity-edit-names-a-live-attribute,
  rules/knowledge-base/entity-edit-names-an-active-node, rules/knowledge-base/entity-edit-new-attribute-state,
  rules/knowledge-base/entity-edit-note, rules/knowledge-base/entity-edit-note-confidence, rules/knowledge-base/entity-edit-note-content,
  rules/knowledge-base/entity-edit-note-run, rules/knowledge-base/entity-edit-note-source, rules/knowledge-base/entity-edit-null-field-is-not-stated,
  rules/knowledge-base/entity-edit-provenance, rules/knowledge-base/entity-edit-reason-length, rules/knowledge-base/entity-edit-reason-trimmed,
  rules/knowledge-base/entity-edit-records-curation-action, rules/knowledge-base/entity-edit-removal,
  rules/knowledge-base/entity-edit-removal-names-an-attribute, rules/knowledge-base/entity-edit-run, rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity,
  rules/knowledge-base/entity-edit-start-defaults-to-today, rules/knowledge-base/entity-edit-stated-end-is-held,
  rules/knowledge-base/entity-edit-stated-start-is-stated, rules/knowledge-base/entity-edit-succession,
  rules/knowledge-base/entity-edit-succession-closes-the-previous, rules/knowledge-base/entity-edit-supersession-time,
  rules/knowledge-base/entity-edit-unchanged-records-nothing, rules/knowledge-base/entity-edit-value-matches-the-kind,
  rules/knowledge-base/stable-key-change-states-no-validity, rules/knowledge-base/unrecorded-temporality-is-not-temporal,
  rules/knowledge-base/validity-start-before-end, scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing,
  scenarios/knowledge-base/backdated-start-supersedes-without-an-end, scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict,
  scenarios/knowledge-base/emptying-one-email-rejects-only-that-email, scenarios/knowledge-base/stable-key-edit-is-a-correction,
  scenarios/knowledge-base/temporal-edit-without-a-date-starts-today were read on every file and answered
  for, and bound from nowhere here — a binding this record writes is one the trace already held.

  Candidates: 8 opened across 5 of 46 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 12 fact(s) the source states that no node holds, over 9 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/entity-edit-backend.returns/`, which are the evidence behind every entry above.
