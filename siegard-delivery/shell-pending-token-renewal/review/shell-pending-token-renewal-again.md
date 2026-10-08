---
target: frontend
title: 'Token renewal on the shell''s pending curation read: second review'
summary: What the coverage, conformance and standard passes found over the shell status hook and the two spec files after
  the proof-only re-deliveries that rewrote both proofs whole.
reviewed:
- src/shell/api/use-shell-status.ts
- src/shell/api/__tests__/use-shell-status.spec.ts
- src/shell/api/__tests__/use-shell-status-session.spec.ts
tasks:
- task/pending-read-token-renewal/renew-expired-token-on-pending-read
- task/pending-read-token-renewal/end-session-on-failed-pending-renewal
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/shell-pending-token-renewal-again passed; there was no failure to read
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
coverage:
- criterion: A 401 on the pending curation read makes the shell ask the identity provider for a fresh access token exactly
    once.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the identity provider once with the session cookie and repeats the read with the fresh token
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
- criterion: The request for a fresh access token is sent with the owner's session cookie.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the identity provider once with the session cookie and repeats the read with the fresh token
  why: The only assertion on this is the fetch credentials mode "include" on the token request, inside the test's single sequence
    equality. No other test in the set checks how the token request is sent.
- criterion: The repeated pending curation read carries the fresh access token as its bearer.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the identity provider once with the session cookie and repeats the read with the fresh token
  why: Only the sequence equality binds the fresh bearer. The test "shows the total of the repeated read's answer" does not
    bind it, because its stub answers 7 to any authorization other than the expired one, including no authorization at all.
- criterion: The repeated pending curation read does not carry the expired access token as its bearer.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the identity provider once with the session cookie and repeats the read with the fresh token
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: shows the total of the repeated read's answer
- criterion: After a successful renewal, the pending curation total is the total of the repeated read's answer.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: shows the total of the repeated read's answer
- criterion: A 401 on the repeated pending curation read does not ask the identity provider for a token a second time.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: does not ask the identity provider a second time when the repeated read is also answered 401
- criterion: A pending curation read that fails without a 401 is not asked again before the next 20-second interval.
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is not asked again before the next 20-second interval when it fails without a 401
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: repeats neither a health read that fails by network error nor a pending read answered 500 before the next interval,
      and asks the identity provider for nothing
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
  why: Every pending failure in the set is a 500 answer. Nothing makes the pending read fail by a rejected request (a network
    error), so for that kind of failure the "not asked again" half is unexercised. Also, only the test run under the application's
    own query client (createQueryClient) binds this behavior as the shell ships it. The other two tests mount under a QueryClient
    whose defaults set retry to false. They would still pass if the hook left retrying to the application client's default
    retry policy.
- criterion: No pending curation read is made while no access token is held.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is not made while no access token is held
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without a total
      counts as 0
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: is not followed by another pending read or another renewal, at once or at the following intervals
  why: Finding, not a gap. In one equality, "is the queue listing with limit 1 and the token as bearer..." also asserts three
    things no criterion of either task states. These are the request URL with limit=1, the held token as bearer, and 0 shown
    for an answer without a total. The task's own notes record the limit form and the zero-without-total as underdetermined
    by its criteria. That test will change whenever any of them does.
- criterion: The health read carries no Authorization header.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: carries no Authorization header while a token is held
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
- criterion: A failed health read does not ask the identity provider for a token.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: does not ask the identity provider for a token when it is answered 401
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: repeats neither a health read that fails by network error nor a pending read answered 500 before the next interval,
      and asks the identity provider for nothing
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
- criterion: A failed renewal on the pending curation read leaves the auth store holding no access token.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: clears the stored token and replaces the browser page once with the sign-in address when the renewal request itself
      fails
- criterion: A failed renewal on the pending curation read replaces the page with the sign-in address carrying the reason
    session_expired.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: clears the stored token and replaces the browser page once with the sign-in address when the renewal request itself
      fails
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: replaces the browser page with the sign-in address and never navigates with a history entry when the identity provider
      holds no session
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
  why: Only the two tests under "with the production redirect in place" bind the page being replaced. They spy location.replace,
    and one also checks that location.assign is never called. The two "leaves no access token and replaces the page..." tests
    only check that the address /sign-in?reason=session_expired reaches the injected seam __setShellRedirectForTests. They
    would still pass if the shipped redirect added a history entry instead, or never navigated.
- criterion: A failed renewal on the pending curation read is not followed by a repeat of the pending curation read.
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: is not followed by another pending read or another renewal, at once or at the following intervals
  why: Pending reads are counted only for a renewal that fails because the identity provider answers 401. The set has two
    tests where the renewal request itself fails, a rejected request. Neither counts pending reads afterward, so for that
    kind of failure the no-repeat half is unexercised.
unpaired:
- test:
    file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: keeps the renewed token and does not replace the page
  asserts: After a successful renewal, the auth store holds the fresh token and the injected redirect seam receives no address.
    The task's own notes record that the specification does not say whether the fresh token replaces the stored one.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the health and the pending total every 20 seconds when the reads succeed
  asserts: When both reads succeed, there is one health read and one pending read before 20 seconds, two of each at 20 seconds,
    and no token request. It runs under a client with retry set to false.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the repeated read as the queue listing with limit 1
  asserts: The second pending read, made after a renewal, is sent to /api/v1/curation/queue?limit=1. The task's notes record
    this form as underdetermined by its criteria.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: does not send a third pending read before the next interval when the repeated read is also answered 401
  asserts: When both the first and the repeated pending reads are answered 401, exactly two pending reads are sent within
    the first 19,999 ms. The task's notes record that no criterion stops a third read.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is not repeated at once after the request fails
  asserts: A health read that fails by a rejected request is sent once and only once within the first 19,999 ms. It runs under
    a client with retry set to false. The task's notes record health non-retry as underdetermined by its criteria.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: shows 0 pending, not the total shown before, when the repeated read's answer has no total
  asserts: The shown total starts at 5. At the next interval the read is answered 401, the token is renewed, and the repeated
    read is also answered 401. After that, three pending reads have been made and 0 is shown. The task's notes record what
    is shown for a repeated answer without a total as underdetermined.
findings:
- pass: conformance
  file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  where: the assertion in the test "keeps the renewed token and does not replace the page" (lines 242-255) (node rules/application-shell/an-expired-token-is-renewed-by-the-pending-read)
  evidence: 'token: FRESH,'
  cost: The test asserts that the renewal the pending read makes leaves the fresh token in the auth store. None of the shell's
    nodes in this set says so. The rule says only that the read is asked once more with the fresh token. The only statement
    that a renewed token is stored is `rules/application-shell/a-refreshed-token-repeats-the-request`, and it constrains the
    request helper, not the pending read. Because the expectation lives only in the test, the next reader looking for what
    the pending read does with a renewed token will not find it in the specification. If the behavior changes, the test fails
    with no node to say which was decided.
  correction: Analysis would have to decide whether the pending read stores the renewed token. If it does, the sentence belongs
    in `rules/application-shell/an-expired-token-is-renewed-by-the-pending-read`, or the pending read is declared to go through
    the request helper whose rule already says so. If it does not, the assertion has no node behind it.
  kind: unstated
reconciliation: siegard-reconcile/shell-pending-token-renewal-again.md
run: run/shell-pending-token-renewal-again
---

## What it is

The second review of the initiative shell-pending-token-renewal, over the shell status hook and the two spec files, after the proof-only re-deliveries of step 5 rewrote both proofs whole.
The coverage, conformance and standard passes ran, and the failures pass did not: the captured run run/shell-pending-token-renewal-again passed typecheck, lint and test, so there was no failure to read.

## Notes

- No reading rule of the standard reaches any of the three files; the only rules that reach them are TYP-01, HKS-01 and DAT-01, which the lint and typecheck steps decide, and the standard pass was handed an empty set of reading rules.
- Five nodes were handed to certification; four came back covered and one partial, the rule that the health and pending reads are asked every twenty seconds, whose new remainder is one a finite test could assert.
- The first review is siegard-reconcile/shell-pending-token-renewal.md and its record review/shell-pending-token-renewal.md; this one does not replace it.
- The unstated finding of the first review over the hook reappears here over the session spec file, as the expectation that a renewed token is kept in the auth store.
