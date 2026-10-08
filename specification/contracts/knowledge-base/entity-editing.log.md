---
entries:
- field: type
  unstated: The material names no such thing.
  decided: api
  why: The form needs one synchronous surface that takes the whole edit and answers it, accepted or refused.
- field: answers
  unstated: The material says an edit is refused on conflict without naming the codes or statuses of any refusal.
  decided: HTTP 409 for BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT and BUSINESS_ENTITY_EDIT_DISPUTED, HTTP 422 for BUSINESS_ENTITY_EDIT_NO_CHANGES and the validation codes the curation surface already uses
  why: A conflict is a state of the store that the owner can retry and so takes 409 as the curation surface does for a lost race, while a request that is wrong in itself takes 422.
- field: answers.0.accepted
  unstated: No node and no material names the HTTP method or path of the edit-entity operation, or says whether the edited node's identity travels in the path or in the body; the scope names only the operation and the contract.
  decided: POST /api/v1/nodes/{node_id}/edit, with the edited node's identity in the path and a JSON body carrying the edit's reason and changes
  why: An edit acts on one node, which the knowledge base already addresses at /api/v1/nodes/{id}. It does not replace the node's representation. It is an action, under a reason, that adds new attribute versions, so it is a POST on that node's address with the identity in the path, in the same way entity-match resolution is a node-addressed POST.
- field: answers.0.accepted
  unstated: The accepted answer names the fields `node_id` and `action_id` but no node and no material says what each one identifies. The path carries the edited node's identity, and rules/knowledge-base/entity-edit-records-curation-action says an accepted edit records one curation action, but neither ties either answer field to that node or to that action.
  decided: '`node_id` is the edited node''s identity, the same one the path carries, and `action_id` is the identity of the curation action the accepted edit recorded under rules/knowledge-base/entity-edit-records-curation-action'
  why: The edit acts on exactly one node and records exactly one curation action, so these are the two identities the answer can name. The curation contract already uses the same names for the node it acted on and the action it recorded, so a caller of either surface reads the fields the same way.
---
