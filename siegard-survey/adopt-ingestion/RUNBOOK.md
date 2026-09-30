# Runbook — adopt `ingestion`, surveyed by the prototype domain-surveyor

Steps 7 and 8 of the adoption plan together: the context `ingestion` (49 source files, ~10.9k
lines, 40 test files) is surveyed by the prototype agent in `domain-surveyor.md`, analysed, and
adopted with certifications. It measures what the query-retrieval adoption could not: how the
candidate pack grows with the specification, a surveyor's material against the hand-written one,
and the first real `--certify`.

Plugin: siegard **4.21.3** or later for step 5 (the judges); steps 1–4 run on 4.21.2. `P` is the
installed plugin root. Record every command, its verbatim output and every decision in
`siegard-survey/adopt-ingestion/RESULTS.md`. Never commit; stop where this runbook says stop.

## Step 1 — preconditions

```
grep '"version"' $P/.claude-plugin/plugin.json
git status --porcelain -- specification backend siegard-trace.json siegard-reconcile siegard.json
python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
python3 -B $P/bin/trace.py --untraced backend
```

`git status` must print nothing and `project.py` must show `standard backend:` pointing at
`standards/backend-node-service.yaml`. Otherwise stop and report. Record the start instant.

## Step 2 — the survey

Four areas, spelled from `backend/`:

- **A — services:** every file under `src/modules/ingestion/service/`, plus
  `src/modules/ingestion/hash.ts` and `src/modules/ingestion/index.ts`.
- **B — transports:** every file under `src/modules/ingestion/mcp/` (not its `__tests__/`),
  `src/modules/ingestion/routes/ingestion.routes.ts`, `src/modules/ingestion/catalog/catalog.ts`.
- **C — input and validation:** every file under `src/modules/ingestion/dto/` and
  `src/modules/ingestion/validation/`.
- **D — extraction and storage:** every file under `src/modules/ingestion/prompts/`,
  `src/modules/ingestion/repository/` and `src/modules/ingestion/chunker/`.

List each area's files explicitly with `git ls-files` (no `*.spec.ts`, no `__tests__/`) and record
the four lists. The four together must be the 49 files; say so.

Spawn four `general-purpose` subagents together, model opus, one per area. Hand each, verbatim:
the whole text of `siegard-survey/adopt-ingestion/domain-surveyor.md` as its instructions; the
target source root `/home/siegfriedneto/projects/eternal/backend`; its area's file list; and, as
"the context so far", the output of `python3 -B $P/bin/spec.py --digest specification`. Tell each
it may use only Read, Grep and Glob, and returns text only.

Save each return verbatim as `siegard-survey/adopt-ingestion/material/<A|B|C|D>.md`. Check each
has the frontmatter and the six sections, and that its `files` equals its area; a return that
fails is re-delegated once with the problem named — record it. Record the instant each returned.

STOP. I read the four material files before any analysis.

## Step 3 — the analysis

Invoke `/siegard:analyse` with the four material files as the material and the project root.
Record the report: nodes created, changed and removed, apart; every decision-log entry; watch
items; the validator's final output. Write the identities of the nodes created and changed to
`siegard-survey/adopt-ingestion/candidates.txt`, one per line (no `_context`, no decision log).

STOP. I review `git diff -- specification` and commit it.

## Step 4 — the certifications

Capture the one step a certification is answered by. The registry's `suite` line also runs
`lint` and `secret-scan`, whose scripts do not exist yet (group A, phase 2), so it would stop
before `test`; capture `install` and `test` alone:

```
python3 -B $P/bin/run.py siegard-delivery/adopt-ingestion --run baseline --cwd backend \
  --timeout-seconds 2400 --step 'install=npm ci' --step 'test=npm test'
```

Record the outcome per step. If `test` does not pass — the integration tests need a database —
record why and propose no certification: the adoption runs without.

If it passes: read the 40 ingestion test files and propose, per candidate node, the test file(s)
that would fail if that node's fact stopped holding, in the format `/siegard:reconcile` takes
(node, proof, step `test`). Propose only where the test asserts the node's own condition. Write
the proposal to `siegard-survey/adopt-ingestion/certify.yaml`.

STOP. I edit and approve that file; the certifications are mine to name.

## Step 5 — the adoption (plugin 4.21.3 or later)

Invoke `/siegard:reconcile` as an adoption:

- **slug:** `adopt-ingestion`
- **file set:** the 49 files of step 2
- **candidates:** every identity in `candidates.txt`
- **outside:** none
- **certifications:** `siegard-survey/adopt-ingestion/certify.yaml`, if step 4 produced one

Record: the size in bytes of each node pack and the number of candidates in it; every judge
return the fold refused and why; the number of judges run in total; the skill's report verbatim.

## Step 6 — what it shows

```
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-ingestion.md
python3 -B $P/bin/trace.py --owed backend
python3 -B $P/bin/trace.py --untraced backend
python3 -B $P/bin/trace.py --convergence backend specification siegard-work
python3 -B $P/bin/trace.py --check backend
```

Then, from the record, count: candidates cleared; certified; `contradicts`, `unstated`,
`restates`; `unheld`. For each `unheld` and each `unstated`, one line: survey gap, analysis
misread, or fact outside the 49 files — and for survey gaps, which area's material missed it.

Tokens: `telemetry.py --probe --since <step 1 start>`, announce, run. Record separately: the four
surveyors; the analysis; the judges (per judge and mean per file); the auditors; the
orchestrating session.

## Step 7 — stop

Stop and ask me to review and commit, with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-ingestion siegard-telemetry siegard-delivery`.
