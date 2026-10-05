import { useEffect, useRef, type FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import type { CorrectionFormProps } from "./CorrectionForm.types";
import {
  buildCorrectItemRequest,
  buildDefaults,
  correctionSchema,
  type CorrectionFormValues,
} from "./correction-schema";
import { CorrectionFields } from "./CorrectionFields";
import { DateJustification } from "./DateJustification";

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

  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
    null,
  );
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [itemKind]);

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
          className="flex items-start gap-sm rounded-md border border-border-error bg-surface p-md text-xs text-destructive"
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
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? "cf-reason-err" : undefined}
              placeholder="Explique brevemente por que a correção é necessária."
              rows={3}
            />
          )}
        />
        {errors.reason && (
          <p id="cf-reason-err" role="alert" className="text-xs text-destructive">
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
