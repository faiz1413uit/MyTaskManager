import { AlertTriangle, CheckCircle2, ListTodo, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  dateKey,
  getDayRange,
  getRecentDayRange,
  recentDateKeys,
} from "@/lib/date";
import { db } from "@/lib/db";

export default async function ActivityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const today = getDayRange(user.timezone, now);
  const period = getRecentDayRange(user.timezone, 7);
  const userId = BigInt(user.id);

  const [pending, overdue, completedToday, completedInPeriod, tasksDueInPeriod] =
    await Promise.all([
      db.task.count({ where: { userId, status: "PENDING" } }),
      db.task.count({
        where: { userId, status: "PENDING", dueAt: { lt: now } },
      }),
      db.task.count({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: today.start, lt: today.end },
        },
      }),
      db.task.findMany({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: period.start, lt: period.end },
        },
        orderBy: { completedAt: "desc" },
        select: { id: true, title: true, completedAt: true },
      }),
      db.task.findMany({
        where: {
          userId,
          dueAt: { gte: period.start, lt: period.end },
        },
        select: { status: true },
      }),
    ]);

  const completedDue = tasksDueInPeriod.filter(
    ({ status }) => status === "COMPLETED",
  ).length;
  const completionRate = tasksDueInPeriod.length
    ? Math.round((completedDue / tasksDueInPeriod.length) * 100)
    : 0;
  const counts = completedInPeriod.reduce<Record<string, number>>(
    (result, task) => {
      if (task.completedAt) {
        const key = dateKey(task.completedAt, user.timezone);
        result[key] = (result[key] ?? 0) + 1;
      }
      return result;
    },
    {},
  );
  const trend = recentDateKeys(user.timezone, 7).map((key) => ({
    key,
    value: counts[key] ?? 0,
  }));
  const maxValue = Math.max(...trend.map(({ value }) => value), 1);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:px-8 lg:pb-12 lg:pt-10">
      <p className="text-sm font-semibold text-primary">Last 7 days</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Activity
      </h1>
      <p className="mt-2 text-muted-foreground">
        A real-time view of completed work and remaining commitments.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Completed today" value={completedToday} icon={<CheckCircle2 size={18} />} />
        <Metric label="Completed this week" value={completedInPeriod.length} icon={<TrendingUp size={18} />} />
        <Metric label="Pending" value={pending} icon={<ListTodo size={18} />} />
        <Metric label="Overdue" value={overdue} icon={<AlertTriangle size={18} />} danger />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div>
            <p className="text-sm font-semibold text-primary">Completion trend</p>
            <h2 className="mt-1 text-xl font-bold">Tasks completed by day</h2>
          </div>
          <div className="mt-8 flex h-52 items-end gap-3 sm:gap-5">
            {trend.map(({ key, value }) => (
              <div key={key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className="mb-2 text-center text-xs font-semibold">{value}</span>
                <div className="flex h-40 items-end rounded-xl bg-muted/70 px-1.5 pt-1.5">
                  <div
                    className="w-full rounded-lg bg-primary transition-[height]"
                    style={{
                      height: value ? `${Math.max((value / maxValue) * 100, 12)}%` : "0%",
                    }}
                  />
                </div>
                <span className="mt-2 truncate text-center text-[11px] text-muted-foreground">
                  {new Intl.DateTimeFormat("en", {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(`${key}T12:00:00Z`))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <p className="text-sm font-semibold text-primary">Completion rate</p>
          <div className="mt-6 grid place-items-center">
            <div
              className="grid size-40 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--primary) ${completionRate}%, var(--muted) 0)`,
              }}
            >
              <div className="grid size-28 place-items-center rounded-full bg-card">
                <span className="text-3xl font-bold">{completionRate}%</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Completed tasks divided by all tasks due during the last seven days.
            Tasks without due dates are excluded.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <p className="text-sm font-semibold text-primary">Task history</p>
        <h2 className="mt-1 text-xl font-bold">Recently completed</h2>
        <div className="mt-5 divide-y divide-border">
          {completedInPeriod.length ? (
            completedInPeriod.slice(0, 10).map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CheckCircle2 size={17} className="shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
                </span>
                <time className="text-xs text-muted-foreground">
                  {task.completedAt
                    ? new Intl.DateTimeFormat("en", {
                        timeZone: user.timezone,
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(task.completedAt)
                    : ""}
                </time>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Complete a task to start building your activity history.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          danger
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </span>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </article>
  );
}
