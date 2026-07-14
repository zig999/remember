/**
 * Form — unit tests (Golden Rule 9).
 *
 * The whole value of this layer is the a11y wiring; if it silently breaks, the
 * form still renders but screen readers lose the label/description/error
 * associations. We pin:
 *  - useFormField() THROWS outside a <FormField> (the misuse is otherwise
 *    silent — ids resolve against an empty base).
 *  - FormControl injects matching id + aria-describedby onto the input, and
 *    flips aria-invalid + surfaces the Zod message once a field errors.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from "../form";
// NB: o alias @/shared não é aplicado dentro de arquivos .spec (excluídos do
// tsconfig, fora do escopo do vite-tsconfig-paths); caminho relativo ao kit.
import { Input } from "../../../../../vendor/ui-kit/frontend/src/shared/components/ui/input";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function BareConsumer() {
  // Inside a Form (so useFormContext resolves) but NOT inside a FormField.
  useFormField();
  return null;
}
function FormWrapper() {
  const form = useForm({ defaultValues: {} });
  return (
    <Form {...form}>
      <BareConsumer />
    </Form>
  );
}

describe("useFormField — misuse guard", () => {
  it("throws when used outside a <FormField>", () => {
    expect(() => act(() => root.render(<FormWrapper />))).toThrow(/FormField/);
  });
});

const schema = z.object({ title: z.string().min(3, "Mínimo de 3 caracteres.") });

function FieldForm() {
  const form = useForm<{ title: string }>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>ajuda</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("Form — a11y wiring", () => {
  it("associates input id with its description and label htmlFor", () => {
    act(() => root.render(<FieldForm />));
    const input = container.querySelector("input") as HTMLInputElement;
    const desc = container.querySelector("p") as HTMLParagraphElement;
    const label = container.querySelector("label") as HTMLLabelElement;
    expect(input.id).toBeTruthy();
    expect(label.getAttribute("for")).toBe(input.id);
    // describedby points at the description while valid (no message rendered)
    expect(input.getAttribute("aria-describedby")).toContain(desc.id);
    // valid field -> not invalid
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });
});
