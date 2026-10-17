import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDayRange, getRecentDayRange } from "@/lib/date";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const today = getDayRange(user.timezone, now);
  const recent = getRecentDayRange(user.timezone, 7);
  const userId = BigInt(user.id);

  const [
    pending,
    completed,
    overdue,
    todayTotal,
    todayCompleted,
    completedThisWeek,
    upcoming,
    recentCompleted,
  ] = await Promise.all([
    db.task.count({ where: { userId, status: "PENDING" } }),
    db.task.count({ where: { userId, status: "COMPLETED" } }),
    db.task.count({
      where: { userId, status: "PENDING", dueAt: { lt: now } },
    }),
    db.task.count({
      where: { userId, dueAt: { gte: today.start, lt: today.end } },
    }),
    db.task.count({
      where: {
        userId,
        status: "COMPLETED",
        dueAt: { gte: today.start, lt: today.end },
      },
    }),
    db.task.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: recent.start, lt: recent.end },
      },
    }),
    db.task.findMany({
      where: { userId, status: "PENDING", dueAt: { gte: today.end } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    db.task.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 4,
    }),
  ]);

  const progress = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">
            {new Intl.DateTimeFormat("en", {
              timeZone: user.timezone,
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(now)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Focus on what matters and keep your momentum visible.
          </p>
        </div>
        <Link
          href="/today"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Open today
          <ArrowRight size={16} />
        </Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending"
          value={pending}
          icon={<ListTodo size={18} />}
          href="/tasks"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={<CheckCircle2 size={18} />}
          tone="success"
          href="/completed"
        />
        <StatCard
          label="Overdue"
          value={overdue}
          icon={<AlertTriangle size={18} />}
          tone="danger"
          href="/today"
        />
        <StatCard
          label="Done this week"
          value={completedThisWeek}
          icon={<Clock3 size={18} />}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Today’s progress</p>
              <h2 className="mt-1 text-xl font-bold">
                {todayCompleted} of {todayTotal} tasks complete
              </h2>
            </div>
            <span className="text-3xl font-bold text-primary">{progress}%</span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {todayTotal === 0
              ? "Nothing is scheduled today. Add a task when you are ready."
              : progress === 100
                ? "Everything scheduled for today is complete."
                : `${todayTotal - todayCompleted} task${todayTotal - todayCompleted === 1 ? "" : "s"} left today.`}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Coming up</p>
              <h2 className="mt-1 text-xl font-bold">Nearest deadlines</h2>
            </div>
            <CalendarClock size={20} className="text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length ? (
              upcoming.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3"
                >
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(task.dueAt, user.timezone)}
                  </time>
                </div>
              ))
            ) : (
              <p className="py-7 text-center text-sm text-muted-foreground">
                No upcoming deadlines.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Recent activity</p>
            <h2 className="mt-1 text-xl font-bold">Latest completed work</h2>
          </div>
          <Link href="/activity" className="text-sm font-semibold text-primary hover:underline">
            View analytics
          </Link>
        </div>
        <div className="mt-5 divide-y divide-border">
          {recentCompleted.length ? (
            recentCompleted.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CheckCircle2 size={17} className="shrink-0 text-success" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</p>
                <time className="text-xs text-muted-foreground">
                  {formatDate(task.completedAt, user.timezone)}
                </time>
              </div>
            ))
          ) : (
            <p className="py-7 text-center text-sm text-muted-foreground">
              Completed tasks will appear here.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "primary" | "success" | "danger";
  href?: string;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
  };

  const content = (
    <article className="h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
      <span className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}>
        {icon}
      </span>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label} tasks</p>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function formatDate(date: Date | null, timeZone: string) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
