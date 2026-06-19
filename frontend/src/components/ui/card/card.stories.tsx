/**
 * Card — Storybook stories (DS port §4.4).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion as m } from "framer-motion";
import { Button } from "../button";
import { staggerContainer, listItem } from "@/lib/motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
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

/**
 * Staggered reveal (front.md §9, motion #4) — consumes the canonical
 * `staggerContainer` + `listItem` factories from `lib/motion.ts`. The list
 * cascades in on mount. Hover any card to feel the shadow lift.
 */
const DOCS = [
  { t: "Ata 12/06", d: "8 fragmentos extraídos" },
  { t: "E-mail orçamento", d: "3 fragmentos" },
  { t: "Transcrição call", d: "14 fragmentos" },
];
export const StaggeredReveal: Story = {
  render: () => (
    <m.div
      variants={staggerContainer(false)}
      initial="hidden"
      animate="visible"
      className="flex max-w-sm flex-col gap-md p-md"
    >
      {DOCS.map((doc) => (
        <m.div key={doc.t} variants={listItem(false)}>
          <Card className="cursor-pointer">
            <CardHeader>
              <CardTitle>{doc.t}</CardTitle>
              <CardDescription>{doc.d}</CardDescription>
            </CardHeader>
          </Card>
        </m.div>
      ))}
    </m.div>
  ),
};
