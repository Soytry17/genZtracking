import type { ReactNode } from "react";

/**
 * CSS enter for route content. Used from `template.tsx` so it remounts on
 * navigation. Default styles stay fully visible — animation is additive.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
