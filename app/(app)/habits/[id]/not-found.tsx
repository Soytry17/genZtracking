import { EmptyState } from "@/components/habit/EmptyState";
import { ROUTES } from "@/lib/habits/constants";

export default function HabitNotFound() {
  return (
    <EmptyState
      title="Habit not found"
      body="It may have been deleted, or the link is wrong."
      action={{ href: ROUTES.habits, label: "All habits" }}
    />
  );
}
