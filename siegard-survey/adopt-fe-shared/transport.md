---
contract_version: siegard-survey/1
target: frontend
files:
  - src/lib/env.ts
  - src/lib/error-routing.ts
  - src/lib/http.ts
  - src/lib/query-client.ts
  - src/lib/report-error.ts
---

## Facts

### Client configuration
- The client needs two configuration values, and each must be a valid URL. `VITE_BFF_URL` is the back-end (BFF) address. `VITE_NEON_AUTH_URL` is the identity provider address. `src/lib/env.ts` (`EnvSchema`, `z.url`).
- Only these two keys are read from the build environment. No other key is read or refused. `src/lib/env.ts` (`getEnv`, `safeParse({ VITE_BFF_URL, VITE_NEON_AUTH_URL })`).
- When the configuration is invalid, the client writes `[env] Frontend env validation failed:` with the issues to the console, then throws `EnvInvalidError`. `src/lib/env.ts` (`getEnv`, `console.error`).
  - The thrown message is `Frontend env invalid — fix VITE_BFF_URL / VITE_NEON_AUTH_URL: ` followed by `<path>: <message>` for each issue, joined by `; `. An empty path is shown as `(root)`. `src/lib/env.ts` (`EnvInvalidError` constructor).
  - The message for each field is `VITE_BFF_URL must be a valid URL` or `VITE_NEON_AUTH_URL must be a valid URL`. `src/lib/env.ts` (`EnvSchema`).
- The first valid configuration is frozen and cached. Every later read returns it without checking again. `src/lib/env.ts` (`cached`, `Object.freeze`).

### The back-end request helper: address and cutoff
- Every request goes to the configured back-end address, joined with the path given. `src/lib/http.ts` (`http`, `joinUrl`).
  - A path that starts with `http://` or `https://` is used as it is. Otherwise one trailing `/` is removed from the base and a leading `/` is added to the path if missing. `src/lib/http.ts` (`joinUrl`).
- A request that is not an ingestion request is cut off after 30 000 ms. The abort reason is a `TimeoutError` with the text `Request timed out after 30s`. `src/lib/http.ts` (`DEFAULT_TIMEOUT_MS`, `buildSignal`).
- A request marked `ingest: true` has no client cutoff. Only the caller's own signal, if any, is passed on. `src/lib/http.ts` (`buildSignal`, `opts.ingest === true`).
- A caller's signal is combined with the cutoff signal: whichever fires first aborts the request. `src/lib/http.ts` (`composeSignals`).
- The cutoff timer is cleared as soon as the response headers arrive. Reading the answer body has no cutoff. `src/lib/http.ts` (`http`, `cleanup()` after `fetch`).

### The back-end request helper: order of checks
- The order is the same for every request: (1) the request fails to complete; (2) HTTP 401 on a first attempt; (3) HTTP status ≥ 500; (4) the body is not JSON; (5) the envelope's `ok`. `src/lib/http.ts` (`http`, `try/fetch`, `response.status === 401 && __retried !== true`, `response.status >= 500`, `response.json()`, `body.ok === true`).
- When a request fails to complete, a timeout is checked first, then a caller abort (`AbortError`). Any other failure counts as a network failure. `src/lib/http.ts` (`isTimeoutError`, `isAbortError`).
- The value in `result` is returned only when the envelope's `ok` is exactly `true`. This holds whatever the HTTP status below 500, and whatever the status is on a retried 401. `src/lib/http.ts` (`body.ok === true`).
- Any envelope whose `ok` is not exactly `true` is a failure, even under a 2xx status. Its `code`, `message` and `details` are passed on unchanged. `src/lib/http.ts` (`ok === false` branch).
- A failure carries `code`, `httpStatus`, `message`, and `details` only when `details` is present. `src/lib/http.ts` (`EnvelopeError`).
- An answer with HTTP status ≥ 500 is always a failure, whatever its body says. `src/lib/http.ts` (`response.status >= 500`).
  - The body is read as JSON first, and as text if that fails. Its `error.code` and `error.message` are used when they are strings. The whole body is carried as `details`. `src/lib/http.ts` (`extractEnvelopeCode`, `extractEnvelopeMessage`).
- An answer below 500 with no body, or with a body that is not JSON, is a failure. This includes a 2xx with no body. `src/lib/http.ts` (`SYSTEM_INVALID_RESPONSE` branch).

### Silent access-token refresh
- On a first-attempt HTTP 401, the helper asks the identity provider once for a fresh access token, using the session cookie. This happens for every request, ingestion or not. `src/lib/http.ts` (`trySilentRefresh`, `fetchAccessToken`).
- When the refresh succeeds, the new access token is stored. The original request is then sent once more with the same options and a fresh 30 s cutoff. `src/lib/http.ts` (`setToken`, `http<T>(path, { ...opts, __retried: true })`).
  - The repeated request carries the same headers as the first one. The helper does not replace an `Authorization` header itself. `src/lib/http.ts` (`retryOpts = { ...opts, __retried: true }`).
- A repeated request never triggers a second refresh. A 401 on the repeated request is handled like any other answer below 500: as an envelope, or as `SYSTEM_INVALID_RESPONSE` if the body is not JSON. `src/lib/http.ts` (`__retried` guard).
- When the refresh fails for any reason, the stored access token is cleared and the page is replaced with `/sign-in?reason=session_expired`. The caller then gets a session-expired failure. `src/lib/http.ts` (`trySilentRefresh` catch, `redirectImpl`, `window.location.replace`).
- Because of the refresh, a first-attempt 401 never reaches the caller with the server's own code. The caller only ever sees the outcome of the repeated request, or `AUTH_SESSION_EXPIRED`. `src/lib/http.ts` (401 branch).

### Mapping error codes to what the owner sees
- All routing from error code to screen action lives in one function. Exact codes are matched before the prefix rules, and `BUSINESS_` is checked before `SYSTEM_`. `src/lib/error-routing.ts` (`routeError`, `switch`/`default`).
- `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED` and `AUTH_TOKEN_INVALID` all send the owner to `/sign-in?reason=session_expired`. `src/lib/error-routing.ts` (`routeError`).
  - Before navigating, the stored access token is cleared. If clearing fails, the failure is ignored. The page is then loaded with `window.location.assign`. `src/lib/query-client.ts` (`applyErrorAction`, `redirect`).
- `AUTH_FORBIDDEN` is routed as a boundary with `Acesso negado.`. The global handler shows it as a danger toast, `Acesso negado.`. `src/lib/error-routing.ts` (`routeError`); `src/lib/query-client.ts` (`applyErrorAction`, `boundary`).
- `VALIDATION_INVALID_FORMAT` is routed as a form error. It uses the server's message when that is non-empty, otherwise `Há campos inválidos no formulário.`, and passes on the server's `details`. The global handler shows nothing. `src/lib/error-routing.ts` (`routeError`); `src/lib/query-client.ts` (`set-error`).
- `RESOURCE_NOT_FOUND` on a single conversation's read or write shows a warning toast, `Conversa não encontrada.`. The router then navigates to `/chat` with empty search parameters, without reloading the page. `src/lib/error-routing.ts` (`routeError`, `toast-and-navigate`); `src/lib/query-client.ts` (`router.navigate`).
- `RESOURCE_NOT_FOUND` anywhere else is routed as an inline empty state. It uses the server's message when that is non-empty, otherwise `Nenhum resultado encontrado.`. The global handler shows nothing. `src/lib/error-routing.ts` (`routeError`, `inline-empty`); `src/lib/query-client.ts`.
- `RESOURCE_GONE` is always routed as an inline "removed" state with `Esta fonte foi removida por conformidade.`; the server's message is never used. The global handler shows nothing. `src/lib/error-routing.ts` (`routeError`, `inline-gone`); `src/lib/query-client.ts`.
- `SYSTEM_NETWORK` shows a warning toast, `Sem conexão.`. `src/lib/error-routing.ts` (`routeError`).
- `SYSTEM_ABORTED` shows nothing. `src/lib/error-routing.ts` (`routeError`, `silent`).
- Any `BUSINESS_*` code shows a warning toast. It uses the server's message when that is non-empty, otherwise `Operação não pôde ser concluída.`. `src/lib/error-routing.ts` (`routeError` default).
- Any other `SYSTEM_*` code shows a danger toast, `Algo deu errado. Tente novamente.`, and the server's message is never used. This covers `SYSTEM_TIMEOUT`, `SYSTEM_UPSTREAM`, `SYSTEM_INVALID_RESPONSE` and `SYSTEM_UNKNOWN`. `src/lib/error-routing.ts` (`routeError` default).
- Any other code shows a danger toast. It uses the server's message when that is non-empty, otherwise `Algo deu errado. Tente novamente.`. `src/lib/error-routing.ts` (`routeError` default).
- A read or write counts as "a single conversation" when its key has at least two elements and the first is `conversations`. The second must be a non-empty string other than `list`. `src/lib/error-routing.ts` (`isConversationResourceKey`).
  - For writes, the mutation key is tested the same way. A write without a key is never a conversation resource. `src/lib/query-client.ts` (`contextFromMutation`).

### Reads, writes and the global failure handler
- By default every read is retried once after a failure, whatever the code, and only then is the failure routed. `src/lib/query-client.ts` (`createQueryClient`, `queries.retry: 1`).
- Writes are never retried by default. `src/lib/query-client.ts` (`mutations.retry: 0`).
- By default a read stays fresh for 5 minutes (300 000 ms). `src/lib/query-client.ts` (`STABLE_STALE_MS`, `staleTime`).
- The volatile freshness value is 0 ms. It is offered for reads that override the default and is not applied globally. `src/lib/query-client.ts` (`VOLATILE_STALE_MS`).
- By default a read is not repeated when the window regains focus. `src/lib/query-client.ts` (`refetchOnWindowFocus: false`).
- Every read and write failure goes to the central routing. A failure that is not an envelope failure is reported and shown as a danger toast, `Algo deu errado. Tente novamente.`. `src/lib/query-client.ts` (`QueryCache.onError`, `MutationCache.onError`).
- Danger toasts are shown as error toasts and warning toasts as warning toasts. `src/lib/query-client.ts` (`applyErrorAction`, `toast.error`/`toast.warning`).
- There is one client for reads and writes, created once when the module loads. `src/lib/query-client.ts` (`queryClient`).

### Client error reporting
- In development, a reported error is written to the console as `[report-error]` with the error, its source, its query key and extra context. In production, nothing is written. `src/lib/report-error.ts` (`reportError`, `import.meta.env.DEV`).
- Reporting an error never makes a network request. `src/lib/report-error.ts` (`reportError`).
- The global handler reports failures that are not envelope failures with no context. `src/lib/query-client.ts` (`reportError(err)`).

## Answers
- back-end request — the 30 s client cutoff fires (requests that are not ingestion requests) → httpStatus 0 `SYSTEM_TIMEOUT` (`Tempo limite excedido na requisição.`; details `{ cause }`). `src/lib/http.ts` (`isTimeoutError` branch).
- back-end request — the caller aborts (`AbortError`) → httpStatus 0 `SYSTEM_ABORTED` (`Requisição cancelada.`; details `{ cause }`). `src/lib/http.ts` (`isAbortError` branch).
- back-end request — any other failure to complete → httpStatus 0 `SYSTEM_NETWORK` (`Falha de rede ao contactar o servidor.`; details `{ cause }`). `src/lib/http.ts` (`http` catch).
- back-end request — first-attempt 401 and the token refresh fails → httpStatus 401 `AUTH_SESSION_EXPIRED` (`Sua sessão expirou. Faça login novamente.`; no details), after the stored token is cleared and the page is replaced with `/sign-in?reason=session_expired`. `src/lib/http.ts` (401 branch, `trySilentRefresh`).
- back-end request — HTTP ≥ 500 whose body has a string `error.code` → that status and that code (the string `error.message`, or `Algo deu errado. Tente novamente.`; details are the raw body). `src/lib/http.ts` (`response.status >= 500`).
- back-end request — HTTP ≥ 500 whose body has no string `error.code` → that status `SYSTEM_UPSTREAM` (`Algo deu errado. Tente novamente.` unless a string `error.message` exists; details are the raw body or text). `src/lib/http.ts` (`envelopeCode ?? "SYSTEM_UPSTREAM"`).
- back-end request — status below 500 and the body is not JSON or is empty → that status `SYSTEM_INVALID_RESPONSE` (`Resposta do servidor não é JSON válido.`; details `{ cause }`). `src/lib/http.ts` (`response.json()` catch).
- back-end request — `ok` is not `true` and the envelope has `error` → that status and the envelope's `code` (its `message`; its `details`). `src/lib/http.ts` (`ok === false` branch).
- back-end request — `ok` is not `true` and there is no `error.code` → that status `SYSTEM_UNKNOWN` (`Erro desconhecido do servidor.` unless `error.message` exists). `src/lib/http.ts` (`error?.code ?? "SYSTEM_UNKNOWN"`).
- client start — either configuration value is missing or not a URL → `EnvInvalidError` (`Frontend env invalid — fix VITE_BFF_URL / VITE_NEON_AUTH_URL: <path>: <message>; …`). `src/lib/env.ts` (`getEnv`).
- global failure handler — a read or write fails with something other than an envelope failure → danger toast `Algo deu errado. Tente novamente.`. `src/lib/query-client.ts` (`onError`).

## Vocabularies
- Screen action for a failure: `redirect`, `toast-and-navigate`, `boundary`, `set-error`, `inline-empty`, `inline-gone`, `toast`, `silent`. `src/lib/error-routing.ts` (`ErrorAction`).
- Toast tone: `warning`, `danger`. `src/lib/error-routing.ts` (`ToastTone`).
- Failure codes the client creates itself: `SYSTEM_TIMEOUT`, `SYSTEM_ABORTED`, `SYSTEM_NETWORK`, `AUTH_SESSION_EXPIRED`, `SYSTEM_UPSTREAM`, `SYSTEM_INVALID_RESPONSE`, `SYSTEM_UNKNOWN`. `src/lib/http.ts` (`http`).
- Codes routed by exact match: `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTH_FORBIDDEN`, `VALIDATION_INVALID_FORMAT`, `RESOURCE_NOT_FOUND`, `RESOURCE_GONE`, `SYSTEM_NETWORK`, `SYSTEM_ABORTED`. Codes routed by prefix: `BUSINESS_`, `SYSTEM_`. `src/lib/error-routing.ts` (`routeError`).
- Standard failure messages: `Sua sessão expirou. Faça login novamente.`, `Acesso negado.`, `Há campos inválidos no formulário.`, `Nenhum resultado encontrado.`, `Conversa não encontrada.`, `Esta fonte foi removida por conformidade.`, `Operação não pôde ser concluída.`, `Algo deu errado. Tente novamente.`, `Sem conexão.`. `src/lib/error-routing.ts` (`MSG`).
  - `sessionExpired` is defined, but no code in `routeError` uses it. `src/lib/error-routing.ts` (`MSG.sessionExpired`).
- Sign-in reason the client sends: `session_expired`. `src/lib/http.ts` (`trySilentRefresh`); `src/lib/error-routing.ts` (`routeError`).

## Upstream artifacts
- The back-end's answer envelope `{ ok, result?, error?: { code, message, details? } }` is read on every request. This restates `constraints/failures-answer-one-envelope` and the `contracts/knowledge-base/*`, `contracts/chat/*` and `contracts/*-workspace/bff-*` contracts. `src/lib/http.ts` (`Envelope`).
- The back-end answers HTTP 401 to a request without a valid owner access token. The client treats this as a stale access token. This restates `constraints/every-operation-requires-owner-authentication`. `src/lib/http.ts` (401 branch).
- The back-end's failure codes the client routes are `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTH_FORBIDDEN`, `VALIDATION_INVALID_FORMAT`, `RESOURCE_NOT_FOUND`, `RESOURCE_GONE`, and the `BUSINESS_*` and `SYSTEM_*` families. `src/lib/error-routing.ts` (`routeError`).
- The identity provider exchanges the session cookie for a fresh access token (`fetchAccessToken`). Its failures arrive as `AuthError`. This restates `contracts/owner-access/identity-provider`. `src/lib/http.ts` (import from `@/features/auth/api/neon-auth`).
- The owner's access token is held in the auth store (`setToken`, `clear`). `src/lib/http.ts`; `src/lib/query-client.ts` (`useAuthStore`).
- Sign-in lives at `/sign-in` and takes a `reason` search parameter. Chat lives at `/chat`. `src/lib/http.ts`; `src/lib/error-routing.ts`.
- Chat reads and writes are keyed as `["conversations", <id>, …]`. The list is keyed as `["conversations", "list", …]`. `src/lib/error-routing.ts` (`isConversationResourceKey`); `src/lib/query-client.ts` (`contextFromMutation`).

## Outside the domain
- Test seams `__resetEnvCacheForTests` and `__setRedirectForTests` (test-only). `src/lib/env.ts`; `src/lib/http.ts`.
- The manual signal-relay fallback used when `AbortSignal.any` is missing (runtime). `src/lib/http.ts` (`composeSignals`).
- The re-export of `AuthError` for diagnostics (wiring). `src/lib/http.ts`.
- The `Unhandled ErrorAction kind` exhaustiveness throw (type safety). `src/lib/query-client.ts` (`applyErrorAction` default).
- The factory, module-scope singleton and HMR stability of the read/write client (wiring). `src/lib/query-client.ts` (`createQueryClient`, `queryClient`).
- The choice of `sonner`, TanStack Query and Zod as libraries (framework). `src/lib/query-client.ts`; `src/lib/env.ts`.
- `ReportErrorContext` fields that no caller in the area fills (`source`, `queryKey`, `extra`), shown only in the dev console (logging). `src/lib/report-error.ts`.

## Observed and not decided here
- Session-loss codes route in two different ways. `src/lib/error-routing.ts` (`routeError`) sends `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` to `/sign-in?reason=session_expired`. `src/lib/http.ts` (401 branch) throws `AUTH_SESSION_EXPIRED` after its own redirect, and `routeError` has no case for that code. It therefore falls to the unknown-code default and shows a danger toast, `Sua sessão expirou. Faça login novamente.`.
- The two redirects to sign-in navigate differently. `src/lib/http.ts` (`redirectImpl`) uses `window.location.replace("/sign-in?reason=session_expired")`, which leaves no history entry. `src/lib/query-client.ts` (`applyErrorAction`, `redirect`) uses `window.location.assign(action.to)` for the same address, which keeps a history entry.
- `AUTH_FORBIDDEN` is routed as action kind `boundary` in `src/lib/error-routing.ts` (`routeError`). The executor in `src/lib/query-client.ts` (`applyErrorAction`, `boundary`) only shows a danger toast, `Acesso negado.`, and nothing in the area renders a boundary.
