import { useEffect, useId, useMemo, useRef, useState, type FC } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/shared/components/ui/alert";
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
  const now = useMemo(() => new Date(), [item]);

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

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const reasonRef = useRef<ReasonFieldHandle>(null);

  useEffect(() => {
    setSelectedCandidate(null);
    setSelectedSide(null);
    setReason("");
  }, [item.kind === "entity_match" ? item.nodeId : item.sides.map((s) => s.itemId).join(":")]);

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
        actions?.onResolveEntityMatch?.({
          decision: "keep_separate",
          reason: reason || null,
        });
        return;
      }
    } else {
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
            variant: "primary",
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
            variant: "primary",
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

  const reasonRequired = true;

  const canCorrect = item.kind === "disputed";
  const correctionDefaults: CorrectionFormDefaults | null =
    item.kind === "disputed" ? buildCorrectionDefaults(item) : null;
  const correctionItemId =
    item.kind === "disputed" ? item.sides[0]?.itemId ?? "" : "";
  const correctionItemKind =
    item.kind === "disputed" ? item.itemKind : "link";

  const body = (
    <>
      <span id={blockedHintId} className="sr-only">
        Veja a evidência antes de decidir.
      </span>

      {stale && onRefetch && <StaleBanner onReload={onRefetch} className="m-md" />}

      <header className="flex flex-col gap-sm border-b border-border p-md">
        <div className="flex items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <StateBadge state={badge.state} size="md" label={badge.label} />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {headerSubject}
              {item.kind === "disputed" &&
                subjectQ.data != null &&
                headerRelation && (
                  <span className="ml-sm align-middle text-xs font-normal text-muted-foreground">
                    · {headerRelation}
                  </span>
                )}
            </h2>
          </div>
          <EvidenceChip viewed={evidenceViewed} />
        </div>
        <p className="text-xs text-body">{relative(now, item.createdAt)}</p>
      </header>

      {serverError &&
        ![
          "BUSINESS_REASON_REQUIRED",
          "BUSINESS_SELF_MERGE_FORBIDDEN",
          "BUSINESS_INVALID_TARGET_NODE",
          "BUSINESS_TEMPORAL_INCOHERENT",
          "BUSINESS_CORRECTION_NO_CHANGES",
        ].includes(serverError.code) && (
          <Alert variant="destructive" role="alert" className="mx-md">
            {serverError.message}
          </Alert>
        )}

      {serverError?.code === "BUSINESS_SELF_MERGE_FORBIDDEN" && (
        <Alert variant="destructive" role="alert" className="mx-md">
          Não é possível fundir um nó com ele mesmo.
        </Alert>
      )}

      <ComparePane
        item={item}
        selectedCandidate={selectedCandidate}
        selectedSide={selectedSide}
        onSelectCandidate={setSelectedCandidate}
        onSelectSide={setSelectedSide}
        invalidCandidateId={invalidCandidateId}
      />

      {provenanceSlot}

      <div className="px-md">
        <ReasonField
          value={reason}
          onChange={setReason}
          validateRef={reasonRef}
          required={reasonRequired}
        />
      </div>

      <DecisionBar
        evidenceViewed={evidenceViewed}
        submitting={submitting}
        buttons={buttons}
        blockedHintId={blockedHintId}
      />

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
