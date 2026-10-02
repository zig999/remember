---
contract_version: siegard-reconcile/8
title: Reconcile the authentication middleware after the constraint was restricted to the network
summary: auth.ts did not change; the specification restricted constraints/every-operation-requires-owner-authentication
  to operations reached over the network through /analyse (commit 5996c48); the human states the source
  is correct.
target: backend
files:
- path: src/middleware/auth.ts
  change: unchanged; re-read against the amended constraint.
nodes:
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: 'src/middleware/auth.ts: held at `preHandler` in `buildNeonAuth` (lines 113-152), with `extractBearer`
    (lines 161-166) — `const token = extractBearer(header); if (token === null) { throw new AuthError("AUTH_UNAUTHORIZED",
    ...)`; `const verified = await jwtVerify(token, jwks);` against `createRemoteJWKSet(buildJwksUrl(env.NEON_AUTH_URL),
    ...)`; `if (typeof sub !== "string" || sub.length === 0) { throw new AuthError("AUTH_TOKEN_INVALID",
    "JWT missing required `sub` claim.")`; `request.user = user;`'
  encoded_at:
  - src/middleware/auth.ts
unstated:
- file: src/middleware/auth.ts
  where: the `createRemoteJWKSet` options in `buildNeonAuth`, line 102
  evidence: 'cooldownDuration: 30_000,'
  cost: The code fixes the pause (30 seconds) between key-set refetches after a failed key lookup, and
    no node states it. Only the comment at lines 87-88, which no node backs ("30 s cooldown, which matches
    the spec exactly"), claims a spec basis. The next reader who looks for this timing in the specification
    will not find it, and a change to it is a decision made only in code.
restates:
- file: src/middleware/auth.ts
  where: the header comment, lines 3-7 (the paragraph beginning "Implements BR-01 of knowledge-graph.back.md")
  evidence: 'every request that reaches a protected route must carry `Authorization: Bearer <jwt>`. We
    verify the signature against Neon Auth''s JWKS, cache the JWKS in process for the configured TTL (default
    10 min, per knowledge-graph.back.md §1), and refuse to dispatch the route on any failure.'
  cost: The comment states the node's rule, a signed bearer token required before the route runs, a second
    time and cites a back-spec section as its authority. If the node moves, the comment keeps claiming
    the old rule and `--check` never reaches it. A reader looking for where the rule lives can stop at
    the prose instead of at the code in `preHandler`.
  node: constraints/every-operation-requires-owner-authentication
pairs_omitted:
- node: constraints/local-operator-token-development-only
  file: src/middleware/auth.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-auth-constraint.returns/.

  Candidates: 2 opened across 1 of 1 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-auth-constraint.returns/`, which are the evidence behind every entry above.
