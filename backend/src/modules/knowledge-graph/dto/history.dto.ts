// Read DTOs for lineage-chain history (UC-09, UC-10, UC-11).
//
// Mirrors `openapi.yaml` components.schemas.LinkHistoryResponse and
// components.schemas.AttributeHistoryResponse. Each entry is a full
// `LinkDetail` / `AttributeDetail`, allowing the caller to distinguish
// successions (6.5-A) from corrections (6.5-B) by inspecting both axes.

import { z } from "zod";

import { AttributeDetailResponseSchema } from "./attribute.dto.js";
import { LinkDetailResponseSchema } from "./link.dto.js";

export const LinkHistoryEntrySchema = LinkDetailResponseSchema;
export type LinkHistoryEntry = z.infer<typeof LinkHistoryEntrySchema>;

export const AttributeHistoryEntrySchema = AttributeDetailResponseSchema;
export type AttributeHistoryEntry = z.infer<typeof AttributeHistoryEntrySchema>;

export const LinkHistoryResponseSchema = z.object({
  versions: z.array(LinkHistoryEntrySchema),
});
export type LinkHistoryResponse = z.infer<typeof LinkHistoryResponseSchema>;

export const AttributeHistoryResponseSchema = z.object({
  versions: z.array(AttributeHistoryEntrySchema),
});
export type AttributeHistoryResponse = z.infer<
  typeof AttributeHistoryResponseSchema
>;
