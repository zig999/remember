---
contract_version: siegard-reconcile/8
title: Frontend files bound to the four rules moved by the restates analysis
summary: The specification rules for the sign-in destination parameter, the evidence indicator, the reorganize
  control and the server-error fallback message changed in the analysis; the owner states the four files
  are the running system, and this reconciliation asks whether each rule still holds what its file carries.
target: frontend
files:
- path: src/features/auth/api/useSignIn.ts
  change: Reads the redirect parameter and takes the owner to it after sign-in when it is a safe local
    path, otherwise to /chat.
- path: src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  change: Shows the evidence indicator with its visible words and gives it an accessible name of its own.
- path: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  change: Offers the reorganize control when a reset handler is supplied, reading Reorganizar and named
    Reorganizar o layout do grafo.
- path: src/lib/http.ts
  change: Fails a status of 500 or more with the body's own code and message, or SYSTEM_UPSTREAM and the
    fallback message, keeping the whole body as details.
nodes:
- node: domain/owner-access/sign-in-attempt
  conforms: true
  how: "src/features/auth/api/useSignIn.ts: held at The signIn callback inside useSignIn (lines 73-101),\
    \ with classifySignInError (lines 37-62) and resolveSafeRedirect (lines 26-35). The credentials, failure\
    \ kind and destination shapes are declared in ../schema (SignInFormValues, SignInError), not here.\
    \ This file holds the four operations: submit, request token, classify failure and resolve destination.\
    \ — await signInWithEmail(values.login, values.senha);\n\nconst jwt = await fetchAccessToken();\n\n\
    useAuthStore.getState().setToken(jwt);\n\nconst redirectParam = readRedirectParam();\nconst target\
    \ = resolveSafeRedirect(redirectParam);\nvoid navigate({ to: target });\n} catch (thrown) {\n  classified\
    \ = classifySignInError(thrown);\n} finally {\n  setIsLoading(false);\n}\n...\nsetError(null);"
  encoded_at:
  - src/features/auth/api/useSignIn.ts
- node: rules/application-shell/a-server-error-is-always-a-failure
  conforms: true
  how: "src/lib/http.ts: held at the `if (response.status >= 500)` branch of http(), lines 177-192, with\
    \ extractEnvelopeCode and extractEnvelopeMessage at lines 221-241 — if (response.status >= 500) {\n\
    \    ...\n    const envelopeCode = extractEnvelopeCode(raw);\n    throw new EnvelopeError({\n    \
    \  code: envelopeCode ?? \"SYSTEM_UPSTREAM\",\n      httpStatus: response.status,\n      message:\n\
    \        extractEnvelopeMessage(raw) ?? \"Algo deu errado. Tente novamente.\",\n      details: raw,\n\
    \    });\n  }\nThe extractors return a value only when `typeof code === \"string\"` or `typeof message\
    \ === \"string\"`, so the body's own string code and message are used when present. The whole parsed\
    \ body goes into `details`. SYSTEM_UPSTREAM and the two-sentence message are the fallbacks."
  encoded_at:
  - src/lib/http.ts
- node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
  conforms: false
  how: "src/features/curation/components/DecisionPanel/EvidenceChip.tsx, the aria-label prop on the span,\
    \ lines 14-18, unviewed branch: aria-label={\n  viewed\n    ? \"Evidência vista.\"\n    : \"Veja a\
    \ evidência antes de decidir\"\n}\n...\n{viewed ? \"Evidência vista\" : \"Ver evidência\"} — The node\
    \ says the visible words and the accessible name are the same. In the unviewed state the visible text\
    \ is \"Ver evidência\", but the accessible name is \"Veja a evidência antes de decidir\". A screen-reader\
    \ user hears a different phrase from the one a sighted user reads. That phrase is a wording no node\
    \ holds, and it lives only in this file. The next reader looks in the specification for what the indicator\
    \ announces and finds \"Ver evidência\" there. The viewed branch adds a trailing period (\"Evidência\
    \ vista.\"), which the visible text lacks. The wording is still the same."
  observed_at:
  - src/features/curation/components/DecisionPanel/EvidenceChip.tsx
- node: rules/graph-explorer/the-reorganize-control-needs-its-handler
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at The `onResetLayout &&` branch\
    \ of the top-right Panel in GraphCanvas, lines 198-209. It renders the Button only when a reset handler\
    \ is supplied, wires that handler as its click handler, and gives it the visible text and accessible\
    \ name the node requires. — {onResetLayout && (\n  <Button\n    type=\"button\"\n    variant=\"secondary\"\
    \n    size=\"sm\"\n    onClick={onResetLayout}\n    aria-label=\"Reorganizar o layout do grafo\"\n\
    \  >\n    <Shuffle aria-hidden=\"true\" className=\"size-4\" />\n    Reorganizar\n  </Button>\n)}"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/owner-access/sign-in-destination-defaults-to-chat
  conforms: true
  how: 'src/features/auth/api/useSignIn.ts: held at readRedirectParam (lines 16-24) reads the redirect
    parameter. resolveSafeRedirect (lines 26-35) falls back to /chat. signIn (lines 86-88) navigates to
    the resolved target only after the token is stored. — const params = new URLSearchParams(window.location.search);

    return params.get("redirect");

    ...

    if (candidate === null) return "/chat";

    if (candidate.length === 0) return "/chat";

    if (candidate.length > 2048) return "/chat";

    if (!candidate.startsWith("/")) return "/chat";

    if (candidate.startsWith("//")) return "/chat";

    if (candidate.includes("://")) return "/chat";

    if (candidate.includes("\\")) return "/chat";

    return candidate;'
  encoded_at:
  - src/features/auth/api/useSignIn.ts
pairs_omitted:
- node: contracts/owner-access/sign-in
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/owner-access/sign-in-destination
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/access-token-is-held-before-the-owner-moves-on
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/any-other-sign-in-failure-is-unknown
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/missing-session-or-token-is-a-session-failure
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/network-looking-failure-is-a-network-failure
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/rejected-credentials-are-a-credential-failure
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/sign-in-destination-is-a-local-path
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/sign-in-failure-shows-only-its-kind-message
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/token-is-requested-after-credentials-accepted
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/owner-access/unreachable-provider-is-a-network-failure
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/owner-access/external-destination-falls-back-to-chat
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/owner-access/offline-fetch-error-is-a-network-failure
  file: src/features/auth/api/useSignIn.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/a-node-click-only-reports-the-node-id
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/a-node-without-position-sits-at-the-origin
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/layout-controls-need-nodes-and-a-handler
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/only-revealed-nodes-are-shown
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/graph-explorer/the-owner-cannot-draw-links
  file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/failures-answer-one-envelope
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-401-is-answered-with-one-silent-refresh
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-failed-envelope-keeps-its-code
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-failed-refresh-ends-the-session
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-failure-carries-code-status-message-and-details
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-failure-to-complete-is-timeout-abort-or-network
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-refreshed-token-repeats-the-request
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-repeated-request-never-refreshes-again
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/a-request-is-judged-in-a-fixed-order
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/an-answer-below-500-without-json-is-invalid
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/an-ingestion-request-has-no-cutoff
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/only-ok-true-returns-the-result
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/the-cutoff-ends-with-the-headers
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/the-first-signal-aborts-the-request
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/application-shell/transport-failures-read-their-wording
  file: src/lib/http.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/moved-fe-analyse-restates.returns/.

  Candidates: 0 opened across 0 of 4 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/moved-fe-analyse-restates.returns/`, which are the evidence behind every entry above.
