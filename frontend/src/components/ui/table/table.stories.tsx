/**
 * Table — Storybook stories (DS port §4.14).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";

const ROWS = [
  { doc: "Ata 12/06", frags: 8, estado: "Aceito" },
  { doc: "E-mail orçamento", frags: 3, estado: "Incerto" },
  { doc: "Transcrição call", frags: 14, estado: "Aceito" },
];

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <div className="p-md">
      <Table>
        <TableCaption>Documentos ingeridos recentemente</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Fragmentos</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((r) => (
            <TableRow key={r.doc}>
              <TableCell>{r.doc}</TableCell>
              <TableCell>{r.frags}</TableCell>
              <TableCell>{r.estado}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

/**
 * New-row flash (front.md §9, #12) — a freshly-arrived row briefly flashes its
 * background (accepted-green → transparent) via the `animate-row-flash` token.
 * Rows also lift to `bg-primary` on hover (baked into TableRow).
 */
export const NewRowFlash: Story = {
  render: () => (
    <div className="p-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Fragmentos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="animate-row-flash">
            <TableCell>Nova ata (recém-ingerida)</TableCell>
            <TableCell>5</TableCell>
          </TableRow>
          {ROWS.map((r) => (
            <TableRow key={r.doc}>
              <TableCell>{r.doc}</TableCell>
              <TableCell>{r.frags}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
