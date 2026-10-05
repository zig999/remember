import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import {
  toIngestRawInformationResult,
  type IngestRawInformationResponseWire,
  type IngestRawInformationResult,
  type SourceTypeWire,
} from "./_transforms";

export interface UseIngestRawInformationVariables {
  readonly source_type: SourceTypeWire;
  readonly content: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly metadata?: Record<string, unknown>;
}

export function useIngestRawInformation(): UseMutationResult<
  IngestRawInformationResult,
  Error,
  UseIngestRawInformationVariables
> {
  return useMutation({
    mutationFn: async (vars) => {
      const wire = await httpIngest<IngestRawInformationResponseWire>(
        "/api/v1/ingest/raw-information",
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(vars),
        },
      );
      return toIngestRawInformationResult(wire);
    },
  });
}
