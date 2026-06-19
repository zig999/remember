/**
 * Form — Storybook stories (DS port §4.15). Schema-first RHF + Zod v4.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../button";
import { Input } from "../input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";

const schema = z.object({
  title: z.string().min(3, "Mínimo de 3 caracteres."),
});
type Values = z.infer<typeof schema>;

function DemoForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
    mode: "onTouched",
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {})}
        className="flex max-w-sm flex-col gap-md"
        noValidate
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do documento</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Ata 12/06" {...field} />
              </FormControl>
              <FormDescription>
                Aparece como rótulo do RawInformation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="self-start">
          Salvar
        </Button>
      </form>
    </Form>
  );
}

const meta: Meta<typeof DemoForm> = {
  title: "DS/Form",
  component: DemoForm,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof DemoForm>;

export const Default: Story = { render: () => <div className="p-md"><DemoForm /></div> };
