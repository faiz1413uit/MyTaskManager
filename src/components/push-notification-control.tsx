"use client";

import { BellRing, LoaderCircle } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

export function PushNotificationControl({
  enabledOnAccount,
}: {
  enabledOnAccount: boolean;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const supported =
    mounted &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supported) {
      void navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription)));
    }
  }, [supported]);

  async function enable() {
    setPending(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const configResponse = await fetch("/api/push/subscriptions");
      const config = (await configResponse.json()) as {
        configured: boolean;
        publicKey: string | null;
      };
      if (!configResponse.ok || !config.configured || !config.publicKey) {
        throw new Error("Push notifications are not configured.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(config.publicKey),
      });

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("The device could not be subscribed.");
      }

      setSubscribed(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Push notifications could not be enabled.",
      );
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) {
          throw new Error("The subscription could not be removed.");
        }
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Push notifications could not be disabled.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 last:pb-0">
      <div className="flex gap-3">
        <BellRing size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">Browser push notifications</p>
          <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
            {mounted && !supported
              ? "This browser does not support Web Push."
              : subscribed
                ? "This device is subscribed to task reminders."
                : enabledOnAccount
                  ? "Push is active on another device. Enable it here too if needed."
                  : "Receive reminders even when Zeinth is not open."}
          </p>
          {error ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant={subscribed ? "secondary" : "primary"}
        size="sm"
        disabled={pending || !supported}
        onClick={subscribed ? disable : enable}
      >
        {pending ? <LoaderCircle size={15} className="animate-spin" /> : null}
        {subscribed ? "Disable on this device" : "Enable on this device"}
      </Button>
    </div>
  );
}

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0),
  );
  return bytes;
}
