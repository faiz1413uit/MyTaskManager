import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-28 pt-8 lg:px-8 lg:pb-12 lg:pt-10">
      <p className="text-sm font-semibold text-primary">Your workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Profile and settings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Personalize Zeinth and choose how reminders should reach you.
      </p>
      <div className="mt-8">
        <SettingsForm user={user} />
      </div>
    </main>
  );
}
