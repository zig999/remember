// Transaction wrappers for curation write endpoints (BR-24).
//
// The implementation now lives in `shared/pg-transaction.ts` (single source for
// every module — see that file). Re-exported here so the historical import path
// used by the curation services AND the chat module ("reuse, not redefine",
// chat.back.md §3) keeps working unchanged.

export { withTransaction, withReadOnly } from "../../../shared/pg-transaction.js";
