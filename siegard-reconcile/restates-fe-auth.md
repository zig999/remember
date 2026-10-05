---
contract_version: siegard-reconcile/8
title: Prose comments removed from the auth frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/features/auth/api/neon-auth.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/auth/api/useSignIn.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/auth/schema.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: contracts/owner-access/sign-in
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at the success path of signIn() (lines 80-88) and its
    failure path (lines 95-98). The notice texts, the form-level alert and the open-sign-in notice are
    not in this file. — void navigate({ to: target });

    ...

    setError(classified);

    toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);

    src/features/auth/schema.ts: held at the two refusal messages in signInSchema, lines 4-5. The notice,
    the failure alerts and their messages are not in this file. — login: z.email("Informe um e-mail válido."),

    senha: z.string().min(1, "Informe a senha."),'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-attempt
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/auth/api/useSignIn.ts, and src/features/auth/schema.ts
    read `nowhere. The file declares the credentials shape and the failure kind, but no construct for
    the attempt as a whole with credentials, failure_kind and destination.` — export type SignInFormValues
    = z.infer<typeof signInSchema>;

    export type SignInError = — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-credentials
  conforms: true
  how: "src/features/auth/schema.ts: held at signInSchema, lines 3-6. This is the shape of the two values\
    \ the owner types, with the fields named login and senha. — export const signInSchema = z.object({\n\
    \  login: z.email(\"Informe um e-mail válido.\"),\n  senha: z.string().min(1, \"Informe a senha.\"\
    ),\n});"
  encoded_at:
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-destination
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect(), lines 26-35 — export function
    resolveSafeRedirect(candidate: string | null): "/chat" | string {'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: domain/owner-access/sign-in-failure-kind
  conforms: true
  how: "src/features/auth/schema.ts: held at the SignInError union, lines 10-14. Its four tags are exactly\
    \ the four enumeration values. — | { type: \"credential\" }\n  | { type: \"network\" }\n  | { type:\
    \ \"session\" }\n  | { type: \"unknown\" };"
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/access-token-is-held-before-the-owner-moves-on
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at signIn(), lines 82-88. The token is stored before
    navigate is called. — useAuthStore.getState().setToken(jwt);

    ...

    void navigate({ to: target });'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/any-other-sign-in-failure-is-unknown
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at The fallback throws in signInWithEmail (lines 64-67)\
    \ and fetchAccessToken (lines 82-88). Both throw an AuthError carrying the provider's own code or\
    \ \"UNKNOWN\". Neither throws one of the codes this file reserves for the other kinds. Rule 1 of the\
    \ pair's own set is the one that sends any other code to unknown, and it sits in classifySignInError\
    \ in useSignIn.ts, not here. — throw new AuthError(\n    body.code ?? \"UNKNOWN\",\n    body.message\
    \ ?? `Falha na autenticação (HTTP ${res.status}).`,\n  );\nsrc/features/auth/api/useSignIn.ts: held\
    \ at classifySignInError(), the default branch and the final return, lines 47-48 and 61 — default:\n\
    \  return { type: \"unknown\" };\n...\nreturn { type: \"unknown\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/missing-session-or-token-is-a-session-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at fetchAccessToken, lines 77-79 and 90-103. A 401 throws\
    \ NO_SESSION. A body that is not JSON, not an object, or has no non-empty string token throws NO_TOKEN.\
    \ useSignIn.ts maps both codes to the session kind. — throw new AuthError(\"NO_SESSION\", body.message\
    \ ?? \"Sessão expirada ou ausente.\");\n...\nif (typeof token !== \"string\" || token.length === 0)\
    \ {\n    throw new AuthError(\"NO_TOKEN\", \"Resposta do servidor de auth não contém token.\");\n\
    \  }\nsrc/features/auth/api/useSignIn.ts: held at classifySignInError(), lines 44-46. The AuthError\
    \ codes are produced in neon-auth.ts. — case \"NO_SESSION\":\ncase \"NO_TOKEN\":\n  return { type:\
    \ \"session\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/network-looking-failure-is-a-network-failure
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at classifySignInError(), lines 51-60. This branch runs
    only for a failure that is not an AuthError, so only for one that did not come out of the exchange.
    — if (reason instanceof TypeError) return { type: "network" };

    ...

    if (lower.includes("failed to fetch") || lower.includes("network")) {'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/rejected-credentials-are-a-credential-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at signInWithEmail, lines 55-63. A body code of INVALID_EMAIL_OR_PASSWORD,\
    \ or HTTP status 401, throws an AuthError with code INVALID_EMAIL_OR_PASSWORD. The message is \"E-mail\
    \ ou senha incorretos.\", which is the contract's own text. A 2xx answer returns early (`if (res.ok)\
    \ return;`), as the identity-provider contract requires. — if (body.code === \"INVALID_EMAIL_OR_PASSWORD\"\
    ) {\n    throw new AuthError(\"INVALID_EMAIL_OR_PASSWORD\", body.message ?? \"E-mail ou senha incorretos.\"\
    );\n  }\n  if (res.status === 401) {\n    throw new AuthError(\n      \"INVALID_EMAIL_OR_PASSWORD\"\
    ,\nsrc/features/auth/api/useSignIn.ts: held at classifySignInError(), lines 40-41 — case \"INVALID_EMAIL_OR_PASSWORD\"\
    :\n  return { type: \"credential\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-destination-defaults-to-chat
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect(), lines 26-35, applied in signIn()
    at lines 86-88 — if (candidate === null) return "/chat";

    if (candidate.length === 0) return "/chat";

    ...

    const target = resolveSafeRedirect(redirectParam);'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-destination-is-a-local-path
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect(), lines 29-33 — if (candidate.length
    > 2048) return "/chat";

    if (!candidate.startsWith("/")) return "/chat";

    if (candidate.startsWith("//")) return "/chat";

    if (candidate.includes("://")) return "/chat";

    if (candidate.includes("\\")) return "/chat";'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-failure-shows-only-its-kind-message
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at signIn(), line 97. The toast text is chosen by the
    failure kind only, and the thrown error''s message is never shown. The message table itself is in
    ../components/SignInForm. — toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-requires-password
  conforms: true
  how: 'src/features/auth/schema.ts: held at the senha field of signInSchema, line 5. It refuses an empty
    password and does not trim, so a password of only spaces passes, as scenarios/owner-access/whitespace-only-password-is-sent
    requires. — senha: z.string().min(1, "Informe a senha."),'
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/sign-in-requires-valid-email
  conforms: true
  how: 'src/features/auth/schema.ts: held at the login field of signInSchema, line 4. — login: z.email("Informe
    um e-mail válido."),'
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/token-is-requested-after-credentials-accepted
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at signIn(), lines 80-82. The token request comes after
    signInWithEmail resolves, in the same try block. — await signInWithEmail(values.login, values.senha);


    const jwt = await fetchAccessToken();'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/unreachable-provider-is-a-network-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at safeFetch, lines 32-41. A request that fails before\
    \ any answer (TypeError, or an AbortError DOMException) throws an AuthError with code NETWORK. Both\
    \ signInWithEmail and fetchAccessToken go through it. — if (err instanceof TypeError || (err instanceof\
    \ DOMException && err.name === \"AbortError\")) {\n      throw new AuthError(\"NETWORK\", `Network\
    \ error contacting auth: ${String(err.message ?? err)}`);\n    }\nsrc/features/auth/api/useSignIn.ts:\
    \ held at classifySignInError(), lines 42-43. The AuthError code NETWORK is produced in neon-auth.ts.\
    \ — case \"NETWORK\":\n  return { type: \"network\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/external-destination-falls-back-to-chat
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect(), line 31 — if (candidate.startsWith("//"))
    return "/chat";'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/offline-fetch-error-is-a-network-failure
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at classifySignInError(), lines 52-59, with the toast\
    \ at line 97 — if (lower.includes(\"failed to fetch\") || lower.includes(\"network\")) {\n  return\
    \ { type: \"network\" };\n}"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/whitespace-only-password-is-sent
  conforms: true
  how: 'src/features/auth/schema.ts: held at the senha field of signInSchema, line 5. min(1) counts length
    with no trim, so a password of spaces is accepted and the attempt goes on to the identity provider.
    — senha: z.string().min(1, "Informe a senha."),'
  encoded_at:
  - src/features/auth/schema.ts
unstated:
- file: src/features/auth/api/useSignIn.ts
  where: readRedirectParam(), lines 16-24
  evidence: 'const params = new URLSearchParams(window.location.search);

    return params.get("redirect");'
  cost: The name of the query parameter that carries the requested destination is a fact about the sign-in
    address, and it lives only in this function. The node says only that the owner goes to "the destination
    the address requested" and never names the parameter. Anything that builds a sign-in address with
    a destination has to match the string "redirect", and the next reader will look for it in the specification
    and not find it.
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/restates-fe-auth.returns/.

  Candidates: 4 opened across 1 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-auth.returns/`, which are the evidence behind every entry above.
