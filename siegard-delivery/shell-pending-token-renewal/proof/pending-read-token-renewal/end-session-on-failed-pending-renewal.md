---
title: Proof that a failed pending-read renewal ends the session through the browser's own page replacement
summary: The proof file now keeps its five seam-based tests and adds two that leave the production redirect in place and spy on location.replace and location.assign, closing the remainders of the two nodes whose certification came back partial.
target: frontend
implementation: sha256:832e797842568b4feef8cac4bcd9cc601c05fd6bfb0f5b610f8794e36352a506
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-end-session-on-failed-pending-renewal-suite-2
tests:
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read, with the production redirect in place > clears the stored token and replaces the browser page once with the sign-in address when the renewal request itself fails
  proves: Remainder (A) and the criteria 'A failed renewal on the pending curation read leaves the auth store holding no access token' and '... replaces the page with the sign-in address carrying the reason session_expired'. With the redirect seam reset to the production default, a pending read answered 401 and a renewal request that fails leave no stored token and call the browser's location.replace exactly once with "/sign-in?reason=session_expired".
  fails_when: the stored token is still held after the failure, or the production redirect stops calling location.replace (does nothing, calls assign, or assigns href), or it calls replace more than once, or it calls it with any address other than "/sign-in?reason=session_expired".
  demonstrates: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read, with the production redirect in place > replaces the browser page with the sign-in address and never navigates with a history entry when the identity provider holds no session
  proves: Remainder (B). Given an expired held token, the pending read answered 401 and the identity provider answering 401 with no session, and with no test recorder installed, the page's location is replaced with "/sign-in?reason=session_expired" and location.assign is never called.
  fails_when: the production redirect does not call location.replace with exactly "/sign-in?reason=session_expired", or it also (or instead) navigates with location.assign and so adds a history entry.
  demonstrates: scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read > leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  proves: 'Criteria 1 and 2: the auth store ends with no access token and the shell''s redirect receives exactly "/sign-in?reason=session_expired" when the identity provider answers 401 with no session.'
  fails_when: the token is still stored after the failure, the redirect is not called, it is called more than once, or it receives another address or reason.
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read > leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
  proves: Criteria 1 and 2 for the class where the renewal request rejects on the network rather than the provider answering 401.
  fails_when: a rejected renewal request leaves the token stored, or does not send the owner to "/sign-in?reason=session_expired" exactly once.
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a failed renewal on the pending curation read > is not followed by another pending read or another renewal, at once or at the following intervals
  proves: 'Criterion 3: after a failed renewal there is exactly one pending read and one renewal request, immediately and across the following 20-second intervals.'
  fails_when: a failed renewal is followed by a repeat of the pending read, a second renewal attempt, or a later interval read while the token is cleared.
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  name: a successful renewal on the pending curation read > keeps the renewed token and does not replace the page
  proves: 'The implementation''s preserved behavior: a renewal that succeeds stores the fresh token and does not end the session. It guards the success path against the new failure branch.'
  fails_when: a successful renewal clears the token, loses the fresh token, or sends the page to the sign-in address.
not_applicable:
- edge_case: A renewal that succeeds and then a second 401 on the repeated read
  why: That belongs to task renew-expired-token-on-pending-read, which owns the one repeat after a renewed token. Its proof file already covers it.
- edge_case: 'Absent input: no token held, so the pending read is never made'
  why: No criterion or node of this task decides it. The-pending-total-needs-a-token owns it and the sibling proof file covers it.
- edge_case: Empty or non-JSON body on the 401 response
  why: The read still returns the 401 body or null, and the count falls to 0 under an inference no node states. Neither criteria nor nodes of this task require a particular outcome.
- edge_case: Two operations against one subject at once (the shell and a page's request wrapper renewing the same expired token)
  why: The implementation record defers it, and no node states a rule for it. A test would pin a guarantee nobody made.
- edge_case: 'Slow dependency: the identity provider answers slowly'
  why: No criterion or node states a timeout or ordering for the renewal. Both failure classes it does state (provider answers 401, request rejects) are covered.
- edge_case: A pending read that fails without a 401 (500 or network error)
  why: This is not a failed renewal, so no criterion of this task reaches it. It belongs to the twenty-seconds rule's no-retry clause, which the sibling proof file exercises.
untested:
- 'rules/application-shell/health-and-pending-are-asked-every-twenty-seconds: this task touches only the no-retry clause for a failed renewal, which the criterion-3 test already exercises. The interval of both reads, the one repeat after a renewed token and the tokenless health read belong to other tasks, so no finite test of this task decides the node whole. A test here claiming it would assert part of it as the whole.'
- 'contracts/application-shell/bff-shell-reads: the contract spans two operations and three refusals. The failed-renewal refusal is exercised by the tests above, but the health operation, the no-total refusal and the renewed-total refusal are other tasks'' ground. No test of this task decides the contract whole.'
- 'domain/application-shell/application-shell: an aggregate root with attributes and operations that this task only honors. No finite test decides a domain declaration''s fact, and the implementation record states that no declaration changed.'
- 'Inference about behavior, recorded by the implementation: after a failed renewal the read returns the 401 body, so the footer count shows 0 until the page is replaced. No node decides it, so no test pins it.'
- 'Inference about behavior, recorded by the implementation: the stored token is cleared first and then the redirect is made. No node states an order. The tests assert both outcomes, not their order.'
- 'Inference about arrangement, recorded by the implementation: the shell-local redirectImpl and the exported __setShellRedirectForTests setter. A test over it would pin the arrangement. The new tests use the setter only to restore the production default.'
---
## What it is
The proof that a failed renewal on the pending curation read ends the session now carries seven tests, two of which leave the production redirect in place and spy on the browser's location.

## Notes
This is a proof-only re-delivery: the implementation record and the source were not touched, and the proof was rewritten whole.
The remainders it closes were left by the review recorded in siegard-reconcile/shell-pending-token-renewal.md, over rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session and scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in.
Both had come back partial because the earlier tests only checked the address handed to a recorder the tests installed in place of the production redirect.
The first proof of this task passed run/pending-read-token-renewal-end-session-on-failed-pending-renewal-suite, and the rewritten one passed run/pending-read-token-renewal-end-session-on-failed-pending-renewal-suite-2.
The test author returned a contested entry reading none, which is not a disagreement and was left out of the record.
The test author ran nothing, and the run above was captured afterwards by the delivery.
