"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  taskId: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications");
    if (!response.ok) return;
    const result = (await response.json()) as {
      notifications: NotificationItem[];
      unreadCount: number;
    };
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  }, []);

  useEffect(() => {
    const immediate = window.setTimeout(loadNotifications, 0);
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [loadNotifications]);

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    setNotifications((items) =>
      items.map((item) =>
        !id || item.id === id
          ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((count) => (id ? Math.max(0, count - 1) : 0));
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void loadNotifications();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={17} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-white">
            {Math.min(unreadCount, 99)}
          </span>
        ) : null}
      </Button>

      {open ? (
        <section className="absolute right-0 top-12 z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount ? `${unreadCount} unread` : "You’re all caught up"}
              </p>
            </div>
            {unreadCount ? (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                onClick={() => markRead()}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href="/today"
                  onClick={() => {
                    if (!notification.readAt) void markRead(notification.id);
                    setOpen(false);
                  }}
                  className={`block border-b border-border px-4 py-3 last:border-0 hover:bg-muted/60 ${
                    notification.readAt ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.readAt ? "bg-border" : "bg-primary"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {notification.body}
                      </p>
                      <time className="mt-1.5 block text-[11px] text-muted-foreground">
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(notification.createdAt))}
                      </time>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
