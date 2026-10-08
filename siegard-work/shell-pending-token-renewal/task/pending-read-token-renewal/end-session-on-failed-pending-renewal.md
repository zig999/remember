---
title: End the session when renewal on the pending read fails
summary: A failed renewal on the pending curation read clears the stored token and sends the owner to sign in with the reason
  session_expired.
rationale: The scope states no cut. Ending the session is a different outcome from showing a renewed total and changes for
  a different reason; it depends on the renewal task because the renewal attempt must exist before its failure can be handled.
sources:
- intake/scope.md
objective: When renewing the access token on the pending curation read fails, the stored token is cleared and the page is
  replaced with the sign-in address carrying the reason session_expired.
criteria:
- A failed renewal on the pending curation read leaves the auth store holding no access token.
- A failed renewal on the pending curation read replaces the page with the sign-in address carrying the reason session_expired.
- A failed renewal on the pending curation read is not followed by a repeat of the pending curation read.
depends_on:
- task/pending-read-token-renewal/renew-expired-token-on-pending-read
implements:
- rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
- scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
- rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
- contracts/application-shell/bff-shell-reads
- domain/application-shell/application-shell
---
## What it is
This task ends the owner's session when the pending curation read cannot renew an expired token.
It clears the stored token and replaces the page with the sign-in address, using the reason session_expired.

## Notes
REMAINDER, from the specification — The statement of rules/application-shell/health-and-pending-are-asked-every-twenty-seconds has clauses for the 20-second interval of both reads, the one repeat after a renewed token and the health read without a token, none of which reaches a criterion here; only the no-retry clause applies, to a failed renewal where no renewed token exists. Belongs: task/pending-read-token-renewal/renew-expired-token-on-pending-read for the repeat after a renewed token, and the footer's status polling already delivered for the interval and the health read.
ADVISORY, from the specification — Every criterion assumes the renewal was attempted, and rules/application-shell/an-expired-token-is-renewed-by-the-pending-read, which makes the 401 trigger it, is implemented by task/pending-read-token-renewal/renew-expired-token-on-pending-read, on which this task depends.
