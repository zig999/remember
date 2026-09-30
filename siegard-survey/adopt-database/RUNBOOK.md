# Runbook — `migrations/` as a second target, adopted

The database schema holds domain facts no TypeScript file does — CHECK bounds, UNIQUE keys that
carry idempotency, closed enumerations, the merged-node CHECK — and `migrations/` sits outside
the `backend` target, so none of them can be bound today. This runbook declares `migrations/` as
a second target, `database`, and adopts it. Nothing in Siegard changes for it; it is this
project's configuration.

Plugin: siegard **4.27.0** or later: `/siegard:survey` reads the area, `/siegard:analyse`
writes the ledger, and the adoption reads the ledger for each file's candidates. `P` is the installed plugin root. Record
every command, its verbatim output and every decision in
`siegard-survey/adopt-database/RESULTS.md`. Never commit; stop where this runbook says stop.

**Do not start while `siegard-survey/adopt-ingestion/RUNBOOK.md` is unfinished or uncommitted.**

## Decisions already taken, by the human

- `migrations/` becomes the target `database`; its standard is `null` for now.
- The migrations already applied are **not edited**, comments included: editing an applied
  migration rewrites the schema's history. A comment the judges report stays, listed in
  `--owed`; it leaves only if a later migration or the project decides otherwise.
- Kept out of the judgment: `migrations/ops/` (operational truncation scripts),
  `migrations/backup/` (a dump derived from the migrations, and its script and README).

## Step 1 — preconditions

```
grep '"version"' $P/.claude-plugin/plugin.json
git status --porcelain -- specification backend migrations siegard-trace.json siegard-reconcile siegard.json
git ls-files migrations
```

Version 4.23.0 or later; `git status` prints nothing. Otherwise stop and report.

## Step 2 — declare the target

STOP and ask me to run `/siegard:siegard-config` adding the target `database` = `migrations`
and `standard.database` = `null`. After I commit `siegard.json`, run
`python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal` and record that both targets
resolve, then `python3 -B $P/bin/trace.py --untraced migrations`.

## Step 3 — the survey

Invoke `/siegard:survey` with the project root, target `database`, slug `adopt-database`, and
one area, `schema`: every `.sql` file `git ls-files` lists under `migrations/` except `ops/` and
`backup/`. Add to the invocation, for the surveyor, verbatim:

> SQL comments are text: a `--` or `/* */` comment is never evidence, however precisely it
> states a rule. Read the DDL: the column, its type, its CHECK, its UNIQUE, its DEFAULT, the
> enumeration's values, the foreign key and its ON DELETE, the index predicate, the view's query.
> Seed rows that populate a catalog — link types, attribute keys — are facts: list each row.

The material lands at `siegard-survey/adopt-database/schema.md`. Record the skill's report.

STOP. I read the material.

## Step 4 — the analysis

Invoke `/siegard:analyse` with that material and the project root. It writes
`siegard-survey/adopt-database/ledger.md` and runs `trace.py --ledger`; record the report and
the ledger's counts verbatim.

STOP. I review `git diff -- specification` and commit it.

## Step 5 — the adoption

Invoke `/siegard:reconcile` as an adoption:

- **target:** `database`
- **slug:** `adopt-database`
- **ledger:** `siegard-survey/adopt-database/ledger.md` — the file set and each file's
  candidates come from it
- **outside:** every tracked file under `ops/` and `backup/`
- **certifications:** none — this target runs no step

Record the report verbatim, the pack size, every refused return, and the judges run.

## Step 6 — what it shows

```
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-database.md
python3 -B $P/bin/trace.py --untraced migrations
python3 -B $P/bin/trace.py --owed migrations
python3 -B $P/bin/trace.py --convergence backend specification siegard-work
python3 -B $P/bin/trace.py --check migrations
```

Count: candidates cleared; `unheld`; `contradicts`, `unstated`, `restates`. Name every node now
bound in both targets — a fact the schema and the code both hold — and every `contradicts` where
the schema and a node disagree, with the two statements quoted. Tokens as in the ingestion
runbook.

## Step 7 — stop

Stop and ask me to review and commit, with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-database siegard-telemetry`.
