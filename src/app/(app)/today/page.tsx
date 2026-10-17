import { redirect } from "next/navigation";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { getCurrentUser } from "@/lib/auth/session";

export default async function TodayPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  return (
    <TaskWorkspace
      view="today"
      eyebrow={new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now)}
      title={`Good ${getGreeting(now)}, ${user.name.split(" ")[0]}`}
      description="Today’s tasks and anything overdue that still needs attention."
    />
  );
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
