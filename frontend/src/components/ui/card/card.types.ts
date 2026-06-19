/**
 * Card — public type contract (DS port §4.4). Composition, no variants/state.
 * Each part is its element's intrinsic props + a React 19 ref-as-prop.
 */
import type { ComponentProps, Ref } from "react";

export interface CardProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
export interface CardHeaderProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
export interface CardTitleProps extends ComponentProps<"h3"> {
  ref?: Ref<HTMLHeadingElement>;
}
export interface CardDescriptionProps extends ComponentProps<"p"> {
  ref?: Ref<HTMLParagraphElement>;
}
export interface CardContentProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
export interface CardFooterProps extends ComponentProps<"div"> {
  ref?: Ref<HTMLDivElement>;
}
