import type { Metadata } from "next";

import { BadgeGrid } from "@/components/gamify/BadgeGrid";
import { GoalBadgeGrid } from "@/components/gamify/GoalBadgeGrid";
import { XpBar } from "@/components/gamify/XpBar";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Pill,
} from "@/components/ui";
import { displayNameFor, requireSession } from "@/lib/auth";
import { progressToNextLevel } from "@/lib/gamify/rules";
import { formatISODate } from "@/lib/habits/dates";
import { getBadges, getGoalBadges, getUserBadges } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireSession();
  const name = displayNameFor(user, profile);
  const [badges, earned, goalBadges] = await Promise.all([
    getBadges(),
    getUserBadges(user.id),
    getGoalBadges(user.id),
  ]);
  const progress = progressToNextLevel(profile?.xp ?? 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="truncate">{name}</CardTitle>
          <CardDescription className="break-all">{user.email}</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <XpBar
            xp={profile?.xp ?? 0}
            level={profile?.level ?? 1}
            className="w-full min-w-0"
          />
          <div className="flex flex-wrap gap-2">
            <Pill tone="brand">Level {profile?.level ?? 1}</Pill>
            {profile?.username ? <Pill>@{profile.username}</Pill> : null}
            <Pill tone="xp">{profile?.xp ?? 0} XP</Pill>
            <Pill tone="freeze">❄ {profile?.freeze_tokens ?? 0} freezes</Pill>
            {profile ? (
              <Pill>Joined {formatISODate(profile.created_at.slice(0, 10))}</Pill>
            ) : null}
            {!progress.isMaxLevel ? (
              <Pill>
                {progress.xpForNext - progress.xpIntoLevel} XP to level{" "}
                {progress.level + 1}
              </Pill>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div data-slot="goal-badge-grid">
        <GoalBadgeGrid badges={goalBadges} />
      </div>

      <div data-slot="badge-grid">
        <BadgeGrid badges={badges} earned={earned} />
      </div>
    </div>
  );
}
