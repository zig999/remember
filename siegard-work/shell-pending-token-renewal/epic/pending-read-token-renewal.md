---
title: Token renewal on the shell's pending curation read
summary: The shell's pending curation read renews an expired access token once and ends the session when renewal fails, while
  the health read stays without a bearer.
rationale: The scope names two rules about one read in one hook and states no cut, so they are grouped under a single epic,
  split into two tasks because a successful renewal and a failed one are separate outcomes, each with its own test.
covers:
- rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
- rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
- scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown
- scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
- contracts/application-shell/bff-shell-reads
- rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
- rules/application-shell/the-pending-total-needs-a-token
- rules/application-shell/the-footer-shows-pending-curation
- domain/application-shell/application-shell
uncovered:
- node: rules/application-shell/the-footer-shows-pending-curation
  why: The way the footer shows the total is already delivered and does not change. This plan changes only the total the pending
    read hands to it.
sources:
- intake/scope.md
---

## What it is
This epic makes the shell's pending curation read obey the two renewal rules the analysis committed.
It covers the read's contract, the polling rule that now allows one repeat after a renewed token, and the rule that the pending total needs a token.

## Notes
The pending read is `useCurationCount` in frontend/src/shell/api/use-shell-status.ts, and it shares a local `getJson` with the health read.
The inventory notes that a page's own request wrapper may try to renew the same expired token at the same moment as the shell.
The specification says nothing about that race, and this plan cuts no task for it.
