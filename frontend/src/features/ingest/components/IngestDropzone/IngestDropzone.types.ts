/**
 * IngestDropzone — public type contract (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 (UI-01 dropzone),
 *    §8 (Feature Accessibility — keyboard, role="button", aria-dropeffect).
 *  - v1 scope: `.txt` files only (binary parsing out of scope, §11).
 */
import type { Ref } from "react";

export interface IngestDropzoneProps {
  /**
   * Invoked when a file is successfully read. The dropzone reads the file
   * client-side and emits the decoded text content here. The parent forwards
   * the text into the form's `content` field.
   */
  readonly onContent: (text: string) => void;

  /**
   * Invoked alongside `onContent` so the parent can render a "file chip"
   * (UI-02: "relatorio.txt — 4.2 KB"). Pass undefined when the user pastes
   * text directly (no file).
   */
  readonly onFile?: (fileName: string, sizeBytes: number) => void;

  /**
   * Disabled state — drag-and-drop + click-to-open are gated off (UI-03,
   * UI-05, UI-07).
   */
  readonly disabled?: boolean;

  /** Optional className merged via `cn()`. */
  readonly className?: string;

  /** React 19 ref-as-prop — attaches to the dropzone root `<div>`. */
  readonly ref?: Ref<HTMLDivElement>;
}
