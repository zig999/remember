---
title: Frontend app where the entities feature lands
summary: The React 19 SPA under frontend/src, where a new lazy-loaded entities feature is added to the protected layout, next to curation, graph and chat.
rationale: The scope names only the entities feature on the frontend target, so the survey walked the router, lib, state, shell, the curation, graph and chat features, components/ui and ds, and the test setup.
sources:
- intake/scope.md
area:
- src/router
- src/lib
- src/state
- src/shell
- src/features/curation
- src/features/graph
- src/features/chat
- src/features/auth
- src/components
- vitest.config.ts
- vitest.setup.ts
- tsconfig.json
- tsconfig.vendor.json
- package.json
modules:
- name: entities-feature
  path: src/features/entities
  role: touched
- name: router
  path: src/router/routes.tsx
  role: touched
- name: router-tests
  path: src/router/__tests__/routes.spec.tsx
  role: touched
- name: curation-feature
  path: src/features/curation
  role: depends-on
- name: graph-feature
  path: src/features/graph
  role: depends-on
- name: http-client
  path: src/lib/http.ts
  role: depends-on
- name: query-client
  path: src/lib/query-client.ts
  role: depends-on
- name: error-routing
  path: src/lib/error-routing.ts
  role: depends-on
- name: auth-store
  path: src/state/auth.ts
  role: depends-on
- name: app-shell
  path: src/shell/AppShell.tsx
  role: depends-on
- name: app-toaster
  path: src/shell/AppToaster.tsx
  role: depends-on
- name: ui-kit-vendor
  path: vendor/ui-kit/frontend/src/shared
  role: depends-on
- name: ds-components
  path: src/components/ds
  role: adjacent
- name: chat-feature
  path: src/features/chat
  role: adjacent
- name: header
  path: src/shell/Header.tsx
  role: adjacent
conventions:
- statement: Protected pages are children of protectedLayoutRoute. Each page is a lazy() import that maps the named export to default, rendered inside Suspense with a role="status" aria-live="polite" fallback in pt-BR.
  seen_at: src/router/routes.tsx
- statement: 'Routes are createRoute objects added to routeTree.addChildren. Search params are checked by validateSearch, and the page reads them with useSearch({ from: route.id }).'
  seen_at: src/router/routes.tsx
- statement: A feature is laid out as features/<x>/{api,components,hooks,state,lib,types.ts}. A feature api folder holds keys.ts, _request.ts, _transforms.ts and *.hooks.ts. Wire types are mapped to domain types by to* transforms.
  seen_at: src/features/curation/api
- statement: Query keys are as-const factories per entity. Reads use useQuery with staleTime 5 min for stable data, and mutations go through useMutation.
  seen_at: src/features/curation/api/keys.ts
- statement: Reads call http<T>() from lib/http with headers authHeader(). http unwraps the { ok, result } envelope and throws EnvelopeError with code, httpStatus and details, retries once after a silent refresh on 401, and times out at 30 s.
  seen_at: src/features/curation/api/node.hooks.ts
- statement: Curation mutations use httpCuration, which returns bare 2xx bodies without an envelope and reads { error } from non-2xx bodies. This is a second, divergent fetch wrapper.
  seen_at: src/features/curation/api/_request.ts
- statement: The 5-second undo flow is a ref holding the pending dispatch plus a setTimeout of UNDO_WINDOW_MS. toast.custom renders an UndoToast with a countdown and a Desfazer button. The commit runs when the timer fires or on unmount.
  seen_at: src/features/curation/hooks/useDecisionDispatch.tsx
- statement: Forms use react-hook-form with zodResolver over a Zod v4 schema. Fields are wrapped in Controller with a Label htmlFor, aria-invalid and aria-describedby, and an error p with role="alert". Server codes are mapped to fields with setError.
  seen_at: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- statement: Shared UI is imported from "@/shared/components/ui/*", which resolves to the vendor/ui-kit submodule. Styling uses tokens merged with cn() from "@/lib/cn".
  seen_at: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- statement: Components use FC with an explicit Props interface and a named export. Component folders hold Component.tsx, Component.types.ts and index.ts, with specs in a sibling __tests__/ folder.
  seen_at: src/features/curation/components/UndoToast
- statement: Error handling is central. The QueryCache and MutationCache onError run routeError, so BUSINESS_* codes become a warning toast and SYSTEM_* codes a danger toast.
  seen_at: src/lib/query-client.ts
- statement: Tests are Vitest with jsdom and globals, specs under __tests__/. MSW is not installed; the network is faked with vi.spyOn(globalThis, "fetch") plus a hand-rolled handler registry with mockResponse, mockOkEnvelope and mockError builders.
  seen_at: src/features/curation/api/__tests__/handlers.ts
- statement: Router specs run under @vitest-environment node with sonner mocked, build a router on an in-memory history, and raise testTimeout to 20 s.
  seen_at: src/router/__tests__/routes.spec.tsx
- statement: UI strings are written directly in pt-BR in the code, with no i18n.
  seen_at: src/features/curation/hooks/useDecisionDispatch.tsx
must_not_duplicate:
- what: The http<T>() wrapper with envelope unwrapping, EnvelopeError, 401 refresh and timeout; the entities hooks use it and add no third copy of the fetch wrapper.
  at: src/lib/http.ts
- what: authHeader() for the bearer token.
  at: src/features/curation/api/_request.ts
- what: The protected-layout route pattern, with the lazy plus Suspense page wrapper.
  at: src/router/routes.tsx
- what: The 5 s undo window constant and the UndoToast component; the toast, timer and commit orchestration in useDecisionDispatch is the model.
  at: src/features/curation/components/UndoToast/UndoToast.tsx
- what: The reason-field, Controller and server-error-to-field pattern for forms.
  at: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- what: STABLE_STALE_MS and VOLATILE_STALE_MS constants and the global QueryClient error routing.
  at: src/lib/query-client.ts
- what: The cn() class merge util.
  at: src/lib/cn.ts
- what: The fake-fetch handler registry and response builders.
  at: src/features/curation/api/__tests__/handlers.ts
- what: The single AppToaster mounted at root; features call toast from sonner and never mount another Toaster.
  at: src/shell/AppToaster.tsx
risks:
- risk: MSW is not a dependency and vitest.setup.ts has no server, while the scope asks for MSW-simulated responses.
  consumers:
  - package.json
  - vitest.setup.ts
  - src/features/entities tests
- risk: 'Query key prefix collision: graph nodeKeys.detail is ["nodes", id] and curation nodeKeys.detail is ["nodes", id, "detail"]; an entities key under "nodes" would be invalidated by, or invalidate, both.'
  consumers:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/curation/api/node.hooks.ts
- risk: The global MutationCache onError turns every BUSINESS_* code into a warning toast, so an edit-conflict response would toast on top of any inline conflict handling unless accounted for.
  consumers:
  - src/lib/query-client.ts
  - src/lib/error-routing.ts
  - src/lib/__tests__/error-routing.spec.ts
- risk: Adding routes changes the shared route tree that routes.spec.tsx asserts; new routes must keep the lazy pattern.
  consumers:
  - src/router/__tests__/routes.spec.tsx
  - src/router/__tests__/routes.ingest.dom.spec.tsx
  - src/router/router.ts
- risk: Curation commits a pending undo on unmount; leaving /entities/$nodeId during the 5 s window must be decided and tested.
  consumers:
  - src/features/curation/hooks/useDecisionDispatch.tsx
  - src/router/routes.tsx
- risk: The curation page imports GlassSurface, which the owner is eliminating app-wide; the entities screen must not copy that dependency.
  consumers:
  - src/features/curation/components/CurationPage.tsx
  - src/components/ds
---
## What it is
The frontend is a Vite 6 and React 19 TypeScript app whose protected routes live in src/router/routes.tsx under protectedLayoutRoute, rendered by AppShell.
Features are self-contained folders under src/features, and curation is the closest model for list, form, undo and conflict handling.
Shared UI comes from the vendor/ui-kit submodule through "@/shared/*", with tokens, cn() and one AppToaster at the root.
There is no entities folder yet, so the whole feature is new, and no existing menu or graph panel links to it.

## Notes
MSW is absent from package.json, so MSW-simulated tests need the dependency added or a decision to use the existing fetch-spy handler registry.
The vendor/ui-kit submodule was not initialized in this worktree and was initialized at its pinned commit before planning.
Curation reads are enveloped through http() while curation writes are bare through httpCuration, so the entities contracts say which shape each endpoint returns.
Node detail is read in two places already with different query keys, so entities should not add a third node-detail key under the "nodes" prefix without a decision.
