/**
 * CorrectionFields — the value/target + validity-window inputs of
 * CorrectionForm. Extracted to keep CorrectionForm under the 300-line limit.
 *
 * `firstFieldRef` is forwarded so the parent can focus the first field on
 * mount (§8 focus management) — the parent owns the effect; this component
 * only wires the ref onto whichever first field the item kind renders.
 */
import { type MutableRefObject, type FC } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { ItemKind } from "../../types";
import type { CorrectionFormValues } from "./correction-schema";

interface CorrectionFieldsProps {
  readonly itemKind: ItemKind;
  readonly control: Control<CorrectionFormValues>;
  readonly errors: FieldErrors<CorrectionFormValues>;
  readonly firstFieldRef: MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  >;
}

export const CorrectionFields: FC<CorrectionFieldsProps> = ({
  itemKind,
  control,
  errors,
  firstFieldRef,
}) => (
  <>
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
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? "cf-value-err" : undefined}
            />
          )}
        />
        {errors.value && (
          <p id="cf-value-err" role="alert" className="text-xs text-destructive">
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
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? "cf-target-err" : undefined}
              placeholder="UUID do nó destino"
            />
          )}
        />
        {errors.targetNodeId && (
          <p id="cf-target-err" role="alert" className="text-xs text-destructive">
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
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? "cf-from-err" : undefined}
            />
          )}
        />
        {errors.validFrom && (
          <p id="cf-from-err" role="alert" className="text-xs text-destructive">
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
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? "cf-to-err" : undefined}
            />
          )}
        />
        {errors.validTo && (
          <p id="cf-to-err" role="alert" className="text-xs text-destructive">
            {errors.validTo.message}
          </p>
        )}
      </div>
    </div>
  </>
);
