# adopt-fe-shared — frontend, contexto shared

Início: 2026-10-02T14:12:42.000Z

## TC.1–TC.2 — survey
- 3 áreas: `transport` (5 arquivos, 69 linhas de fato), `shell` (20, 81), `ds` (40 listados; ver `--survey`). Sem recusas, sem cerca.
- Tokens dos surveyors: 96 139 (transport) + 106 935 (shell) + 148 032 (ds).
- Observed: AUTH_SESSION_EXPIRED não roteado por routeError e redirect com replace × assign; AUTH_FORBIDDEN roteado como boundary mas só vira toast; atalho do rodapé "as_of" sem leitor; NAV com seis áreas e palette com cinco; trigger do menu de conversa: "Conversa sem título" × "Nova conversa" no nome acessível; datas as-of UTC × local; nós `not-found` com e sem guarda.

## TC.3 — análise
- Contexto novo `domain/application-shell`: 11 elementos, 118 regras, 4 cenários, contratos `shell-screen` (published), `bff-shell-reads` (consumed, upstream `contracts/knowledge-base/access`). Envelope e autenticação ligados a `constraints/failures-answer-one-envelope` e `constraints/every-operation-requires-owner-authentication`; vocabulários de domínio ligados a nós existentes (`domain/chat/*`, `domain/knowledge-base/*`, `domain/graph-explorer/confidence-state`).
- 2 decisões em log. `trace.py --ledger`: `ledger sound: 205 fact line(s) over 3 material file(s) — 205 landed in 118 node(s), 0 left out with a reason`.
- Regras de transporte duplicadas nos contextos ingest/curation/chat (30 s, refresh de 401, envelope) ficam como estão; consolidação é decisão do dono.

## TC.4 — adoção
- 34 juízes (um por arquivo com fatos; 1 relançado por retorno fora do contrato — `CommandPalette`: `candidates_opened` dentro de um item de `read`), 31 arquivos só de premissa. `--fold`: `111 node(s) cleared, 3 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 3 candidate(s) no file of the set holds, listed under unheld`.
- `--bind-record`: 111 vínculos gravados; sem vínculo: rules/application-shell/a-request-goes-to-the-back-end-address, rules/application-shell/a-user-bubble-may-be-streaming, rules/application-shell/the-as-of-date-lives-in-memory.

## TC.5 — medição
- Achados: contradicts 6, unstated 19, restates 94, unheld 3 (domain/application-shell/owner-session, domain/knowledge-base/link-type, rules/application-shell/session-expired-failure-carries-no-details).
- Contradicts: ChatBubble.types (vocabulário de papel redeclarado e comentário "usuário nunca em streaming"), use-shell-status (fetch direto com junção própria de URL), as-of.ts (comentário diz que a URL é a fonte), tokens.ts (13 tipos de link e 10 de nó redeclarados em kebab-case).
- `--check frontend`: 0 orphaned, 0 moved, 2 proof, 0 code. `--untraced`: 149 vinculados, 29 ainda sem classe (arquivos fora do domínio, tratados na Etapa 10).
- Telemetria: siegard-telemetry/20261002T142255Z.json.
