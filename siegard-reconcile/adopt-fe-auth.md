---
contract_version: siegard-reconcile/8
title: Adoption of the frontend auth context
summary: The sign-in feature of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/features/auth/api/neon-auth.ts
  change: Exchanges the owner's credentials with the identity provider in two requests, sign-in and access
    token, and classifies each failure of the exchange by a code of its own.
- path: src/features/auth/api/useSignIn.ts
  change: Runs the sign-in attempt, classifies its failure into a kind, stores the token before navigating,
    and resolves a safe destination from the address.
- path: src/features/auth/components/SignInForm.tsx
  change: Renders the sign-in form, the expired-session notice and the failure alert, and disables the
    controls while an attempt is in flight.
- path: src/features/auth/components/SignInPanel.tsx
  change: Hosts the sign-in form in an animated panel and passes it the submit handler and the attempt
    state.
- path: src/features/auth/index.ts
  change: Re-exports the feature's public surface to the application.
- path: src/features/auth/schema.ts
  change: Validates the sign-in credentials and declares the four failure kinds.
nodes:
- node: contracts/owner-access/identity-provider
  conforms: false
  how: "src/features/auth/api/neon-auth.ts, Lines 153-156 (signInWithEmail) and lines 183-186 (fetchAccessToken),\
    \ the fallback throws for a non-2xx answer.: throw new AuthError(\n  body.code ?? \"UNKNOWN\",\n \
    \ body.message ?? `Falha na autenticação (HTTP ${res.status}).`,\n);\nThe node says: \"a failure carrying\
    \ the code of the answer's JSON body when it has one, otherwise no code\" — The node says a failure\
    \ with no code in the body carries no code. The code gives it the code \"UNKNOWN\", a sentinel no\
    \ node holds. A failure with no code and a provider that itself answers with a code spelled UNKNOWN\
    \ become indistinguishable to whoever reads the code. The next reader will look in the specification\
    \ for what \"UNKNOWN\" means as a carried code and will not find it."
  observed_at:
  - src/features/auth/api/neon-auth.ts
- node: contracts/owner-access/sign-in
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at Only the error notice, in the `toast.error` call at\
    \ line 177. The form-level alert, the messages and the opening of the form are held outside this file.\
    \ — toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);\nsrc/features/auth/components/SignInForm.tsx:\
    \ held at the session-expired notice (line 106), the \"Login\" and \"Senha\" labels, the SIGN_IN_ERROR_MESSAGE\
    \ record (lines 52-57) and the role=\"alert\" block (lines 151-159). The error notice that the contract\
    \ pairs with the alert is not raised in this file, and the validation messages come from the schema\
    \ it imports. — {sessionExpired ? (\n    <div role=\"status\" data-testid=\"session-expired-notice\"\
    \ className=\"text-xs text-body\">\n      Sua sessão expirou. Faça login novamente.\n    </div>\n\
    \  ) : null}\n...\ncredential: \"E-mail ou senha incorretos.\",\nnetwork: \"Erro de conexão. Verifique\
    \ sua rede e tente novamente.\",\nsession: \"Erro ao obter sessão. Tente novamente.\",\nunknown: \"\
    Erro inesperado. Tente novamente.\",\nsrc/features/auth/schema.ts: held at only the two validation\
    \ refusals of submit-sign-in, in the `signInSchema` messages (lines 16-19). The other answers of this\
    \ contract, such as the expired-session notice and the failure alerts, sit in other files. — login:\
    \ z.email(\"Informe um e-mail válido.\"),\nsenha: z.string().min(1, \"Informe a senha.\"),"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/components/SignInForm.tsx
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-attempt
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at The `useSignIn` function, lines 136-184, holding the\
    \ failure kind in `error`, the in-flight state in `isLoading` and the destination in `target`. — const\
    \ [error, setError] = useState<SignInError | null>(null);\n  ...\n  const target = resolveSafeRedirect(redirectParam);\n\
    src/features/auth/components/SignInForm.tsx: held at the useForm call with defaultValues of empty\
    \ login and senha (lines 82-87), and the form-level error derived from the error prop (line 89). The\
    \ failure_kind and destination attributes are not declared in this file. — defaultValues: { login:\
    \ \"\", senha: \"\" },\n...\nconst formLevelError = error ? SIGN_IN_ERROR_MESSAGE[error.type] : null;\n\
    src/features/auth/schema.ts: held at partly. `signInSchema` and `SignInFormValues` carry the credentials,\
    \ and the `SignInError` union carries the failure kind. The destination attribute is not in this file.\
    \ — export type SignInFormValues = z.infer<typeof signInSchema>;\nexport type SignInError =\n  | {\
    \ type: \"credential\" }"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/components/SignInForm.tsx
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-credentials
  conforms: true
  how: "src/features/auth/schema.ts: held at the `signInSchema` object, lines 16-19. It declares the two\
    \ required string fields, named `login` and `senha` where the node's attributes are `email` and `password`.\
    \ — export const signInSchema = z.object({\n  login: z.email(\"Informe um e-mail válido.\"),\n  senha:\
    \ z.string().min(1, \"Informe a senha.\"),\n});"
  encoded_at:
  - src/features/auth/schema.ts
- node: domain/owner-access/sign-in-destination
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect, lines 85-94, which accepts or
    replaces the destination as a string. — export function resolveSafeRedirect(candidate: string | null):
    "/chat" | string {'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: domain/owner-access/sign-in-failure-kind
  conforms: true
  how: "src/features/auth/schema.ts: held at the `SignInError` union, lines 25-29. It has exactly the\
    \ four kinds the enumeration names. — export type SignInError =\n  | { type: \"credential\" }\n  |\
    \ { type: \"network\" }\n  | { type: \"session\" }\n  | { type: \"unknown\" };"
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/access-token-is-held-before-the-owner-moves-on
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at Lines 161-168 of signIn, where the token is stored\
    \ before the navigation. — useAuthStore.getState().setToken(jwt);\n...\n        void navigate({ to:\
    \ target });"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/any-other-sign-in-failure-is-unknown
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at The fallback throws with code \"UNKNOWN\", lines 153-156\
    \ and 183-186. The failure kind itself is assigned by the caller, outside this file. — throw new AuthError(\n\
    \  body.code ?? \"UNKNOWN\",\nsrc/features/auth/api/useSignIn.ts: held at The `default` branch of\
    \ the switch at lines 117-118 and the final return of classifySignInError at line 133. — default:\n\
    \        return { type: \"unknown\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/missing-session-or-token-is-a-session-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at The NO_SESSION throw on 401 from /token (lines 176-179)\
    \ and the NO_TOKEN throws on a non-JSON, non-object or empty-token 2xx body (lines 189-202). — if\
    \ (res.status === 401) {\n  const body = await readErrorBody(res);\n  throw new AuthError(\"NO_SESSION\"\
    , body.message ?? \"Sessão expirada ou ausente.\");\n}\nif (typeof token !== \"string\" || token.length\
    \ === 0) {\n  throw new AuthError(\"NO_TOKEN\", \"Resposta do servidor de auth não contém token.\"\
    );\nsrc/features/auth/api/useSignIn.ts: held at The `NO_SESSION` and `NO_TOKEN` cases of the switch,\
    \ lines 109-116. — case \"NO_SESSION\":\n    case \"NO_TOKEN\":\n      ...\n      return { type: \"\
    session\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/network-looking-failure-is-a-network-failure
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at Lines 123-131 of classifySignInError, after the AuthError\
    \ branch returns for failures that came out of the exchange. — if (reason instanceof TypeError) return\
    \ { type: \"network\" };\n...\n      if (lower.includes(\"failed to fetch\") || lower.includes(\"\
    network\")) {"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/rejected-credentials-are-a-credential-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at The two INVALID_EMAIL_OR_PASSWORD throws in signInWithEmail,\
    \ one for the body code and one for a 401 with any other code (lines 144-152). — if (body.code ===\
    \ \"INVALID_EMAIL_OR_PASSWORD\") {\n  throw new AuthError(\"INVALID_EMAIL_OR_PASSWORD\", body.message\
    \ ?? \"E-mail ou senha incorretos.\");\n}\nif (res.status === 401) {\n  throw new AuthError(\n   \
    \ \"INVALID_EMAIL_OR_PASSWORD\",\nsrc/features/auth/api/useSignIn.ts: held at The `INVALID_EMAIL_OR_PASSWORD`\
    \ case of the switch, lines 105-106. The 401 mapping is in neon-auth.ts, outside this file. — case\
    \ \"INVALID_EMAIL_OR_PASSWORD\":\n        return { type: \"credential\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-attempt-in-flight-accepts-no-second-submission
  conforms: true
  how: 'src/features/auth/components/SignInForm.tsx: held at the submit Button and the two Inputs, all
    disabled while isSubmitting is true (lines 122, 142, 166) — loading={isSubmitting}

    disabled={isSubmitting}'
  encoded_at:
  - src/features/auth/components/SignInForm.tsx
- node: rules/owner-access/sign-in-destination-defaults-to-chat
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at resolveSafeRedirect, whose branches return \"/chat\"\
    , and the call at lines 163-164. — if (candidate === null) return \"/chat\";\n...\n        const target\
    \ = resolveSafeRedirect(redirectParam);"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-destination-is-a-local-path
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at Lines 88-92 of resolveSafeRedirect. — if (candidate.length\
    \ > 2048) return \"/chat\";\n  if (!candidate.startsWith(\"/\")) return \"/chat\";\n  if (candidate.startsWith(\"\
    //\")) return \"/chat\";\n  if (candidate.includes(\"://\")) return \"/chat\";\n  if (candidate.includes(\"\
    \\\\\")) return \"/chat\";"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-failure-shows-only-its-kind-message
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at The `toast.error` call at line 177, which shows only
    the message of the classified kind. The message map is declared in SignInForm, outside this file.
    — toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);

    src/features/auth/components/SignInForm.tsx: held at the alert block renders only the SIGN_IN_ERROR_MESSAGE
    entry of error.type (lines 89 and 157) — const formLevelError = error ? SIGN_IN_ERROR_MESSAGE[error.type]
    : null;

    ...

    {formLevelError}'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/components/SignInForm.tsx
- node: rules/owner-access/sign-in-failure-stays-until-the-next-attempt
  conforms: false
  how: "src/features/auth/api/useSignIn.ts, the clearError member of the UseSignInReturn interface and\
    \ its implementation, lines 49-50, 141-143 and 183: /** Imperative clear, e.g. after the user edits\
    \ a field. */\n  readonly clearError: () => void;\nconst clearError = useCallback(() => {\n    setError(null);\n\
    \  }, []); — The node says the failure kind stays shown until the owner submits the next attempt.\
    \ This hook exports a way to drop it at any other time, and its own comment names editing a field\
    \ as the use. No file in frontend/src calls it today, so no running behavior breaks. The first caller\
    \ to wire it would make the rule false without any node being changed."
  observed_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/sign-in-requires-password
  conforms: true
  how: 'src/features/auth/schema.ts: held at the `senha` field of `signInSchema`, line 18. It refuses
    only the empty string, so a password made only of spaces passes. — senha: z.string().min(1, "Informe
    a senha."),'
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/sign-in-requires-valid-email
  conforms: true
  how: 'src/features/auth/schema.ts: held at the `login` field of `signInSchema`, line 17. — login: z.email("Informe
    um e-mail válido."),'
  encoded_at:
  - src/features/auth/schema.ts
- node: rules/owner-access/token-is-requested-after-credentials-accepted
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at Lines 153-157 of signIn, where the token request follows\
    \ the awaited credential exchange inside one try block. — await signInWithEmail(values.login, values.senha);\n\
    ...\n        const jwt = await fetchAccessToken();"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/owner-access/unreachable-provider-is-a-network-failure
  conforms: true
  how: "src/features/auth/api/neon-auth.ts: held at The catch in safeFetch (lines 105-117). — if (err\
    \ instanceof TypeError || (err instanceof DOMException && err.name === \"AbortError\")) {\n  throw\
    \ new AuthError(\"NETWORK\", `Network error contacting auth: ${String(err.message ?? err)}`);\n}\n\
    src/features/auth/api/useSignIn.ts: held at The `NETWORK` case of the switch, lines 107-108. The fetch\
    \ failure that produces that code is in neon-auth.ts, outside this file. — case \"NETWORK\":\n   \
    \     return { type: \"network\" };"
  encoded_at:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/expired-session-notice-stays-beside-a-failure
  conforms: true
  how: 'src/features/auth/components/SignInForm.tsx: held at the notice block and the alert block are
    rendered under independent conditions (lines 100 and 151), so both can show together — {sessionExpired
    ? (

    ...

    {formLevelError ? ('
  encoded_at:
  - src/features/auth/components/SignInForm.tsx
- node: scenarios/owner-access/external-destination-falls-back-to-chat
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at The `startsWith("//")` branch of resolveSafeRedirect,
    line 90. — if (candidate.startsWith("//")) return "/chat";'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/offline-fetch-error-is-a-network-failure
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at The message match at lines 126-130 of classifySignInError.\
    \ — const lower = msg.toLowerCase();\n      if (lower.includes(\"failed to fetch\") || lower.includes(\"\
    network\")) {\n        return { type: \"network\" };"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: scenarios/owner-access/whitespace-only-password-is-sent
  conforms: true
  how: 'src/features/auth/schema.ts: held at the `senha` field of `signInSchema`, line 18. The minimum
    length is 1 with no trim, so spaces-only input is not held back. — senha: z.string().min(1, "Informe
    a senha."),'
  encoded_at:
  - src/features/auth/schema.ts
unstated:
- file: src/features/auth/api/useSignIn.ts
  where: readRedirectParam, lines 62-70
  evidence: "const params = new URLSearchParams(window.location.search);\n    return params.get(\"redirect\"\
    );"
  cost: The name `redirect` of the address parameter that carries the requested destination is a domain
    fact. No node holds it. A grep of the specification for "redirect" finds nothing. The nodes say only
    that "the address requested" a destination. The next reader who needs to know how a destination is
    requested will look in the specification and find nothing, and the only home of the parameter name
    is this function.
- file: src/features/auth/components/SignInForm.tsx
  where: the submit Button's label, line 169
  evidence: '{isSubmitting ? "Entrando…" : "Entrar"}'
  cost: The words the owner reads on the sign-in button, and the change of that text while an attempt
    is in flight, exist only in this component. The contract holds the notice, the field labels and the
    failure messages, so the next reader looks there for the button text and does not find it. Changing
    it would not reach any node.
restates:
- file: src/features/auth/api/neon-auth.ts
  where: The docblock above AuthError, lines 47-60 ("Known codes").
  evidence: '*  - INVALID_EMAIL_OR_PASSWORD : Better Auth 401 from /sign-in/email.

    *  - NO_SESSION                : 401 from /token (cookie absent/expired).

    *  - NO_TOKEN                  : /token responded 200 but body lacked a

    *  - NETWORK                   : fetch rejected (offline, CORS, DNS, abort).

    *  - UNKNOWN                   : any non-2xx without a recognised code.'
  cost: The classification of failures (rejected credentials, missing session or token, unreachable provider,
    anything else) is restated as a code table in prose. The code holds it in the throw sites, so a second
    reading of the same rule sits where nothing reads the node.
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- file: src/features/auth/api/neon-auth.ts
  where: The docblocks above signInWithEmail (lines 119-129) and fetchAccessToken (lines 159-168).
  evidence: '*  - "INVALID_EMAIL_OR_PASSWORD" on 401 with the matching `code`.

    *  - "NO_SESSION" on 401 (cookie absent or expired).

    *  - "NO_TOKEN" on 200 with a missing/empty `token` field — we treat this as'
  cost: The per-operation refusals are restated in prose next to the branches that implement them. A change
    to the contract's refusals would leave these lists standing as a second statement of what each answer
    means.
  node: contracts/owner-access/identity-provider
- file: src/features/auth/api/neon-auth.ts
  where: The module header comment, lines 16-31 ("Two-step contract").
  evidence: '* 1. POST {base}/sign-in/email  with credentials:''include''

    *      → 401 INVALID_EMAIL_OR_PASSWORD: bad credentials.

    * 2. GET  {base}/token          with credentials:''include''

    *      → 200 { token: "<JWT EdDSA, exp=iat+900s>" } — this is the access token

    *      → 401: session cookie absent or expired.'
  cost: The two requests, their answers and what each answer means are written a second time as prose
    beside the code that implements them. When the node moves, nothing ties this comment to it, so a reader
    can take the comment for the decided contract.
  node: contracts/owner-access/identity-provider
- file: src/features/auth/api/useSignIn.ts
  where: the comment at lines 121-122 in classifySignInError
  evidence: "Native fetch failure that escaped neon-auth.ts (defensive) — also\n  // anything else we\
    \ didn't anticipate."
  cost: 'The rule that a failure outside the exchange is classified as network is restated in prose. The
    code holds it at `if (reason instanceof TypeError) return { type: "network" };` and at `lower.includes("failed
    to fetch") || lower.includes("network")`.'
  node: rules/owner-access/network-looking-failure-is-a-network-failure
- file: src/features/auth/api/useSignIn.ts
  where: the docstring of resolveSafeRedirect, line 81
  evidence: Anything else falls back to `/chat`.
  cost: 'The default destination is restated in prose. The code holds it at `export function resolveSafeRedirect(candidate:
    string | null): "/chat" | string` and the `return "/chat";` branches.'
  node: rules/owner-access/sign-in-destination-defaults-to-chat
- file: src/features/auth/api/useSignIn.ts
  where: the docstring of resolveSafeRedirect, lines 75-79
  evidence: "starts with `/`\n   - does NOT start with `//` (protocol-relative URLs are off-origin)\n\
    \   - does NOT contain `://`     (any embedded scheme is off-origin)\n   - does NOT contain `\\` \
    \       (defensive — IE/Edge legacy parsers)"
  cost: The shape of a valid sign-in destination is written out a second time in prose. The code holds
    it at `if (candidate.startsWith("//")) return "/chat";`, `if (candidate.includes("://")) return "/chat";`
    and `if (candidate.includes("\\")) return "/chat";`. The comment also gives a reason, IE/Edge legacy
    parsers, that the node does not hold.
  node: rules/owner-access/sign-in-destination-is-a-local-path
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, line 26 (Error classification)
  evidence: 'AuthError("INVALID_EMAIL_OR_PASSWORD") → { type: "credential" }'
  cost: 'The credential-failure classification is restated in prose. The code holds it at `case "INVALID_EMAIL_OR_PASSWORD":
    return { type: "credential" };`.'
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, line 27 (Error classification)
  evidence: 'AuthError("NETWORK")                   → { type: "network" }'
  cost: 'The network classification of an unreachable provider is restated in prose. The code holds it
    at `case "NETWORK": return { type: "network" };`.'
  node: rules/owner-access/unreachable-provider-is-a-network-failure
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, line 28, and the comment at lines 111-115
  evidence: 'AuthError("NO_SESSION" | "NO_TOKEN")   → { type: "session" }'
  cost: 'The session classification is restated in two comments. The code holds it at `case "NO_SESSION":
    case "NO_TOKEN": return { type: "session" };`.'
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, line 29
  evidence: 'any other thrown value                 → { type: "unknown" }'
  cost: 'The fallback classification is restated in prose. The code holds it at `default: return { type:
    "unknown" };` and at the final `return { type: "unknown" };`.'
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, lines 14-16 (step 2 is sequential)
  evidence: "Step 2 is sequential — never invoked if step 1 fails (the spec's BR\n \"credentials:'include'\
    \ must already have set the session cookie before we\n ask for a token\")."
  cost: The rule that the token is requested only after the credentials are accepted is stated in prose
    here as well as in the node. When the node changes, this comment keeps saying the old rule. The ordering
    itself is held by the two sequential awaits at lines 153 and 157.
  node: rules/owner-access/token-is-requested-after-credentials-accepted
- file: src/features/auth/api/useSignIn.ts
  where: the header docstring, lines 20-23 (Success ordering, BR-04), and the comment at lines 159-160
  evidence: "stepCount: setToken BEFORE navigate — the protected layout guard reads\n `isFresh()` synchronously\
    \ on navigation; setting the token after\n `navigate()` would bounce the operator back to /sign-in."
  cost: 'The rule that the owner holds the token before being taken to the destination is restated in
    two comments. The code holds it at `useAuthStore.getState().setToken(jwt);` before `void navigate({
    to: target });`. A reader who finds the rule in the comment will look for it in the file and not in
    the specification.'
  node: rules/owner-access/access-token-is-held-before-the-owner-moves-on
- file: src/features/auth/schema.ts
  where: the file's header docblock, lines 4-5
  evidence: '* Field names (`login`, `senha`) match the visible UI labels (Login, Senha).

    * `login` is the Stack Auth credential email per D3 — the field is an email'
  cost: The docblock says in prose that the on-screen labels are "Login" and "Senha", and the node already
    holds that. The labels themselves are rendered in `src/features/auth/components/SignInForm.tsx` (`<FormLabel>Login</FormLabel>`,
    `<FormLabel>Senha</FormLabel>`). If the node's labels change, this comment keeps asserting the old
    ones. No check reaches it, because the comment is not code.
  node: domain/owner-access/sign-in-credentials
unbound:
- src/features/auth/components/SignInPanel.tsx
- src/features/auth/index.ts
adopted: true
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-auth.returns/.

  Staged as an adoption of source no delivery wrote: 24 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 3 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 2 fact(s) the source states that no node holds, over 2 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 13 place(s) where text in the source restates a node''s fact the code holds, over 3 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-auth.returns/`, which are the evidence behind every entry above.
