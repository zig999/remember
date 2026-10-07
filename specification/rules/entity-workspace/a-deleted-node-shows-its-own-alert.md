---
type: invariant
statement: "The page for a knowledge node the knowledge base refuses as deleted MUST show the deleted-node alert written in the description in place of the form, with no action to try again."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The deleted-node alert reads "Este nó foi apagado.", ending as written, and carries no code or message of the failure's own.
rules/knowledge-base/deleted-node-read-refused decides that a node read refuses a deleted node with HTTP 410 and the code BUSINESS_NODE_DELETED, so a deleted node's attributes never reach the screen.
rules/entity-workspace/the-form-is-offered-only-for-an-active-node decides what the screen shows for every other node the knowledge base still delivers.
contracts/entity-workspace/entity-screen decides the alerts for a node that is not held and for any other failure to load.
