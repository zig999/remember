/**
 * IngestDropzone — keyboard-accessible drag-and-drop area for `.txt` files
 * (TC-04). Also opens a file picker on click / Enter / Space (§8).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 (UI-01 dropzone),
 *    §8 (Accessibility — `tabIndex={0}`, `role="button"`, Enter/Space opens
 *    file dialog, `aria-dropeffect="copy"` while a drag is active),
 *    §11 (.txt only — binary out of scope).
 *
 * Out of scope:
 *  - Binary / PDF parsing — only `.txt` files are accepted (text/* MIME also
 *    accepted as a fallback).
 *  - Streaming / chunked upload — the file is read fully via FileReader.
 */
import { useCallback, useId, useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  FC,
  KeyboardEvent,
} from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import type { IngestDropzoneProps } from "./IngestDropzone.types";

const ZONE_LABEL = "Área para arrastar ou carregar arquivo .txt";
const HELPER_TEXT = "Arraste um .txt ou cole o texto abaixo.";
const ACCEPT = ".txt,text/plain";

/**
 * Validate that a file is a text file by extension or MIME type. We do not
 * trust the OS-reported MIME alone (Windows sometimes reports
 * `application/octet-stream` for `.txt`) — extension wins as a fallback.
 */
function isTxtFile(file: File): boolean {
  if (file.type === "text/plain") return true;
  if (file.type.startsWith("text/")) return true;
  return file.name.toLowerCase().endsWith(".txt");
}

export const IngestDropzone: FC<IngestDropzoneProps> = ({
  onContent,
  onFile,
  disabled = false,
  className,
  ref,
}) => {
  const reactId = useId();
  const helperId = `ingest-dropzone-helper-${reactId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (files: FileList | null): void => {
      if (files === null || files.length === 0) return;
      const file = files[0];
      if (!file) return;
      if (!isTxtFile(file)) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") return;
        onContent(result);
        onFile?.(file.name, file.size);
      };
      reader.readAsText(file);
    },
    [onContent, onFile],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      handleFiles(e.target.files);
      // Reset value so picking the same file twice still fires onChange.
      e.target.value = "";
    },
    [handleFiles],
  );

  const onZoneKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    },
    [disabled, openPicker],
  );

  const onDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    [],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  return (
    <div className={cn("flex flex-col gap-xs", className)}>
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ZONE_LABEL}
        aria-describedby={helperId}
        aria-disabled={disabled || undefined}
        aria-dropeffect={isDragOver ? "copy" : undefined}
        data-disabled={disabled || undefined}
        data-drag-over={isDragOver || undefined}
        data-testid="ingest-dropzone"
        onClick={openPicker}
        onKeyDown={onZoneKeyDown}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-sm rounded-md border-2 border-dashed border-border px-lg py-lg text-center transition",
          "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          "min-h-[6rem]",
          isDragOver && "border-border-focus bg-surface",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer hover:bg-surface",
        )}
      >
        <UploadCloud
          className="size-6 text-muted"
          aria-hidden="true"
        />
        <p className="text-body-sm text-content">
          Arraste um arquivo .txt ou clique para selecionar
        </p>
      </div>
      <p
        id={helperId}
        className="text-caption text-muted"
        data-testid="ingest-dropzone-helper"
      >
        {HELPER_TEXT}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onInputChange}
        data-testid="ingest-dropzone-input"
      />
    </div>
  );
};
