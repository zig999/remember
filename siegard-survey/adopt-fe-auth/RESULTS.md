# adopt-fe-auth — frontend, contexto auth (piloto)

Início: 2026-10-02T10:08:29-03:00

## TC.1
- version 5.2.0; `git status --porcelain` limpo; `project.py` sem erro; specification sound.
- `--untraced frontend`: `377 tracked file(s) under frontend: 0 bound, 377 no binding names` (118 uncertified, 259 unsurveyed).

## TC.2 — survey
- Área `auth` = `src/features/auth/`: 6 arquivos; 4 testes deixados de fora (declarados).
- Um surveyor; retorno copiado do JSONL; sem refusal, sem nova execução.
- `trace.py --survey`: `57 fact line(s) over 6 file(s) — Facts 33, Answers 15, Vocabularies 3, Upstream artifacts 6` / `1 file(s) no fact names: src/features/auth/index.ts`.
- Tokens do surveyor: 78 972 (subagent_tokens), 12 usos de ferramenta, 124 s.
- `Observed and not decided here`: None.
- `read_outside_area`: `src/state/auth.ts`, `src/lib/env.ts`.

STOP: o dono lê `siegard-survey/adopt-fe-auth/auth.md`; a política P1 (RUNBOOK-adopt-frontend.md) aguarda aprovação antes da análise.

## TC.3 — análise (2026-10-02)
- Política P1 aplicada provisionalmente (o dono ainda não a aprovou); o dono revisa `git diff` e pode reverter o commit.
- Nós escritos: contexto `domain/owner-access` (supporting), 4 elementos, 14 regras, 3 cenários, contratos `contracts/owner-access/sign-in` (published api) e `contracts/owner-access/identity-provider` (consumed api, upstream `contracts/system/owner-identity`, capability).
- 5 decisões em log (strategic, answers, attributes, e duas de statement); 3 `why` ficaram em 26–33 palavras (p90 = 25), pois o log é append-only.
- `trace.py --ledger`: `ledger sound: 57 fact line(s) over 1 material file(s) — 51 landed in 24 node(s), 6 left out with a reason`; candidatos por arquivo: neon-auth.ts 6, useSignIn.ts 19, SignInForm.tsx 15, schema.ts 7, SignInPanel.tsx 0, index.ts 0.
- Nenhum nó duplica um nó existente (P2): a autenticação do BFF (`constraints/every-operation-requires-owner-authentication`, `contracts/knowledge-base/access`) não foi reescrita.
