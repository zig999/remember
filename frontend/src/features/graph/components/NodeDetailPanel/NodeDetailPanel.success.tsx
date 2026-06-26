/**
 * NodeDetailPanel — SuccessView (aliases, attributes, relationships).
 *
 * Split out of `NodeDetailPanel.tsx` to keep the main shell under the 300-line
 * cap mandated by spec §11. The shell still owns the GlassSurface root and
 * state branching; this file owns the rendering of the success body.
 */
import { Stethoscope } from "lucide-react";
import type { FC } from "react";

import { StateBadge } from "@/components/ds/StateBadge";
import { cn } from "@/lib/cn";
import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import { PanelHeader } from "./NodeDetailPanel.shell";
import { NodeAttributeRow } from "./NodeAttributeRow";
import { NodeRelationshipsSection } from "./NodeRelationshipsSection";
import type { NodeCurationTarget } from "./NodeDetailPanel.curation";
import type { NodeDetailView } from "../../api";

export interface SuccessViewProps {
  readonly data: NodeDetailView;
  readonly closeRef: React.RefObject<HTMLButtonElement | null>;
  readonly curateButtonRef: React.RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
  readonly curationTarget: NodeCurationTarget | null;
  readonly onCurate: () => void;
}

export const SuccessView: FC<SuccessViewProps> = ({
  data,
  closeRef,
  curateButtonRef,
  onClose,
  curationTarget,
  onCurate,
}) => {
  return (
    <>
      <PanelHeader
        title={data.canonicalName}
        closeRef={closeRef}
        onClose={onClose}
        trailing={
          <>
            <span
              className="text-caption text-muted"
              data-testid="node-detail-type"
            >
              {data.nodeType}
            </span>
            <span data-testid="node-detail-status">
              <StateBadge state={data.badgeState} size="sm" />
            </span>
            {curationTarget !== null && (
              <button
                ref={curateButtonRef}
                type="button"
                onClick={onCurate}
                data-testid="node-detail-curate"
                data-curate-kind={curationTarget.kind}
                className={cn(
                  "inline-flex items-center gap-xs",
                  "min-h-8 px-md py-xs rounded-md",
                  "text-body-sm text-content-inverse bg-action hover:bg-action-hover",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
                )}
              >
                <Stethoscope aria-hidden="true" className="size-4" />
                {NODE_DETAIL_COPY.curate}
              </button>
            )}
          </>
        }
      />
      <div
        className="flex-1 min-h-0 overflow-y-auto px-lg pb-lg"
        data-testid="node-detail-success"
      >
        {/* ---------- Aliases ---------------------------------------- */}
        <section className="mt-md">
          <h3 className="text-subheading text-content mb-sm">
            {NODE_DETAIL_COPY.aliasesHeading}
          </h3>
          {data.aliases.length === 0 ? (
            <p className="text-body-sm text-muted">
              {NODE_DETAIL_COPY.noAliases}
            </p>
          ) : (
            <ul
              aria-label={NODE_DETAIL_COPY.aliasesHeading}
              className="flex flex-col gap-xs"
              data-testid="node-detail-aliases"
            >
              {data.aliases.map((alias) => (
                <li
                  key={alias.id}
                  className="flex items-center gap-sm text-body-sm text-content"
                >
                  <span>{alias.alias}</span>
                  {alias.kind === "canonical" && (
                    <span className="text-caption text-muted">(canônico)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Attributes ------------------------------------- */}
        <section className="mt-lg">
          <h3 className="text-subheading text-content mb-sm">
            {NODE_DETAIL_COPY.attributesHeading}
          </h3>
          {data.attributes.length === 0 ? (
            <p className="text-body-sm text-muted">
              {NODE_DETAIL_COPY.noAttributes}
            </p>
          ) : (
            <table
              className="w-full text-body-sm text-content"
              data-testid="node-detail-attributes"
            >
              <thead>
                <tr className="text-caption text-muted">
                  <th scope="col" className="text-left p-xs font-normal">
                    {NODE_DETAIL_COPY.attrColKey}
                  </th>
                  <th scope="col" className="text-left p-xs font-normal">
                    {NODE_DETAIL_COPY.attrColValue}
                  </th>
                  <th scope="col" className="text-left p-xs font-normal">
                    {NODE_DETAIL_COPY.attrColState}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.attributes.map((attr) => (
                  <NodeAttributeRow key={attr.id} attr={attr} />
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ---------- Relationships (Phase B) ------------------------ */}
        <NodeRelationshipsSection nodeId={data.id} />
      </div>
    </>
  );
};
