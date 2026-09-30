# Runbook — re-fold the adoption under reconcile/7

The adoption of step 6 was folded under `siegard-reconcile/6`, which named every judged file
under a non-cleared candidate: `--owed` read 465 open findings where the judges found 26.
Siegard 4.20.0 (`reconcile/7`) lists an unheld candidate apart and names under `observed_at` only
the files a finding was read in. Nothing of step 6 was committed, and the 17 judge returns are
saved, so the record is folded again from the same returns: **no judge runs**.

Plugin: siegard **4.20.0** or later. `P` below is its installed root
(`~/.claude/plugins/cache/siegard-generator/siegard/<version>`). Append every command and its
verbatim output to `siegard-survey/adopt-query-retrieval/RESULTS.md` under a new heading
`## Re-fold under reconcile/7`. Stop where this runbook says stop.

## Step 1 — preconditions

```
grep '"version"' $P/.claude-plugin/plugin.json
git status --porcelain -- specification backend
ls siegard-reconcile/adopt-query-retrieval.returns | wc -l
```

The version must be 4.20.0 or later, `git status` must print nothing for those two paths, and
the returns directory must hold 15 files. Otherwise stop and report.

## Step 2 — discard what the /6 fold wrote

Both are untracked and derived; the returns they were folded from stay.

```
rm siegard-trace.json siegard-reconcile/adopt-query-retrieval.md
```

## Step 3 — stage under a new slug and move the returns in

The slug `adopt-query-retrieval` is taken by its returns directory, and `--stage` refuses a taken
slug. Stage `adopt-query-retrieval-r2` with the same file set and candidates, then move — not
copy — the 15 returns into the directory the staging created, so one copy of the evidence
survives:

```
WS=/tmp/adopt-qr-r2; rm -rf "$WS"
FILES=$(sed -n '/^```$/,/^```$/p' siegard-survey/adopt-query-retrieval/RUNBOOK.md | grep '^src/')
NODES=$(sed 's/^/--node /' siegard-survey/adopt-query-retrieval/candidates.txt)
python3 -B $P/bin/trace.py --stage backend specification adopt-query-retrieval-r2 "$WS" \
  $FILES --adopt $NODES
mv siegard-reconcile/adopt-query-retrieval.returns/*.yaml siegard-reconcile/adopt-query-retrieval-r2.returns/
rmdir siegard-reconcile/adopt-query-retrieval.returns
```

## Step 4 — fold, validate, bind

In the same command block as step 3's `WS`, or spell the path:

```
python3 -B $P/bin/trace.py --fold backend /tmp/adopt-qr-r2 \
  siegard-survey/adopt-query-retrieval/premise.yaml siegard-reconcile/adopt-query-retrieval-r2.md
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval-r2.md
python3 -B $P/bin/trace.py --bind-record backend specification \
  siegard-reconcile/adopt-query-retrieval-r2.md --workspace /tmp/adopt-qr-r2
```

Expected, from a dry run of the same returns: 53 cleared, 21 not, 10 under `unheld`; 53
bindings written.

## Step 5 — read the result

```
python3 -B $P/bin/trace.py --owed backend
python3 -B $P/bin/trace.py --untraced backend
python3 -B $P/bin/trace.py --convergence backend specification siegard-work
python3 -B $P/bin/trace.py --check backend
```

Expected: `--owed` 26 findings, 11 unstated; `--untraced` 14 bound, 1 holds-nothing.

## Step 6 — stop

Stop and ask the human to review and commit, as one commit with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-query-retrieval siegard-telemetry`.
