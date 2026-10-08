---
title: Renew an expired token on the pending curation read
summary: A 401 on the pending curation read asks for a fresh token once and asks the read once more with that token.
rationale: The scope states no cut. The successful renewal is its own task because its outcome, the total shown after renewal,
  can be tested without the failure path. The four existing renewal copies are not merged into a shared helper, because that
  would change an interface and its four consumers and the scope did not ask for it.
sources:
- intake/scope.md
objective: After a 401 on the pending curation read, the shell renews the access token once and the pending total is the total
  from the read asked again with the fresh token.
criteria:
- A 401 on the pending curation read makes the shell ask the identity provider for a fresh access token exactly once.
- The request for a fresh access token is sent with the owner's session cookie.
- The repeated pending curation read carries the fresh access token as its bearer.
- The repeated pending curation read does not carry the expired access token as its bearer.
- After a successful renewal, the pending curation total is the total of the repeated read's answer.
- A 401 on the repeated pending curation read does not ask the identity provider for a token a second time.
- A pending curation read that fails without a 401 is not asked again before the next 20-second interval.
- No pending curation read is made while no access token is held.
- The health read carries no Authorization header.
- A failed health read does not ask the identity provider for a token.
implements:
- rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
- scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown
- rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
- rules/application-shell/the-pending-total-needs-a-token
- contracts/application-shell/bff-shell-reads
- domain/application-shell/application-shell
---
## What it is
This task gives the pending curation read one renewal of an expired token and one repeat of the read with the fresh token.
It leaves the health read without a bearer and without renewal.

## Notes
UNDERDETERMINED, from the specification — rules/application-shell/an-expired-token-is-renewed-by-the-pending-read says the read is asked once more, and rules/application-shell/health-and-pending-are-asked-every-twenty-seconds allows no retry beyond the one repeat after a renewed token; no criterion stops a third read after the repeated read is itself answered 401. Passes: on a 401 to the repeated read, the shell does not renew again but sends the pending curation read a third time, or keeps sending it, with the same fresh token before the next 20-second interval.
UNDERDETERMINED, from the specification — rules/application-shell/the-pending-total-needs-a-token requires the queue listing requested with limit 1, and contracts/application-shell/bff-shell-reads gives GET /api/v1/curation/queue?limit=1; no criterion fixes the form of the repeated read beyond its bearer. Passes: the repeated pending curation read asks the queue listing with no limit, or a different limit, and the fresh bearer, and shows the total from that answer.
UNDERDETERMINED, from the specification — rules/application-shell/the-pending-total-needs-a-token counts an answer without a total as 0, and no criterion says what is shown when the repeated read's answer has no total, for example a 401 on the repeated read. Passes: when the repeated read's answer has no total, the shell keeps the total shown before the renewal, or shows nothing, instead of 0 pending.
UNDERDETERMINED, from the specification — rules/application-shell/health-and-pending-are-asked-every-twenty-seconds says both reads are asked every 20 seconds, and only one criterion mentions the interval, as the earliest a failed read may be asked again; no criterion fixes the cadence of successful reads. Passes: the shell asks the health and the pending curation total every 5 seconds and never repeats a failed read inside its own interval.
UNDERDETERMINED, from the specification — rules/application-shell/health-and-pending-are-asked-every-twenty-seconds says the health read is not retried on failure, and the health criteria only forbid an Authorization header and a token request after a failed health read. Passes: after a failed health read, the shell repeats the health read at once with no Authorization header and no token request.
REMAINDER, from the specification — The statement of rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session, scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in and the matching refusal of read-pending-curation in contracts/application-shell/bff-shell-reads reach no criterion of this task, which covers the successful renewal only. Belongs: task/pending-read-token-renewal/end-session-on-failed-pending-renewal.
ADVISORY, from the specification — rules/application-shell/an-expired-token-is-renewed-by-the-pending-read and contracts/application-shell/bff-shell-reads do not say whether the fresh token replaces the stored one for later reads, which whoever implements token storage meets.
