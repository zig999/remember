# Runbook — adopt one frontend context, by the current route

Derived from `RUNBOOK-adopt-context.md`, with `backend` replaced by `frontend`. Plugin siegard
**4.28.0** or later; `P` is the installed plugin root
(`~/.claude/plugins/cache/siegard-generator/siegard/5.2.0`). The human names the context in the
invocation. Record every command, its verbatim output and every decision in
`siegard-survey/<slug>/RESULTS.md`. Commit only at a STOP, with the pathspec the STOP names.

**Precondition of the whole runbook:** `siegard.json` declares `targets.frontend`,
`tests.frontend` and `standard.frontend` (setup stage, `/siegard-config` and `/siegard-standard`,
both reserved to the human). `trace.py --area` and `--untraced` do not work on `frontend` until
then.

Contexts and areas, spelled from `frontend/` (tests, `*.stories.tsx` and the MSW fixture
`src/features/curation/api/__tests__/handlers.ts` are certification material, never an area):

| context | slug | areas |
|---|---|---|
| auth (pilot) | `adopt-fe-auth` | `auth` = `src/features/auth/` |
| ingest | `adopt-fe-ingest` | `boundary` = `src/features/ingest/api/`; `ui` = `components/`, `hooks/`, `state/`, `types.ts` under `src/features/ingest/` |
| curation | `adopt-fe-curation` | `boundary` = `api/`; `logic` = `lib/`, `state/`, `hooks/`, `types.ts`; `ui` = `components/` (all under `src/features/curation/`) |
| chat | `adopt-fe-chat` | `boundary` = `api/`; `ui` = every other non-test directory and file under `src/features/chat/` |
| graph | `adopt-fe-graph` | `boundary` = `api/`; `logic` = `lib/`, `state/`, `hooks/`, `types.ts`, `index.ts`; `ui` = `components/` (all under `src/features/graph/`) |
| shared (last) | `adopt-fe-shared` | `transport` = `src/lib/http.ts`, `error-routing.ts`, `report-error.ts`, `env.ts`, `query-client.ts`; `shell` = `src/shell/`, `src/router/`, `src/state/`; `ds` = `src/components/ds/`, `src/components/ui/`, `src/styles/`, `src/lib/tokens.ts`, `motion.ts`, `cn.ts`; outside: `src/features/history/*`, `src/features/search/*`, `src/main.tsx`, `src/vite-env.d.ts`, `src/presentation/`, `.storybook/`, `eslint-rules/`, `docs/`, `public/`, `vendor/ui-kit`, and every tracked file at the frontend root (`package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `postcss.config.js`, `eslint.config.js`, `index.html`, `.env.example`, `.gitignore` — configuration, not domain) |

Order: auth, ingest, curation, chat, graph, shared. `auth` is the pilot: a defect it shows is
fixed in this file, and committed, before `ingest` pays for it.

## Policies the survey and the analysis receive as instruction

**P1 — interface text.** The criterion is the framework's: if the text alters what a person
using the system can learn or do, it is a domain fact and is surveyed and held by a node; if it
only names a control and keeps it doing the same thing, it is surface and is not surveyed.

| category | decision |
|---|---|
| refusal or failure message the user reads (`error-routing.ts` messages, inline-empty, inline-gone, boundary, `toast.error`) | fact |
| the mapping from a BFF error code to a UI action (redirect, toast, set-error, silent) | fact |
| label of a closed vocabulary state (confidence, curation queue, effective status) | fact |
| outcome notice after an action (`toast.success`, `toast.info`) | fact |
| empty-state text | fact where it tells the owner what to do next; surface otherwise |
| button, column, tab, menu and heading labels; tooltips; placeholders | surface |
| colours, spacing, icons, motion | surface |

This table is the owner's to approve before the pilot's analysis. Until approved it stays a
proposal.

P1 divergence found in the pilot: a judge reads any text the code emits that no node holds as
`unstated`, including a control label the table above calls surface. Decision pending with the
owner: either such labels stay surface and the `unstated` is accepted as a residue, or they get
a home.

**P2 — reuse of held nodes.** Facts the frontend restates from the backend (confidence bands,
curation states, error codes, the `{ok,result,error}` envelope) bind to the nodes that already
hold them under `specification/`. The analysis never creates a node that duplicates one. Hand
the `spec.py --digest` output to every surveyor and to the analysis as a file path.

## Practices carried from the backend adoption

- Copy each subagent return by script from the last assistant message in the agent's
  `tasks/<id>.output` JSONL, strip the outer fence, validate with `jsonschema` against
  `schemas/survey.json` or `schemas/conformance-return.json`. Never retype a return.
- Surveyor prompts: give the names a caller reads (keys, paths, verbs); `read_outside_area`
  items must parse as YAML strings, so no unquoted `": "`.
- Judge prompts: "only the keys the contract defines at every depth"; every multi-line value as a
  `|-` block with every line indented at least as deep as the first; "no code fence around the
  return" (in the pilot three of four judges fenced it anyway: strip only the outer fence by
  script after `--save-return`, before `--fold`, and record it).
- Ledger: land each rule on every line that states its fact; a rule gets a judge only on the
  files whose fact lines the ledger landed on it.

## Step 1 — preconditions

```
grep '"version"' $P/.claude-plugin/plugin.json
git status --porcelain -- specification frontend siegard-trace.json siegard-reconcile siegard.json
python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
python3 -B $P/bin/trace.py --untraced frontend
python3 -B $P/bin/spec.py specification
```

Version 4.28.0 or later; `git status` prints nothing; the specification is sound. Otherwise
stop. Record the `--untraced` line and the start instant.

## Step 2 — the survey

Invoke `/siegard:survey` with the project root, target `frontend`, the context's slug, and its
areas from the table, each area's files listed by `trace.py --area frontend <paths>`. Record the
skill's report verbatim, `trace.py --survey` output included.

STOP. The owner reads every material file under `siegard-survey/<slug>/`.

## Step 3 — the analysis

Invoke `/siegard:analyse` with the material files as the material and the project root, with
policies P1 and P2. It writes `siegard-survey/<slug>/ledger.md` and runs `trace.py --ledger`.
Record the report, the decision-log entries, the watch items, the validator's output and
`--ledger`'s output verbatim.

STOP. The owner reviews `git diff -- specification` and commits it with pathspec
`specification siegard-survey/<slug>`.

## Step 4 — the adoption

Invoke `/siegard:reconcile` as an adoption: slug `<slug>`, ledger
`siegard-survey/<slug>/ledger.md`, outside as the table says (none unless listed),
certifications none unless named. Record the staging line verbatim, the size in bytes of every
node pack, every judge return the fold refused and why, the number of judges run, and the
skill's report verbatim.

## Step 5 — what it shows

```
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/<slug>.md
python3 -B $P/bin/trace.py --owed frontend
python3 -B $P/bin/trace.py --untraced frontend
python3 -B $P/bin/trace.py --convergence frontend specification siegard-work
python3 -B $P/bin/trace.py --check frontend
```

Count from the record: cleared; `contradicts`, `unstated`, `restates`; `unheld`. Classify each
`unheld` and `unstated` as survey gap (which area), analysis drop (ledger line and reason), or
fact outside the areas. Tokens: `telemetry.py --probe --since <start>`, announce, run.

## Step 6 — stop

Stop for the owner to review and commit with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/<slug> siegard-telemetry`.
