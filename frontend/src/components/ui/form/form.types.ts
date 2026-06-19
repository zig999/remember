/**
 * Form — public type contract (DS port §4.15).
 *
 * The two context value shapes the field wiring threads between FormField,
 * FormItem and useFormField. Simplified to non-generic string carriers (the
 * field name is always a FieldPath, which is a string) — the generics live on
 * the `FormField` component signature itself.
 */
export interface FormFieldContextValue {
  /** The react-hook-form field path this FormField controls. */
  name: string;
}

export interface FormItemContextValue {
  /** useId()-derived base id; the a11y ids are derived from it. */
  id: string;
}
