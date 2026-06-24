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
 *   - CorrectionSection (UI-11, expands inline; not a modal)
 *
 * Pure helpers live in `DecisionPanel.helpers.ts`; the UI-11 errata
 * affordance lives in `CorrectionSection.tsx` — both extracted to keep
 * this file under the 300-line limit.
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
import { useEffect, useId, useMemo, useRef, useState, type FC } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { StateBadge } from "@/components/ds/StateBadge";
import { ComparePane } from "./ComparePane";
import { DecisionBar, type DecisionBarButtonProps } from "./DecisionBar";
import { EvidenceChip } from "./EvidenceChip";
import { ReasonField, type ReasonFieldHandle } from "./ReasonField";
import { StaleBanner } from "./StaleBanner";
import { CorrectionSection } from "./CorrectionSection";
import {
  relative,
  headerBadge,
  describeScope,
  buildCorrectionDefaults,
} from "./DecisionPanel.helpers";
import { useCurationNodeDetail } from "../../api/node.hooks";
import type { CorrectionFormDefaults } from "../CorrectionForm";
import type { DecisionPanelProps } from "./DecisionPanel.types";

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
  surface = "ambient",
  className,
}) => {
  const badge = useMemo(() => headerBadge(item), [item]);
  const now = useMemo(() => new Date(), [item]); // refresh on item change

  // Header subject: for disputes, resolve the SUBJECT node name (the link's
  // source, or the attribute's node) so the title reads e.g. "Salvar
  // imagens… · part_of" instead of just the bare relation. entity_match
  // items already carry their canonical name. While the name loads (or for
  // entity_match) we fall back to describeScope.
  const subjectId = useMemo(() => {
    if (item.kind !== "disputed") return null;
    return item.itemKind === "link"
      ? item.scope.sourceNodeId
      : item.scope.nodeId;
  }, [item]);
  const subjectQ = useCurationNodeDetail(subjectId);
  const headerRelation =
    item.kind === "disputed"
      ? (item.itemKind === "link" ? item.scope.linkType : item.scope.attributeKey)
      : null;
  const headerSubject =
    item.kind === "entity_match"
      ? item.canonicalName
      : (subjectQ.data?.node.canonicalName ?? describeScope(item));

  // ---- selection state for ComparePane ----
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const reasonRef = useRef<ReasonFieldHandle>(null);

  // Reset selections / reason whenever the item changes. (The correction
  // sub-form resets independently via its `key` below.)
  useEffect(() => {
    setSelectedCandidate(null);
    setSelectedSide(null);
    setReason("");
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
  const canCorrect = item.kind === "disputed"; // entity_match has no item id.
  const correctionDefaults: CorrectionFormDefaults | null =
    item.kind === "disputed" ? buildCorrectionDefaults(item) : null;
  const correctionItemId =
    item.kind === "disputed" ? item.sides[0]?.itemId ?? "" : "";
  const correctionItemKind =
    item.kind === "disputed" ? item.itemKind : "link";

  const body = (
    <>
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
            <h2 className="text-heading text-content">
              {headerSubject}
              {item.kind === "disputed" &&
                subjectQ.data != null &&
                headerRelation && (
                  <span className="ml-sm align-middle text-body-sm font-normal text-muted">
                    · {headerRelation}
                  </span>
                )}
            </h2>
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

      {/* Correção (UI-11) — keyed by item so it resets on item change. */}
      {canCorrect && (
        <CorrectionSection
          key={correctionItemId}
          itemKind={correctionItemKind}
          itemId={correctionItemId}
          defaults={correctionDefaults ?? {}}
          {...(fragmentFilter ? { fragmentFilter } : {})}
          submitting={submitting}
          serverError={serverError}
          evidenceViewed={evidenceViewed}
          blockedHintId={blockedHintId}
          onCorrect={(req) => {
            actions?.onCorrect?.(req);
          }}
        />
      )}
    </>
  );

  // Outer surface — GlassSurface level="ambient" by default (its own
  // background/border/blur). When nested inside another glass surface (e.g.
  // CurationDrawer's modal-glass), the caller passes `surface="plain"` to
  // skip the surface chrome and avoid double-glass stacking.
  if (surface === "plain") {
    return (
      <section
        aria-label="Painel de decisão"
        className={cn("flex flex-col gap-md", className)}
      >
        {body}
      </section>
    );
  }
  return (
    <GlassSurface
      level="ambient"
      role="region"
      aria-label="Painel de decisão"
      className={cn("flex flex-col gap-md", className)}
    >
      {body}
    </GlassSurface>
  );
};
