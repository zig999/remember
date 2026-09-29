# Pilot runbook — adoption Phase 0, context `query-retrieval`

Run in a Claude Code session opened at `/home/siegfriedneto/projects/eternal`, where the
`siegard` plugin 4.17.0 is installed at project scope. `$P` below is the plugin root the session
resolves as `${CLAUDE_PLUGIN_ROOT}`
(`/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.17.0`).

What this pilot measures (plan: `siegard2/temp/20260929-adoption-plan.md`, §6):
(a) tokens per judged file; (b) wrong attributions; (c) candidate pack size; (d) material shape;
(e) nodes the documentation changes. Nothing here is adoption: no fold, no bind in this
repository.

Write every measurement to `siegard-survey/pilot-query-retrieval/RESULTS.md`, one section per
step, with the exact commands run and their verbatim output. Never report a step not run.

## Step 1 — declare the project

Invoke `/siegard:siegard-config` with these values:

- `specification_root`: `specification`
- `targets`: `{ "backend": "backend" }`
- `work_root`: `siegard-work`
- `delivery_root`: `siegard-delivery`
- `telemetry_root`: `siegard-telemetry`
- `standard`: `{ "backend": null }`

Then stop and ask the human to commit `siegard.json` together with
`siegard-survey/pilot-query-retrieval/` (the material and this runbook). Record the commit id.

## Step 2 — first increment, source alone

Record the start instant (ISO-8601, UTC) in RESULTS.md.

Invoke `/siegard:analyse` with:

- material: `siegard-survey/pilot-query-retrieval/query-retrieval.md` — only this file; no
  documentation, no other path;
- project root: `/home/siegfriedneto/projects/eternal`.

Record in RESULTS.md: the node list the report prints (created), the count per class, every
decision-log entry by location, the watch items, and the validator's final output verbatim.
Record the end instant. Then stop and ask the human to review `git diff -- specification` and
commit it. Record the commit id.

## Step 3 — judges over the source, in a disposable clone

Never in this repository. The trace this step needs does not exist here, and `--stage` refuses
without one (`trace.py`, the `no trace file` stop).

```
rm -rf /tmp/eternal-pilot
git clone -q /home/siegfriedneto/projects/eternal /tmp/eternal-pilot
cd /tmp/eternal-pilot
```

Create the trace with one binding, only to satisfy `--stage`: take the first node of step 2's
list whose class is a Rule, and one file of the set where its fact is plainly held.

```
python3 -B $P/bin/trace.py --bind backend specification <that-node> <that-file>
git add siegard-trace.json && git commit -qm "pilot: seed trace (disposable)"
```

Record the node and the file chosen. Then stage every source file of the context against every
node step 2 wrote. `<nodes>` is `--node <id>` once per node of step 2's list; the files are the
15 under `files:` in the material, spelled from `backend/`:

```
WS=/tmp/eternal-pilot-ws; rm -rf "$WS"; mkdir -p "$WS"
python3 -B $P/bin/trace.py --stage backend specification pilot-qr "$WS" \
  src/modules/query-retrieval/index.ts \
  src/modules/query-retrieval/routes/query-retrieval.routes.ts \
  src/modules/query-retrieval/dto/search.dto.ts \
  src/modules/query-retrieval/dto/fragment.dto.ts \
  src/modules/query-retrieval/dto/response.dto.ts \
  src/modules/query-retrieval/service/errors.ts \
  src/modules/query-retrieval/service/search.service.ts \
  src/modules/query-retrieval/service/provenance.service.ts \
  src/modules/query-retrieval/service/accepted-fragments.service.ts \
  src/modules/query-retrieval/repository/search.repository.ts \
  src/modules/query-retrieval/repository/provenance.repository.ts \
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts \
  src/modules/query-retrieval/repository/fts-config.ts \
  src/modules/query-retrieval/repository/scoring.ts \
  src/modules/query-retrieval/mcp/query-toolset.ts \
  --review <nodes>
```

Record the staging output verbatim and the size in bytes of each node pack in `/tmp/eternal-pilot-ws` (shell variables do not persist between commands; spell the path).

Record the instant, then spawn one `siegard:specification-conformance-reviewer` per file of the
manifest, together, exactly as step 3 ("Judge") of `$P/skills/reconcile/SKILL.md` states the
delegation — file, node pack path, candidate index path, specification root, and
`$P/schemas/conformance-return.json`. Save each return verbatim under
`/tmp/eternal-pilot/siegard-reconcile/pilot-qr.returns/`, named as the manifest names it. Do not
run `--fold`, `--bind-record` or anything after the returns. Record the end instant.

## Step 4 — count the returns

```
python3 - <<'EOF'
import yaml, pathlib, collections
d = pathlib.Path("/tmp/eternal-pilot/siegard-reconcile/pilot-qr.returns")
held = collections.Counter(); nowhere = collections.Counter(); kinds = collections.Counter()
per_file = {}
for p in sorted(d.glob("*")):
    if not p.is_file(): continue
    f = yaml.safe_load(p.read_text())
    h = [r["node"] for r in f.get("read", []) if str(r.get("held_at","")).strip().lower() != "nowhere"]
    for r in f.get("read", []):
        (held if r["node"] in h else nowhere)[r["node"]] += 1
    for x in f.get("findings", []) or []: kinds[x.get("kind")] += 1
    per_file[p.name] = {"held": len(h), "findings": len(f.get("findings") or []),
                        "candidates_opened": len(f.get("candidates_opened") or [])}
never = sorted(n for n in set(held) | set(nowhere) if held[n] == 0)
print("per file:", per_file)
print("findings by kind:", dict(kinds))
print("nodes held in no file:", len(never), never)
print("nodes held in >=1 file:", len([n for n in held if held[n] > 0]))
EOF
```

Record the output verbatim. For each node held in no file, open it and say in one line whether
the material or the analysis misread the code (a wrong node) or the fact lives in a file outside
the 15 (`../migrations/`, another module). That line per node is measurement (b).

## Step 5 — tokens

```
python3 -B $P/bin/telemetry.py --probe /home/siegfriedneto/projects/eternal
```

Announce the read, then run it with `--since <step 2 start instant>`. Record, per judge
delegation, input + cache-creation + output tokens and tool calls, and the totals for step 2
and for step 3 apart. That is measurement (a).

## Step 6 — second increment, documentation

Back in `/home/siegfriedneto/projects/eternal`. Record the start instant.

Invoke `/siegard:analyse` with, as material, only these:

- `remember-modelagem-v7.md` lines 727–797 (§7), 1062–1074 (§11) and 1260–1320 (§14.3);
- `docs/specs/domains/query-retrieval/query-retrieval.spec.md`;
- `docs/specs/domains/query-retrieval/back/query-retrieval.back.md`.

The OpenAPI file is left out: a published surface's routes and schemas stay out of the
specification.

Record: nodes created, changed and removed, apart; every decision-log entry; and, for each
changed node, one line saying whether the documentation corrected the code (the node changed
meaning) or only named it (wording, a term). That is measurement (e). Record the end instant.
Then stop; the human reviews and commits.

## Step 7 — clean up

```
rm -rf /tmp/eternal-pilot /tmp/eternal-pilot-ws
```

Record that it ran. The disposable trace, the seed binding and the returns leave with it; the
returns' counts survive in RESULTS.md.
