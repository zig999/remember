/**
 * SignInPanel — composed sign-in surface (TC-02).
 *
 * Canonical spec:
 *  - docs/specs/front/features/sign-in.feature.spec.md §2 (UI-01).
 *  - temp/login-screen-plan.md §5 (CRT animation), §6 (panel layout).
 *
 * Composition:
 *   <flex centered host>
 *     <motion.div variants={transitionCrtPowerOn}>  ← Phases 1–3 of CRT
 *       <GlassSurface level="panel" animate={false}>  ← R4: own entrance disabled
 *         <motion.div variants={staggerContainer}>      ← Phase 4: content
 *           <motion.h1 variants={listItem}>...
 *           <motion.p  variants={listItem}>...
 *           <SignInForm ... />
 *         </motion.div>
 *       </GlassSurface>
 *     </motion.div>
 *   </flex>
 *
 * Why GlassSurface gets `animate={false}` (R4):
 *  - GlassSurface(level="panel") plays its own enter variant (glass-panel,
 *    opacity 0→1 + y 8→0, 200ms) when `animate=true` (default). The CRT
 *    wrapper already animates the surface; running both at once produces a
 *    visible "double bounce" + breaks the H-sweep/V-open silhouette
 *    (the y-shift fights the scaleY phase).
 *
 * Why a wrapper `motion.div` rather than feeding variants to GlassSurface:
 *  - GlassSurface owns its motion contract (glass-panel/glass-modal) and is
 *    a shared atom — overloading it with custom variants would couple two
 *    independent surfaces. The CRT lives on a sibling wrapper so the spec
 *    contract of GlassSurface stays intact.
 *
 * Reduced-motion (WCAG 2.2 AA):
 *  - `useReducedMotion()` returns `boolean | null`. We coerce `null → false`
 *    (motion allowed) — SSR default. The CRT factory itself returns a fade-
 *    only variant when the boolean is true; the stagger + listItem factories
 *    collapse to zero-duration in the same mode.
 */
import { useReducedMotion, motion as motionLib } from "framer-motion";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface";
import {
  listItem,
  staggerContainer,
  transitionCrtPowerOn,
} from "@/lib/motion";
import { SignInForm, type SignInFormProps } from "./SignInForm";

export interface SignInPanelProps
  extends Pick<
    SignInFormProps,
    "onSubmit" | "isSubmitting" | "error" | "sessionExpired"
  > {
  /** Forwarded to the outer flex host for layout overrides. */
  className?: string;
}

export function SignInPanel({
  onSubmit,
  isSubmitting = false,
  error = null,
  sessionExpired = false,
  className,
}: SignInPanelProps) {
  // `useReducedMotion()` may return null when no preference is detected (SSR
  // or older browsers); coerce to `false` (motion allowed) so the factories
  // receive a strict boolean — see motion.ts factory contract.
  const reducedMotion = useReducedMotion() === true;
  const crtVariants = transitionCrtPowerOn(reducedMotion);
  const staggerVariants = staggerContainer(reducedMotion);
  const itemVariants = listItem(reducedMotion);

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center p-lg",
        className,
      )}
    >
      <motionLib.div
        variants={crtVariants}
        initial="hidden"
        animate="visible"
        // `data-motion-variant` mirrors GlassSurface's pattern so spec-driven
        // tests / Storybook play-functions can assert the active variant.
        data-motion-variant="crt-power-on"
        className="w-full max-w-md"
      >
        <GlassSurface
          level="panel"
          animate={false}
          aria-labelledby="sign-in-heading"
          className="w-full p-xl"
        >
          <motionLib.div
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-lg"
          >
            <motionLib.div variants={itemVariants} className="flex flex-col gap-xs">
              <h1
                id="sign-in-heading"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Bem-vindo ao Remember,
              </h1>
              <p className="text-base text-body">sua memória virtual.</p>
            </motionLib.div>

            <motionLib.div variants={itemVariants}>
              <SignInForm
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                error={error}
                sessionExpired={sessionExpired}
              />
            </motionLib.div>
          </motionLib.div>
        </GlassSurface>
      </motionLib.div>
    </div>
  );
}
