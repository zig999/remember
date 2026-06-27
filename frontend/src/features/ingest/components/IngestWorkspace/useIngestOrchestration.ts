/**
 * useIngestOrchestration — the async state machine behind `/ingest`.
 *
 * Extracted from `IngestWorkspace.tsx` during dev_tc_005_r1 so the screen
 * component stays ≤ 300 lines (u-fe-standards "Component size" rule). The
 * workspace still owns the form values (`content` / `sourceType`) and the
 * graph-store subscriptions; this hook owns:
 *
 *   - the phase machine (idle → ready → sending → … → complete | error)
 *   - the mutation orchestration (ingest → run → assembly)
 *   - the polling fallback when the LLM connection drops
 *   - the retry path
 *   - the noop "Ver grafo existente" CTA wiring
 *
 * The hook is intentionally not generic — it mirrors `ingest.feature.spec.md
 * §3` one-to-one. Lifting to a `useReducer` is deferred until the spec grows.
 */
import { useCallback, useEffect, useState } from "react";
import { useGraphStore } from "@/features/graph";
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
import type { IngestPhase } from "../IngestPanel";
import { classifyError, isConnectionDropError } from "./_utils";

const INGEST_MODEL = "claude-opus-4-8";
const INGEST_PROMPT_VERSION = "v3";

export interface UseIngestOrchestrationArgs {
  readonly content: string;
  readonly sourceType: IngestSourceType | "";
  readonly resetForm: () => void;
}

export interface UseIngestOrchestrationResult {
  readonly phase: IngestPhase;
  readonly summary: LlmRunSummary | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly validationMessage: string | null;
  readonly handleSubmit: () => void;
  readonly handleAssembleExisting: () => void;
  readonly handleRetry: () => void;
  readonly handleReset: () => void;
}

export function useIngestOrchestration({
  content,
  sourceType,
  resetForm,
}: UseIngestOrchestrationArgs): UseIngestOrchestrationResult {
  const [phase, setPhase] = useState<IngestPhase>("idle");
  const [llmRunId, setLlmRunId] = useState<string | null>(null);
  const [affectedNodes, setAffectedNodes] =
    useState<ReadonlyArray<AffectedNode> | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [assemblyEnabled, setAssemblyEnabled] = useState<boolean>(false);
  const [summary, setSummary] = useState<LlmRunSummary | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

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

  const graphStatus = useGraphStore((s) => s.status);

  // ---- form → phase syncing ------------------------------------------------
  useEffect(() => {
    setPhase((current) => {
      if (current !== "idle" && current !== "ready") return current;
      const isReady = content.length >= 1 && sourceType !== "";
      return isReady ? "ready" : "idle";
    });
  }, [content, sourceType]);

  // ---- effect: revealing → complete ---------------------------------------
  useEffect(() => {
    if (phase === "revealing" && graphStatus === "ready") {
      setPhase("complete");
    }
  }, [phase, graphStatus]);

  // ---- effect: polling settled --------------------------------------------
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
          useGraphStore.getState().setStatus("loading");

          if (data.outcome === "noop_existing") {
            setAffectedNodes(data.affectedNodes ?? []);
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
    resetForm();
    setLlmRunId(null);
    setAffectedNodes(null);
    setIsPolling(false);
    setAssemblyEnabled(false);
    setSummary(null);
    setErrorCode(null);
    setErrorMessage(null);
    setValidationMessage(null);
    setPhase("idle");
    useGraphStore.getState().clear();
  }, [resetForm]);

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

  return {
    phase,
    summary,
    errorCode,
    errorMessage,
    validationMessage,
    handleSubmit,
    handleAssembleExisting,
    handleRetry,
    handleReset,
  };
}
