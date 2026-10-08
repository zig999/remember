---
title: Proof that a failed renewal on the pending curation read ends the session
summary: Four tests in a new spec file show the stored token cleared, the page replaced with /sign-in?reason=session_expired, and no repeat of the read, with the renewal-succeeds boundary pinned. Two of them are offered as proof of the rule and the scenario.
target: frontend
implementation: sha256:832e797842568b4feef8cac4bcd9cc601c05fd6bfb0f5b610f8794e36352a506
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-end-session-on-failed-pending-renewal-suite
tests:
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  proves: 'The scenario''s given, when and then: an expired token and no identity-provider session, the pending curation read answered 401, then the stored token cleared and the page replaced with the sign-in address and the reason session_expired. Also the task criteria ''A failed renewal on the pending curation read leaves the auth store holding no access token'' and ''A failed renewal on the pending curation read replaces the page with the sign-in address carrying the reason session_expired''; the object diff shows which of the two failed.'
  fails_when: the auth store still holds an access token after the renewal request is answered 401, the page is not replaced, it is replaced more than once, or it is replaced with an address other than /sign-in?reason=session_expired
  demonstrates: scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
  proves: The rule's whole fact, 'A failed renewal of the access token on the pending curation read MUST clear the stored token and replace the page with the sign-in address and the reason session_expired', for a renewal that fails by a network error rather than by the no-session 401. Also the criteria on the cleared token and on the replaced page.
  fails_when: a renewal that fails other than by a 401 from the identity provider leaves the token in the store or does not replace the page with /sign-in?reason=session_expired, for example an implementation that ends the session only for the no-session answer
  demonstrates: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read is not followed by another pending read or another renewal, at once or at the following intervals
  proves: '''A failed renewal on the pending curation read is not followed by a repeat of the pending curation read.'''
  fails_when: after the failed renewal a second pending read is sent at once, with the stale token or any other, or at a later 20-second interval, or the renewal is attempted again
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a successful renewal on the pending curation read keeps the renewed token and does not replace the page
  proves: 'The boundary of the two criteria on the cleared token and the replaced page: the session ends on a failed renewal and not on a successful one.'
  fails_when: a renewal that succeeds still clears the token or replaces the page with the sign-in address
not_applicable:
- edge_case: the pending read failing without a 401 (a 500 or an unreachable BFF)
  why: No criterion or node states what a non-401 failure does to the session. The scenario's trigger is a 401 and the rule speaks only of a failed renewal. The sibling proof already pins that such a read is not retried.
- edge_case: a second 401 on the repeated read after a renewed token
  why: That is the successful-renewal path owned by task/pending-read-token-renewal/renew-expired-token-on-pending-read. No renewal fails there, so none of this task's criteria reaches it, and the sibling proof holds it.
- edge_case: no access token held, so the pending read is never made
  why: No renewal is attempted, so no criterion here reaches it. The sibling proof pins it.
- edge_case: a renewal that answers with an empty or non-JSON body, or a non-401 error status
  why: The rule treats every failed renewal alike, and two representatives (the no-session 401 and a network failure) already cover the rule's class. A third would repeat the same evidence.
- edge_case: window.location.replace unavailable, or the page replacement itself failing
  why: No criterion or node states behavior for a missing or failing browser location.
- edge_case: two renewals at once, from the shell and from a page's own request wrapper
  why: No node states a rule for it. The implementation record defers it as the race the inventory already records across the wrappers, and a test would assert a guarantee nobody made.
untested:
- 'contracts/application-shell/bff-shell-reads: its fact spans two operations and four answers (health unparsed, no total or no token, the renewed total, the sign-in address). This task''s tests reach only the sign-in refusal, and the rest belongs to the sibling task and the footer''s polling. A test asserting that part as the whole would be refused, so the node carries no demonstrates here.'
- 'rules/application-shell/health-and-pending-are-asked-every-twenty-seconds: the task''s own Notes REMAINDER says only the no-retry clause reaches this task, and only on a failed renewal. The 20-second interval of both reads, the one repeat after a renewed token and the tokenless health read belong to the sibling task and the already delivered footer polling, and the pending read stops by design once the session ends. The third test covers the no-retry clause alone, so the node is not claimed.'
- 'domain/application-shell/application-shell: an aggregate-root declaration of attributes and operations, with no fact that one finite test decides.'
- 'Implementation inference about behavior: after a failed renewal the read still returns the 401 body, so the footer count shows 0 between clearing the token and the page replacement. No node decides it, so the proof pins nothing about it.'
- 'Implementation inference about behavior: the token is cleared first and the page replaced second. The two effects are asserted only as an end state, and no node states their order.'
---
## What it is
Four tests in a new spec file show a failed renewal on the pending curation read clearing the stored token, replacing the page with the sign-in address and the reason session_expired, and sending no further read.

## Notes
The suite ran green on its first attempt, run/pending-read-token-renewal-end-session-on-failed-pending-renewal-suite.
The test author ran nothing, and the run above was captured afterwards by the delivery.
The tests live in a file of their own and leave the sibling task's proof file untouched.
