import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";

import { EnvelopeError } from "@/lib/http";
import { entityEdit } from "./_edit-request";
import { toEditAccepted, toEntityEditWire } from "./_transforms";
import { entityKeys } from "./keys";
import type { EditFailure, EditOutcome, EditVariables } from "../types";

const CONFLICT_CODE = "BUSINESS_ENTITY_EDIT_CONFLICT";
const SESSION_ENDED_CODE = "AUTH_SESSION_EXPIRED";
const UNREACHABLE_CODES: readonly string[] = [
  "SYSTEM_NETWORK",
  "SYSTEM_TIMEOUT",
  "SYSTEM_ABORTED",
];

function conflictFacts(details: unknown): {
  attributeKey: string | null;
  itemId: string | null;
} {
  const named: { attribute_key?: unknown; item_id?: unknown } =
    typeof details === "object" && details !== null
      ? (details as { attribute_key?: unknown; item_id?: unknown })
      : {};
  return {
    attributeKey:
      typeof named.attribute_key === "string" ? named.attribute_key : null,
    itemId: typeof named.item_id === "string" ? named.item_id : null,
  };
}

function toFailureOutcome(error: EnvelopeError): EditOutcome {
  if (error.code === CONFLICT_CODE) {
    return { kind: "conflict", ...conflictFacts(error.details) };
  }
  if (error.code === SESSION_ENDED_CODE) return { kind: "session-ended" };
  const failure: EditFailure = {
    code: error.code,
    status: error.httpStatus,
    message: error.message,
    details: error.details,
  };
  return UNREACHABLE_CODES.includes(error.code)
    ? { kind: "unreachable", failure }
    : { kind: "refused", failure };
}

export function useEditEntity(): UseMutationResult<
  EditOutcome,
  Error,
  EditVariables
> {
  const queryClient = useQueryClient();
  return useMutation<EditOutcome, Error, EditVariables>({
    mutationFn: async ({ nodeId, edit, signal }) => {
      try {
        return toEditAccepted(
          await entityEdit(nodeId, toEntityEditWire(edit), signal),
        );
      } catch (error) {
        if (error instanceof EnvelopeError) return toFailureOutcome(error);
        throw error;
      }
    },
    onSuccess: async (outcome, { nodeId }) => {
      if (outcome.kind === "accepted") {
        await queryClient.invalidateQueries({
          queryKey: entityKeys.node(nodeId),
        });
      }
    },
  });
}
