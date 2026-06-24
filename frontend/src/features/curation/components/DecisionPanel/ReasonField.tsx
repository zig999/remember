/**
 * ReasonField — destructive-action reason textarea (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §5 ("Informe um motivo para continuar."),
 *    §6 BUSINESS_REASON_REQUIRED (highlight + focus move),
 *    §8 (aria-invalid + aria-describedby).
 *
 * Pure controlled component — owns no state. The DecisionPanel keeps the
 * value and dispatches it with the action. Validation:
 *  - At submit time, the parent calls `ref.current?.validateOnSubmit()`
 *    via the `validateRef` prop; we expose it through a tiny imperative
 *    handle so the parent doesn't need RHF for just one field.
 */
import { useImperativeHandle, useState, type FC, type Ref } from "react";
import { cn } from "@/lib/cn";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface ReasonFieldHandle {
  readonly value: string;
  /** Returns true when the value is non-empty (trimmed). When false, sets
   *  the inline error AND moves focus to the textarea (spec §6). */
  validateOnSubmit(): boolean;
  /** Surface a server error inline (BUSINESS_REASON_REQUIRED). */
  setServerError(message: string | null): void;
  clear(): void;
}

export interface ReasonFieldProps {
  /** Field id used for label+textarea association. */
  readonly id?: string;
  /** Controlled by the parent (DecisionPanel) so it can dispatch on submit. */
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Imperative handle for parent-driven submit validation. */
  readonly validateRef?: Ref<ReasonFieldHandle>;
  /** Marks the field as required in the label rendering. */
  readonly required?: boolean;
  readonly className?: string;
}

export const ReasonField: FC<ReasonFieldProps> = ({
  id = "reason-field",
  value,
  onChange,
  validateRef,
  required = false,
  className,
}) => {
  const [error, setError] = useState<string | null>(null);
  const errorId = `${id}-err`;

  useImperativeHandle(
    validateRef,
    () => ({
      value,
      validateOnSubmit() {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          setError("Informe um motivo para continuar.");
          // Move focus to the textarea — §6 BUSINESS_REASON_REQUIRED.
          const el = document.getElementById(id) as HTMLTextAreaElement | null;
          el?.focus();
          return false;
        }
        setError(null);
        return true;
      },
      setServerError(message) {
        setError(message);
        if (message !== null) {
          const el = document.getElementById(id) as HTMLTextAreaElement | null;
          el?.focus();
        }
      },
      clear() {
        setError(null);
        onChange("");
      },
    }),
    [value, id, onChange],
  );

  return (
    <div className={cn("flex flex-col gap-sm", className)}>
      <Label htmlFor={id}>
        Motivo
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.currentTarget.value);
          if (error) setError(null);
        }}
        invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        placeholder={
          required
            ? "Explique brevemente a decisão (obrigatório)."
            : "Explique brevemente a decisão (opcional)."
        }
        rows={2}
      />
      {error && (
        <p id={errorId} role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
