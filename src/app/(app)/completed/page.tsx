import { TaskWorkspace } from "@/components/tasks/task-workspace";

export default function CompletedPage() {
  return (
    <TaskWorkspace
      view="completed"
      eyebrow="Progress"
      title="Completed"
      description="Review finished work or reopen a task that needs more attention."
      allowCreate={false}
    />
  );
}
