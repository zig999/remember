---
target: frontend
title: Proof for other save failures keeping what the owner typed
summary: Form-level tests prove the refusal alert, the fixed refusal texts, the could-not-be-sent alert and the held typed values; a lapsed session shows no alert; a hook-level test proves a cancelled edit counts as unreachable.
implementation: sha256:4bc2903da20cffc2f05e8b10e8ae654ae4c7b5cc12306817fdb040433b81a4f2
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-other-save-failures-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
  name: alerts with the message the refusal carries and with nothing else
  proves: A refusal other than a conflict shows an alert carrying the refusal's message. (A 422 with the readable code VALIDATION_INVALID_FORMAT. The exact one-element alert list also shows there is at most one alert and that no code, status or details are rendered.)
  fails_when: the refusal shows no alert, shows an alert with other text, shows the code or status beside the message, shows a second alert, or classifies a readable-code refusal as an edit that could not be sent.
- file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
  name: still holds the status the owner typed, the reason and the open review, though the node was superseded elsewhere
  proves: A refusal other than a conflict leaves every typed value in the form. (Status field, reason as typed and review open. The node read would answer a superseding status, so a refetch and reset would show.)
  fails_when: a refusal resets the form, clears the reason, closes the review, or invalidates the node so that it is refetched and the superseding status replaces the typed one.
- file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
  name: alerts with the fixed text $text when the edit is answered $answered, as a refusal and not as an edit that could not be sent
  proves: 'UNDERDETERMINED entry 1. SYSTEM_UPSTREAM (5xx, no readable code), SYSTEM_UNKNOWN (non-2xx below 500, no readable code) and SYSTEM_INVALID_RESPONSE (2xx, non-JSON) are refusals, and each alert carries its fixed text from bff-entity-edit: ''Algo deu errado. Tente novamente.'', ''Erro desconhecido do servidor.'' and ''Resposta do servidor não é JSON válido.''. A table of three cases.'
  fails_when: any of the three codes is treated as an edit that could not be sent (the alert would read 'Não foi possível enviar a edição. Tente novamente.'), shows no alert, or shows a text other than its fixed one.
- file: src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
  name: alerts that the edit could not be sent, with no message of the failure's own, when thirty seconds pass without an answer
  proves: 'An edit that cannot reach the knowledge base shows an alert saying the edit could not be sent. Also UNDERDETERMINED entries 1 and 3: SYSTEM_TIMEOUT is not a refusal showing its own message, and the alert reads exactly ''Não foi possível enviar a edição. Tente novamente.'' with ''Tempo limite excedido na requisição.'' absent.'
  fails_when: the cutoff shows no alert, treats SYSTEM_TIMEOUT as a refusal showing 'Tempo limite excedido na requisição.', adds the failure's own message to the text, words it 'Não foi possível salvar.', or shows two alerts.
- file: src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
  name: still holds the status the owner typed, the reason and the open review when the request fails on the network
  proves: An edit that cannot reach the knowledge base leaves every typed value in the form. (The fetch rejects, which is SYSTEM_NETWORK.)
  fails_when: an unreachable edit resets the form, clears the reason, closes the review or causes the node to be refetched.
- file: src/features/entities/components/__tests__/EntityForm.session-expired.spec.tsx
  name: shows no alert of either kind, neither the refusal's nor the could-not-be-sent one
  proves: UNDERDETERMINED entry 2. AUTH_SESSION_EXPIRED (401 whose refresh fails, so the request clears the token and replaces the page) is neither a refusal nor an edit that could not be sent. No alert is shown, so 'Sua sessão expirou. Faça login novamente.' is not shown as a refusal. The page being replaced once confirms the failure path was reached.
  fails_when: the lapsed session is treated as a refusal (alert with 'Sua sessão expirou. Faça login novamente.') or as an edit that could not be sent (fixed alert), or the request does not end the session.
- file: src/features/entities/api/__tests__/edit-outcomes-aborted.spec.ts
  name: is unreachable with SYSTEM_ABORTED, not a refusal, when the caller cancels the edit before an answer
  proves: 'UNDERDETERMINED entry 1 and rules/entity-workspace/a-save-failure-is-classified-by-its-code: SYSTEM_ABORTED counts as an edit that could not be sent. The form passes no signal, so only the hook can show it.'
  fails_when: the edit hook classifies SYSTEM_ABORTED as a refusal, or as anything but an unreachable outcome carrying that code.
files:
- path: src/features/entities/components/__tests__/entity-form-failure-support.ts
  effect: Shared helper for the three new form specs. It mounts the reviewed status edit through the existing conflict support, then replaces the stubbed fetch so the edit POST answers any status or body, rejects, or hangs until the 30 s cutoff. It also provides the 422 refusal fixture, the cutoff-and-wait routine, the typed-form expectation (status, reason, review) and a reader of what the form still holds. It changes no existing test file.
not_applicable:
- edge_case: the alert before the send and for an accepted answer
  why: Not written, to avoid duplicating tests. EntityForm.conflict.spec.tsx already asserts that the list of all role=alert elements is empty inside the undo window and after an accepted answer. A refusal or could-not-be-sent alert appearing in either case would fail those tests too, so a copy here would be the same evidence twice (SPEC-004 R5).
- edge_case: the 29,999 ms and 30,000 ms boundary of the cutoff
  why: owned by edit-request-cutoff.spec.ts, which tests the request. This task's obligation is what the form shows once the failure arrives, so one representative failure is enough.
- edge_case: SYSTEM_NETWORK and SYSTEM_TIMEOUT classified as unreachable at the hook, and a readable-code refusal at the hook
  why: already failed over by the existing edit-outcomes.spec.ts (network, timeout, 409 refusal). A readable-code refusal at 422 is the same class as the 409 case there. The form-level tests cover the alert for the timeout and the 422 refusal.
- edge_case: Salvar pressed twice, undo followed by a failure, and two sends at once
  why: owned by the undo-window task (busy guard, single send). No criterion of this task reaches them.
- edge_case: absent or empty input, duplicates, an empty collection
  why: the task takes no input of its own. The edit comes from the reviewed form, whose gates belong to other tasks.
- edge_case: a 401 whose refresh succeeds and a second 401
  why: owned by edit-request-session.spec.ts, which tests the request's SYSTEM_UNKNOWN for the second 401. The form-level 'below 500, no code' case here has the same class and the same alert.
untested:
- The toast concern from the notes (the inventory flags a global BUSINESS_* warning toast for these refusals). The test QueryClient has no global MutationCache handler, so a toast could not occur here. No assertion about toasts was written. The implementation returns outcomes as values so the global handler is never reached, and no test here guards that.
- 'contracts/entity-workspace/entity-screen: the node holds the show-entity-list, show-entity-form, show-review and save-edit answers, including the accepted reload and the conflict refusal that belong to other tasks. No finite test of this task decides it whole. The two refusals this task owns are proven by the form tests above, and the node is not claimed.'
- 'contracts/entity-workspace/bff-entity-edit: how the request reports each failure (wire, cutoff, refresh, codes and fixed texts) belongs to the edit-request task''s specs. This task reaches it only through the form, so a claim here would assert part of it as the whole.'
- 'rules/entity-workspace/a-save-failure-is-classified-by-its-code: the classification clauses are tested. ABORTED is unreachable at the hook. UPSTREAM, UNKNOWN and INVALID_RESPONSE are refusals at the form. TIMEOUT and NETWORK are unreachable at the form and in edit-outcomes.spec.ts. SESSION_EXPIRED shows no alert. The clause ''whose typed values are not kept'' is not asserted: the caller asked that the values not be asserted for that case, and the implementation writes no persistence and relies on the page being replaced. A finite test over the whole fact would assert part of it, so no `demonstrates` is claimed.'
- 'rules/entity-workspace/a-failed-save-reads-its-wording: the could-not-be-sent clause and the failure''s-own-message absence are proven for the unreachable alert. The conflict clause belongs to the conflict task (the REMAINDER note) and is asserted by EntityForm.conflict.spec.tsx. A test over this task alone would assert part of the fact, so the node is not claimed.'
- 'domain/entity-workspace/entity-edit-session: an aggregate root with six operations (open, change, review, confirm, undo, discard). No finite test decides it whole. This task''s share, that the typed fields, reason and review survive a failed save, is proven by the two values-held tests.'
- 'Inference: AUTH_SESSION_EXPIRED is a returned outcome value of its own and not a thrown error, so no global toast is raised on top of the redirect. Not pinned. The form test shows only that no alert appears, and no test over the outcome''s kind or the throw-versus-return choice was written.'
- 'Inference: the refusal and unreachable alerts use the destructive variant, the testids entity-save-refused and entity-save-unreachable, and sit after the review. Arrangement, not tested. The tests find alerts by role=alert.'
- 'Inference: the alerts have no dismiss control and leave only at the next confirmation. No node states when they end, so nothing proves dismissal or the clearing of the alert at the next confirmation.'
- 'Inference: a refusal whose readable body code carries an empty-string message renders an empty alert body. No node holds a fallback, so no test pins the choice.'
- 'Inference: SYSTEM_SERVICE_UNAVAILABLE stays a refusal. No node names it, the edit request never produces it, and a test would pin the implementation''s guess.'
- 'Typed values after AUTH_SESSION_EXPIRED: deliberately neither asserted kept nor asserted dropped (see the classification rule above).'
---
## What it is
This record proves task/review-and-save/other-save-failures.
It holds the specs and helpers listed in its tests and files.

## Notes
The suite passed on its first run, run/review-and-save-other-save-failures-suite.
