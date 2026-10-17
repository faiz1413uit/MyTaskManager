"use client";

import { LoaderCircle, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fromZonedDateTime, toZonedDateTimeInput } from "@/lib/date";
import type { TaskDto } from "@/lib/tasks/serialize";

type TaskDialogProps = {
  open: boolean;
  task: TaskDto | null;
  timeZone: string;
  onClose: () => void;
  onSaved: () => void;
};

export function TaskDialog({
  open,
  task,
  timeZone,
  onClose,
  onSaved,
}: TaskDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") ?? "");
    const reminderAt = String(form.get("reminderAt") ?? "");
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      priority: String(form.get("priority") ?? "MEDIUM"),
      dueAt: dueAt ? fromZonedDateTime(dueAt, timeZone).toISOString() : null,
      reminderAt: reminderAt
        ? fromZonedDateTime(reminderAt, timeZone).toISOString()
        : null,
    };

    const response = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
      method: task ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(result.error ?? "The task could not be saved.");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              {task ? "Task details" : "Quick capture"}
            </p>
            <h2 id="task-dialog-title" className="mt-1 text-2xl font-bold">
              {task ? "Edit task" : "Create a new task"}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close task form"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field label="Title">
            <Input
              name="title"
              required
              maxLength={255}
              autoFocus
              defaultValue={task?.title ?? ""}
              placeholder="What needs to be done?"
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              defaultValue={task?.description ?? ""}
              placeholder="Add useful context (optional)"
              className="w-full resize-none rounded-xl border border-border bg-card/80 px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date and time">
              <Input
                name="dueAt"
                type="datetime-local"
                defaultValue={toZonedDateTimeInput(task?.dueAt, timeZone)}
              />
            </Field>
            <Field label="Reminder">
              <Input
                name="reminderAt"
                type="datetime-local"
                defaultValue={toZonedDateTimeInput(task?.reminderAt, timeZone)}
              />
            </Field>
          </div>

          <Field label="Priority">
            <select
              name="priority"
              defaultValue={task?.priority ?? "MEDIUM"}
              className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={pending}>
              {pending ? <LoaderCircle size={17} className="animate-spin" /> : null}
              {task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

