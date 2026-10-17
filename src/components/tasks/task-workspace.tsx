"use client";

import {
  Check,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskDto } from "@/lib/tasks/serialize";
import { cn } from "@/lib/utils";

export type TaskView = "today" | "upcoming" | "all" | "completed";

type TaskWorkspaceProps = {
  view: TaskView;
  eyebrow: string;
  title: string;
  description: string;
  allowCreate?: boolean;
};

export function TaskWorkspace({
  view,
  eyebrow,
  title,
  description,
  allowCreate = true,
}: TaskWorkspaceProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [timeZone, setTimeZone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("due");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ view, sort });
    if (search.trim()) params.set("search", search.trim());
    if (priority) params.set("priority", priority);
    if (view === "all" && status) params.set("status", status);

    const response = await fetch(`/api/tasks?${params}`);
    if (response.status === 401) {
      router.push("/login");
      router.refresh();
      return;
    }

    const result = (await response.json()) as {
      tasks?: TaskDto[];
      timezone?: string;
      error?: string;
    };

    if (!response.ok) {
      setError(result.error ?? "Tasks could not be loaded.");
      setLoading(false);
      return;
    }

    setTasks(result.tasks ?? []);
    setTimeZone(result.timezone ?? "UTC");
    setLoading(false);
  }, [priority, router, search, sort, status, view]);

  useEffect(() => {
    const timer = window.setTimeout(loadTasks, 250);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  function openCreate() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  function openEdit(task: TaskDto) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  async function updateStatus(task: TaskDto) {
    setActionId(task.id);
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED",
      }),
    });

    setActionId(null);
    if (!response.ok) {
      setError("The task status could not be updated.");
      return;
    }
    await loadTasks();
  }

  async function deleteTask(task: TaskDto) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;

    setActionId(task.id);
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });
    setActionId(null);

    if (!response.ok) {
      setError("The task could not be deleted.");
      return;
    }
    await loadTasks();
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate}>
            <Plus size={17} />
            Add task
          </Button>
        ) : null}
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-64 flex-1">
            <span className="sr-only">Search tasks</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-3 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or description"
              className="min-w-64 pl-10"
            />
          </label>
          {view === "all" ? (
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="h-11 rounded-xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          ) : null}
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            aria-label="Filter by priority"
            className="h-11 rounded-xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All priorities</option>
            <option value="HIGH">High priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="LOW">Low priority</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort tasks"
            className="h-11 rounded-xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary"
          >
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="created">Recently created</option>
          </select>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <button className="font-semibold hover:underline" onClick={loadTasks}>
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <TaskLoading />
          ) : tasks.length ? (
            view === "upcoming" ? (
              <UpcomingGroups
                tasks={tasks}
                timeZone={timeZone}
                actionId={actionId}
                onEdit={openEdit}
                onStatus={updateStatus}
                onDelete={deleteTask}
              />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    timeZone={timeZone}
                    busy={actionId === task.id}
                    onEdit={openEdit}
                    onStatus={updateStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyTasks view={view} onCreate={allowCreate ? openCreate : undefined} />
          )}
        </div>
      </section>

      {dialogOpen ? (
        <TaskDialog
          open
          task={editingTask}
          timeZone={timeZone}
          onClose={() => setDialogOpen(false)}
          onSaved={loadTasks}
        />
      ) : null}
    </main>
  );
}

type TaskActions = {
  actionId?: number | null;
  onEdit: (task: TaskDto) => void;
  onStatus: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
};

function UpcomingGroups({
  tasks,
  timeZone,
  actionId,
  ...actions
}: { tasks: TaskDto[]; timeZone: string } & TaskActions) {
  const groups = tasks.reduce<Record<string, TaskDto[]>>((result, task) => {
    const key = task.dueAt
      ? new Intl.DateTimeFormat("en", {
          timeZone,
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(new Date(task.dueAt))
      : "No due date";
    (result[key] ??= []).push(task);
    return result;
  }, {});

  return (
    <div className="space-y-7">
      {Object.entries(groups).map(([date, group]) => (
        <section key={date}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{date}</h2>
          <div className="space-y-3">
            {group.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                timeZone={timeZone}
                busy={actionId === task.id}
                {...actions}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  timeZone,
  busy,
  onEdit,
  onStatus,
  onDelete,
}: { task: TaskDto; timeZone: string; busy: boolean } & Omit<TaskActions, "actionId">) {
  const overdue =
    task.status === "PENDING" &&
    task.dueAt !== null &&
    new Date(task.dueAt) < new Date();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-2xl border border-border bg-background/55 p-4"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => onStatus(task)}
        aria-label={task.status === "COMPLETED" ? "Reopen task" : "Complete task"}
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
          task.status === "COMPLETED"
            ? "border-success bg-success text-white"
            : "border-primary/45 hover:border-primary",
        )}
      >
        {task.status === "COMPLETED" ? <Check size={14} /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={cn(
                "truncate font-semibold",
                task.status === "COMPLETED" && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </h3>
            {task.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {task.description}
              </p>
            ) : null}
          </div>
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1.5", overdue && "font-semibold text-destructive")}>
            <Clock3 size={14} />
            {task.dueAt
              ? `${overdue ? "Overdue · " : ""}${formatDateTime(task.dueAt, timeZone)}`
              : "No due date"}
          </span>
          {task.completedAt ? (
            <span>Completed {formatDateTime(task.completedAt, timeZone)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Edit task"
          onClick={() => onEdit(task)}
        >
          <Pencil size={16} />
        </Button>
        {task.status === "COMPLETED" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Reopen task"
            disabled={busy}
            onClick={() => onStatus(task)}
          >
            <RotateCcw size={16} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete task"
          disabled={busy}
          className="hover:text-destructive"
          onClick={() => onDelete(task)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </motion.article>
  );
}

function PriorityBadge({ priority }: { priority: TaskDto["priority"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        priority === "HIGH" && "bg-destructive/10 text-destructive",
        priority === "MEDIUM" && "bg-primary/10 text-primary",
        priority === "LOW" && "bg-success/10 text-success",
      )}
    >
      {priority.toLowerCase()}
    </span>
  );
}

function TaskLoading() {
  return (
    <div className="space-y-3" aria-label="Loading tasks">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function EmptyTasks({
  view,
  onCreate,
}: {
  view: TaskView;
  onCreate?: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 size={25} />
        </span>
        <h2 className="mt-4 font-semibold">
          {view === "completed" ? "Nothing completed yet" : "No tasks here"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {view === "completed"
            ? "Completed work will appear here."
            : "Create a task and give your day a clear next step."}
        </p>
        {onCreate ? (
          <Button className="mt-5" onClick={onCreate}>
            <Plus size={16} />
            Create task
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
