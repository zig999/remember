---
contract_version: siegard-reconcile/9
title: 'Token renewal on the shell''s pending curation read: second review reconciliation'
summary: The files were written by the deliveries of task/pending-read-token-renewal/renew-expired-token-on-pending-read
  and task/pending-read-token-renewal/end-session-on-failed-pending-renewal under the initiative shell-pending-token-renewal,
  and the proofs were rewritten whole by their proof-only re-deliveries.
target: frontend
files:
- path: src/shell/api/__tests__/use-shell-status-session.spec.ts
  change: 'Written by the delivery of task/pending-read-token-renewal/end-session-on-failed-pending-renewal
    and rewritten whole by its proof-only re-delivery: the proof that a failed renewal ends the session.'
- path: src/shell/api/__tests__/use-shell-status.spec.ts
  change: 'Written by the delivery of task/pending-read-token-renewal/renew-expired-token-on-pending-read
    and rewritten whole by its proof-only re-delivery: the proof of the renewal and of the shell''s read
    cadence.'
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
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson and getJson with send (lines 11-16,
    22-24, 55-64), PENDING_PATH (line 9), useHealth (lines 66-76), useCurationCount (lines 78-89) — const
    PENDING_PATH = "/api/v1/curation/queue?limit=1";

    if (token) headers.Authorization = `Bearer ${token}`;

    const d = q.data as { database?: string; result?: { database?: string } };

    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at endSession (lines 50-53), called from the failed-renewal
    branch of getPendingJson (lines 59-62) — const SESSION_EXPIRED_ADDRESS = "/sign-in?reason=session_expired";

    useAuthStore.getState().clear();

    redirectImpl(SESSION_EXPIRED_ADDRESS);'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status-session.spec.ts
- node: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson (lines 55-64) with renewToken (lines
    40-48) — if (res.status !== 401) return readBody(res);

    const fresh = await renewToken();

    return readBody(await send(PENDING_PATH, fresh));'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status.spec.ts
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at REFETCH_MS (line 7), used by useHealth and useCurationCount
    with retry disabled — const REFETCH_MS = 20_000;

    refetchInterval: REFETCH_MS,

    retry: false,'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: a health read answered with an error status (500, and also 401) while the hook
    runs under the application''s own query client, the one built by createQueryClient(). Expected result:
    one health read until 19,999 ms and two at 20,000 ms, which is the same shape the pending-500 test
    already asserts. A matching assertion that a pending read answered 401 on both the first read and
    its repeat produces exactly two pending reads before 20,000 ms under createQueryClient() would close
    the renewal path under the real client too.'
  read_at:
    node: sha256:42602b23e9e43343a4567076b576b02ae561cf1d930af999bb83d81b2d7db9ce
    proof:
    - file: src/shell/api/__tests__/use-shell-status.spec.ts
      digest: sha256:18c841950830230fe213683e6f6a638cb6203198529964c1c2d6a03e0224bb67
- node: rules/application-shell/the-pending-total-needs-a-token
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useCurationCount (lines 78-89) and send (lines 11-16)
    — enabled: token != null,

    queryFn: () => getPendingJson(token as string),

    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status.spec.ts
- node: scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in
  conforms: true
  how: "src/shell/api/use-shell-status.ts: held at the null-renewal branch of getPendingJson (lines 59-62)\
    \ calling endSession (lines 50-53) — if (fresh === null) {\n  endSession();"
  encoded_at:
  - src/shell/api/use-shell-status.ts
  decided_by: test
  step: test
  proof:
  - src/shell/api/__tests__/use-shell-status-session.spec.ts
- node: scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getPendingJson (lines 55-64), then useCurationCount
    (lines 78-89) returning the total of that answer — const fresh = await renewToken();

    return readBody(await send(PENDING_PATH, fresh));'
  encoded_at:
  - src/shell/api/use-shell-status.ts
unstated:
- file: src/shell/api/__tests__/use-shell-status-session.spec.ts
  where: the assertion in the test "keeps the renewed token and does not replace the page" (lines 242-255)
  evidence: 'token: FRESH,'
  cost: The test asserts that the renewal the pending read makes leaves the fresh token in the auth store.
    None of the shell's nodes in this set says so. The rule says only that the read is asked once more
    with the fresh token. The only statement that a renewed token is stored is `rules/application-shell/a-refreshed-token-repeats-the-request`,
    and it constrains the request helper, not the pending read. Because the expectation lives only in
    the test, the next reader looking for what the pending read does with a renewed token will not find
    it in the specification. If the behavior changes, the test fails with no node to say which was decided.
unbound:
- src/shell/api/__tests__/use-shell-status-session.spec.ts
- src/shell/api/__tests__/use-shell-status.spec.ts
pairs_omitted:
- node: rules/application-shell/health-is-judged-by-the-database-field
  file: src/shell/api/use-shell-status.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/application-shell/the-active-ingestion-segment-is-never-shown
  file: src/shell/api/use-shell-status.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/shell-pending-token-renewal-again.returns/.

  Certified rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session as decided by
  step `test`: src/shell/api/__tests__/use-shell-status-session.spec.ts (leaves no access token and replaces
  the page with the sign-in address when the identity provider holds no session); src/shell/api/__tests__/use-shell-status-session.spec.ts
  (leaves no access token and replaces the page with the sign-in address when the renewal request itself
  fails); src/shell/api/__tests__/use-shell-status-session.spec.ts (clears the stored token and replaces
  the browser page once with the sign-in address when the renewal request itself fails); src/shell/api/__tests__/use-shell-status-session.spec.ts
  (replaces the browser page with the sign-in address and never navigates with a history entry when the
  identity provider holds no session) would fail if the fact stopped holding.

  Certified rules/application-shell/an-expired-token-is-renewed-by-the-pending-read as decided by step
  `test`: src/shell/api/__tests__/use-shell-status.spec.ts (asks the identity provider once with the session
  cookie and repeats the read with the fresh token); src/shell/api/__tests__/use-shell-status.spec.ts
  (does not ask the identity provider a second time when the repeated read is also answered 401); src/shell/api/__tests__/use-shell-status.spec.ts
  (does not send a third pending read before the next interval when the repeated read is also answered
  401); src/shell/api/__tests__/use-shell-status.spec.ts (asks the repeated read as the queue listing
  with limit 1) would fail if the fact stopped holding.

  Certification of rules/application-shell/health-and-pending-are-asked-every-twenty-seconds did not hold:
  the auditor answered `partial` — Most of the fact is pinned. The 20-second period is pinned for both
  reads: at 19,999 ms there is one read of each, at 20,000 ms there are two, and the 40-second timeline
  adds a third. That period keeps holding after failures. Health is never sent with the token and never
  triggers a token renewal. A pending read answered 401 gets exactly one repeat after a renewed token,
  and no second renewal or third read follows. A pending read answered 500 is not repeated before the
  next interval, and neither is a health read that fails with a network error. Those last two cases are
  also run under the application''s own query client (createQueryClient), so a default client-level retry
  would make that test fail.

  One part is not exercised: a health read that fails because it was answered with an error status. No
  test answers health with 500, or any other non-2xx status, and then counts the health reads. The test
  "does not ask the identity provider for a token when it is answered 401" does answer health with 401,
  but it only asserts that no token was requested. It never counts health reads, so a retry of that health
  read before the interval would pass it. Every other "no retry" test except the one under the application''s
  own client builds its own QueryClient with retry: false. That means a retry rule that repeats a health
  read on an HTTP error status but not on a network error would pass the whole set. The same blind spot
  applies to a pending read answered 401 twice when run under the application''s own client: the "no retry"
  claim for it is asserted only under the test''s retry-disabled client.. The node is decided by reading,
  and a certification standing on it from an earlier reconciliation is released by the bind. The remainder
  is testable: Input: a health read answered with an error status (500, and also 401) while the hook runs
  under the application''s own query client, the one built by createQueryClient(). Expected result: one
  health read until 19,999 ms and two at 20,000 ms, which is the same shape the pending-500 test already
  asserts. A matching assertion that a pending read answered 401 on both the first read and its repeat
  produces exactly two pending reads before 20,000 ms under createQueryClient() would close the renewal
  path under the real client too..

  Certified rules/application-shell/the-pending-total-needs-a-token as decided by step `test`: src/shell/api/__tests__/use-shell-status.spec.ts
  (is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without
  a total counts as 0); src/shell/api/__tests__/use-shell-status.spec.ts (is not made while no access
  token is held); src/shell/api/__tests__/use-shell-status.spec.ts (shows 0 pending, not the total shown
  before, when the repeated read''s answer has no total) would fail if the fact stopped holding.

  Certified scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in as decided by step
  `test`: src/shell/api/__tests__/use-shell-status-session.spec.ts (leaves no access token and replaces
  the page with the sign-in address when the identity provider holds no session); src/shell/api/__tests__/use-shell-status-session.spec.ts
  (replaces the browser page with the sign-in address and never navigates with a history entry when the
  identity provider holds no session) would fail if the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/application-shell/an-expired-token-is-renewed-by-the-pending-read, scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown,
  rules/application-shell/health-and-pending-are-asked-every-twenty-seconds, rules/application-shell/the-pending-total-needs-a-token,
  contracts/application-shell/bff-shell-reads, domain/application-shell/application-shell, rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session,
  scenarios/application-shell/a-failed-renewal-sends-the-owner-to-sign-in were read on every file and
  answered for, and bound from nowhere here — a binding this record writes is one the trace already held.

  Candidates: 3 opened across 1 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/shell-pending-token-renewal-again.returns/`, which are the evidence behind every entry above.
