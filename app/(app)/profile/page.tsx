import type { Metadata } from "next";

import { BadgeGrid } from "@/components/gamify/BadgeGrid";
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
import { getBadges, getUserBadges } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireSession();
  const name = displayNameFor(user, profile);
  const [badges, earned] = await Promise.all([
    getBadges(),
    getUserBadges(user.id),
  ]);
  const progress = progressToNextLevel(profile?.xp ?? 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
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
        </CardBody>
      </Card>

      <div data-slot="badge-grid">
        <BadgeGrid badges={badges} earned={earned} />
      </div>
    </div>
  );
}
