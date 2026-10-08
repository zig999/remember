---
target: backend
title: Entity edit request schema proof
summary: Unit tests drive EditEntityBodySchema through boundary and class tables and render each refusal through the existing mapZodError. They prove the reason limit, the shape of the body and of a change, the value and removal rules, null read as not stated, and the refusal's message and dotted paths.
implementation: sha256:515123c73f8481ec4f29bd8225eb6cc6a4f691c6cbf16e2bad60f5c257989cbb
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-request-schema-suite
tests:
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
  proves: 'Criteria 1 to 6: an empty or spaces-only reason, 1001 characters, 501 characters outside the BMP (1002 units) and 999 BMP plus one astral character (1001 units) are each refused with VALIDATION_INVALID_FORMAT. 1000 characters surrounded by spaces and 500 characters outside the BMP (1000 units) are not refused. UNDERDETERMINED entry 1: a one-character trimmed reason is accepted, so the lower bound is tested from the accepting side.'
  fails_when: The limit is counted in code points rather than UTF-16 units, or the reason is measured before trimming. The upper bound moves off 1000 in either direction. The empty trimmed reason is accepted. A minimum above 1 is imposed (5, 10 and so on), so the one-character reason is refused. A refusal arrives under a code other than VALIDATION_INVALID_FORMAT.
  demonstrates: rules/knowledge-base/entity-edit-reason-length
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: requires a reason and a changes list and neither coerces nor accepts null for them
  proves: 'Criteria 7, 8 and 31, and the body-level half of UNDERDETERMINED entry 2: a body without a reason or without changes is refused. A numeric reason, a null reason, null changes, and a lone change object where a list belongs are each refused. A reason with an empty changes list is accepted.'
  fails_when: Reason or changes becomes optional, or an empty changes list is refused. A schema converts the number 42 to the reason "42", wraps a lone change object into a one-element list, or reads null as acceptable for reason or changes.
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
  proves: Criteria 17 and 24 to 26, and the change-level half of UNDERDETERMINED entry 2. A change without attribute_key, with a null or numeric attribute_key, or without kind is refused. A boolean or numeric value, a numeric item_id, an item_id that is not an identifier, and a valid_from or valid_to that is not YYYY-MM-DD or is a number are each refused. A set with only key, kind and value is accepted. A remove with only key, kind and item is accepted. A set stating every field is accepted.
  fails_when: attribute_key or kind becomes optional or accepts null. Any scalar field is coerced from another type (true read as "true", a number read as a date or a string). item_id stops being checked as an identifier, or a date stops being checked as YYYY-MM-DD. An optional field becomes required.
  demonstrates: domain/knowledge-base/attribute-change
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: accepts exactly the change kinds set and remove
  proves: 'Criterion 18, and UNDERDETERMINED entry 2 for kind: a set change and a remove change are accepted. A kind of add, SET in capitals, an empty string, null or a number is refused with VALIDATION_INVALID_FORMAT.'
  fails_when: The closed set gains or loses a member. Kind matching becomes case-insensitive, or an empty or numeric kind is coerced. Null is accepted for kind.
  demonstrates: domain/knowledge-base/attribute-change-kind
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: requires a change to state a value exactly when its kind is set
  proves: 'Criteria 19 to 21 and 30: a set stating a value is accepted. A set stating no value, and a set whose value is null, are refused. A remove stating a value is refused. A remove stating no value is accepted. Together these cover all four combinations of kind and stated value.'
  fails_when: A set without a value is accepted. A remove carrying a value is accepted. A set whose value is null is read as stating one. A remove without a value is refused. Any refusal uses a code other than VALIDATION_INVALID_FORMAT.
  demonstrates: rules/knowledge-base/entity-edit-value-matches-the-kind
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: requires a remove change to name an attribute and asks no such thing of a set change
  proves: 'Criteria 22, 23 and 29: a remove naming an attribute is accepted. A remove naming none, and a remove whose item_id is null, are refused. A set naming no attribute and stating a value is accepted.'
  fails_when: A remove with no item_id or a null item_id is accepted. The item requirement is extended to set changes. A remove that names an attribute is refused.
  demonstrates: rules/knowledge-base/entity-edit-removal-names-an-attribute
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: reads a null value, item, validity start or validity end exactly as the same field left out
  proves: 'Criteria 32 to 35: for each of value, item_id, valid_from and valid_to, a change carrying null yields exactly the outcome of the same change with the field omitted. Where the change is accepted, the parsed result is identical. Where it is refused, the issues are identical. This is checked on the value of a set and of a remove, and on the item of a set and of a remove, and for validity start and end. It does not depend on whether not stated is represented as undefined or null.'
  fails_when: Null is kept as a stated value, so a parsed field differs from the omitted one. Null is refused as a wrong type. Null is read as stated by a cross-field rule, so a set with a null value passes or a remove with a null item passes. Any one of the four fields is not treated as null equals not stated.
  demonstrates: rules/knowledge-base/entity-edit-null-field-is-not-stated
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: refuses with the message "Request payload failed validation."
  proves: 'Criterion 27: a shape refusal rendered through mapZodError carries the message "Request payload failed validation.".'
  fails_when: A shape issue is given a message that mapZodError promotes to a priority business code, so the top-level message changes. The refusal's message wording changes.
- file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  name: carries each issue's path joined by a dot, for a refinement issue and a field issue alike
  proves: 'Criterion 28: a cross-field refinement issue on the second change surfaces with path "changes.1.value". A field-level issue on the first change surfaces with path "changes.0.valid_from".'
  fails_when: A refinement issue is placed at the wrong path (the object root, or item_id rather than value). The change's index is dropped from the path. The path is not joined by "." in the rendered details.
not_applicable:
- edge_case: two edits against one subject at once, a failing dependency, a slow dependency
  why: The schema is a pure parse with no store, no clock and no dependency. Concurrency and failure belong to the service and route tasks.
- edge_case: a duplicate attribute_key or item_id across the changes list
  why: No criterion or node implemented here claims uniqueness at the shape level. Whether two changes may name the same attribute is decided by the later change-checking rules.
- edge_case: an empty changes list being refused as changing nothing
  why: The criteria require the shape to accept it. The BUSINESS_ENTITY_EDIT_NO_CHANGES refusal belongs to the task that implements rules/knowledge-base/entity-edit-changes-something.
untested:
- 'contracts/knowledge-base/entity-editing: no finite test of this task decides the contract''s fact whole. Beyond the request-shape format refusal, it states the route, the 200 answer, the 404, 409, 422 and 503 and 500 answers, and the HTTP 422 status. It also states each issue''s own message. Those belong to the route and service tasks, and a test over the schema alone would assert part of it as the whole. The format refusal''s code, message and dotted paths are exercised by other tests here, but they are not claimed against this node.'
- 'domain/knowledge-base/entity-edit: the schema''s reason and changes are exercised by the tests above. The node''s relationship to knowledge-node (a reference of cardinality 1) is carried by the route path, which this schema does not hold. No test over the schema decides that part, so the node is not claimed.'
- 'Inference, whether not stated is represented as undefined or null in the parsed output: the implementation chose undefined, and no node decides the representation. The null-equals-omitted test is deliberately representation-agnostic, so it does not pin it.'
- 'Inference, whether the parsed reason is the trimmed text: no criterion or node of this task says so. The reason-trimmed rule belongs to the recording task, and the length tests only assert what is accepted or refused.'
- 'Inference, that an impossible calendar date such as 2024-02-30 passes the shape check: no node says whether a shape refusal covers it. Not tested either way.'
- 'Inference, that attribute_key and value carry no minimum length and that unknown keys in the body or in a change are silently dropped: no node decides these. An empty attribute_key, an empty value and an extra key are not pinned.'
- 'Inference, that the refinement messages are plain sentences rather than BUSINESS_* codes: only the resulting VALIDATION_INVALID_FORMAT code is asserted. Each issue''s message wording is left to whichever task maps the refusal onto the wire, as the task''s ADVISORY note says.'
- 'A request body that is not an object at all (null, a string, an array): no criterion or node of this task states it, only fields that are wrong or missing, so it is not tested.'
- The HTTP 422 status and each issue's own message are mapped by the wire task and are not asserted here (the task's ADVISORY note).
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
  departure: The file sits at src/__tests__/unit/curation/edit-entity.dto.spec.ts, which mirrors the unit's module and file name but drops the modules/ and dto/ path segments, instead of mirroring src/modules/curation/dto/ under src/__tests__/unit/.
  why: The existing curation unit tests (src/__tests__/unit/curation/dto.spec.ts) sit in the same flat unit/curation directory. Placing this one elsewhere would split curation's unit tests across two layouts.
---
## What it is
Unit tests drive EditEntityBodySchema through boundary and class tables and render each refusal through the existing mapZodError. They prove the reason limit, the shape of the body and of a change, the value and removal rules, null read as not stated, and the refusal's message and dotted paths.

## Notes
None.
