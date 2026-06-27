/**
 * IngestPanel — left-column container of `/ingest` (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 (UI-01..UI-09),
 *    §5 (ingestFormSchema — Zod), §7 (Textarea/Select/GlassSurface adapters),
 *    §8 (WCAG 2.2 AA — labels, aria-invalid, aria-describedby), §10
 *    (components to create).
 *
 * Responsibilities:
 *  - Owns the form (RHF v7 + Zod v4): content (1..10MiB) + source_type enum.
 *  - Renders dropzone + textarea + source-type select + "Ingerir" button.
 *  - Mounts the IngestProgressArea (aria-live region) which switches between
 *    sending / extracting / noop / error / summary panels driven by `phase`.
 *  - Disables inputs during sending/extracting/revealing (UI-03/05/07).
 *
 * Does NOT do:
 *  - Network calls — `onSubmit` hands the payload to the parent IngestWorkspace
 *    (TC-05), which owns the mutations + graph wiring.
 *  - Right-column rendering (GraphSpace / NodeDetailPanel) — parent's job.
 *
 * Forbidden imports (TC-04 constraints):
 *  - `features/chat/**` — `/ingest` reuses graph primitives via the
 *    `features/graph/` and global `components/`, never via `chat`.
 */
import { useCallback, useEffect, useId, useRef } from "react";
import type { FC } from "react";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { z, type ZodType } from "zod";
import { Loader2 } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { IngestDropzone } from "../IngestDropzone";
import { IngestProgressArea } from "../IngestProgressArea";
import type {
  IngestPanelProps,
  IngestPhase,
  IngestSourceType,
} from "./IngestPanel.types";

/* ---------- spec-derived constants ---------- */

/** §5 ingestFormSchema: max 10 MiB (10_485_760 chars). */
const MAX_CONTENT_LENGTH = 10_485_760;

/** §5 user messages — verbatim. */
const MSG_CONTENT_EMPTY =
  "Cole ou arraste o conteúdo do documento antes de ingerir.";
const MSG_CONTENT_TOO_LONG =
  "O conteúdo excede o limite de 10 MiB. Reduza o texto.";
const MSG_SOURCE_TYPE_REQUIRED =
  "Selecione o tipo de fonte antes de ingerir.";

/** §8 pt-BR source-type labels. */
const SOURCE_TYPE_LABELS: Readonly<Record<IngestSourceType, string>> = Object.freeze({
  pdf: "PDF",
  email: "E-mail",
  ata: "Ata",
  chat: "Chat",
  artigo: "Artigo",
  transcricao: "Transcrição",
  outro: "Outro",
});

const SOURCE_TYPE_OPTIONS: ReadonlyArray<IngestSourceType> = [
  "pdf",
  "email",
  "ata",
  "chat",
  "artigo",
  "transcricao",
  "outro",
];

const CONTENT_LABEL = "Conteúdo do documento";
const CONTENT_ARIA_LABEL = "Conteúdo do documento";
const CONTENT_PLACEHOLDER = "Cole aqui o conteúdo do documento…";
const SOURCE_TYPE_LABEL = "Tipo de fonte";
const SOURCE_TYPE_PLACEHOLDER = "Selecione o tipo…";

const INGERIR_LABEL = "Ingerir";
const INGERIR_BUSY_LABEL = "Enviando…";
const INGERIR_ARIA_BUSY_LABEL = "Ingerindo…";

/* ---------- Zod schema (§5) ---------- */

const ingestFormSchema = z.object({
  content: z
    .string()
    .min(1, MSG_CONTENT_EMPTY)
    .max(MAX_CONTENT_LENGTH, MSG_CONTENT_TOO_LONG),
  source_type: z.enum(
    ["pdf", "email", "ata", "chat", "artigo", "transcricao", "outro"],
    MSG_SOURCE_TYPE_REQUIRED,
  ),
});

type IngestFormValues = z.infer<typeof ingestFormSchema>;

/**
 * `safeParse`-based Zod resolver — same pattern as Composer.tsx (avoids the
 * `@hookform/resolvers/zod` v3 + Zod v4 `.errors`/`.issues` rename hazard).
 * Single-form scope; do NOT promote to a shared util until the project-wide
 * resolver upgrade lands.
 */
function safeZodResolver<TValues extends FieldValues, TSchema extends ZodType>(
  schema: TSchema,
): Resolver<TValues> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data as TValues, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (errors[path] === undefined) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    }
    return {
      values: {} as TValues,
      errors: errors as never,
    };
  };
}

/* ---------- phase helpers ---------- */

function isFormDisabled(phase: IngestPhase): boolean {
  return (
    phase === "sending" ||
    phase === "extracting" ||
    phase === "revealing" ||
    phase === "complete" ||
    phase === "noop" ||
    phase === "node_selected"
  );
}

/** §2 — "Ingerir" is hidden in UI-04, UI-05, UI-07. We hide it in any phase
 * that is not idle/ready/sending/error (sending shows the spinner state of
 * the same button; error keeps the button visible for retry on the form). */
function showIngerirButton(phase: IngestPhase): boolean {
  return phase === "idle" || phase === "ready" || phase === "sending" || phase === "error";
}

/* ---------- component ---------- */

export const IngestPanel: FC<IngestPanelProps> = ({
  phase,
  progressMessage,
  summary,
  errorCode,
  onSubmit,
  onVerGrafoExistente,
  onIngerirOutro,
  onRetry,
  className,
  style,
}) => {
  const reactId = useId();
  const contentId = `ingest-content-${reactId}`;
  const sourceTypeId = `ingest-source-type-${reactId}`;
  const contentErrorId = `ingest-content-error-${reactId}`;
  const sourceTypeErrorId = `ingest-source-type-error-${reactId}`;

  const form = useForm<IngestFormValues>({
    resolver: safeZodResolver<IngestFormValues, typeof ingestFormSchema>(
      ingestFormSchema,
    ),
    // §5: primary gate is onSubmit; oversized-content live error is handled
    // by RHF mode `onChange`. We use `onChange` so both the empty-on-submit
    // and the >10MiB live error surface correctly (the validation step is
    // identical — the difference is purely a UX-timing decision).
    mode: "onChange",
    defaultValues: {
      content: "",
      // `source_type` starts unset (the placeholder option is selected). We
      // use an empty-string sentinel that the Zod enum rejects — this gives
      // us the "not selected" guard on submit without needing a separate
      // required-flag.
      source_type: "" as unknown as IngestSourceType,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const contentValue = watch("content");
  const sourceTypeValue = watch("source_type");
  const formDisabled = isFormDisabled(phase);
  // §2 UI-01 / UI-02 — button enabled only when both fields are provided.
  // Zod enforces this at validation time, but for the button-disabled gate
  // we look at the field values directly so the button reflects field state
  // before any submit attempt.
  const canSubmit =
    !formDisabled &&
    contentValue.length > 0 &&
    SOURCE_TYPE_OPTIONS.includes(sourceTypeValue as IngestSourceType);

  const contentError = errors.content?.message;
  const sourceTypeError = errors.source_type?.message;

  const submitHandler = useCallback<SubmitHandler<IngestFormValues>>(
    (values) => {
      onSubmit({
        content: values.content,
        source_type: values.source_type,
      });
    },
    [onSubmit],
  );

  /** When the parent resets to `idle` (e.g. after "Ingerir outro documento"),
   * clear the form. We use a ref-based latch to detect the transition rather
   * than tracking previous phase — simpler + sufficient. */
  const prevPhaseRef = useRef<IngestPhase>(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "idle" && phase === "idle") {
      reset({
        content: "",
        source_type: "" as unknown as IngestSourceType,
      });
    }
    prevPhaseRef.current = phase;
  }, [phase, reset]);

  /** Dropzone → form integration: setValue with shouldValidate so the
   * onChange validators run and the submit button enables immediately. */
  const onDropzoneContent = useCallback(
    (text: string) => {
      setValue("content", text, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  return (
    <GlassSurface
      level="ambient"
      role="region"
      aria-label="Ingerir documento"
      animate={false}
      className={cn(
        "flex flex-col gap-md h-full p-lg",
        className,
      )}
      style={style}
      data-testid="ingest-panel"
      data-phase={phase}
    >
      <form
        onSubmit={(e) => {
          void handleSubmit(submitHandler)(e);
        }}
        noValidate
        className="flex flex-col gap-md"
        data-testid="ingest-panel-form"
      >
        <IngestDropzone
          onContent={onDropzoneContent}
          disabled={formDisabled}
        />

        {/* Content textarea — §7 Textarea adapter */}
        <div className="flex flex-col gap-xs">
          <label
            htmlFor={contentId}
            className="text-label font-semibold text-content"
          >
            {CONTENT_LABEL}
          </label>
          <Textarea
            id={contentId}
            placeholder={CONTENT_PLACEHOLDER}
            aria-label={CONTENT_ARIA_LABEL}
            invalid={contentError !== undefined}
            disabled={formDisabled}
            aria-describedby={
              contentError !== undefined ? contentErrorId : undefined
            }
            data-testid="ingest-content-textarea"
            {...register("content")}
          />
          {contentError !== undefined && (
            <p
              id={contentErrorId}
              role="alert"
              className="text-caption text-state-disputed-fg"
              data-testid="ingest-content-error"
            >
              {contentError}
            </p>
          )}
        </div>

        {/* Source type select — §7 Select adapter */}
        <div className="flex flex-col gap-xs">
          <label
            htmlFor={sourceTypeId}
            className="text-label font-semibold text-content"
          >
            {SOURCE_TYPE_LABEL}
          </label>
          <Select
            // exactOptionalPropertyTypes: omit `value` entirely when the
            // form has no selection (the placeholder is shown via SelectValue).
            {...(SOURCE_TYPE_OPTIONS.includes(sourceTypeValue as IngestSourceType)
              ? { value: sourceTypeValue }
              : {})}
            onValueChange={(v) => {
              setValue("source_type", v as IngestSourceType, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            disabled={formDisabled}
          >
            <SelectTrigger
              id={sourceTypeId}
              aria-label={SOURCE_TYPE_LABEL}
              aria-invalid={sourceTypeError !== undefined || undefined}
              aria-describedby={
                sourceTypeError !== undefined ? sourceTypeErrorId : undefined
              }
              data-testid="ingest-source-type-trigger"
            >
              <SelectValue placeholder={SOURCE_TYPE_PLACEHOLDER} />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPE_OPTIONS.map((key) => (
                <SelectItem key={key} value={key} data-testid={`ingest-source-type-option-${key}`}>
                  {SOURCE_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sourceTypeError !== undefined && (
            <p
              id={sourceTypeErrorId}
              role="alert"
              className="text-caption text-state-disputed-fg"
              data-testid="ingest-source-type-error"
            >
              {sourceTypeError}
            </p>
          )}
        </div>

        {/* Ingerir button — hidden in UI-04/UI-05/UI-07 */}
        {showIngerirButton(phase) && (
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              size="md"
              disabled={!canSubmit}
              aria-busy={phase === "sending" || undefined}
              aria-label={
                phase === "sending" ? INGERIR_ARIA_BUSY_LABEL : INGERIR_LABEL
              }
              data-testid="ingest-submit-button"
            >
              {phase === "sending" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {INGERIR_BUSY_LABEL}
                </>
              ) : (
                INGERIR_LABEL
              )}
            </Button>
          </div>
        )}
      </form>

      <IngestProgressArea
        phase={phase}
        {...(progressMessage !== undefined ? { progressMessage } : {})}
        {...(summary !== undefined ? { summary } : {})}
        {...(errorCode !== undefined ? { errorCode } : {})}
        {...(onVerGrafoExistente !== undefined ? { onVerGrafoExistente } : {})}
        {...(onIngerirOutro !== undefined ? { onIngerirOutro } : {})}
        {...(onRetry !== undefined ? { onRetry } : {})}
      />
    </GlassSurface>
  );
};
