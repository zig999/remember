import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type Ref,
} from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";
import { Label } from "@/shared/components/ui/label";
import type {
  FormFieldContextValue,
  FormItemContextValue,
} from "./form.types";

export const Form = FormProvider;

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

const FormItemContext = createContext<FormItemContextValue | null>(null);

export function FormItem({
  className,
  ref,
  ...props
}: ComponentProps<"div"> & { ref?: Ref<HTMLDivElement> }) {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("flex flex-col gap-sm", className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  if (!fieldContext) {
    throw new Error("useFormField deve ser usado dentro de <FormField>");
  }
  const name = fieldContext.name as FieldPath<FieldValues>;
  const formState = useFormState({ name });
  const fieldState = getFieldState(name, formState);
  const id = itemContext?.id ?? "";
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();
  return (
    <Label
      htmlFor={formItemId}
      className={cn("transition-colors", error && "text-destructive", className)}
      {...props}
    />
  );
}

export function FormControl(props: ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

export function FormDescription({ className, ...props }: ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();
  return (
    <p
      id={formDescriptionId}
      className={cn("text-xs text-body", className)}
      {...props}
    />
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;
  if (!body) return null;
  return (
    <p
      id={formMessageId}
      className={cn("animate-message-in text-xs font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}
