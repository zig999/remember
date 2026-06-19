/**
 * Presentation / FormExample — full AppShell with a newsletter sign-up form.
 *
 * The workspace is split 40% | 60% (grid-cols-5: col-span-2 | col-span-3). The
 * form lives in the left 40%; the right 60% is intentionally left free.
 *
 * Composed ENTIRELY from already-built components (no new ones needed):
 *   AppShell · GlassSurface (panel) · Form (RHF + Zod) · Input · Select · Checkbox · Button · Badge
 *
 * The form panel background uses the GlassSurface frosted-glass material
 * (level="panel") over the ambient backdrop — per layout.md §5 (floating panels
 * are glass). Card* subcomponents provide the internal padding/structure only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/shell/AppShell";
import { GlassSurface } from "@/components/ds/GlassSurface";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.email("E-mail inválido."),
  frequency: z.enum(["diaria", "semanal", "mensal"]),
  consent: z.boolean().refine((v) => v, "É necessário aceitar para continuar."),
});
type Values = z.infer<typeof schema>;

function NewsletterForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", frequency: "semanal", consent: false },
    mode: "onTouched",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} noValidate>
        <GlassSurface
          level="panel"
          radius="rounded-lg"
          role="region"
          aria-label="Cadastro de newsletter"
        >
          <CardHeader>
            <div className="flex items-center gap-sm">
              <CardTitle>Receba a newsletter</CardTitle>
              <Badge variant="accent">Grátis</Badge>
            </div>
            <CardDescription>
              Um resumo do que entrou no seu segundo cérebro, sem ruído.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-lg">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Como te chamamos?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="voce@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Nunca compartilhamos seu e-mail.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <div className="flex flex-col gap-xs">
                    <FormLabel className="font-normal">
                      Aceito receber a newsletter por e-mail.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Inscrever-se
            </Button>
          </CardFooter>
        </GlassSurface>
      </form>
    </Form>
  );
}

const meta: Meta = {
  title: "Presentation/FormExample",
  parameters: {
    layout: "fullscreen",
    a11y: { element: "#storybook-root" },
  },
};
export default meta;
type Story = StoryObj;

export const NewsletterSignup: Story = {
  name: "Newsletter (40% | 60%)",
  render: () => (
    <AppShell>
      {/* Workspace split 40% | 60% (grid-cols-5: 2 + 3). Right 60% left free. */}
      <div className="grid min-h-screen grid-cols-1 gap-xl p-xl lg:grid-cols-5">
        <div className="lg:col-span-2">
          <NewsletterForm />
        </div>
        <div className="hidden lg:col-span-3 lg:block" aria-hidden="true" />
      </div>
    </AppShell>
  ),
};
