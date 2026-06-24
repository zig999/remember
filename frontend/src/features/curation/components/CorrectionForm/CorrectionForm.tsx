/**
 * CorrectionForm — errata form (TC-05, UI-11).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-11 (inline expansion, not modal),
 *    §5 (validation), §6 (BUSINESS_* inline mappings), §8 (focus
 *    management).
 *  - openapi.yaml CorrectItemRequest schema (mirrored in
 *    `correction-schema.ts`).
 *  - flow spec 3o (R2 fragment-picker degradation).
 *
 * Schema-first RHF + Zod (zodResolver). Single-owner pt-BR strings.
 *
 * Focus management (§8):
 *   - On mount, move focus to the first field (value OR targetNodeId).
 *     Caller (DecisionPanel) controls mounting and restores focus to
 *     "Corrigir…" via the `onCancel`/onSubmit completion path.
 *
 * R2 degradation:
 *   - When `valid_from_source=stated`, the form needs a fragment id. The
 *     picker calls `useListAcceptedFragments(filter)` — if the filter
 *     yields no source ids OR the list is empty, the form shows a plain
 *     text input for the fragment id with an explanatory placeholder
 *     (flow 3o "modo avançado"). "Salvar" stays disabled until the user
 *     supplies a non-empty id (schema enforces this).
 */
import { useEffect, useRef, type FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useListAcceptedFragments } from "../../api/provenance.hooks";
import type { CorrectionFormProps } from "./CorrectionForm.types";
import {
  buildDefaults,
  correctionSchema,
  type CorrectionFormValues,
} from "./correction-schema";
import type { CorrectItemRequest } from "../../types";

const SOURCE_OPTIONS: ReadonlyArray<{
  readonly value: "stated" | "document" | "received";
  readonly label: string;
  readonly hint: string;
}> = Object.freeze([
  {
    value: "stated",
    label: "Declarada no fragmento",
    hint: "A própria fonte diz a data — selecione o fragmento.",
  },
  {
    value: "document",
    label: "Data do documento",
    hint: "Derivada da data do documento de origem.",
  },
  {
    value: "received",
    label: "Data de recebimento",
    hint: "Quando o sistema recebeu a informação.",
  },
]);

/** Translate the server error code into the field path it highlights. */
function fieldForServerCode(code: string): keyof CorrectionFormValues | null {
  switch (code) {
    case "BUSINESS_TEMPORAL_INCOHERENT":
      return "validTo";
    case "BUSINESS_DATE_UNJUSTIFIED":
      return "validFromSource";
    case "BUSINESS_FRAGMENT_NOT_ACCEPTED":
      return "validFromFragmentId";
    case "BUSINESS_REASON_REQUIRED":
      return "reason";
    default:
      return null;
  }
}

export const CorrectionForm: FC<CorrectionFormProps> = ({
  itemKind,
  itemId,
  defaults,
  fragmentFilter,
  onSubmit,
  onCancel,
  submitting = false,
  serverError = null,
  className,
}) => {
  const form = useForm<CorrectionFormValues>({
    resolver: zodResolver(correctionSchema),
    defaultValues: buildDefaults({
      itemKind,
      itemId,
      value: defaults.value ?? null,
      targetNodeId: defaults.targetNodeId ?? null,
      validFrom: defaults.validFrom ?? null,
      validTo: defaults.validTo ?? null,
      validFromSource: defaults.validFromSource ?? "document",
      validFromFragmentId: defaults.validFromFragmentId ?? null,
    }) as unknown as CorrectionFormValues,
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = form;

  const validFromSource = watch("validFromSource");

  // -------- focus first field on mount (§8) --------
  // Use a direct DOM ref instead of RHF setFocus to avoid triggering the
  // resolver synchronously on mount with empty defaults (which throws an
  // unhandled rejection under vitest's jsdom — see SignInForm.spec.tsx
  // header for the same pattern).
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
    null,
  );
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [itemKind]);

  // -------- server-error projection --------
  useEffect(() => {
    if (!serverError) return;
    const field = fieldForServerCode(serverError.code);
    if (field) {
      setError(field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  // -------- R2 fragment picker --------
  const hasFilter =
    !!fragmentFilter?.llmRunId || !!fragmentFilter?.rawInformationId;
  const fragmentParams: { llmRunId?: string; rawInformationId?: string } = {};
  if (validFromSource === "stated" && hasFilter) {
    if (fragmentFilter?.llmRunId !== undefined) {
      fragmentParams.llmRunId = fragmentFilter.llmRunId;
    }
    if (fragmentFilter?.rawInformationId !== undefined) {
      fragmentParams.rawInformationId = fragmentFilter.rawInformationId;
    }
  }
  const fragmentQ = useListAcceptedFragments(fragmentParams);
  const showPicker =
    validFromSource === "stated" &&
    hasFilter &&
    !fragmentQ.isError &&
    (fragmentQ.data?.items.length ?? 0) > 0;
  const showManualFragment =
    validFromSource === "stated" && !showPicker;

  function submit(values: CorrectionFormValues): void {
    const body: CorrectItemRequest = {
      item_kind: itemKind,
      item_id: itemId,
      corrected: {
        ...(itemKind === "attribute"
          ? { value: values.value }
          : { target_node_id: values.targetNodeId }),
        valid_from: values.validFrom,
        valid_to: values.validTo,
        valid_from_source: values.validFromSource,
        valid_from_fragment_id: values.validFromFragmentId,
      },
      reason: values.reason,
    };
    onSubmit(body);
  }

  const formLevelError =
    serverError?.code === "BUSINESS_CORRECTION_NO_CHANGES"
      ? "Nenhuma alteração detectada. Modifique pelo menos um campo."
      : null;

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="Formulário de correção"
      className={cn("flex flex-col gap-md p-md", className)}
    >
      {formLevelError !== null && (
        <p
          role="alert"
          className="flex items-start gap-sm rounded-md border border-border-error bg-surface p-md text-body-sm text-danger"
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {formLevelError}
        </p>
      )}

      {itemKind === "attribute" ? (
        <div className="flex flex-col gap-sm">
          <Label htmlFor="cf-value">Novo valor</Label>
          <Controller
            control={control}
            name="value"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id="cf-value"
                value={field.value ?? ""}
                ref={(node) => {
                  field.ref(node);
                  firstFieldRef.current = node;
                }}
                invalid={!!fieldState.error}
                aria-describedby={
                  fieldState.error ? "cf-value-err" : undefined
                }
              />
            )}
          />
          {errors.value && (
            <p id="cf-value-err" role="alert" className="text-body-sm text-danger">
              {errors.value.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          <Label htmlFor="cf-target">Nó-alvo (ID)</Label>
          <Controller
            control={control}
            name="targetNodeId"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id="cf-target"
                value={field.value ?? ""}
                ref={(node) => {
                  field.ref(node);
                  firstFieldRef.current = node;
                }}
                invalid={!!fieldState.error}
                aria-describedby={
                  fieldState.error ? "cf-target-err" : undefined
                }
                placeholder="UUID do nó destino"
              />
            )}
          />
          {errors.targetNodeId && (
            <p id="cf-target-err" role="alert" className="text-body-sm text-danger">
              {errors.targetNodeId.message}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        <div className="flex flex-col gap-sm">
          <Label htmlFor="cf-from">Vigência — início</Label>
          <Controller
            control={control}
            name="validFrom"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id="cf-from"
                type="date"
                value={field.value ?? ""}
                invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? "cf-from-err" : undefined}
              />
            )}
          />
          {errors.validFrom && (
            <p id="cf-from-err" role="alert" className="text-body-sm text-danger">
              {errors.validFrom.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-sm">
          <Label htmlFor="cf-to">Vigência — fim</Label>
          <Controller
            control={control}
            name="validTo"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id="cf-to"
                type="date"
                value={field.value ?? ""}
                invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? "cf-to-err" : undefined}
              />
            )}
          />
          {errors.validTo && (
            <p id="cf-to-err" role="alert" className="text-body-sm text-danger">
              {errors.validTo.message}
            </p>
          )}
        </div>
      </div>

      {/* DateJustification sub-form */}
      <fieldset className="flex flex-col gap-sm rounded-md border border-border p-md">
        <legend className="px-xs text-body-sm font-medium">
          Justificativa da data
        </legend>
        <Controller
          control={control}
          name="validFromSource"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              aria-label="Fonte da data de início"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-sm text-body-sm"
                >
                  <RadioGroupItem value={opt.value} id={`cf-src-${opt.value}`} />
                  <span className="flex flex-col">
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-body">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />

        {showPicker && fragmentQ.data && (
          <div className="flex flex-col gap-sm">
            <Label htmlFor="cf-frag">Fragmento</Label>
            <Controller
              control={control}
              name="validFromFragmentId"
              render={({ field, fieldState }) => (
                <select
                  {...field}
                  id="cf-frag"
                  value={field.value ?? ""}
                  aria-invalid={!!fieldState.error || undefined}
                  className={cn(
                    "h-9 w-full rounded-md border bg-input px-md text-label text-content",
                    fieldState.error
                      ? "border-border-error"
                      : "border-border",
                  )}
                >
                  <option value="">Selecione um fragmento…</option>
                  {fragmentQ.data?.items.map((f) => (
                    <option key={f.fragmentId} value={f.fragmentId}>
                      {f.text.slice(0, 80)}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.validFromFragmentId && (
              <p role="alert" className="text-body-sm text-danger">
                {errors.validFromFragmentId.message}
              </p>
            )}
          </div>
        )}

        {showManualFragment && (
          <div className="flex flex-col gap-sm">
            <Label htmlFor="cf-frag-manual">ID do fragmento</Label>
            <Controller
              control={control}
              name="validFromFragmentId"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id="cf-frag-manual"
                  value={field.value ?? ""}
                  invalid={!!fieldState.error}
                  placeholder="UUID do fragmento accepted"
                  aria-describedby="cf-frag-manual-hint"
                />
              )}
            />
            <p id="cf-frag-manual-hint" className="text-caption text-body">
              Listagem de fragmentos indisponível — informe o id manualmente.
            </p>
            {errors.validFromFragmentId && (
              <p role="alert" className="text-body-sm text-danger">
                {errors.validFromFragmentId.message}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-sm">
        <Label htmlFor="cf-reason">Motivo</Label>
        <Controller
          control={control}
          name="reason"
          render={({ field, fieldState }) => (
            <Textarea
              {...field}
              id="cf-reason"
              invalid={!!fieldState.error}
              aria-describedby={
                fieldState.error ? "cf-reason-err" : undefined
              }
              placeholder="Explique brevemente por que a correção é necessária."
              rows={3}
            />
          )}
        />
        {errors.reason && (
          <p id="cf-reason-err" role="alert" className="text-body-sm text-danger">
            {errors.reason.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-md">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={submitting}
          disabled={
            // Targeted requirement (spec UI-11 / BDD 5): when stated is
            // chosen, "Salvar permanece desabilitado até fragmento ser
            // selecionado". For other sources the schema gates submission.
            validFromSource === "stated" &&
            (watch("validFromFragmentId") ?? "").length === 0
          }
        >
          Salvar correção
        </Button>
      </div>
    </form>
  );
};
