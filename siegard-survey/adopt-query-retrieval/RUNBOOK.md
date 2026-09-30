# Runbook — adoption step 6, context `query-retrieval`

The first real adoption: `/siegard:reconcile` as an adoption over the 15 source files the pilot
surveyed, in this repository, not in a clone. Plugin: siegard **4.19.0** or later.

Write every measurement to `siegard-survey/adopt-query-retrieval/RESULTS.md`, one section per
step, with the exact commands run and their verbatim output. Never report a step not run. Stop
where this runbook says stop.

## Inputs, named here by the human

- **project root:** `/home/siegfriedneto/projects/eternal`
- **target:** `backend`
- **slug:** `adopt-query-retrieval`
- **mode:** adoption
- **candidates:** every identity in `siegard-survey/adopt-query-retrieval/candidates.txt` (84
  nodes — every node of the specification except the decision log and the context descriptor)
- **outside:** none
- **certifications:** none in this step
- **file set** (spelled from `backend/`):

```
src/modules/query-retrieval/index.ts
src/modules/query-retrieval/routes/query-retrieval.routes.ts
src/modules/query-retrieval/dto/search.dto.ts
src/modules/query-retrieval/dto/fragment.dto.ts
src/modules/query-retrieval/dto/response.dto.ts
src/modules/query-retrieval/service/errors.ts
src/modules/query-retrieval/service/search.service.ts
src/modules/query-retrieval/service/provenance.service.ts
src/modules/query-retrieval/service/accepted-fragments.service.ts
src/modules/query-retrieval/repository/search.repository.ts
src/modules/query-retrieval/repository/provenance.repository.ts
src/modules/query-retrieval/repository/accepted-fragments.repository.ts
src/modules/query-retrieval/repository/fts-config.ts
src/modules/query-retrieval/repository/scoring.ts
src/modules/query-retrieval/mcp/query-toolset.ts
```

## Step 1 — preconditions

`--convergence` refuses a work root that does not exist, and this project has no initiative yet,
so create the empty directory first (git does not track an empty directory; nothing is added):

```
mkdir -p siegard-work
```

Record each output:

```
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/project.py /home/siegfriedneto/projects/eternal
grep '"version"' ${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json
git status --porcelain -- specification backend siegard-trace.json siegard-reconcile
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --untraced backend
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --convergence backend specification siegard-work
```

The version must be 4.19.0 or later, and `git status` must print nothing. Otherwise stop and
report. Record the start instant (ISO-8601, UTC).

## Step 2 — the adoption

Invoke `/siegard:reconcile` with the inputs above, as an adoption. It stages with `--adopt`,
spawns one judge per file, folds, validates the record and binds. Follow the skill as written;
this runbook adds nothing to it.

When the judges return, before the fold, record per file: the return's size in bytes, whether it
parsed, and whether the fold refused it. Every refused return is re-delegated as the skill says;
record how many judges ran in total.

Record the skill's report verbatim, and the end instant.

## Step 3 — what the adoption bound

```
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval.md
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --untraced backend
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --convergence backend specification siegard-work
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --owed backend
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --check backend
```

Then, from the record, count and record: candidates cleared; candidates not cleared, split into
held by no file, contradicted, and tainted; `unstated` findings; and for each candidate held by
no file, one line saying whether the node is wrong or the fact lives outside the 15 files.
Compare with the pilot's RESULTS.md step 4, where the same files held all 69 nodes of the first
increment: name every node the pilot found held and this adoption did not clear.

## Step 4 — tokens

```
python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/telemetry.py --probe --since <step 1 start instant> /home/siegfriedneto/projects/eternal
```

Announce the read, then run it without `--probe`. The report is `siegard-telemetry/6`, which
counts each message once. Record per judge delegation input + cache-creation + output and tool
calls, the total, the mean per file, and the orchestrating session's own usage.

## Step 5 — stop

Stop and ask the human to review and commit, as one commit with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-query-retrieval siegard-telemetry`.
Record the commit id once they have.
