import { EnvelopeError } from "@/lib/http";

export type NodeFailure = "not-found" | "deleted" | "other";

export const NODE_NOT_HELD_CODE = "RESOURCE_NOT_FOUND";

export const NODE_DELETED_CODE = "BUSINESS_NODE_DELETED";

export const ACTIVE_NODE_STATUS = "active";

export function classifyNodeFailure(error: unknown): NodeFailure {
  if (error instanceof EnvelopeError) {
    if (error.code === NODE_NOT_HELD_CODE) return "not-found";
    if (error.code === NODE_DELETED_CODE) return "deleted";
  }
  return "other";
}
