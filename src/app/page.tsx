import { ArrowRight, Check, Circle, Clock3 } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
          {!user ? (
            <Link
              href="/register"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Get started
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-20 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="mb-5 text-sm font-semibold text-primary">
            Personal productivity, without the noise
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-6xl">
            A calmer way to get things done.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Organize your day, focus on what matters, and keep every deadline
            within reach.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {user ? "Open dashboard" : "Start planning"}
              <ArrowRight size={17} />
            </Link>
            {!user ? (
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold transition hover:bg-muted"
              >
                I have an account
              </Link>
            ) : null}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Check size={15} className="text-success" /> Private by default
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={15} className="text-success" /> Built for every screen
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="hero-glow" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-border/80 bg-card/90 p-5 backdrop-blur sm:p-7">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Good morning</p>
                <h2 className="mt-1 text-2xl font-bold">Your focused day</h2>
              </div>
              <div className="grid size-14 place-items-center rounded-full border-[6px] border-primary/20 text-sm font-bold text-primary">
                60%
              </div>
            </div>
            <div className="grid gap-3">
              <PreviewTask
                icon={<Clock3 size={17} />}
                title="Design project"
                meta="9:00 AM · High priority"
                accent="bg-orange-500/12 text-orange-600 dark:text-orange-300"
              />
              <PreviewTask
                icon={<Circle size={17} />}
                title="Team standup"
                meta="11:00 AM · Work"
                accent="bg-violet-500/12 text-violet-600 dark:text-violet-300"
              />
              <PreviewTask
                icon={<Check size={17} />}
                title="Morning workout"
                meta="Completed"
                accent="bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewTask({
  icon,
  title,
  meta,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
      <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}
