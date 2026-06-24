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
 * Composition (extracted to keep this file under the 300-line limit):
 *  - CorrectionFields    — value/target + validity-window inputs.
 *  - DateJustification   — BR-15 date-source fieldset + R2 fragment picker.
 *
 * Focus management (§8):
 *   - On mount, move focus to the first field (value OR targetNodeId).
 *     Caller (DecisionPanel) controls mounting and restores focus to
 *     "Corrigir…" via the `onCancel`/onSubmit completion path.
 */
import { useEffect, useRef, type FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CorrectionFormProps } from "./CorrectionForm.types";
import {
  buildCorrectItemRequest,
  buildDefaults,
  correctionSchema,
  type CorrectionFormValues,
} from "./correction-schema";
import { CorrectionFields } from "./CorrectionFields";
import { DateJustification } from "./DateJustification";

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
      // Double cast: `buildDefaults` returns the discriminated-union input
      // shape (CorrectionFormInput), while RHF's `defaultValues` is typed as
      // the resolved output (CorrectionFormValues). The two differ only by
      // Zod's transform/refine narrowing — runtime shape is identical — so we
      // cast through `unknown` to bridge the input→output mismatch that TS
      // cannot prove safe statically.
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

  function submit(values: CorrectionFormValues): void {
    onSubmit(buildCorrectItemRequest(itemKind, itemId, values));
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

      <CorrectionFields
        itemKind={itemKind}
        control={control}
        errors={errors}
        firstFieldRef={firstFieldRef}
      />

      <DateJustification
        control={control}
        validFromSource={validFromSource}
        {...(fragmentFilter ? { fragmentFilter } : {})}
        {...(errors.validFromFragmentId?.message
          ? { fragmentErrorMessage: errors.validFromFragmentId.message }
          : {})}
      />

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
              aria-describedby={fieldState.error ? "cf-reason-err" : undefined}
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
