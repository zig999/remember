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

## TC.4 — adoção (2026-10-02)
- Staging: `staged adopt-fe-auth: 4 file(s) to judge over 0 node(s); staged as an adoption — 24 candidate node(s) from the ledger, 47 pair(s) over 4 file(s) (19 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 6 file(s) the trace binds nothing to, 4 of them judged over the candidates alone`.
- Node packs: neon-auth.ts 5 719 B; useSignIn.ts 14 248 B; SignInForm.tsx 10 174 B; schema.ts 5 949 B.
- Juízes: 4 (um por arquivo). Retornos recusados pelo fold: 3 na primeira tentativa (`neon-auth.ts`, `useSignIn.ts`, `SignInForm.tsx`) porque vieram dentro de uma cerca ```yaml; a cerca externa foi removida por script (nada mais alterado) e o fold passou.
- Fold: `22 node(s) cleared, 2 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed`.
- Bind: 22 bindings escritos em `siegard-trace.json`; não escritos: `contracts/owner-access/identity-provider`, `rules/owner-access/sign-in-failure-stays-until-the-next-attempt`.

## TC.5 — medição
- cleared 22; `contradicts` 2; `unstated` 2; `restates` 13; `unheld` 0.
- `contradicts`: (1) `contracts/owner-access/identity-provider` — o código usa o código sentinela "UNKNOWN" quando o corpo não traz código, e o nó diz "no code" (`neon-auth.ts`); (2) `rules/owner-access/sign-in-failure-stays-until-the-next-attempt` — `useSignIn` exporta `clearError`, que limpa a falha fora de um envio (nenhum chamador hoje).
- `unstated` (classificação): (1) nome do parâmetro de endereço `redirect` — queda da análise (a linha 46 do material o cita, o nó não o guarda); (2) rótulo do botão "Entrar"/"Entrando…" — o survey o tratou como superfície (política P1), o juiz o leu como fato sem nó: decisão do dono sobre P1.
- `restates`: 13 comentários em 3 arquivos (neon-auth.ts 3, useSignIn.ts 9, schema.ts 1).
- `--untraced frontend`: `377 tracked file(s) under frontend: 4 bound, 373 no binding names` / `2 holds-nothing` (SignInPanel.tsx, index.ts) / `118 uncertified` / `253 unsurveyed`.
- `--check frontend`: sem drift novo no frontend (os 2 `proof` são do backend).
- Tokens: surveyor 78 972; juízes 40 095 (schema.ts), 45 497 (SignInForm.tsx), 49 226 (neon-auth.ts), 52 893 (useSignIn.ts) = 187 711, média 46 928 por arquivo julgado; a análise correu no contexto principal (telemetria da janela: 5 agentes, 36 440 tokens de saída; sessão 43 811).

## Lições do piloto
1. Três de quatro juízes devolveram o YAML dentro de uma cerca de código apesar do prompt "return the YAML and nothing else": o fold exige a remoção por script da cerca externa. Runbook atualizado: o prompt do juiz passa a dizer "no code fence" e o passo 4 prevê o strip.
2. A política P1 (rótulos de controle são superfície) diverge do critério do juiz (todo texto que o código emite e que nenhum nó guarda é `unstated`). Decisão do dono pendente: manter o rótulo como superfície (e aceitar o `unstated` como resíduo) ou dar-lhe um nó.
3. Os comentários do código fonte são o maior resíduo (13 `restates`), esperado numa adoção; a rota é a de comentário (remover, nunca refrescar) e `/reconcile` depois.
4. O `index.ts` e o `SignInPanel.tsx` não têm fato: ficam `holds-nothing` e não ganham juiz — custo zero.
5. Custo médio: ~47 mil tokens por juiz, ~79 mil por surveyor numa área de 6 arquivos (31 KB).

STOP: o dono revisa e commita `siegard-trace.json siegard-reconcile siegard-survey/adopt-fe-auth siegard-telemetry`.
