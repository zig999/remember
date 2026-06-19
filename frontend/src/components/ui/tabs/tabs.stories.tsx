/**
 * Tabs — Storybook stories (DS port §4.13).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { a11y: { element: "#storybook-root" } },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <div className="max-w-md p-md">
      <Tabs defaultValue="fragmentos">
        <TabsList>
          <TabsTrigger value="fragmentos">Fragmentos</TabsTrigger>
          <TabsTrigger value="proveniencia">Proveniência</TabsTrigger>
          <TabsTrigger value="bruto" disabled>
            Bruto
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fragmentos">
          <p className="text-body-sm text-body">8 fragmentos extraídos.</p>
        </TabsContent>
        <TabsContent value="proveniencia">
          <p className="text-body-sm text-body">
            Cada fato remonta a chunk → raw.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};
