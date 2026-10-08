---
title: End the session when renewal on the pending curation read fails
summary: A failed renewal on the pending curation read now clears the stored token and replaces the page with /sign-in?reason=session_expired, with no repeat of the read.
target: frontend
task: sha256:67281806a8ecf1a835b579c4e2be935547680acacb45c225dfdc3d8ab6a62ab5
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-end-session-on-failed-pending-renewal-build
files:
- path: src/shell/api/use-shell-status.ts
  effect: When the pending curation read is answered 401 and the renewal fails, the hook clears the auth store and replaces the page with /sign-in?reason=session_expired. It sends no second pending read and makes no second renewal. It adds a shell-local redirect (replacePage, redirectImpl) and an exported test setter, __setShellRedirectForTests, following the other request wrappers. A successful renewal still repeats the read once with the fresh token. The health read is untouched.
criteria:
- criterion: A failed renewal on the pending curation read leaves the auth store holding no access token.
  met: true
  how: In getPendingJson, a null result from renewToken() calls endSession(), which calls useAuthStore.getState().clear(). clear() removes the token from the store and from sessionStorage.
- criterion: A failed renewal on the pending curation read replaces the page with the sign-in address carrying the reason session_expired.
  met: true
  how: endSession() then calls redirectImpl(SESSION_EXPIRED_ADDRESS). The constant is "/sign-in?reason=session_expired" and the default implementation is window.location.replace.
- criterion: A failed renewal on the pending curation read is not followed by a repeat of the pending curation read.
  met: true
  how: 'The failure branch in getPendingJson returns the first 401 response''s body and never calls send(PENDING_PATH, ...) again. Once the token is cleared the query''s `enabled: token != null` is false, so the interval no longer reads. Failure is also not retried, because renewToken() is called once per read and the query uses retry: false.'
nodes:
- node: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: The invariant is the failure branch of getPendingJson, which calls endSession() (clear, then replace the page with the sign-in address and session_expired).
- node: scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: The given (expired token, no identity-provider session) makes fetchAccessToken throw, so renewToken() returns null. The when (pending read answered 401) is the 401 branch. The then (token cleared, page replaced with /sign-in?reason=session_expired) is endSession().
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: 'Only the no-retry clause is touched by this task. A failed renewal produces no repeat, so no failure is retried apart from the one repeat after a renewed token. REFETCH_MS, retry: false and the tokenless health read are unchanged.'
- node: contracts/application-shell/bff-shell-reads
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: The read-pending-curation refusal for the failed-renewal rule is now answered with the sign-in address and session_expired. The read-health operation and the other two refusals are unchanged.
- node: domain/application-shell/application-shell
  how: The task only honors it. The address and reason attributes describe shell state, and the page replacement goes through the browser location rather than a stored attribute, so no declaration changed.
inferences:
- inferred: The shell keeps its own redirectImpl and an exported __setShellRedirectForTests setter, rather than importing the redirect from lib/http.ts or the curation wrapper.
  from: The inventory convention in frontend/src/features/curation/api/_request.ts, where each wrapper carries its own redirectImpl and test setter. lib/http.ts does not export its redirectImpl, and reaching it would edit a file outside this task.
- inferred: The order is clear() first, then the redirect.
  from: trySilentRefresh in src/lib/http.ts and src/features/curation/api/_request.ts, which clear and then redirect.
- inferred: After a failed renewal the read still returns the 401 response's body rather than null, so the footer count follows the existing no-total fallback of 0 until the page is replaced.
  from: The unchanged tail of getPendingJson and the `d?.total ?? d?.result?.total ?? 0` fallback. No node states what the count shows in the moment between the clear and the page replacement.
divergences:
- from: 'Inventory must_not_duplicate: the trySilentRefresh and redirectImpl pattern in frontend/src/features/curation/api/_request.ts, which says a fifth full copy should be a deliberate choice.'
  departure: src/shell/api/use-shell-status.ts carries a fifth, minimal copy of the redirectImpl and test setter pattern, and does not reuse trySilentRefresh.
  why: The shell hook is not a request wrapper and its renewal must return a null result, not redirect inside the renewal, so the hook can read the 401 body first. None of the four existing copies exports its redirect. A shared one would require changing lib/http.ts or the other wrappers, which this task does not reach.
preserved:
- A successful renewal repeats the pending read once with the fresh token, and the repeated read's total is shown.
- A second 401 on the repeated read causes no second renewal and no third read before the next 20-second interval.
- The health read carries no Authorization header, never triggers renewal, and is not retried on failure.
- A pending read that fails without a 401 is not retried before the next interval.
- No pending read is made while no token is held. The queue listing with limit 1 and the bearer are unchanged.
- An answer with no total counts as 0.
- The sibling proof tests in src/shell/api/__tests__/use-shell-status.spec.ts, whose renewals all succeed and so never reach the new failure branch.
deferred:
- what: A concurrent renewal by the shell and by a page's own request wrapper on the same expired token may each clear the token and redirect.
  why: It is the race the inventory records across the four wrappers. Coordinating them would change files outside this task and no node states a rule for it.
- what: lib/query-client.ts routes an EnvelopeError through routeError, whose redirect action also clears and navigates. The shell hook does not use that path.
  why: Unifying the shell's session ending with the central error routing would change the hook's structure and lib/query-client.ts, which this task does not reach.
---
## What it is
A failed renewal on the pending curation read clears the stored token and replaces the page with the sign-in address and the reason session_expired.
The pending read does not repeat after the failure.

## Notes
The shell hook carries its own redirect function and test setter, a fifth copy of the pattern the other request wrappers hold, because none of them exports its redirect.
After a failed renewal the read still returns the 401 body, so the count shows 0 between the clearing of the token and the replacement of the page.
