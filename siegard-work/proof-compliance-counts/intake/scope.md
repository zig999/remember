# Proof increment — owner, 2026-10-01

- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- assertion (verbatim, the record's remainder_why): One input against one expected result: a compliance deletion of a raw whose rows that depend only on it are 1 chunk, 1 fragment, 2 links and 3 attributes, plus one attribute with provenance in a second active raw and one chunk of the target raw that is already superseded. It should answer affected {chunks 1, fragments 1, links 2, attributes 3}, and those numbers should match the rows whose status the deletion turned to deleted.
- record: siegard-reconcile/certify-counts-what-it-marked.md
- files: src/modules/compliance-audit/repository/compliance-audit.repository.ts, src/modules/compliance-audit/service/compliance-audit.service.ts
