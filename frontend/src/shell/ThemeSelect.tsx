/**
 * ThemeSelect — combobox do header para trocar o tema ativo da UI.
 *
 * Controlado por useThemeStore; a escrita flui para <html data-theme> e para o
 * localStorage (persist). Usa o Select do kit (`role="combobox"`).
 */
import { Select } from "@/shared/components/ui/select";
import { cn } from "@/lib/cn";
import { THEMES, useThemeStore, type ThemeName } from "@/state/theme";

export interface ThemeSelectProps {
  className?: string;
}

export function ThemeSelect({ className }: ThemeSelectProps) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <Select
      value={theme}
      onChange={(value) => setTheme(value as ThemeName)}
      options={THEMES}
      aria-label="Tema"
      className={cn("w-36 shrink-0", className)}
    />
  );
}
