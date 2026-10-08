---
title: Proof for renewing an expired token on the pending curation read
summary: Fourteen tests over the shell's pending curation and health reads cover every criterion, the four nodes a finite test decides, and the five underdetermined entries. Two tests that read the total before the repeated read had rendered now wait for it.
target: frontend
implementation: sha256:580a840775cf6ab74d929483c781cbd71001cbdcb09159aff5e5ced2d7f06b03
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite-2
tests:
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > asks the identity provider once with the session cookie and repeats the read with the fresh token
  proves: A 401 on the pending curation read makes the shell ask the identity provider for a fresh access token exactly once; the request is sent with the owner's session cookie; the repeated read carries the fresh token as its bearer and not the expired one. Also decides the rule 'A 401 on the pending curation read MUST make the shell ask the identity provider once for a fresh access token with the session cookie and ask the read once more with it.'
  fails_when: the sequence of requests is anything other than the stale-bearer pending read, one token request with credentials include, then the fresh-bearer pending read. That covers no renewal, two renewals, a renewal without the cookie, a repeat with the stale bearer, and no repeat.
  demonstrates: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > shows the total of the repeated read's answer
  proves: After a successful renewal, the pending curation total is the total of the repeated read's answer.
  fails_when: the footer total comes from the first 401 answer, a default, or anything other than the repeated read's total
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > does not ask the identity provider a second time when the repeated read is also answered 401
  proves: A 401 on the repeated pending curation read does not ask the identity provider for a token a second time.
  fails_when: a 401 on the repeated read triggers a second token request
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > does not send a third pending read before the next interval when the repeated read is also answered 401
  proves: 'UNDERDETERMINED entry 1: no criterion stops a third read after the repeated read is itself answered 401.'
  fails_when: after the repeated read is answered 401, the shell sends the pending read a third time, or keeps sending it, before the next 20-second interval
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > asks the repeated read as the queue listing with limit 1
  proves: 'UNDERDETERMINED entry 2: the repeated read is GET /api/v1/curation/queue?limit=1, not another form.'
  fails_when: the repeated read asks the queue listing with no limit, a different limit, or another path
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > shows 0 pending, not the total shown before, when the repeated read's answer has no total
  proves: 'UNDERDETERMINED entry 3: an answer without a total counts as 0, here when the repeated read''s answer is also a 401. The test also asserts that the three pending reads were sent, so the 0 comes from the repeated read''s answer.'
  fails_when: the shell keeps the total shown before the renewal, or shows nothing, instead of 0 when the repeated read's answer has no total; or the repeated read is not sent
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is not asked again before the next 20-second interval when it fails without a 401
  proves: A pending curation read that fails without a 401 is not asked again before the next 20-second interval, and is asked at the interval.
  fails_when: a non-401 failure of the pending read is retried at once, or is not asked again at 20 seconds
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is not made while no access token is held
  proves: No pending curation read is made while no access token is held.
  fails_when: any pending read is sent while the auth store holds no token, at mount or at the 20-second interval
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without a total counts as 0
  proves: The pending curation total is the queue listing's total requested with limit 1 and the access token as a bearer, no request being made without a token and an answer without a total counting as 0. After the token is held, the test waits for the interval's second answer to render before reading the total.
  fails_when: a request is made with no token, the request is not queue?limit=1 with Bearer of the held token, the answer's total is not shown, or an answer without a total is not shown as 0
  demonstrates: rules/application-shell/the-pending-total-needs-a-token
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > carries no Authorization header while a token is held
  proves: The health read carries no Authorization header.
  fails_when: GET /health is sent with an Authorization header while the shell holds a token
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > does not ask the identity provider for a token when it is answered 401
  proves: A failed health read does not ask the identity provider for a token.
  fails_when: a 401 on the health read causes a token request
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > is not repeated at once after the request fails
  proves: 'UNDERDETERMINED entry 5: a failed health read is not repeated at once.'
  fails_when: after a failed health read the shell repeats the health read before the next 20-second interval
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the shell reads > asks the health and the pending total every 20 seconds when the reads succeed
  proves: 'UNDERDETERMINED entry 4: the cadence of successful reads is 20 seconds, for both reads.'
  fails_when: either read is asked before 20 seconds, for example every 5 seconds, or is not asked again at 20 seconds
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the shell reads > asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health without the token
  proves: The health and the pending curation total are each asked every 20 seconds and not retried on failure other than the one repeat after a renewed token, health without the token.
  fails_when: either read is asked at another cadence, a failed health or pending read is retried before its interval, the renewal repeat is missing or doubled, or the health read carries an Authorization header
  demonstrates: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
not_applicable:
- edge_case: a network failure (rejected fetch) on the pending read
  why: No criterion or node distinguishes it from a non-401 failure, which the 500 test covers; a second test would be the same evidence.
- edge_case: the renewal request itself failing (identity provider unreachable or answering no token)
  why: That is the failed-renewal refusal, which belongs to the sibling task end-session-on-failed-pending-renewal. No criterion of this task states it.
- edge_case: result.total as the wrapped form of the total
  why: The wrapped form is an alternative spelling of one fact and does not change what any obligation requires. The plain total is the one representative.
- edge_case: two operations on one subject at once, such as overlapping interval fires
  why: No criterion or node states concurrent behavior.
untested:
- 'scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown: its three consequences (the token is asked once, the read is repeated with the fresh token, the footer shows that answer''s total) are each exercised by a separate test above, none of which carries the whole scenario. One combined test would repeat the same evidence. The scenario''s given of a still-valid session cookie is not exercised, since the identity provider is a stub.'
- 'contracts/application-shell/bff-shell-reads: its refusal ''rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session'' (answer: the sign-in address with reason session_expired) is the sibling task''s. The other operations and refusals are exercised only piecewise by tests that demonstrate the rules above, so no finite test decides the contract whole.'
- 'domain/application-shell/application-shell: an aggregate with operations (open-address, toggle-palette, choose-as-of, show-failure) and attributes this task does not touch. No finite test decides it whole.'
- 'Implementation inference: when the renewal fails, the read returns the 401 body and the shell keeps showing 0 without clearing the store or redirecting. No node decides it, and the sibling task owns that behavior.'
- 'Implementation inference: the fresh token is written to the auth store with setToken for later reads. The task''s ADVISORY says the specification does not decide it, so it is left unpinned.'
- 'Implementation inference: the repeated read''s body is returned without inspecting its status, so a 401 on the repeat becomes 0. The criteria and the rule ''answer without a total counts as 0'' cover the observable result, and the choice of not inspecting the status is arrangement.'
- The REMAINDER in the task Notes (the failed-renewal rule and scenario) belongs to the sibling task and no criterion here reaches it.
contested:
- what: The diagnostician's cause (both failing tests asserted before the second pending answer was rendered) is accepted. The implementation is not contested.
  why: 'From reading use-shell-status.ts, useCurationCount derives the total from the query''s current data. A refetch whose queryFn resolves with a body that has no total replaces the previous data (TanStack''s structural sharing returns the new object) and gives 0, so 5 would not persist after a correct wait. I did not run anything. The probable mechanism is in the fake timers: the interval fires inside a tick, and TanStack Query''s notification scheduling uses setTimeout(0). That timer is taken as 1 ms when set during a tick and falls outside the following advance(0). Both tests now advance a further 100 ms, well short of the next 20-second interval, and keep the expected 0.'
---
## What it is
Fourteen tests over the shell's pending curation and health reads prove the criteria of the task, the four nodes a finite test decides and the five underdetermined entries.

## Notes
The first suite run, run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite, failed in the test step on two tests of this proof, with the diagnosis cause test: both read the total before the repeated read had rendered.
The test author rewrote the file whole with the expected values unchanged, and run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite-2 passed typecheck, lint and test.
The test author and the diagnosis both inferred the cause from reading, and the suite was not run by either; the second run is what decided it.
The test author ran nothing, and the suite runs above were captured afterwards by the delivery.
