---
contract_version: siegard-reconcile/9
title: 'Token renewal on the shell''s pending curation read: review reconciliation'
summary: The files were written by the deliveries of task/pending-read-token-renewal/renew-expired-token-on-pending-read
  and task/pending-read-token-renewal/end-session-on-failed-pending-renewal under the initiative shell-pending-token-renewal.
target: frontend
files:
- path: src/shell/api/__tests__/use-shell-status-session.spec.ts
  change: 'Written by the delivery of task/pending-read-token-renewal/end-session-on-failed-pending-renewal:
    the proof that a failed renewal ends the session.'
- path: src/shell/api/__tests__/use-shell-status.spec.ts
  change: 'Written by the delivery of task/pending-read-token-renewal/renew-expired-token-on-pending-read:
    the proof of the renewal and of the shell''s read cadence.'
- path: src/shell/api/use-shell-status.ts
  change: 'Written by the deliveries of both tasks. First: A leitura do total pendente (useCurationCount)
    trata um 401 pedindo ao provedor de identidade um token novo, com o cookie de sessão, por fetchAccessToken.
    Grava o token novo no store de autenticação e repete GET /api/v1/curation/queue?limit=1 uma única
    vez com ele como bearer. O total mostrado é o da resposta repetida. A leitura de saúde segue sem Authorization
    e sem renovação. Then: When the pending curation read is answered 401 and the renewal fails, the hook
    clears the auth store and replaces the page with /sign-in?reason=session_expired. It sends no second
    pending read and makes no second renewal. It adds a shell-local redirect (replacePage, redirectImpl)
    and an exported test setter, __setShellRedirectForTests, following the other request wrappers. A successful
    renewal still repeats the read once with the fresh token. The health read is untouched.'
nodes:
- node: contracts/application-shell/bff-shell-reads
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at send(), PENDING_PATH, getJson("/health"), useHealth()
    and useCurationCount(), lines 9-24, 66-89 — const PENDING_PATH = "/api/v1/curation/queue?limit=1";
    ... if (token) headers.Authorization = `Bearer ${token}`; ... queryFn: () => getJson("/health") ...
    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at endSession() and the fresh === null branch of getPendingJson(),
    lines 26, 50-53, 59-62 — const SESSION_EXPIRED_ADDRESS = "/sign-in?reason=session_expired"; ... useAuthStore.getState().clear();
    redirectImpl(SESSION_EXPIRED_ADDRESS);'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Give one input with the redirect seam not swapped: the pending curation read answers
    401 and the renewal fails. Expect one result: the stored token is cleared and the page is replaced
    with "/sign-in?reason=session_expired". The check is that the browser''s page-replacing navigation
    (for example a spied window.location.replace) is called once with that address.'
  read_at:
    node: sha256:e5d580a17fd63f5bfc3d88f0789dd9066d964247e912456e0528542ef492f513
    proof:
    - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
      digest: sha256:701d363bf4756cba9f97e960c9c26bf1125dab6482f59fde02bd3856d7256224
- node: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson(), lines 55-64 — if (res.status !==
    401) return readBody(res); const fresh = await renewToken(); ... return readBody(await send(PENDING_PATH,
    fresh));'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status.spec.ts
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at REFETCH_MS, and the useQuery options of useHealth()
    and useCurationCount() — const REFETCH_MS = 20_000; ... refetchInterval: REFETCH_MS, retry: false,'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Mount useHealth and useCurationCount under a QueryClient whose default allows retries,
    such as the application''s own client configuration, not `retry: false`. Make the health read fail
    with a network error and the pending read fail with a 500, then advance 19,999 ms. The expected result
    is exactly one health request and one pending request, with no request to the identity provider.'
  read_at:
    node: sha256:42602b23e9e43343a4567076b576b02ae561cf1d930af999bb83d81b2d7db9ce
    proof:
    - file: src/shell/api/__tests__/use-shell-status.spec.ts
      digest: sha256:8bd96504c3c455c6243758f8539090fc2f1dcdb9881dea1517f61214e6fbe508
- node: rules/application-shell/health-is-judged-by-the-database-field
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useHealth(), lines 73-75 — if (q.data == null) return
    "checking"; ... return (d.database ?? d.result?.database) === "ok" ? "ok" : "down";'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-active-ingestion-segment-is-never-shown
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useActiveRun(), lines 91-93 — export function useActiveRun():
    { label: string } | null { return null; }'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-pending-total-needs-a-token
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useCurationCount(), lines 78-89, with PENDING_PATH
    — enabled: token != null, ... return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status.spec.ts
- node: scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson() together with renewToken() and endSession(),
    lines 40-64 — } catch { return null; } ... if (fresh === null) { endSession(); return readBody(res);
    }'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result. Use the same given: an expired held token, the
    pending read answered 401, and the identity provider answering with no session. Leave the production
    redirect in place, with no test recorder installed. Expect the page''s location to be replaced, not
    navigated with a history entry, with "/sign-in?reason=session_expired". For example, a spy on window.location.replace
    that receives exactly that address while location.assign is never called.'
  read_at:
    node: sha256:19b4e3fffd30539fd30fb17066ddd4922b7a508857eb6e1430a1f7b4ba8994a3
    proof:
    - file: src/shell/api/__tests__/use-shell-status-session.spec.ts
      digest: sha256:701d363bf4756cba9f97e960c9c26bf1125dab6482f59fde02bd3856d7256224
- node: scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson() and useCurationCount(), lines 55-64,
    88 — const fresh = await fetchAccessToken(); ... return readBody(await send(PENDING_PATH, fresh));
    ... return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
unstated:
- file: src/shell/api/use-shell-status.ts
  where: renewToken(), line 43, inside the renewal that getPendingJson() runs on a 401
  evidence: useAuthStore.getState().setToken(fresh);
  cost: After a renewal, the fresh token is also kept as the shell's stored token, so every later read
    uses it. No node of the pending-read renewal says this. The nodes say only that the shell asks the
    identity provider once and asks the read once more with the fresh token. The one rule that states
    storing a renewed token, a-refreshed-token-repeats-the-request, constrains the request helper and
    not this read. A reader looking in the specification for what happens to the token after a renewed
    pending read finds nothing, and the answer lives only in this file.
unbound:
- src/shell/api/__tests__/use-shell-status-session.spec.ts
- src/shell/api/__tests__/use-shell-status.spec.ts
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/shell-pending-token-renewal.returns/.

  Certification of rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session did not
  hold: the auditor answered `partial` — The two named tests cover two ways a renewal can fail on the
  pending curation read: the identity provider answers 401, or the renewal request rejects. Each test
  asserts both halves together: the stored access token ends up null, and the shell''s redirect gets exactly
  "/sign-in?reason=session_expired". So clearing the token, the sign-in address and the reason session_expired
  are all exercised. Replacing the page is not. Both tests swap the shell''s redirect for a capturing
  function through __setShellRedirectForTests, so the tests only check the address the shell passes to
  that function. The function the shell uses when no test swaps it is never run. If it stopped replacing
  the page (it navigated another way or did nothing), the fact would stop holding and both tests would
  still pass. The test "is not followed by another pending read or another renewal, at once or at the
  following intervals" and the test "keeps the renewed token and does not replace the page" check other
  facts (no retry after the failure, and the success path). They are not cited here.. The node is decided
  by reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: Give one input with the redirect seam not swapped: the pending curation read
  answers 401 and the renewal fails. Expect one result: the stored token is cleared and the page is replaced
  with "/sign-in?reason=session_expired". The check is that the browser''s page-replacing navigation (for
  example a spied window.location.replace) is called once with that address..

  Certified rules/application-shell/an-expired-token-is-renewed-by-the-pending-read as decided by step
  `test`: src/shell/api/__tests__/use-shell-status.spec.ts (asks the identity provider once with the session
  cookie and repeats the read with the fresh token); src/shell/api/__tests__/use-shell-status.spec.ts
  (asks the repeated read as the queue listing with limit 1); src/shell/api/__tests__/use-shell-status.spec.ts
  (does not ask the identity provider a second time when the repeated read is also answered 401); src/shell/api/__tests__/use-shell-status.spec.ts
  (does not send a third pending read before the next interval when the repeated read is also answered
  401) would fail if the fact stopped holding.

  Certification of rules/application-shell/health-and-pending-are-asked-every-twenty-seconds did not hold:
  the auditor answered `partial` — Several parts of the fact would make these tests fail if they stopped
  holding. The 20-second interval for both reads is checked: one request each at 19,999 ms and a second
  at 20,000 ms. The health read is checked to carry no Authorization header while a token is held. A health
  401 is checked not to ask for a token. The pending read is checked to get exactly one repeat after one
  renewal following a 401. The "not retried on failure" part is not checked against the code under test.
  The test''s mount helper builds every QueryClient with `defaultOptions.queries.retry: false`. So for
  any hook that does not turn off retries itself, the test setup turns them off for it. Suppose the health
  or pending hook dropped its own no-retry setting and fell back to a client default that retries. Three
  tests would still pass: "is not repeated at once after the request fails", "is not asked again before
  the next 20-second interval when it fails without a 401", and the no-retry part of the timeline test.
  They catch only a hook that sets a retry count explicitly.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: Mount
  useHealth and useCurationCount under a QueryClient whose default allows retries, such as the application''s
  own client configuration, not `retry: false`. Make the health read fail with a network error and the
  pending read fail with a 500, then advance 19,999 ms. The expected result is exactly one health request
  and one pending request, with no request to the identity provider..

  Certified rules/application-shell/the-pending-total-needs-a-token as decided by step `test`: src/shell/api/__tests__/use-shell-status.spec.ts
  (is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without
  a total counts as 0); src/shell/api/__tests__/use-shell-status.spec.ts (is not made while no access
  token is held); src/shell/api/__tests__/use-shell-status.spec.ts (asks the identity provider once with
  the session cookie and repeats the read with the fresh token); src/shell/api/__tests__/use-shell-status.spec.ts
  (asks the repeated read as the queue listing with limit 1); src/shell/api/__tests__/use-shell-status.spec.ts
  (shows the total of the repeated read''s answer); src/shell/api/__tests__/use-shell-status.spec.ts (shows
  0 pending, not the total shown before, when the repeated read''s answer has no total) would fail if
  the fact stopped holding.

  Certification of scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in did not hold:
  the auditor answered `partial` — The test sets up the scenario''s given and when: a held token, a pending
  curation read answered 401, and the identity provider''s token endpoint answering 401 "no session".
  It checks both outcomes by observation. The stored accessToken must be null. The redirect sink must
  receive exactly one entry, "/sign-in?reason=session_expired". So the cleared token, the sign-in address
  and the session_expired reason would all fail this test if they stopped holding. The part left unexercised
  is that the page is replaced. The test swaps the production redirect for a recorder through __setShellRedirectForTests
  and only checks which URL was handed to that recorder. It would still pass if the production redirect
  navigated with a history entry instead of replacing the page, or did not navigate at all. The sibling
  test in the same file, "when the renewal request itself fails", has a different given: the renewal request
  fails on the network rather than the provider holding no session. It goes through the same recorder,
  so it closes nothing here. The two remaining tests in the file bear on other facts: one checks that
  no further reads or renewals follow, the other covers the successful renewal.. The node is decided by
  reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: One input against one expected result. Use the same given: an expired held
  token, the pending read answered 401, and the identity provider answering with no session. Leave the
  production redirect in place, with no test recorder installed. Expect the page''s location to be replaced,
  not navigated with a history entry, with "/sign-in?reason=session_expired". For example, a spy on window.location.replace
  that receives exactly that address while location.assign is never called..

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/application-shell/an-expired-token-is-renewed-by-the-pending-read, scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown,
  rules/application-shell/health-and-pending-are-asked-every-twenty-seconds, rules/application-shell/the-pending-total-needs-a-token,
  contracts/application-shell/bff-shell-reads, domain/application-shell/application-shell, rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session,
  scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in were read on every file and
  answered for, and bound from nowhere here — a binding this record writes is one the trace already held.

  Candidates: 0 opened across 0 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/shell-pending-token-renewal.returns/`, which are the evidence behind every entry above.
