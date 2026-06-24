/**
 * DateJustification — the "Justificativa da data" fieldset of CorrectionForm
 * (BR-15). Extracted to keep CorrectionForm under the 300-line limit.
 *
 * Owns the R2 accepted-fragment picker and its degradation (flow spec 3o):
 * when `valid_from_source=stated` and a filter is available, it lists
 * accepted fragments; otherwise (no filter, or empty/errored list) it falls
 * back to a plain text input for the fragment id.
 */
import { type FC } from "react";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListAcceptedFragments } from "../../api/provenance.hooks";
import type { ValidFromSource } from "../../types";
import type { CorrectionFormValues } from "./correction-schema";

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

interface DateJustificationProps {
  readonly control: Control<CorrectionFormValues>;
  readonly validFromSource: ValidFromSource;
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  readonly fragmentErrorMessage?: string;
}

export const DateJustification: FC<DateJustificationProps> = ({
  control,
  validFromSource,
  fragmentFilter,
  fragmentErrorMessage,
}) => {
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
  const showManualFragment = validFromSource === "stated" && !showPicker;

  return (
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
              // Standard dark-theme Select (Radix). Wired to the RHF field
              // via `value` / `onValueChange`. Radix treats "" as "no value",
              // so an undefined/"" field value renders the placeholder
              // from <SelectValue>.
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v)}
              >
                <SelectTrigger
                  id="cf-frag"
                  aria-invalid={!!fieldState.error || undefined}
                  className={
                    fieldState.error ? "border-border-error" : undefined
                  }
                >
                  <SelectValue placeholder="Selecione um fragmento…" />
                </SelectTrigger>
                <SelectContent>
                  {fragmentQ.data?.items.map((f) => (
                    <SelectItem key={f.fragmentId} value={f.fragmentId}>
                      {f.text.slice(0, 80)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {fragmentErrorMessage && (
            <p role="alert" className="text-body-sm text-danger">
              {fragmentErrorMessage}
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
          {fragmentErrorMessage && (
            <p role="alert" className="text-body-sm text-danger">
              {fragmentErrorMessage}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
};
