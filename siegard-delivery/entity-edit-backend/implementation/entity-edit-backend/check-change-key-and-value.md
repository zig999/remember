---
target: backend
title: Check a change's key and value against the catalog
summary: Adds one curation service helper that refuses an attribute change whose key the node's type does not hold, or whose set value does not read as its key's value type or is not one of its allowed values, with the catalog codes and details the entity-editing contract states.
task: sha256:5cb92b536a8c98daeffed4bed397c783099523ca8ece1a9cbe2ba78971a2bae9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-check-change-key-and-value-build
files:
- path: src/modules/curation/service/attribute-change-catalog.ts
  effect: New. checkChangeAgainstCatalog(catalog, nodeType, change) looks the change's key up for the node's type and refuses an absent one with a BusinessError BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key and the node type. Both set and remove changes get this check. For a set change it then refuses a value that does not read as the key's value type with BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value. Last it refuses a value outside the key's allowed values, compared exactly as written, with BUSINESS_INVALID_ATTRIBUTE_VALUE naming the attribute key, the value and the allowed values. The ingestion validators do the parsing and the domain comparison, and a key with no allowed values passes any text. Refusals are BusinessError, so they render as HTTP 422 through mapErrorToHttpResponse.
criteria:
- criterion: A set change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: resolveAttributeKey in attribute-change-catalog.ts looks the key up in catalog.attributeKeyByNodeTypeAndKey with attributeKeyCacheKey(nodeType.id, key). When it is absent it throws BusinessError with code BUSINESS_UNKNOWN_ATTRIBUTE_KEY, and checkChangeAgainstCatalog runs this check first for every change kind.
- criterion: A remove change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: The key resolution runs before the kind is examined, so a remove change reaches the same refusal. Only the value checks are skipped for a remove.
- criterion: An unknown-key refusal names the key.
  met: true
  how: The message reads "Attribute key '<key>' is not held by the catalog for node type '<name>'." and details carries attribute_key.
- criterion: An unknown-key refusal names the node type.
  met: true
  how: Message and details.node_type both carry the node type's name (nodeType.name).
- criterion: A set change of 2024-02-30 for a key whose value type is date is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: assertValueReadsAsType calls the shared parseAttributeValue, whose namesExistingDay check rejects 2024-02-30. The ValidationFailure becomes a BusinessError with code BUSINESS_INVALID_ATTRIBUTE_VALUE.
- criterion: A set change of 1e3 for a key whose value type is number is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: The shared number parser matches ^-?\d+(?:\.\d+)?$, which 1e3 does not, and the failure is translated to BUSINESS_INVALID_ATTRIBUTE_VALUE.
- criterion: A set change of True for a key whose value type is bool is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: The shared bool parser accepts exactly "true" or "false", so True fails and is translated to BUSINESS_INVALID_ATTRIBUTE_VALUE.
- criterion: A refusal for a value that does not read as its type names the value type.
  met: true
  how: The message reads "Value '<v>' does not read as value type '<type>'." and details carries value_type.
- criterion: A refusal for a value that does not read as its type names the value.
  met: true
  how: The message and details.value both carry the value as written.
- criterion: A set change whose value is none of its key's allowed values is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: assertValueAllowed resolves the closed domain with domainOf and calls assertValueInDomain. A failure is translated to BusinessError BUSINESS_INVALID_ATTRIBUTE_VALUE.
- criterion: A set change whose value differs from an allowed value only in letter case is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: assertValueInDomain uses Set.has on the value exactly as written, with no case folding, so a case-only difference is outside the domain and refused.
- criterion: A refusal for a value outside the allowed values names the attribute key.
  met: true
  how: details.attribute_key is attributeKey.key, and the message names it too.
- criterion: A refusal for a value outside the allowed values names the value.
  met: true
  how: details.value and the message both carry the value.
- criterion: A refusal for a value outside the allowed values names the allowed values.
  met: true
  how: details.allowed_values holds the sorted allowed values, taken from the shared validator's failure details and narrowed by allowedValuesOf. The message lists them joined by a comma and a space.
- criterion: A set change of any text for a text key that has no allowed values is not refused by these rules.
  met: true
  how: The text parser accepts any string, and domainOf returns null for a key with no allowed values, so assertValueAllowed returns without checking.
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: The three catalog refusal answers of the contract are encoded. BUSINESS_UNKNOWN_ATTRIBUTE_KEY names the key and the node type. BUSINESS_INVALID_ATTRIBUTE_VALUE names the value type and the value, or the attribute key, the value and the allowed values. BusinessError carries statusCode 422, so mapErrorToHttpResponse renders HTTP 422 as the contract states. The contract's other answers (the format, node-state, temporal, conflict and no-change refusals, and the 200 answer) belong to other tasks and are not reached here.
- node: rules/knowledge-base/attribute-key-for-node-type
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: resolveAttributeKey refuses a change whose key the catalog does not hold for the edited node's type. The proposal clause is not reached, because it belongs to the ingestion proposal path.
- node: rules/knowledge-base/attribute-value-parses
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: assertValueReadsAsType delegates to the shared parseAttributeValue, which implements the rule's expression (existing calendar day, finite number, exactly true or false, any text). Its failure is re-raised as BUSINESS_INVALID_ATTRIBUTE_VALUE. Only the set-change clause is answered here.
- node: rules/knowledge-base/attribute-value-in-allowed-values
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: assertValueAllowed delegates to the shared assertValueInDomain, which compares exactly as written, and re-raises its failure as BUSINESS_INVALID_ATTRIBUTE_VALUE. A key with no allowed values is unconstrained. Only the set-change clause is answered here.
- node: domain/knowledge-base/attribute-key
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: The helper reads the attribute key as the catalog holds it, through AttributeKeyRow (key, node type, value_type) and its allowed values through domainOf. It declares no new shape of the element, since the catalog snapshot already carries it.
- node: domain/knowledge-base/value-type
  encoded_at:
  - src/modules/curation/service/attribute-change-catalog.ts
  how: The key's value_type (date, number, text, bool) selects the parse in the shared parseAttributeValue, and the helper names it in the refusal. The enumeration itself is declared by the existing catalog row type.
inferences:
- inferred: The helper takes the edited node's resolved NodeTypeRow (id and name) from its caller rather than looking the node up itself. The caller (the edit service, another task) supplies the node's type.
  from: The inventory's convention that curation write services receive the ingestion CatalogSnapshot, and that propose_attribute scopes the key by the node's type id. Resolving the type name from the node is the edit service's act, and this task has no node load.
- inferred: Refusal details use the field names attribute_key, node_type, value_type, value and allowed_values.
  from: The existing curation correct_item refusal (item.service.ts), which uses value_type, value, attribute_key and allowed_values for the same two codes, and the delivered unit spec for edit-refusal-codes, which builds the unknown-key refusal with attribute_key and node_type. No node fixes the field names.
- inferred: The unknown-key refusal is raised as BusinessError, not through the shared assertKnownType, which raises a ValidationFailure whose details carry kind and name only. The domain check re-raises the ingestion validator's allowed_values after narrowing it.
  from: The contract requires the refusal to name the node type, which assertKnownType cannot carry. BusinessError renders as 422 by its own statusCode, while the code table maps BUSINESS_UNKNOWN_ATTRIBUTE_KEY to 404 for the retrieval surface. The delivered spec error-mapping.entity-edit.spec.ts documents both.
- inferred: The three checks run in the order key, then value type, then allowed values, and a value is only examined once the key resolved.
  from: rules/knowledge-base/entity-edit-change-check-order, read as a neighbour. The order is also the only one that never reads a value type for a key the catalog does not hold. That rule is not in this task's implements.
- inferred: An unexpected non-validation error thrown by a shared validator is rethrown as a plain Error wrapping the original as its cause, and it surfaces as an internal failure.
  from: Standard rule COR-01 (a catch rethrows wrapped with the original as cause). The validators throw only ValidationFailure, so this branch is defensive.
- inferred: The helper lives in a new file under service/ without a .service.ts suffix, so that the future edit service imports a helper rather than another service (LAY-04).
  from: The existing suffix-less helpers in the same directory (errors.ts, transaction.ts) and standard rule LAY-04.
preserved:
- parseAttributeValue, assertValueInDomain, assertKnownType and domainOf are called, not changed, so the ingestion propose-attribute path and the correct_item path accept and report exactly what they did.
- src/modules/curation/service/item.service.ts and the curation routes are not edited, so correct_item's BUSINESS_INVALID_ATTRIBUTE_VALUE shape stays as it was.
- src/shared/error-mapping.ts is not edited. BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays at 404 by code for the retrieval surface, and BUSINESS_INVALID_ATTRIBUTE_VALUE stays at 422.
- The curation MCP toolset and its tool whitelist are not touched, so the edit stays off the language-model toolsets.
deferred:
- what: The curation module still has no edit-entity service, route or wiring that calls checkChangeAgainstCatalog, and nothing resolves the edited node's type to a NodeTypeRow yet.
  why: The task's objective is the catalog check only. Loading the node, the whole-edit check order and the route belong to other tasks of the epic.
- what: The order of checks across a change and across the changes of an edit (rules/knowledge-base/entity-edit-change-check-order and entity-edit-check-order), and the checks of a change against the node's live attributes.
  why: The task notes place them with the task that implements the check order, and they are not in this task's implements. The helper only fixes the key, value-type, allowed-values order inside itself.
- what: Logging of these refusals at a level below error (constraints/expected-refusals-not-logged-as-errors).
  why: The helper throws and does not log. The mapping already renders both codes with a warn level, and the calling service and route own the log line.
---
## What it is
Adds one curation service helper that refuses an attribute change whose key the node's type does not hold, or whose set value does not read as its key's value type or is not one of its allowed values, with the catalog codes and details the entity-editing contract states.

## Notes
Inferred: The helper takes the edited node's resolved NodeTypeRow (id and name) from its caller rather than looking the node up itself. The caller (the edit service, another task) supplies the node's type.
Inferred: Refusal details use the field names attribute_key, node_type, value_type, value and allowed_values.
Inferred: The unknown-key refusal is raised as BusinessError, not through the shared assertKnownType, which raises a ValidationFailure whose details carry kind and name only. The domain check re-raises the ingestion validator's allowed_values after narrowing it.
Inferred: The three checks run in the order key, then value type, then allowed values, and a value is only examined once the key resolved.
Inferred: An unexpected non-validation error thrown by a shared validator is rethrown as a plain Error wrapping the original as its cause, and it surfaces as an internal failure.
Inferred: The helper lives in a new file under service/ without a .service.ts suffix, so that the future edit service imports a helper rather than another service (LAY-04).
Deferred: The curation module still has no edit-entity service, route or wiring that calls checkChangeAgainstCatalog, and nothing resolves the edited node's type to a NodeTypeRow yet.
Deferred: The order of checks across a change and across the changes of an edit (rules/knowledge-base/entity-edit-change-check-order and entity-edit-check-order), and the checks of a change against the node's live attributes.
Deferred: Logging of these refusals at a level below error (constraints/expected-refusals-not-logged-as-errors).
