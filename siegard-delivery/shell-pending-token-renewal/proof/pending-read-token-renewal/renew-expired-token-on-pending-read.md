---
title: Proof for the pending read's token renewal and the shell's read cadence
summary: What proves task/pending-read-token-renewal/renew-expired-token-on-pending-read in src/shell/api/__tests__/use-shell-status.spec.ts. This re-delivery adds one test, which runs the health and pending reads under the application's own query client and shows that neither failed read is repeated before the next interval.
target: frontend
implementation: sha256:580a840775cf6ab74d929483c781cbd71001cbdcb09159aff5e5ced2d7f06b03
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite-3
tests:
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > asks the identity provider once with the session cookie and repeats the read with the fresh token
  proves: 'Criteria 1 to 4: a 401 on the pending curation read makes the shell ask the identity provider for a fresh token exactly once, with the session cookie (credentials include), and the repeated read carries the fresh bearer and not the expired one.'
  fails_when: The shell asks for the token zero or two times, omits the session cookie, repeats the read with the expired bearer, or does not repeat it.
  demonstrates: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > shows the total of the repeated read's answer
  proves: 'Criterion 5: after a successful renewal, the pending total is the total of the repeated read''s answer.'
  fails_when: The shown total comes from the 401 answer, from a stored value, or is not the repeated read's total.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > does not ask the identity provider a second time when the repeated read is also answered 401
  proves: 'Criterion 6: a 401 on the repeated read does not ask the identity provider for a token a second time.'
  fails_when: A second token request is sent after the repeated read is answered 401.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > does not send a third pending read before the next interval when the repeated read is also answered 401
  proves: The UNDERDETERMINED entry on a third read after the repeated read is itself answered 401.
  fails_when: The shell sends a third pending read, or keeps sending, before 20,000 ms pass after the repeated read is answered 401.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > asks the repeated read as the queue listing with limit 1
  proves: 'The UNDERDETERMINED entry on the form of the repeated read: the queue listing with limit 1.'
  fails_when: The repeated read asks the queue listing with no limit or a different one.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read answered 401 > shows 0 pending, not the total shown before, when the repeated read's answer has no total
  proves: 'The UNDERDETERMINED entry on a repeated read with no total: it counts as 0 (the-pending-total-needs-a-token), and the total shown before the renewal is not kept.'
  fails_when: After the repeated read comes back with no total, the shell keeps the earlier total or shows nothing instead of 0.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is not asked again before the next 20-second interval when it fails without a 401
  proves: 'Criterion 7: a pending read that fails without a 401 is not asked again before the next 20-second interval.'
  fails_when: A second pending read is sent before 20,000 ms after a 500, or none is sent at the interval.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is not made while no access token is held
  proves: 'Criterion 8: no pending curation read is made while no access token is held.'
  fails_when: A pending read is sent while no token is held, at mount or at an interval.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the pending curation read > is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without a total counts as 0
  proves: 'The fact of the-pending-total-needs-a-token, whole: queue listing with limit 1, the token as bearer, no request without a token, and an answer without a total counted as 0.'
  fails_when: The request has another path or limit, drops or alters the bearer, is made without a token, or an answer without a total counts as anything but 0.
  demonstrates: rules/application-shell/the-pending-total-needs-a-token
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > carries no Authorization header while a token is held
  proves: 'Criterion 9: the health read carries no Authorization header.'
  fails_when: The health read sends any Authorization header while a token is held.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > does not ask the identity provider for a token when it is answered 401
  proves: 'Criterion 10: a failed health read does not ask the identity provider for a token.'
  fails_when: A token request is sent after the health read is answered 401.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the health read > is not repeated at once after the request fails
  proves: The UNDERDETERMINED entry on repeating a failed health read at once.
  fails_when: A second health request is sent before 20,000 ms after a failed health read.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the shell reads under the application's own query client > repeats neither a health read that fails by network error nor a pending read answered 500 before the next interval, and asks the identity provider for nothing
  proves: 'The remainder: under createQueryClient(), the application''s own client (default retry 1, not retry false), a health read that fails by network error and a pending read answered 500, after 19,999 ms, leave exactly one health request, one pending request, and no request to the identity provider.'
  fails_when: A health or pending read is repeated before the interval, or the identity provider is asked for a token. In particular, the health hook stops turning retries off itself and falls back to the application client's default retry, so the failed health read is retried after the default 1,000 ms retry delay.
  demonstrates: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the shell reads > asks the health and the pending total every 20 seconds when the reads succeed
  proves: 'The UNDERDETERMINED entry on cadence: both reads are asked once at mount and again at 20,000 ms, never earlier.'
  fails_when: Either read is asked before 20,000 ms (for example every 5 seconds), or is not asked again at 20,000 ms.
- file: src/shell/api/__tests__/use-shell-status.spec.ts
  name: the shell reads > asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health without the token
  proves: 'Over a mixed timeline: one repeat after the renewed token and no other retry, an interval of 20 seconds for both reads, and a health request that never carries the token.'
  fails_when: A failed read is retried inside its interval, the renewal repeat is repeated, the interval changes, or a health request carries an Authorization header.
not_applicable:
- edge_case: A token request that fails or a session with no cookie on the pending read
  why: That is the failed-renewal behavior, which belongs to the sibling task task/pending-read-token-renewal/end-session-on-failed-pending-renewal and its own proof file, which is not edited here. This task's criteria cover the successful renewal only.
- edge_case: Two pending reads at once, or a read that answers slowly
  why: No criterion or node states concurrent or latency behavior for the shell reads. A test would assert a guarantee nobody made.
- edge_case: A health answer that is not JSON, or a pending answer with an empty collection
  why: No criterion of this task reaches them. The health-is-judged-by-the-database-field rule is not implemented by this task, and an answer without a total is covered by the test on the-pending-total-needs-a-token.
- edge_case: A duplicate or boundary of the limit parameter other than 1
  why: The fact fixes limit 1. Other limits are one class that two tests already fail over, and a further representative would be the same evidence again.
untested:
- 'scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown: the node is finite, but no single test here asserts all three of its outcomes (identity provider asked once, read repeated once, total of that answer shown). The first and second tests of the 401 group split them, so nothing is claimed whole. The remainder named one assertion only, so no combined test was added.'
- 'contracts/application-shell/bff-shell-reads: read-health and read-pending-curation with a renewed token are exercised, but the contract''s refusal for the failed renewal (a-failed-renewal-on-the-pending-read-ends-the-session) belongs to the sibling task''s proof. No test of this file holds the contract whole, so it is not claimed.'
- 'domain/application-shell/application-shell: an aggregate whose attributes and operations no finite test of this task enumerates. It carries no fact of its own beyond what its constraining rules state, so it is left to the rules above.'
- 'In the new test, the pending half cannot fail on a retry default: the pending query function does not reject on a 500 (readBody returns the body), so no query-level retry arises from it either way. Only the health half, which fails by a rejected request, catches a hook that stops disabling retries. The test states the remainder assertion as written.'
- 'The inference that a failed renewal leaves the shell showing 0 and does not redirect: the implementation recorded it as a choice, and the sibling task has since replaced it. It is not pinned here.'
- The inference that the fresh token is written to the auth store (setToken) is behavior no criterion or node of this task states (the node's ADVISORY says as much). No test pins it.
- 'The inference that the repeated read''s body is returned without inspecting its status: the observable half, a 0 shown after a 401 on the repeat, is covered by the test above on a repeated read with no total, which rests on the rule that an answer without a total counts as 0. The status-blindness itself is a choice of arrangement and is not pinned.'
---
## What it is
Fourteen tests over the shell's pending curation and health reads prove the criteria of the task, the nodes a finite test decides and the five underdetermined entries, and one of them runs the reads under the application's own query client.

## Notes
This is a proof-only re-delivery: the implementation record and the source were not touched, and the proof was rewritten whole.
The remainder it closes was left by the review recorded in siegard-reconcile/shell-pending-token-renewal.md, over rules/application-shell/health-and-pending-are-asked-every-twenty-seconds, whose certification came back partial because every earlier test mounted the hooks under a client with retries off.
The first suite run of the earlier proof failed on two of its tests with the diagnosis cause test, and its rewrite passed run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite-2; the present proof passed run/pending-read-token-renewal-renew-expired-token-on-pending-read-suite-3.
The sibling task end-session-on-failed-pending-renewal changed src/shell/api/use-shell-status.ts after this task's implementation record was written, and its delivery and the review restamped the bindings; the implementation record of this task is left as it is.
The test author returned a files entry naming the test file itself, which holds a test and was left out of the record.
The test author ran nothing, and the run above was captured afterwards by the delivery.
