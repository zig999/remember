# ChatBubble — Component Spec

> Path: `frontend/src/components/ds/ChatBubble/`
> COMP-03 | Used in features: chat (`MessageStream`)
> Status: draft | Layer: permanent

---

## §1 Purpose and Responsibilities

`ChatBubble` is the **shared DS atom** for every message in the chat pane — both user and assistant, both persisted history and live streaming. It composes:

- `GlassSurface` at `level="modal"` (heaviest glass tier) as the visible surface. The `level="modal"` picks only the glass material (blur + shadow + radius); z-index is NOT assigned by the bubble — the positioning context (the pane) owns stacking.
- `chatBubble` CVA factory for the outer wrapper: controls alignment (`self-end` for user, `self-start` for assistant) and max-width (`max-w-[75ch]`).
- `transitionGlassModal` factory from `lib/motion.ts` for the entrance animation — the same factory used when a Dialog opens.
- Optional `ToolCallChip`-compatible stub slots above the text content.
- Optional inline streaming cursor at the tail of the text.

The bubble is **NOT** a modal in the ARIA sense: no `role="dialog"`, no focus trap, no `tabIndex`, no scrim. `level="modal"` is a glass material choice only.

**Responsibilities:**
- Rendering the aligned, glass-surfaced wrapper for a single message.
- Encoding the four rendered states (idle, streaming, error, stopped) into the appropriate `data-state` attribute, `aria-busy`, and `GlassSurface accent` props.
- Playing the `transitionGlassModal` entrance on first mount (when `animate={true}`).
- Rendering tool-call chip stubs above the text (chips slot → caller provides `toolChips` array).

**Out of scope (this component deliberately does NOT):**
- Lay out the conversation scroll container or manage autoscroll.
- Manage SSE connection or streaming state — those are feature-layer concerns.
- Render the real `ToolCallChip` feature component — the DS atom renders a presentational stub; the feature-local `ToolCallChip` is composed by the feature layer.
- Assign `z-modal` or any z-index — the pane positions the bubble at `z-base`.
- Capture focus or trap keyboard navigation.

---

## §2 Props Contract

```ts
// src/components/ds/ChatBubble/ChatBubble.types.ts
import type { ComponentPropsWithoutRef, Ref } from "react";
import type { ToolCallData } from "@/features/chat/types";

export type ChatBubbleVariant = "user" | "assistant";

export type ChatBubbleProps = Omit<ComponentPropsWithoutRef<"div">, "content"> & {
  variant: ChatBubbleVariant;
  content: string;
  streaming?: boolean;
  error?: boolean;
  stopReason?: string;
  animate?: boolean;
  toolChips?: ReadonlyArray<ToolCallData>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};
```

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `"user" \| "assistant"` | yes | — | Alignment and tonal direction. `"user"` → right-aligned; `"assistant"` → left-aligned. |
| `content` | `string` | yes | — | Text content. Empty string is legal (streaming bubble starts empty). |
| `streaming` | `boolean` | no | `false` | True while SSE turn is open. Adds `aria-busy="true"` and renders the inline `StreamingCursorStub` at the text tail. |
| `error` | `boolean` | no | `false` | True when the turn ended in error. Switches `GlassSurface accent` to `"error"` (red border). |
| `stopReason` | `string` | no | `undefined` | Only `"cancelled"` renders the "Resposta interrompida" notice below the bubble. All other values (including `"end_turn"`, `"max_tokens"`, etc.) produce no visible notice. |
| `animate` | `boolean` | no | `true` | Play the `transitionGlassModal` entrance animation on mount. Pass `false` for history bubbles on initial load (no cascade). Reduced motion is always honored regardless of this prop. |
| `toolChips` | `ReadonlyArray<ToolCallData>` | no | `undefined` | Tool-call chip data rendered above the text. The DS atom uses stub rendering (tool name only); the feature layer replaces stubs with real `ToolCallChip` components. |
| `className` | `string` | no | `undefined` | Merged onto the outer wrapper via `cn()`. |
| `ref` | `Ref<HTMLDivElement>` | no | `undefined` | React 19 ref-as-prop, forwarded to the outer wrapper `<div>`. |

---

## §3 Component States

| State | Entry condition | `data-state` | Visible behavior |
|---|---|---|---|
| `idle` | Default — persisted message, no special condition | `"idle"` | Standard glass bubble; no cursor, no notice. |
| `streaming` | `streaming={true}` | `"streaming"` | `aria-busy="true"` on wrapper; `StreamingCursorStub` appended inline at text tail; `GlassSurface accent="none"`. |
| `error` | `error={true}` | `"error"` | `GlassSurface accent="error"` (red border). No cursor. |
| `stopped` | `stopReason="cancelled"` | `"stopped"` | Standard glass bubble; "Resposta interrompida" caption below the surface. Any other `stopReason` renders no notice (`"end_turn"`, `"max_tokens"`, `"stop_sequence"`, `"max_iterations"`, `"turn_timeout"`, `"provider_error"`, `"internal_error"` → silent). |
| `entering` | `animate={true}` AND first mount | (animation only — `data-state` reflects the logical state above) | `transitionGlassModal` factory plays once (fade-in + slight upward scale). `prefers-reduced-motion` gates it. |

State precedence: `error` > `streaming` > `stopped` > `idle`. `data-state` reflects the first applicable state.

---

## §4 Events Emitted

This component emits no custom events. It is a pure presentation atom. All state is driven by props from the parent.

---

## §5 Variants and Compositions

| Variant | Props combination | Usage context |
|---|---|---|
| User bubble (history) | `variant="user" content="..." animate={false}` | Persisted user messages in `MessageStream` |
| Assistant bubble (history) | `variant="assistant" content="..." animate={false}` | Persisted assistant messages in `MessageStream` |
| Streaming assistant bubble | `variant="assistant" content={streamingText} streaming animate` | Live in-flight turn in `MessageStream` |
| Error bubble | `variant="assistant" content={errMsg} error animate={false}` | Post-error display (if applicable) |
| Cancelled bubble | `variant="assistant" content="..." stopReason="cancelled" animate={false}` | When turn was aborted; shows "Resposta interrompida" |
| Bubble with tool chips | `variant="assistant" content="..." toolChips={[...]} streaming` | Live streaming turn with tool activity |

---

## §6 Do / Don't

**Do:**

```tsx
// Persisted history bubble — no entrance animation on initial load
<ChatBubble variant={m.role} content={joinContent(m.content)} animate={false} />

// Streaming bubble
<ChatBubble key="streaming" variant="assistant" content={streamingText} streaming animate />

// Cancelled turn
<ChatBubble variant="assistant" content="..." stopReason="cancelled" animate={false} />
```

**Don't:**

```tsx
// Do NOT add z-modal — the bubble is at z-base
<ChatBubble className="z-modal" ... />  // WRONG

// Do NOT set streaming on a user bubble
<ChatBubble variant="user" streaming ... />  // WRONG — only assistant turns stream

// Do NOT pass animate={true} for all history bubbles on initial render
// (would cascade-animate a 50-message history on mount)
messages.map(m => <ChatBubble key={m.id} ... animate={true} />)  // WRONG

// Do NOT use role="dialog" — ChatBubble is not a modal
<ChatBubble role="dialog" ... />  // WRONG
```

---

## §7 BDD Scenarios

### Scenario 1 — Render default user bubble

**Given** `variant="user"` and `content="Quem é o Rodrigo?"`  
**When** the component renders  
**Then** `data-variant="user"` is set on the root wrapper  
**And** `data-state="idle"` is set  
**And** the text "Quem é o Rodrigo?" is visible in `[data-testid="bubble-content"]`  
**And** `[data-testid="streaming-cursor"]` is absent  
**And** `[data-testid="stop-notice"]` is absent  

### Scenario 2 — Streaming state with aria-busy

**Given** `variant="assistant"`, `content=""`, `streaming={true}`  
**When** the component renders  
**Then** `data-state="streaming"` is set  
**And** `aria-busy="true"` is set on the root wrapper  
**And** `[data-testid="streaming-cursor"]` is present  
**And** `aria-hidden="true"` is set on the cursor  

### Scenario 3 — Error state — red glass border

**Given** `variant="assistant"`, `content="Algo deu errado."`, `error={true}`  
**When** the component renders  
**Then** `data-state="error"` is set  
**And** the inner `GlassSurface` has `accent="error"` applied (verify `data-accent` or class)  
**And** `aria-busy` is absent  

### Scenario 4 — Cancelled stop reason shows notice

**Given** `variant="assistant"`, `content="Resposta parcial."`, `stopReason="cancelled"`  
**When** the component renders  
**Then** `data-state="stopped"` is set  
**And** `[data-testid="stop-notice"]` is visible with text "Resposta interrompida"  

### Scenario 5 — Non-cancelled stop reason shows no notice

**Given** `variant="assistant"`, `content="Resposta completa."`, `stopReason="end_turn"`  
**When** the component renders  
**Then** `data-state="idle"` is set  
**And** `[data-testid="stop-notice"]` is absent  

### Scenario 6 — Keyboard navigation — no focus trap

**Given** the bubble is rendered inside `MessageStream`  
**When** the user `Tab`s through the page  
**Then** the bubble wrapper does NOT capture focus (no `tabIndex`)  
**And** focus moves to the next interactive element outside the bubble  

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| `aria-busy="true"` during streaming | Set on the outer wrapper `<div>` when `streaming={true}`; removed when `streaming` flips false. The live region (`aria-live="polite"`) is on the parent `MessageStream` section — NOT on the bubble. |
| Streaming cursor hidden from AT | `aria-hidden="true"` on `StreamingCursorStub` always. |
| Stop notice is informational | The "Resposta interrompida" paragraph carries no `role="alert"` or `role="status"` — it is static text that enters with the bubble after `done{stop_reason:"cancelled"}`. AT reads it in document order. |
| No focus trap | No `tabIndex`, no `role="dialog"` — the bubble is never a modal surface. |
| `GlassSurface level="modal"` does not imply a dialog role | `GlassSurface` defaults to `role="group"` when no `role` prop is passed; the bubble never passes `role`. Consumers MUST NOT infer dialog semantics from the glass level. |
| Tool chips accessible | Each chip stub has `data-ok` attribute encoding state; the real `ToolCallChip` (feature-local) carries `role="status"` + `aria-label`. |
| Motion | Entrance animation via `transitionGlassModal`; respects `prefers-reduced-motion` through `useReducedMotion()` hook (Framer Motion). When reduced motion is preferred, `animate` is forced to `false` regardless of the prop. |

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Regenerated from implemented code (`ChatBubble.tsx`, `ChatBubble.types.ts`, `ChatBubble.variants.ts`). 4 states, 2 variants axis, entrance animation, tool-chip stub slot. |
