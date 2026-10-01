# Runbook — adopt one backend context, by the current route

One runbook for every context still unsurveyed under `backend/`. Plugin: siegard **4.28.0** or
later. `P` is the installed plugin root. The human names the context and its areas in the
invocation; everything else is this file's. Record every command, its verbatim output and every
decision in `siegard-survey/adopt-<context>/RESULTS.md`. Never commit; stop at each STOP.

Contexts and areas, spelled from `backend/` (tests are never an area; `__tests__/` and
`*.spec.ts` are certification material, not survey material):

| context | slug | areas |
|---|---|---|
| compliance-audit | `adopt-compliance-audit` | `service` = `src/modules/compliance-audit/service/`; `boundary` = `dto/`, `mcp/`, `routes/`, `repository/`, `index.ts` |
| knowledge-graph | `adopt-knowledge-graph` | `service` = `service/`, `traversal/`; `boundary` = `dto/`, `mcp/`, `routes/`, `index.ts`; `storage` = `repository/`, `catalog/` |
| curation | `adopt-curation` | `service` = `service/`; `boundary` = `dto/`, `mcp/`, `routes/`, `repository/`, `index.ts` |
| chat | `adopt-chat` | `service` = `service/`; `prompts` = `prompts/`; `boundary` = `routes/`, `repository/`, `index.ts` |
| shared (last) | `adopt-shared` | `transport` = `src/shared/error-mapping.ts`, `src/middleware/error-handler.ts`, `src/middleware/auth.ts`, `src/shared/health.ts`; outside: `src/app.ts`, `src/server.ts`, `src/mcp-stdio.ts`, `src/config/*`, `src/mcp/*`, `src/shared/invariant-error.ts`, `src/shared/pg-transaction.ts`, `src/shared/zod-coercion.ts`, and every tracked file at the backend root (`package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `.env.example`, `.gitignore` — configuration, not domain) |

Order: compliance-audit, knowledge-graph, curation, chat, shared. The first is the smallest and
is the first live run of the survey, the ledger and the per-file candidates together; what it
measures decides nothing about the others, but a defect it finds is fixed before the larger
ones pay for it.

## Step 1 — preconditions

```
grep '"version"' $P/.claude-plugin/plugin.json
git status --porcelain -- specification backend siegard-trace.json siegard-reconcile siegard.json
python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
python3 -B $P/bin/trace.py --untraced backend
python3 -B $P/bin/spec.py specification
```

Version 4.28.0 or later; `git status` prints nothing; the specification is sound. Otherwise
stop. Record the `--untraced` line and the start instant.

## Step 2 — the survey

Invoke `/siegard:survey` with the project root, target `backend`, the context's slug, and its
areas from the table, each area's files listed with `git ls-files` (no tests). Record the
skill's report verbatim, `trace.py --survey` output included.

STOP. I read every material file under `siegard-survey/<slug>/`.

## Step 3 — the analysis

Invoke `/siegard:analyse` with the material files as the material and the project root. It
writes `siegard-survey/<slug>/ledger.md` and runs `trace.py --ledger`. Record the report, the
decision-log entries, the watch items, the validator's output and `--ledger`'s output verbatim.
Where `--ledger` refused, record what the analysis did about each fact line before it passed.

STOP. I review `git diff -- specification` and commit it with pathspec
`specification siegard-survey/<slug>`.

## Step 4 — the adoption

Invoke `/siegard:reconcile` as an adoption: slug `<slug>`, ledger `siegard-survey/<slug>/ledger.md`,
outside as the table says for the context (none unless listed), certifications none unless I
name them in the invocation. Record: the staging line verbatim (candidates from the ledger,
pairs, at most on one file), the size in bytes of every node pack, every judge return the fold
refused and why, the number of judges run, the skill's report verbatim.

## Step 5 — what it shows

```
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/<slug>.md
python3 -B $P/bin/trace.py --owed backend
python3 -B $P/bin/trace.py --untraced backend
python3 -B $P/bin/trace.py --convergence backend specification siegard-work
python3 -B $P/bin/trace.py --check backend
```

Count from the record: cleared; `contradicts`, `unstated`, `restates`; `unheld`. For each
`unheld` and each `unstated`: survey gap (which area), analysis drop (the ledger line that left
it out, and its reason), or fact outside the areas. Tokens: `telemetry.py --probe --since <start>`,
announce, run; record per surveyor, the analysis, per judge, and the mean per judged file.

## Step 6 — stop

Stop and ask me to review and commit with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/<slug> siegard-telemetry`.
