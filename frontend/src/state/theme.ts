/**
 * useThemeStore — tema de UI selecionado, persistido entre sessões.
 *
 * O app traz dois temas TUI do kit compartilhado, trocados pelo ÚNICO atributo
 * `data-theme` no <html> (a superfície de token-switch do kit — ver
 * vendor/ui-kit/frontend/src/theme.css e a nota THEME-COLLISION em AppToaster).
 * `index.html` fixa `data-theme="phosphor"` estaticamente para o primeiro paint
 * casar com o default; este store reaplica a escolha persistida na reidratação e
 * a cada troca.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Temas disponíveis. Cada valor mapeia 1:1 para um escopo `data-theme` do kit. */
export type ThemeName = "phosphor" | "default";

export interface ThemeOption {
  value: ThemeName;
  label: string;
}

/** Ordem do array = ordem de exibição no combobox. */
export const THEMES: ThemeOption[] = [
  { value: "phosphor", label: "Phosphor" },
  { value: "default", label: "Terminal" },
];

const THEME_STORAGE_KEY = "remember.theme.v1";
const DEFAULT_THEME: ThemeName = "phosphor";

/** Escreve o tema na superfície única de troca de tokens (<html data-theme>). */
function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Reaplica o tema persistido ao <html> assim que o store reidrata.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
