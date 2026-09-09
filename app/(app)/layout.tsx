import { ShellPresence } from "@/components/app/ShellPresence";
import { GamifyProvider } from "@/components/gamify/GamifyProvider";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";
import { displayNameFor, requireSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireSession();
  const name = displayNameFor(user, profile);

  return (
    <GamifyProvider
      xp={profile?.xp ?? 0}
      level={profile?.level ?? 1}
      freezeTokens={profile?.freeze_tokens ?? 0}
    >
      <div className="bg-navy-grid flex min-h-dvh flex-col">
        <ShellPresence>
          <AppSidebar name={name} />
        </ShellPresence>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:pl-[var(--app-sidebar)]">
          <main className="w-full min-w-0 flex-1 px-app pb-tabbar pt-[max(1rem,var(--safe-top))] md:pt-6">
            {children}
          </main>

          <MobileTabBar />
        </div>
      </div>
    </GamifyProvider>
  );
}
