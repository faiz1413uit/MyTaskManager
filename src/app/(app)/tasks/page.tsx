import { TaskWorkspace } from "@/components/tasks/task-workspace";

export default function AllTasksPage() {
  return (
    <TaskWorkspace
      view="all"
      eyebrow="Everything in one place"
      title="All tasks"
      description="Search, filter, and manage every task in your workspace."
    />
  );
}
