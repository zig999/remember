---
target: frontend
title: 'Token renewal on the shell''s pending curation read: review'
summary: What the coverage, conformance and standard passes found over the shell status hook and the two spec files written
  by the two tasks of the initiative shell-pending-token-renewal.
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
  missing: run/shell-pending-token-renewal passed; there was no failure to read
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
  why: The cookie is shown only by the token request carrying credentials "include" to a stubbed fetch. No cookie is actually
    sent or received anywhere in the set. The request-level property is asserted directly and is the whole of what the shell
    controls.
- criterion: The repeated pending curation read carries the fresh access token as its bearer.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the identity provider once with the session cookie and repeats the read with the fresh token
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: shows the total of the repeated read's answer
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
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: does not ask the identity provider a second time when the repeated read is also answered 401
  why: The test mounts the hook under a QueryClient whose defaults set retry to false for every query. The application's client
    in src/lib/query-client.ts sets retry to 1. So the hook's own retry setting is never exercised. If the hook stopped withholding
    a retry, the failed query would run once more in the application, with the fresh token now held. That run would be answered
    401 and would ask the identity provider a second time. This test would still pass.
- criterion: A pending curation read that fails without a 401 is not asked again before the next 20-second interval.
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is not asked again before the next 20-second interval when it fails without a 401
  - file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
  why: There are two gaps. First, the only failure without a 401 that any test submits to the pending read is an answered
    500. A pending read that fails with no answer at all (the request itself rejected) is never exercised. Second, both tests
    run under a QueryClient whose defaults set retry to false, while the application's client sets retry to 1. A hook that
    dropped its own retry setting would repeat a failed pending read before the interval in the application, and both tests
    would still pass.
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
  why: In "is the queue listing with limit 1 ..." this criterion is asserted in passing, beside the read's address, its bearer
    and the count-as-0 rule. Those belong to the already delivered footer polling, not to these tasks. The dedicated test
    "is not made while no access token is held" carries the criterion on its own.
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
    name: asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health
      without the token
- criterion: A failed renewal on the pending curation read leaves the auth store holding no access token.
  state: covered
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
- criterion: A failed renewal on the pending curation read replaces the page with the sign-in address carrying the reason
    session_expired.
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the identity provider holds no session
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: leaves no access token and replaces the page with the sign-in address when the renewal request itself fails
  why: The address and its reason are asserted. They are asserted on a redirect function the tests inject through __setShellRedirectForTests,
    which takes the place of the production redirect. So the "replaces the page" half is never exercised. If the production
    redirect navigated with location.assign, or with any other navigation that keeps the current page in the history instead
    of replacing it, both tests would still pass.
- criterion: A failed renewal on the pending curation read is not followed by a repeat of the pending curation read.
  state: partial
  tests:
  - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: is not followed by another pending read or another renewal, at once or at the following intervals
  why: The test mounts the hook under a QueryClient whose defaults set retry to false, while the application's client sets
    retry to 1. So the test never exercises whether the shell's own query configuration would run the failed read again after
    a failed renewal. Only the hook's own logic, with retries disabled from outside, is shown not to repeat it.
unpaired:
- test:
    file: src/shell/api/__tests__/use-shell-status-session.spec.ts
    name: keeps the renewed token and does not replace the page
  asserts: After a 401 to the pending read and a successful renewal, the auth store holds the fresh token and no redirect
    is made. The task leaves open (ADVISORY note) whether the fresh token replaces the stored one, and no criterion decides
    it.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the health and the pending total every 20 seconds when the reads succeed
  asserts: With both reads succeeding, exactly one health read, one pending read and no token request happen before 20 seconds,
    and exactly two of each read at 20 seconds. This is the cadence of successful reads, which the task notes as UNDERDETERMINED.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: asks the repeated read as the queue listing with limit 1
  asserts: The repeated pending read after a renewal is sent to /api/v1/curation/queue?limit=1. This is the form of the repeated
    read, which the task notes as UNDERDETERMINED.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: does not send a third pending read before the next interval when the repeated read is also answered 401
  asserts: When the read and its repeat are both answered 401, exactly two pending reads are sent through 19,999 ms. That
    means no third read before the next interval, which the task notes as UNDERDETERMINED.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: is not repeated at once after the request fails
  asserts: A health read whose request rejects is sent only once through 19,999 ms. This is the health no-retry rule, which
    the task notes as UNDERDETERMINED. Its criteria cover only the missing Authorization header and the missing token request.
- test:
    file: src/shell/api/__tests__/use-shell-status.spec.ts
    name: shows 0 pending, not the total shown before, when the repeated read's answer has no total
  asserts: A total of 5 is shown. Then at the next interval the read is answered 401, the token is renewed and the repeat
    is answered 401. After that exactly three pending reads have been made and 0 is shown, not 5. What to show when the repeated
    read's answer has no total is noted by the task as UNDERDETERMINED.
findings:
- pass: conformance
  file: src/shell/api/use-shell-status.ts
  where: renewToken(), line 43, inside the renewal that getPendingJson() runs on a 401 (node rules/application-shell/an-expired-token-is-renewed-by-the-pending-read)
  evidence: useAuthStore.getState().setToken(fresh);
  cost: After a renewal, the fresh token is also kept as the shell's stored token, so every later read uses it. No node of
    the pending-read renewal says this. The nodes say only that the shell asks the identity provider once and asks the read
    once more with the fresh token. The one rule that states storing a renewed token, a-refreshed-token-repeats-the-request,
    constrains the request helper and not this read. A reader looking in the specification for what happens to the token after
    a renewed pending read finds nothing, and the answer lives only in this file.
  correction: The analysis would decide whether a renewed token on the pending read is stored. If it is, a node would state
    it, probably rules/application-shell/an-expired-token-is-renewed-by-the-pending-read, or the node the request-helper rule
    belongs to would be widened to cover it.
  kind: unstated
reconciliation: siegard-reconcile/shell-pending-token-renewal.md
run: run/shell-pending-token-renewal
---

## What it is

The review of the two tasks of the initiative shell-pending-token-renewal, over the shell status hook and the two spec files they wrote.
The coverage, conformance and standard passes ran, and the failures pass did not: the captured run run/shell-pending-token-renewal passed typecheck, lint and test, so there was no failure to read.

## Notes

- No reading rule of the standard reaches any of the three files; the only rules that reach them are TYP-01, HKS-01 and DAT-01, which the lint and typecheck steps decide.
- The standard pass was handed an empty set of reading rules and returned no findings; that is a statement about the registry's reach and not a clean reading.
- Five nodes were handed to certification; two came back covered and three partial, each partial with a remainder a finite test could assert, which `trace.py --owed` lists.
- The shell target is declared freely edited, so drift on files outside this set was counted and held back, not listed.
