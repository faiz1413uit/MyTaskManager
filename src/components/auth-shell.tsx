import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col">
        <div className="relative z-10">
          <Brand />
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <div className="orbit-scene mb-10" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="planet">
              <span />
            </div>
          </div>
          <p className="text-sm font-semibold text-violet-300">A calmer way forward</p>
          <h2 className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight">
            Plan less.
            <br />
            Finish more.
          </h2>
          <p className="mt-5 max-w-md leading-7 text-slate-300">
            Bring tasks, priorities, and deadlines into one focused space built
            for your day.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Your tasks stay private to your account.
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
        <div className="absolute left-6 top-6 lg:hidden">
          <Brand />
        </div>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        {children}
      </section>
    </main>
  );
}
