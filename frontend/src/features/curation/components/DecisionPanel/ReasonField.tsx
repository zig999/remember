import { useImperativeHandle, useState, type FC, type Ref } from "react";
import { cn } from "@/lib/cn";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";

export interface ReasonFieldHandle {
  readonly value: string;
  validateOnSubmit(): boolean;
  setServerError(message: string | null): void;
  clear(): void;
}

export interface ReasonFieldProps {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly validateRef?: Ref<ReasonFieldHandle>;
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
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        placeholder={
          required
            ? "Explique brevemente a decisão (obrigatório)."
            : "Explique brevemente a decisão (opcional)."
        }
        rows={2}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
