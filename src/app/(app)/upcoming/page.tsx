import { TaskWorkspace } from "@/components/tasks/task-workspace";

export default function UpcomingPage() {
  return (
    <TaskWorkspace
      view="upcoming"
      eyebrow="Plan ahead"
      title="Upcoming"
      description="Future tasks grouped by their scheduled date."
    />
  );
}
