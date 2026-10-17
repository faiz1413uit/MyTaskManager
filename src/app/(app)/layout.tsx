import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { NotificationCenter } from "@/components/notification-center";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeSync } from "@/components/theme-sync";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/35">
      <ThemeSync theme={user.theme} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Brand className="px-2" />
        <AppNavigation />
        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Your private workspace
          </p>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>
        {children}
      </div>

      <AppNavigation mobile />
    </div>
  );
}
