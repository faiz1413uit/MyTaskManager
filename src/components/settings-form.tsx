"use client";

import { Bell, LoaderCircle, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PushNotificationControl } from "@/components/push-notification-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const timezones = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export function SettingsForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(user.theme);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timezoneOptions = timezones.includes(user.timezone)
    ? timezones
    : [user.timezone, ...timezones];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        timezone: String(form.get("timezone") ?? "UTC"),
        theme: selectedTheme,
        inAppNotifications: form.get("inAppNotifications") === "on",
      }),
    });
    const result = (await response.json()) as { error?: string };

    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "Settings could not be saved.");
      return;
    }

    setTheme(selectedTheme.toLowerCase());
    setMessage("Settings saved.");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <SettingsSection
        icon={<UserRound size={18} />}
        title="Profile"
        description="The details used to personalize your workspace."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={user.name}
            />
          </Field>
          <Field label="Email address">
            <Input value={user.email} disabled readOnly />
          </Field>
          <Field label="Time zone">
            <select
              name="timezone"
              defaultValue={user.timezone}
              className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Sun size={18} />}
        title="Appearance"
        description="Choose how Zeinth looks on this device."
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "LIGHT" as const, label: "Light", icon: Sun },
            { value: "DARK" as const, label: "Dark", icon: Moon },
            { value: "SYSTEM" as const, label: "System", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedTheme(value)}
              className={cn(
                "flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition",
                selectedTheme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Bell size={18} />}
        title="Notifications"
        description="Control how reminders can reach you."
      >
        <div className="divide-y divide-border">
          <Preference
            name="inAppNotifications"
            label="In-app notifications"
            description="Show task reminders while you are using Zeinth."
            defaultChecked={user.inAppNotifications}
          />
          <PushNotificationControl enabledOnAccount={user.pushNotifications} />
        </div>
      </SettingsSection>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      ) : null}

      <Button disabled={pending}>
        {pending ? <LoaderCircle size={17} className="animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
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

function Preference({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-5 accent-primary"
      />
    </label>
  );
}
