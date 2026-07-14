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
import { withRouter } from "../../.storybook/decorators/withRouter";
import { withQueryClient, seedShellHealthy } from "../../.storybook/decorators/withQueryClient";
import { GlassSurface } from "@/components/ds/GlassSurface";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/shared/components/ui/select";

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
          <div className="flex flex-col gap-xs p-lg pb-0">
            <div className="flex items-center gap-sm">
              <h3 className="text-lg font-semibold tracking-tight">
                Receba a newsletter
              </h3>
              <Badge variant="accent">Grátis</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Um resumo do que entrou no seu segundo cérebro, sem ruído.
            </p>
          </div>

          <div className="flex flex-col gap-lg p-lg">
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
                  <FormControl>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione"
                      options={[
                        { value: "diaria", label: "Diária" },
                        { value: "semanal", label: "Semanal" },
                        { value: "mensal", label: "Mensal" },
                      ]}
                    />
                  </FormControl>
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
                      onChange={(e) => field.onChange(e.target.checked)}
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
          </div>

          <div className="p-lg pt-0">
            <Button type="submit" className="w-full">
              Inscrever-se
            </Button>
          </div>
        </GlassSurface>
      </form>
    </Form>
  );
}

const meta: Meta = {
  title: "Eternal/Presentation/FormExample",
  parameters: {
    layout: "fullscreen",
    a11y: { element: "#storybook-root" },
  },
  decorators: [withRouter(), withQueryClient(seedShellHealthy)],
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
