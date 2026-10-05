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

  const assembly = useIngestGraphAssembly({
    affectedNodes: assemblyEnabled ? affectedNodes : null,
    enabled: assemblyEnabled,
  });
  void assembly;

  const graphStatus = useGraphStore((s) => s.status);

  useEffect(() => {
    setPhase((current) => {
      if (current !== "idle" && current !== "ready") return current;
      const isReady = content.length >= 1 && sourceType !== "";
      return isReady ? "ready" : "idle";
    });
  }, [content, sourceType]);

  useEffect(() => {
    if (phase === "revealing" && graphStatus === "ready") {
      setPhase("complete");
    }
  }, [phase, graphStatus]);

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

  const handleAssembleExisting = useCallback(() => {
    setAssemblyEnabled(true);
    setPhase("revealing");
  }, []);

  const handleRetry = useCallback(() => {
    if (llmRunId === null) {
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
