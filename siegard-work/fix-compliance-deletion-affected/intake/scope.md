# Corrective increment — compliance_deletion.affected

Invocation, 2026-09-30, by the owner.

Wrong behavior (as the finding in siegard-reconcile/moved-migrations.md states it): migrations/0001_init.sql line 523 declares `compliance_deletion.affected jsonb NOT NULL DEFAULT '{}'::jsonb`; domain/knowledge-base/compliance-deletion requires `affected` to hold four required counts (chunks, fragments, links, attributes), but the column declares no such shape and its empty-object default holds none of the four, so a compliance deletion can be recorded with its reach unstated.

File: migrations/0001_init.sql (target `database`).

Owner decision: the node is right; harden the DDL with a new versioned migration (a CHECK on the four integer keys, and the '{}' default dropped).

The migration must be presented to the owner for explicit approval before it is executed against any database.
