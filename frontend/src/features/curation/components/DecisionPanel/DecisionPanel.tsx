/**
 * DecisionPanel — hero panel for /curadoria (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-02/UI-03/UI-10/UI-11, §3 transitions,
 *    §6 error map, §8 a11y, §10 (qualifies for component.spec.md), §11
 *    (display-mode heuristic in lib/display-mode.ts).
 *
 * Composition:
 *   - Header (StateBadge + scope/name + relative timestamp + EvidenceChip)
 *   - StaleBanner (UI-10, when stale=true)
 *   - ComparePane (UI-03; mode driven by resolveDisplayMode)
 *   - provenanceSlot (caller-provided — usually <ProvenanceTrail /> below)
 *   - ReasonField (always rendered for destructive actions)
 *   - DecisionBar (UI-02 gated by evidenceViewed, UI-03 armed)
 *   - CorrectionForm (UI-11, expands inline; not a modal)
 *
 * Reused in TC-07's CurationDrawer — no store/router dependencies.
 *
 * Server-error projection (§6):
 *   - BUSINESS_REASON_REQUIRED      -> ReasonField highlights + focus.
 *   - BUSINESS_SELF_MERGE_FORBIDDEN -> inline message + ComparePane invalid.
 *   - BUSINESS_TEMPORAL_INCOHERENT  -> forwarded to CorrectionForm.
 *   - BUSINESS_CORRECTION_NO_CHANGES -> forwarded to CorrectionForm.
 *   - Other codes              -> generic inline error banner.
 */
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge";
import { Button } from "@/components/ui/button";
import { ComparePane } from "./ComparePane";
import { DecisionBar, type DecisionBarButtonProps } from "./DecisionBar";
import { EvidenceChip } from "./EvidenceChip";
import { ReasonField, type ReasonFieldHandle } from "./ReasonField";
import { StaleBanner } from "./StaleBanner";
import { CorrectionForm } from "../CorrectionForm";
import type { CorrectionFormDefaults } from "../CorrectionForm";
import type { DecisionPanelProps } from "./DecisionPanel.types";
import type {
  ReviewQueueItem,
  DisputeQueueItem,
} from "../../types";

function relative(now: Date, then: Date): string {
  const diff = Math.max(0, now.getTime() - then.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} d`;
  return then.toLocaleDateString("pt-BR");
}

function headerBadge(item: ReviewQueueItem): {
  readonly state: "uncertain" | "disputed";
  readonly label: string;
} {
  if (item.kind === "entity_match") {
    return { state: "uncertain", label: "Para revisar" };
  }
  return { state: "disputed", label: "Disputado" };
}

function describeScope(item: ReviewQueueItem): string {
  if (item.kind === "entity_match") return item.canonicalName;
  return (
    item.scope.linkType ?? item.scope.attributeKey ?? "Item em disputa"
  );
}

/** Build CorrectionForm defaults from a disputed item's first side. The
 *  parent picks which side seeds the form; we default to side[0]. */
function buildCorrectionDefaults(item: DisputeQueueItem): CorrectionFormDefaults {
  const first = item.sides[0];
  if (!first) {
    return { validFromSource: "document" };
  }
  return {
    value: first.value,
    targetNodeId: first.targetNodeId,
    validFrom: first.validFrom ? first.validFrom.toISOString().slice(0, 10) : null,
    validTo: first.validTo ? first.validTo.toISOString().slice(0, 10) : null,
    validFromSource: first.validFromSource,
    validFromFragmentId: null,
  };
}

export const DecisionPanel: FC<DecisionPanelProps> = ({
  item,
  evidenceViewed,
  stale = false,
  onRefetch,
  serverError = null,
  submitting = false,
  actions,
  fragmentFilter,
  provenanceSlot,
  className,
}) => {
  const badge = useMemo(() => headerBadge(item), [item]);
  const scope = useMemo(() => describeScope(item), [item]);
  const now = useMemo(() => new Date(), [item]); // refresh on item change

  // ---- selection state for ComparePane ----
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const reasonRef = useRef<ReasonFieldHandle>(null);
  const correctButtonRef = useRef<HTMLButtonElement>(null);

  // Reset selections / form / reason whenever the item changes.
  useEffect(() => {
    setSelectedCandidate(null);
    setSelectedSide(null);
    setReason("");
    setCorrectionOpen(false);
  }, [item.kind === "entity_match" ? item.nodeId : item.sides.map((s) => s.itemId).join(":")]);

  // ---- server-error projection ----
  const invalidCandidateId =
    serverError?.code === "BUSINESS_SELF_MERGE_FORBIDDEN" ||
    serverError?.code === "BUSINESS_INVALID_TARGET_NODE"
      ? selectedCandidate
      : null;

  useEffect(() => {
    if (!serverError) return;
    if (serverError.code === "BUSINESS_REASON_REQUIRED") {
      reasonRef.current?.setServerError(serverError.message);
    }
  }, [serverError]);

  const blockedHintId = useId();

  // ---- build the action buttons per kind ----
  function dispatch(name: "merge_into" | "keep_separate" | "prefer_one" | "adjust_periods" | "keep_disputed" | "confirm" | "reject"): void {
    if (item.kind === "entity_match") {
      if (name === "merge_into") {
        if (!selectedCandidate) return;
        if (!reasonRef.current?.validateOnSubmit()) return;
        actions?.onResolveEntityMatch?.({
          decision: "merge_into",
          target_node_id: selectedCandidate,
          reason: reason || null,
        });
        return;
      }
      if (name === "keep_separate") {
        // Non-destructive — reason optional.
        actions?.onResolveEntityMatch?.({
          decision: "keep_separate",
          reason: reason || null,
        });
        return;
      }
    } else {
      // disputed
      if (name === "prefer_one") {
        if (!selectedSide) return;
        if (!reasonRef.current?.validateOnSubmit()) return;
        actions?.onResolveDispute?.({
          item_kind: item.itemKind,
          item_ids: item.sides.map((s) => s.itemId),
          decision: "prefer_one",
          winner_id: selectedSide,
          reason: reason || null,
        });
        return;
      }
      if (name === "keep_disputed") {
        actions?.onResolveDispute?.({
          item_kind: item.itemKind,
          item_ids: item.sides.map((s) => s.itemId),
          decision: "keep_disputed",
          reason: reason || null,
        });
        return;
      }
    }
  }

  const buttons: ReadonlyArray<DecisionBarButtonProps> =
    item.kind === "entity_match"
      ? [
          {
            id: "merge_into",
            label: "Fundir neste",
            variant: "default",
            destructive: true,
            onClick: () => dispatch("merge_into"),
          },
          {
            id: "keep_separate",
            label: "Manter separados",
            variant: "outline",
            onClick: () => dispatch("keep_separate"),
          },
        ]
      : [
          {
            id: "prefer_one",
            label: "Preferir este",
            variant: "default",
            destructive: true,
            onClick: () => dispatch("prefer_one"),
          },
          {
            id: "keep_disputed",
            label: "Manter em disputa",
            variant: "outline",
            onClick: () => dispatch("keep_disputed"),
          },
        ];

  // Require reason if any destructive button is going to fire.
  const reasonRequired = true;

  // ---- correction form integration ----
  function openCorrection(): void {
    setCorrectionOpen(true);
  }
  function closeCorrection(): void {
    setCorrectionOpen(false);
    // Restore focus to the "Corrigir…" button per §8.
    requestAnimationFrame(() => {
      correctButtonRef.current?.focus();
    });
  }

  const canCorrect = item.kind === "disputed"; // entity_match has no item id.
  const correctionDefaults: CorrectionFormDefaults | null =
    item.kind === "disputed" ? buildCorrectionDefaults(item) : null;
  const correctionItemId =
    item.kind === "disputed" ? item.sides[0]?.itemId ?? "" : "";
  const correctionItemKind =
    item.kind === "disputed" ? item.itemKind : "link";

  return (
    <section
      aria-label="Painel de decisão"
      className={cn(
        "flex flex-col gap-md rounded-md border border-border bg-surface",
        className,
      )}
    >
      {/* hidden tooltip text for aria-describedby on blocked buttons (§8) */}
      <span id={blockedHintId} className="sr-only">
        Veja a evidência antes de decidir.
      </span>

      {stale && onRefetch && <StaleBanner onReload={onRefetch} className="m-md" />}

      {/* Header */}
      <header className="flex flex-col gap-sm border-b border-border p-md">
        <div className="flex items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <StateBadge state={badge.state} size="md" label={badge.label} />
            <h2 className="text-heading text-content">{scope}</h2>
          </div>
          <EvidenceChip viewed={evidenceViewed} />
        </div>
        <p className="text-caption text-body">{relative(now, item.createdAt)}</p>
      </header>

      {/* Generic server-error banner for codes we don't field-project */}
      {serverError &&
        ![
          "BUSINESS_REASON_REQUIRED",
          "BUSINESS_SELF_MERGE_FORBIDDEN",
          "BUSINESS_INVALID_TARGET_NODE",
          "BUSINESS_TEMPORAL_INCOHERENT",
          "BUSINESS_CORRECTION_NO_CHANGES",
        ].includes(serverError.code) && (
          <p
            role="alert"
            className="mx-md flex items-start gap-sm rounded-md border border-border-error bg-surface p-md text-body-sm text-danger"
          >
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            {serverError.message}
          </p>
        )}

      {/* SELF_MERGE_FORBIDDEN inline (spec §6) — within the panel, not in
          the toast — so the user picks another candidate without losing
          context. */}
      {serverError?.code === "BUSINESS_SELF_MERGE_FORBIDDEN" && (
        <p
          role="alert"
          className="mx-md rounded-md border border-border-error bg-surface p-md text-body-sm text-danger"
        >
          Não é possível fundir um nó com ele mesmo.
        </p>
      )}

      {/* ComparePane */}
      <ComparePane
        item={item}
        selectedCandidate={selectedCandidate}
        selectedSide={selectedSide}
        onSelectCandidate={setSelectedCandidate}
        onSelectSide={setSelectedSide}
        invalidCandidateId={invalidCandidateId}
      />

      {/* Evidence (provided by parent) */}
      {provenanceSlot}

      {/* ReasonField */}
      <div className="px-md">
        <ReasonField
          value={reason}
          onChange={setReason}
          validateRef={reasonRef}
          required={reasonRequired}
        />
      </div>

      {/* DecisionBar */}
      <DecisionBar
        evidenceViewed={evidenceViewed}
        submitting={submitting}
        buttons={buttons}
        blockedHintId={blockedHintId}
      />

      {/* Correção (UI-11) */}
      {canCorrect && (
        <div className="border-t border-border p-md">
          {correctionOpen ? (
            <CorrectionForm
              itemKind={correctionItemKind}
              itemId={correctionItemId}
              defaults={correctionDefaults ?? {}}
              {...(fragmentFilter ? { fragmentFilter } : {})}
              submitting={submitting}
              serverError={
                serverError &&
                (serverError.code === "BUSINESS_TEMPORAL_INCOHERENT" ||
                  serverError.code === "BUSINESS_CORRECTION_NO_CHANGES" ||
                  serverError.code === "BUSINESS_DATE_UNJUSTIFIED" ||
                  serverError.code === "BUSINESS_FRAGMENT_NOT_ACCEPTED")
                  ? serverError
                  : null
              }
              onCancel={closeCorrection}
              onSubmit={(body) => {
                actions?.onCorrect?.(body);
              }}
            />
          ) : (
            <Button
              ref={correctButtonRef}
              type="button"
              variant="ghost"
              onClick={openCorrection}
              aria-disabled={!evidenceViewed || undefined}
              aria-describedby={
                !evidenceViewed ? blockedHintId : undefined
              }
              onClickCapture={(e) => {
                if (!evidenceViewed) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              Corrigir…
            </Button>
          )}
        </div>
      )}
    </section>
  );
};
