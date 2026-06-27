/**
 * IngestWorkspace — `/ingest` page-level component (dev_tc_005).
 *
 * Layout (mirrors `ChatWorkspace`):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  IngestPanel (40%)       │  GraphSpace OR NodeDetailPanel    │
 *   │  form + progress/summary │  (60% — toggled by selectedNode)  │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Container-query split: `@container` + `@lg:flex-row` — the exact class
 * strings from `ChatWorkspace` are reused verbatim (TC constraint: copy the
 * pattern, do not invent variants).
 *
 * State machine (`ingest.feature.spec.md §3`):
 *
 *   idle → ready → sending → { extracting | polling | noop | error } →
 *   { complete | revealing → complete | error }
 *
 *   plus the side-mode `node_selected` (right column swap; left column
 *   unaffected, hence the panel phase is unchanged).
 *
 * Why local state (not Zustand): the workspace is a single screen and the
 * state is purely UI orchestration — no other component reads it. The graph
 * store is the only shared sink (it is shared with `/chat`).
 *
 * Why NOT a `useReducer`: the transitions are driven by query/mutation
 * resolution callbacks more than by user actions; a flat `useState` with
 * narrow `onSuccess`/`onError` callbacks reads more clearly than a reducer
 * for this size of machine. If the spec grows we will lift to a reducer.
 *
 * No imports from `features/chat` — only `features/graph` (right column),
 * `features/ingest/api` (the orchestration hooks), and `features/ingest/
 * components` (the left column).
 */
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { cn } from "@/lib/cn";
import {
  GraphSpace,
  NodeDetailPanel,
  useGraphStore,
} from "@/features/graph";
import {
  useIngestGraphAssembly,
  useIngestRawInformation,
  useIngestRunStatus,
  useRetryLlmRun,
  useRunLlmExtraction,
  type AffectedNode,
  type IngestRawInformationResponse,
  type IngestSourceType,
  type LlmRun,
  type LlmRunSummary,
} from "../../api";
import { IngestPanel, type IngestPhase } from "../IngestPanel";
import type { IngestWorkspaceProps } from "./IngestWorkspace.types";
import { EnvelopeError } from "@/lib/http";

const INGEST_MODEL = "claude-opus-4-8";
const INGEST_PROMPT_VERSION = "v3";

/** Map an arbitrary error to a `{ code, message }` pair the panel can show.
 *  Keeps the workspace decoupled from `EnvelopeError` internals when other
 *  code paths surface a generic `Error`. */
function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof EnvelopeError) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    return { code: "SYSTEM_UNKNOWN", message: err.message };
  }
  return { code: "SYSTEM_UNKNOWN", message: "Erro desconhecido." };
}

/** Decide whether a `runLlmExtraction` error counts as a "connection drop"
 *  (transitions to polling silently) or a real error (shows the error
 *  band). Per the TC contract: anything other than 409/422 is treated as a
 *  drop. */
function isConnectionDropError(err: unknown): boolean {
  if (err instanceof EnvelopeError) {
    // Definite server-side rejections — surface as error.
    if (err.httpStatus === 409 || err.httpStatus === 422) return false;
    // Network/timeout — definitely a drop.
    if (err.code === "SYSTEM_NETWORK" || err.code === "SYSTEM_TIMEOUT") {
      return true;
    }
    // 5xx with an LLM_PROVIDER_UNAVAILABLE is a real error band per spec §6.
    if (err.code === "SYSTEM_LLM_PROVIDER_UNAVAILABLE") return false;
    if (err.code === "AUTH_SESSION_EXPIRED") return false; // handled globally
    if (err.code === "SYSTEM_ABORTED") return false; // user-driven, no UI
    // Any other code → treat as drop (graceful degradation per spec §4).
    return true;
  }
  // Non-Envelope errors are unknown ground — be conservative and surface
  // as error so they don't hide silently behind a polling spinner.
  return false;
}

export const IngestWorkspace: FC<IngestWorkspaceProps> = ({ className }) => {
  // ---- form state ---------------------------------------------------------
  const [content, setContent] = useState<string>("");
  const [sourceType, setSourceType] = useState<IngestSourceType | "">("");

  // ---- machine state ------------------------------------------------------
  const [phase, setPhase] = useState<IngestPhase>("idle");
  const [llmRunId, setLlmRunId] = useState<string | null>(null);
  const [affectedNodes, setAffectedNodes] =
    useState<ReadonlyArray<AffectedNode> | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [assemblyEnabled, setAssemblyEnabled] = useState<boolean>(false);
  const [summary, setSummary] = useState<LlmRunSummary | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<
    { id: string; label: string | undefined } | null
  >(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  // ---- mutations / queries ------------------------------------------------
  const ingestMutation = useIngestRawInformation();
  const runMutation = useRunLlmExtraction();
  const retryMutation = useRetryLlmRun();
  const runStatus = useIngestRunStatus({ llmRunId, enabled: isPolling });

  // Assembly drives the graph store directly (calls `replaceNodes` +
  // `setStatus('revealing')` when all traverses settle).
  const assembly = useIngestGraphAssembly({
    affectedNodes: assemblyEnabled ? affectedNodes : null,
    enabled: assemblyEnabled,
  });
  void assembly; // exposed status not consumed by the panel today

  // Subscribe to the graph store so we can derive UI-08 → UI-07. Reading
  // `status` reactively here is correct — when the reveal queue drains and
  // the GraphCanvas flips the store to `'ready'`, this component re-renders
  // and we transition `phase` from `revealing` → `complete`.
  const graphStatus = useGraphStore((s) => s.status);
  const graphErrorMessage = useGraphStore((s) => s.errorMessage);
  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const nodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const links = useMemo(() => Array.from(linksMap.values()), [linksMap]);

  // ---- form → phase syncing ----------------------------------------------
  // Move idle ↔ ready as the form fields change (only while no async work
  // is in flight — once we leave the form view we stay there until reset).
  useEffect(() => {
    setPhase((current) => {
      if (current !== "idle" && current !== "ready") return current;
      const isReady = content.length >= 1 && sourceType !== "";
      return isReady ? "ready" : "idle";
    });
  }, [content, sourceType]);

  // ---- effect: revealing → complete --------------------------------------
  useEffect(() => {
    if (phase === "revealing" && graphStatus === "ready") {
      setPhase("complete");
    }
  }, [phase, graphStatus]);

  // ---- effect: polling settled -------------------------------------------
  useEffect(() => {
    if (!isPolling) return;
    const run: LlmRun | undefined = runStatus.data;
    if (run === undefined) return;
    if (run.status === "completed") {
      setIsPolling(false);
      setSummary(run.summary);
      if (run.affectedNodes !== undefined && run.affectedNodes.length > 0) {
        setAffectedNodes(run.affectedNodes);
      }
      setAssemblyEnabled(true);
      setPhase("revealing");
    } else if (run.status === "failed") {
      setIsPolling(false);
      setErrorCode("RUN_FAILED");
      setErrorMessage(
        "A extração falhou. Reabra a execução para tentar novamente.",
      );
      setPhase("error");
    }
  }, [isPolling, runStatus.data]);

  // ---- submit -------------------------------------------------------------
  const handleSubmit = useCallback(() => {
    if (content.length < 1) {
      setValidationMessage(
        "Cole ou arraste o conteúdo do documento antes de ingerir.",
      );
      return;
    }
    if (sourceType === "") {
      setValidationMessage("Selecione o tipo de fonte antes de ingerir.");
      return;
    }
    setValidationMessage(null);
    setErrorCode(null);
    setErrorMessage(null);
    setPhase("sending");

    ingestMutation.mutate(
      {
        content,
        source_type: sourceType,
        model: INGEST_MODEL,
        prompt_version: INGEST_PROMPT_VERSION,
      },
      {
        onSuccess: (data: IngestRawInformationResponse) => {
          setLlmRunId(data.llmRunId);
          // Mirror ChatWorkspace pattern — touch the graph store via
          // `getState()` so we don't subscribe the workspace to every
          // intra-load mutation.
          useGraphStore.getState().setStatus("loading");

          if (data.outcome === "noop_existing") {
            if (data.affectedNodes !== undefined) {
              setAffectedNodes(data.affectedNodes);
            } else {
              setAffectedNodes([]);
            }
            setPhase("noop");
            return;
          }

          // outcome === "created" — fire extraction immediately.
          setPhase("extracting");
          runMutation.mutate(
            { llm_run_id: data.llmRunId },
            {
              onSuccess: (run) => {
                setSummary(run.summary);
                if (
                  run.affectedNodes !== undefined &&
                  run.affectedNodes.length > 0
                ) {
                  setAffectedNodes(run.affectedNodes);
                }
                setAssemblyEnabled(true);
                setPhase("revealing");
              },
              onError: (err) => {
                if (isConnectionDropError(err)) {
                  // Silent fallback to polling — copy changes; no error band.
                  setIsPolling(true);
                  setPhase("polling");
                  return;
                }
                const { code, message } = classifyError(err);
                setErrorCode(code);
                setErrorMessage(message);
                setPhase("error");
              },
            },
          );
        },
        onError: (err) => {
          const { code, message } = classifyError(err);
          setErrorCode(code);
          setErrorMessage(message);
          setPhase("error");
        },
      },
    );
  }, [content, sourceType, ingestMutation, runMutation]);

  // ---- reset --------------------------------------------------------------
  const handleReset = useCallback(() => {
    setContent("");
    setSourceType("");
    setLlmRunId(null);
    setAffectedNodes(null);
    setIsPolling(false);
    setAssemblyEnabled(false);
    setSummary(null);
    setErrorCode(null);
    setErrorMessage(null);
    setValidationMessage(null);
    setSelectedNode(null);
    setPhase("idle");
    useGraphStore.getState().clear();
  }, []);

  // ---- noop CTA -----------------------------------------------------------
  const handleAssembleExisting = useCallback(() => {
    setAssemblyEnabled(true);
    setPhase("revealing");
  }, []);

  // ---- retry --------------------------------------------------------------
  const handleRetry = useCallback(() => {
    if (llmRunId === null) {
      // Re-submit from the form — same content+source still in state.
      handleSubmit();
      return;
    }
    setErrorCode(null);
    setErrorMessage(null);
    setPhase("extracting");
    retryMutation.mutate(
      { llm_run_id: llmRunId },
      {
        onSuccess: () => {
          runMutation.mutate(
            { llm_run_id: llmRunId },
            {
              onSuccess: (run) => {
                setSummary(run.summary);
                if (
                  run.affectedNodes !== undefined &&
                  run.affectedNodes.length > 0
                ) {
                  setAffectedNodes(run.affectedNodes);
                }
                setAssemblyEnabled(true);
                setPhase("revealing");
              },
              onError: (err) => {
                if (isConnectionDropError(err)) {
                  setIsPolling(true);
                  setPhase("polling");
                  return;
                }
                const { code, message } = classifyError(err);
                setErrorCode(code);
                setErrorMessage(message);
                setPhase("error");
              },
            },
          );
        },
        onError: (err) => {
          const { code, message } = classifyError(err);
          setErrorCode(code);
          setErrorMessage(message);
          setPhase("error");
        },
      },
    );
  }, [llmRunId, retryMutation, runMutation, handleSubmit]);

  // ---- graph node selection ----------------------------------------------
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const node = nodesMap.get(nodeId);
      setSelectedNode({ id: nodeId, label: node?.label });
    },
    [nodesMap],
  );
  const handleDetailClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div
      data-testid="ingest-workspace"
      className={cn("@container min-h-0 w-full flex-1", className)}
    >
      <div className="flex h-full w-full flex-col @lg:flex-row">
        {/* Left column — IngestPanel, 40% at @lg+. */}
        <div className="min-h-0 flex-1 @lg:w-2/5 @lg:flex-none">
          <IngestPanel
            phase={phase}
            content={content}
            sourceType={sourceType}
            {...(validationMessage !== null ? { validationMessage } : {})}
            {...(summary !== null ? { summary } : {})}
            {...(errorMessage !== null ? { errorMessage } : {})}
            {...(errorCode !== null ? { errorCode } : {})}
            onContentChange={setContent}
            onSourceTypeChange={setSourceType}
            onSubmit={handleSubmit}
            onAssembleExisting={handleAssembleExisting}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </div>

        {/* Right column — GraphSpace or NodeDetailPanel, 60% at @lg+. */}
        <div
          data-testid="graph-space-panel"
          className="min-h-0 flex-1 p-lg @lg:w-3/5 @lg:flex-none"
        >
          {selectedNode !== null ? (
            <NodeDetailPanel
              nodeId={selectedNode.id}
              {...(selectedNode.label !== undefined
                ? { nodeLabel: selectedNode.label }
                : {})}
              onClose={handleDetailClose}
            />
          ) : (
            <GraphSpace
              nodes={nodes}
              links={links}
              status={graphStatus}
              {...(graphErrorMessage !== undefined
                ? { errorMessage: graphErrorMessage }
                : {})}
              onNodeSelect={handleNodeSelect}
              revealStaggerMs={90}
            />
          )}
        </div>
      </div>
    </div>
  );
};
