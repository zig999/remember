---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/auth/api/neon-auth.ts
  - src/features/auth/api/useSignIn.ts
  - src/features/auth/components/SignInForm.tsx
  - src/features/auth/components/SignInPanel.tsx
  - src/features/auth/index.ts
  - src/features/auth/schema.ts
read_outside_area:
  - "src/state/auth.ts — opened to understand what useAuthStore.getState().setToken receives from the sign-in; read, not surveyed"
  - "src/lib/env.ts — opened to understand where VITE_NEON_AUTH_URL, the auth provider base address, comes from; read, not surveyed"
---

## Facts
### Sign-in form
- The sign-in form has two fields, `login` (the owner's e-mail) and `senha` (the password), and both start empty. `src/features/auth/schema.ts` (`signInSchema`), `src/features/auth/components/SignInForm.tsx` (`defaultValues: { login: "", senha: "" }`).
- `login` must be a valid e-mail address. `src/features/auth/schema.ts` (`z.email("Informe um e-mail válido.")`).
- `senha` must hold at least one character. The schema does not trim it, so a password made only of spaces passes the form check. `src/features/auth/schema.ts` (`z.string().min(1, "Informe a senha.")`).
- The form checks its fields first on submit. After that, it checks a field again each time the field loses focus. `src/features/auth/components/SignInForm.tsx` (`mode: "onSubmit"`, `reValidateMode: "onBlur"`).
- The submit handler runs only after both fields pass the schema. An invalid form never contacts the auth provider. `src/features/auth/components/SignInForm.tsx` (`form.handleSubmit(onSubmit)` with `zodResolver(signInSchema)`).
- While a sign-in attempt is in flight, both fields and the submit button are disabled. `src/features/auth/components/SignInForm.tsx` (`disabled={isSubmitting}`), `src/features/auth/api/useSignIn.ts` (`isLoading`).
- When a sign-in failure category is present, the form shows its mapped message as a form-level alert. `src/features/auth/components/SignInForm.tsx` (`formLevelError`, `SIGN_IN_ERROR_MESSAGE[error.type]`).
- When the session has expired, the form shows the notice "Sua sessão expirou. Faça login novamente." above the fields. `src/features/auth/components/SignInForm.tsx` (`sessionExpired`, `session-expired-notice`).
  - The area does not decide when `sessionExpired` is true. The panel only passes it through from its caller. `src/features/auth/components/SignInPanel.tsx` (`SignInPanelProps` Pick of `sessionExpired`).
- The session-expired notice and a form-level failure message can be shown at the same time, because each depends on its own input. `src/features/auth/components/SignInForm.tsx` (`sessionExpired ? … : null`, `formLevelError ? … : null`).
- The sign-in panel holds the sign-in form and passes it the submit handler, the in-flight flag, the failure category and the session-expired flag. `src/features/auth/components/SignInPanel.tsx` (`SignInPanel`).

### Sign-in (two-step exchange with the auth provider)
- Sign-in sends the `login` value as `email` and the `senha` value as `password`. `src/features/auth/api/useSignIn.ts` (`signInWithEmail(values.login, values.senha)`), `src/features/auth/api/neon-auth.ts` (`JSON.stringify({ email, password })`).
- Step 1 sends `POST {VITE_NEON_AUTH_URL}/sign-in/email` with a JSON body and credentials included. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`).
- Step 1 succeeds on any 2xx response, and the response body is ignored. `src/features/auth/api/neon-auth.ts` (`if (res.ok) return;`).
- Step 2 sends `GET {VITE_NEON_AUTH_URL}/token` with credentials included and reads the `token` field of the JSON answer as the owner's access token. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`).
- Step 2 runs only after step 1 succeeds. A step-1 failure ends the attempt before `/token` is called. `src/features/auth/api/useSignIn.ts` (`signIn`, sequential `await signInWithEmail` then `await fetchAccessToken`).
- Step 2 accepts a token only when it is a non-empty string. `src/features/auth/api/neon-auth.ts` (`typeof token !== "string" || token.length === 0`).
- After both steps succeed, the access token goes to the SPA's auth store before any navigation. `src/features/auth/api/useSignIn.ts` (`useAuthStore.getState().setToken(jwt)` before `navigate`).
- Each attempt clears the previous failure category and turns the in-flight flag on before step 1. The flag turns off whether the attempt succeeds or fails. `src/features/auth/api/useSignIn.ts` (`setIsLoading(true); setError(null);`, `finally { setIsLoading(false); }`).
- A successful sign-in shows no notice. The owner is taken to the destination. `src/features/auth/api/useSignIn.ts` (`signIn`, success branch has no toast).
- A failed sign-in shows the category's message twice: as the form-level alert and as an error toast. `src/features/auth/api/useSignIn.ts` (`setError(classified); toast.error(SIGN_IN_ERROR_MESSAGE[classified.type])`), `src/features/auth/components/SignInForm.tsx` (`formLevelError`).
- The owner sees only the category message. The auth provider's own message and the client's own message are never shown. `src/features/auth/api/useSignIn.ts` (`toast.error(SIGN_IN_ERROR_MESSAGE[classified.type])`), `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE[error.type]`).
- The hook offers a way to clear the shown failure, but the form in this area never calls it. A shown failure stays until the next attempt. `src/features/auth/api/useSignIn.ts` (`clearError`), `src/features/auth/components/SignInForm.tsx` (no `clearError` prop).
- The hook does not wait for navigation to finish. `src/features/auth/api/useSignIn.ts` (`void navigate({ to: target })`).

### Post-sign-in destination
- After sign-in, the destination comes from the `redirect` query parameter of the current address. `src/features/auth/api/useSignIn.ts` (`readRedirectParam`, `params.get("redirect")`).
- The default destination is `/chat`. `src/features/auth/api/useSignIn.ts` (`resolveSafeRedirect`).
- A `redirect` value is used only when all of these hold. Any failure falls back to `/chat`. `src/features/auth/api/useSignIn.ts` (`resolveSafeRedirect`):
  - it is present and non-empty;
  - it is at most 2048 characters long;
  - it starts with `/`;
  - it does not start with `//`;
  - it contains neither `://` nor `\`.
- If the address cannot be read, the result is the same as an absent `redirect` (`/chat`). `src/features/auth/api/useSignIn.ts` (`readRedirectParam` `catch { return null; }`).

### Failure classification
- Each sign-in failure falls into exactly one category. The checks run in this order. `src/features/auth/api/useSignIn.ts` (`classifySignInError`):
  - auth-client codes first: `INVALID_EMAIL_OR_PASSWORD` is credential, `NETWORK` is network, `NO_SESSION` or `NO_TOKEN` is session, and any other code is unknown;
  - then a native `TypeError`, which is network;
  - then any object whose `message` contains "failed to fetch" or "network" (case-insensitive), which is network;
  - everything else is unknown.
- An auth-client failure is classified by its code alone, even when its message would match the network check. `src/features/auth/api/useSignIn.ts` (`if (reason instanceof AuthError) { switch … default: return { type: "unknown" } }` returns before the message check).
- The auth client reports a fetch rejection (`TypeError`, or an `AbortError` `DOMException`) as the `NETWORK` code. Any other rejection is thrown again unchanged. `src/features/auth/api/neon-auth.ts` (`safeFetch`).
- On a step-1 failure, the auth client checks the provider's body `code` before the status. `INVALID_EMAIL_OR_PASSWORD` in the body wins at any status, then status 401, then the body code or `UNKNOWN`. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`).
- On a step-2 answer, the auth client runs its checks in this order. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`):
  - status 401;
  - any other non-2xx status;
  - a body that is not JSON;
  - a body that is not an object;
  - a `token` that is missing, empty or not a string.
- The provider's error body is read as optional string `code` and `message`. A body that is not JSON or not an object counts as having neither. `src/features/auth/api/neon-auth.ts` (`readErrorBody`).

## Answers
- sign-in form — `login` is not a valid e-mail → the field shows "Informe um e-mail válido." and nothing is sent to the auth provider. `src/features/auth/schema.ts` (`z.email`), `src/features/auth/components/SignInForm.tsx` (`FormMessage`, `handleSubmit`).
- sign-in form — `senha` is empty → the field shows "Informe a senha." and nothing is sent to the auth provider. `src/features/auth/schema.ts` (`z.string().min(1, …)`), `src/features/auth/components/SignInForm.tsx` (`FormMessage`, `handleSubmit`).
- sign-in — failure classified as credential → alert and toast "E-mail ou senha incorretos." `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE.credential`), `src/features/auth/api/useSignIn.ts` (`toast.error`).
- sign-in — failure classified as network → alert and toast "Erro de conexão. Verifique sua rede e tente novamente." `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE.network`), `src/features/auth/api/useSignIn.ts` (`toast.error`).
- sign-in — failure classified as session → alert and toast "Erro ao obter sessão. Tente novamente." `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE.session`), `src/features/auth/api/useSignIn.ts` (`toast.error`).
- sign-in — failure classified as unknown → alert and toast "Erro inesperado. Tente novamente." `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE.unknown`), `src/features/auth/api/useSignIn.ts` (`toast.error`).
- sign-in step 1 (`POST /sign-in/email`) — provider body code `INVALID_EMAIL_OR_PASSWORD`, at any status → `AuthError` `INVALID_EMAIL_OR_PASSWORD` (provider message, else "E-mail ou senha incorretos."), classified credential. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`), `src/features/auth/api/useSignIn.ts` (`classifySignInError`).
- sign-in step 1 — status 401 with any other body code or none → `AuthError` `INVALID_EMAIL_OR_PASSWORD` (provider message, else "E-mail ou senha incorretos."), classified credential. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`).
- sign-in step 1 — any other non-2xx → `AuthError` carrying the provider's body code, else `UNKNOWN` (provider message, else "Falha na autenticação (HTTP <status>)."). Classified by that code, so codes outside the auth client's set become unknown. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`), `src/features/auth/api/useSignIn.ts` (`classifySignInError` `default`).
- sign-in step 1 or step 2 — the provider cannot be reached (offline, DNS, CORS, abort) → `AuthError` `NETWORK` ("Network error contacting auth: <cause>"), classified network. `src/features/auth/api/neon-auth.ts` (`safeFetch`), `src/features/auth/api/useSignIn.ts` (`classifySignInError`).
- sign-in step 2 (`GET /token`) — status 401 → `AuthError` `NO_SESSION` (provider message, else "Sessão expirada ou ausente."), classified session. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`), `src/features/auth/api/useSignIn.ts` (`classifySignInError`).
- sign-in step 2 — any other non-2xx → `AuthError` carrying the provider's body code, else `UNKNOWN` (provider message, else "Falha ao obter token (HTTP <status>)."). Classified by that code. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`), `src/features/auth/api/useSignIn.ts` (`classifySignInError`).
- sign-in step 2 — 2xx whose body is not JSON → `AuthError` `NO_TOKEN` ("Resposta do servidor de auth não é JSON válido."), classified session. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`).
- sign-in step 2 — 2xx whose body is not an object, or whose `token` is missing, empty or not a string → `AuthError` `NO_TOKEN` ("Resposta do servidor de auth não contém token."), classified session. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`).
- sign-in — a thrown value that is not an auth-client error → network when it is a `TypeError` or its message mentions "failed to fetch" or "network", otherwise unknown. `src/features/auth/api/useSignIn.ts` (`classifySignInError`).

## Vocabularies
- Sign-in failure category: `credential`, `network`, `session`, `unknown`. `src/features/auth/schema.ts` (`SignInError`), `src/features/auth/components/SignInForm.tsx` (`SIGN_IN_ERROR_MESSAGE`).
- Codes the auth client mints itself: `INVALID_EMAIL_OR_PASSWORD`, `NO_SESSION`, `NO_TOKEN`, `NETWORK`, `UNKNOWN`.
  - The `code` field is an open string that can also carry a code from the provider's body. `src/features/auth/api/neon-auth.ts` (`AuthError`, `signInWithEmail`, `fetchAccessToken`).
- Sign-in form fields: `login`, `senha`. `src/features/auth/schema.ts` (`signInSchema`).

## Upstream artifacts
- The auth provider's address is `VITE_NEON_AUTH_URL`, and a trailing `/` is removed before the paths are joined. `src/features/auth/api/neon-auth.ts` (`base`).
- The auth provider's endpoint `POST /sign-in/email` takes the JSON body `{ email, password }`. `src/features/auth/api/neon-auth.ts` (`signInWithEmail`).
- The auth provider's endpoint `GET /token` answers JSON `{ token }`, and that token is the owner's access token. `src/features/auth/api/neon-auth.ts` (`fetchAccessToken`).
- The auth provider's error body has the shape `{ code, message }`. The code `INVALID_EMAIL_OR_PASSWORD` is the only one the client recognises. `src/features/auth/api/neon-auth.ts` (`readErrorBody`, `signInWithEmail`).
- Step 2 depends on state the provider keeps between the two calls. Both requests include browser credentials, and a step-2 401 means that state is absent. `src/features/auth/api/neon-auth.ts` (`credentials: "include"`, `fetchAccessToken` 401 → `NO_SESSION`).
- The access token goes to the SPA's auth store, which lives outside this area. `src/features/auth/api/useSignIn.ts` (`useAuthStore.getState().setToken`).

## Outside the domain
- CRT power-on, stagger and list-item animations, the reduced-motion handling, and the `GlassSurface` panel host (motion and surface). `src/features/auth/components/SignInPanel.tsx`.
- The panel heading "Bem-vindo ao Remember," and subtitle "sua memória virtual." (surface text). `src/features/auth/components/SignInPanel.tsx`.
- Field labels "Login" and "Senha", the button labels "Entrar" and "Entrando…", input types, `autoComplete`, `autoFocus`, `noValidate`, the spinner, and the classes `text-xs`, `text-destructive`, `w-full` (surface). `src/features/auth/components/SignInForm.tsx`.
- The ARIA wiring (`role="alert"`, `role="status"`, `aria-invalid`, `aria-labelledby`) and `data-testid` / `data-motion-variant` hooks (accessibility and testing wiring). `src/features/auth/components/SignInForm.tsx`, `src/features/auth/components/SignInPanel.tsx`.
- The `sonner` toast as the delivery channel for the failure message (framework). `src/features/auth/api/useSignIn.ts`.
- The feature's barrel re-exports (module wiring). `src/features/auth/index.ts`.
- The RHF and `zodResolver` wiring, the TanStack Router `useNavigate`, and reading `window.location.search` directly (framework wiring). `src/features/auth/components/SignInForm.tsx`, `src/features/auth/api/useSignIn.ts`.
- Header comments about cookie names, token lifetimes, silent refresh in `lib/http.ts`, and the `MISSING_ORIGIN` code (text only, not evidence). `src/features/auth/api/neon-auth.ts`, `src/features/auth/api/useSignIn.ts`.

## Observed and not decided here
None.
