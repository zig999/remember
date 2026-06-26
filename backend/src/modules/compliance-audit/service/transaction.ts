// Transaction wrapper for the compliance-audit write endpoint (UC-01, BR-02).
//
// The implementation now lives in `shared/pg-transaction.ts` (single source for
// every module). Re-exported here so the existing import path keeps working.

export { withTransaction } from "../../../shared/pg-transaction.js";
