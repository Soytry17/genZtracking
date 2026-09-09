import type { Metadata } from "next";

import { CreateHabitForm } from "@/components/habit/CreateHabitForm";
import { requireSession } from "@/lib/auth";
import { getPresets } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "New habit" };

export default async function NewHabitPage() {
  await requireSession();
  const presets = await getPresets();

  return (
    <div className="w-full space-y-6">
      <header className="pr-[4.75rem] md:pr-24">
        <h1 className="text-2xl font-semibold">New habit</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set a duration to auto-fill the end date, or pick the range yourself.
          Tap the floating ball to start from a template.
        </p>
      </header>
      <CreateHabitForm presets={presets} />
    </div>
  );
}
