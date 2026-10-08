---
title: Validate the shape of an entity edit request
summary: The request schema that accepts a well-formed entity edit and refuses a malformed one with the validation-format answer.
rationale: Planning cut the request's shape away from the service. The shape changes when the contract's body changes, while the service changes when the business rules change, and a schema can be shown working by parsing alone.
sources:
- intake/scope.md
objective: An edit body that breaks the edit's shape is refused with VALIDATION_INVALID_FORMAT, and a well-formed body parses into a reason and its changes.
criteria:
- A reason that holds no character once trimmed is refused with VALIDATION_INVALID_FORMAT.
- A reason that holds 1001 characters once trimmed is refused with VALIDATION_INVALID_FORMAT.
- A reason of 1000 characters surrounded by spaces is not refused by the reason-length rule.
- A reason of 500 characters outside the Basic Multilingual Plane, 1000 UTF-16 code units, is not refused by the reason-length rule.
- A reason of 501 characters outside the Basic Multilingual Plane, 1002 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
- A reason of 999 characters inside the Basic Multilingual Plane and one character outside it, 1001 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
- A body without a reason is refused with VALIDATION_INVALID_FORMAT.
- A body without a changes field is refused with VALIDATION_INVALID_FORMAT.
- A change without an attribute key is refused with VALIDATION_INVALID_FORMAT.
- A change whose kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
- A set change that states no value is refused with VALIDATION_INVALID_FORMAT.
- A set change whose value is null is refused with VALIDATION_INVALID_FORMAT.
- A remove change that states a value is refused with VALIDATION_INVALID_FORMAT.
- A remove change that names no attribute is refused with VALIDATION_INVALID_FORMAT.
- A remove change whose item_id is null is refused with VALIDATION_INVALID_FORMAT.
- A change whose item_id is not a well-formed identifier is refused with VALIDATION_INVALID_FORMAT.
- A change whose valid_from is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
- A change whose valid_to is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
- A shape refusal carries the message "Request payload failed validation.".
- Each issue of a shape refusal carries its path joined by ".".
- A set change that names no attribute and states a value passes the schema.
- A remove change that names an attribute and states no value passes the schema.
- A body with a reason and a changes field that is an empty list passes the schema.
- A set change whose item_id is null parses as a change that names no attribute.
- A remove change whose value is null parses as a change that states no value.
- A change whose valid_from is null parses as a change that states no validity start.
- A change whose valid_to is null parses as a change that states no validity end.
implements:
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
- rules/knowledge-base/entity-edit-reason-length
- rules/knowledge-base/entity-edit-value-matches-the-kind
- rules/knowledge-base/entity-edit-removal-names-an-attribute
- rules/knowledge-base/entity-edit-null-field-is-not-stated
---
## What it is
The request schema that accepts a well-formed entity edit and refuses a malformed one with the validation-format answer.

## Notes
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-reason-length says a trimmed reason MUST hold between 1 and 1000 UTF-16 code units. The criteria test the upper bound from both sides and refuse an empty trimmed reason. No criterion says a short reason, such as one character, is accepted. So the lower bound is tested only from the refusing side. Implementation that meets every criterion and that the specification refuses: A schema that refuses any trimmed reason shorter than 5 UTF-16 code units (or 10, or any minimum above 1) with VALIDATION_INVALID_FORMAT. It satisfies every criterion, and the rule refuses it because a 1-unit trimmed reason is within bounds.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — The format refusal in contracts/knowledge-base/entity-editing also covers a field "of the wrong type" and a field "null where it may not be". No criterion tests a wrongly typed reason, changes, attribute_key, kind, value, item_id, valid_from or valid_to. No criterion tests a null reason, changes, attribute_key or kind either. Implementation that meets every criterion and that the specification refuses: A schema that converts non-string scalars to strings and wraps a lone change object into a one-element list. For example, reason 42 is read as "42", value true is read as "true", and changes sent as a single object become a list of one. It satisfies every criterion, and the contract refuses it because each of those fields is of the wrong type.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The format answer in contracts/knowledge-base/entity-editing carries HTTP 422 over REST and `details.issues` entries of `{ path, message }`. The criteria name only the code, the top-level message and the dotted path. The HTTP status and each issue's own message are left to whichever task maps the refusal onto the wire.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — rules/knowledge-base/entity-edit-check-order makes its first check a well-formed request with "its reason's length and every change's form included". That puts the reason-length, value-matches-the-kind and removal-names-an-attribute refusals inside the one format refusal, before the node is looked up. This task builds that first check. Its later clauses are the node's existence, then whether the node is active, then the changes in the order given, refused at the first failure. Those clauses belong to the task that orders the edit's checks. The well-formed-change step of rules/knowledge-base/entity-edit-change-check-order is the same check, and the steps after it belong to the change-checking tasks. Neither rule is named in implements here.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Criterion "A body with a reason and a changes field that is an empty list passes the schema." is backed by scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing ("not as a malformed request"; its log, field `subject`, records why an empty list is well formed). That scenario's other outcomes need the BUSINESS_ENTITY_EDIT_NO_CHANGES refusal and a check that nothing was recorded, and this task cannot show either. So the scenario is left to the task that implements rules/knowledge-base/entity-edit-changes-something.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The objective says a well-formed body "parses into a reason and its changes". No criterion says whether the parsed reason is trimmed. Trimming is required where the edit records the reason (rules/knowledge-base/entity-edit-reason-trimmed), and that belongs to the recording task. The length check still counts the trimmed reason, per rules/knowledge-base/entity-edit-reason-length.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
