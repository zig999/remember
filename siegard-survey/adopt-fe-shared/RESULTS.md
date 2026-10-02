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
