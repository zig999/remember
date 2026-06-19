/**
 * Card — Storybook stories (DS port §4.4).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "DS/Card",
  component: Card,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <div className="p-md">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Documento ingerido</CardTitle>
          <CardDescription>
            Ata da reunião de 12/06 — 8 fragmentos extraídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-body">
            O conteúdo bruto foi preservado e o grafo consolidado sem conflitos.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Ver no grafo</Button>
          <Button size="sm" variant="ghost">
            Descartar
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const LightTheme: Story = {
  decorators: [
    (Story) => (
      <div data-theme="light" className="bg-primary p-xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Tema claro</CardTitle>
        <CardDescription>Mesma estrutura, tokens recalibrados.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-body">Conteúdo do cartão.</p>
      </CardContent>
    </Card>
  ),
};
