"use client";

import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { XpBar } from "@/components/gamify/XpBar";

/** Header XP / freeze chips that follow Server Action results without a board refetch. */
export function ShellGamifyStats() {
  const { xp, level, freezeTokens } = useGamify();

  return (
    <>
      <div
        data-slot="xp-bar"
        className="hidden min-w-0 max-w-28 sm:block md:max-w-32 lg:max-w-52"
      >
        <XpBar xp={xp} level={level} />
      </div>

      <div data-slot="freeze-tokens" className="shrink-0">
        <FreezeTokens count={freezeTokens} />
      </div>
    </>
  );
}
