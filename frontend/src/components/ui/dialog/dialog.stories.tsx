/**
 * Dialog — Storybook stories (DS port §4.12).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

const meta: Meta<typeof Dialog> = {
  title: "DS/Dialog",
  component: Dialog,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <div className="p-md">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Apagar (compliance)</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar apagamento controlado</DialogTitle>
            <DialogDescription>
              Esta é a única exceção à imutabilidade (§11). A ação é auditada e
              irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive">Apagar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};
