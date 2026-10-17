self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : { title: "Zeinth reminder", body: "A task needs your attention." };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Zeinth reminder", {
      body: payload.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.tag,
      data: { url: payload.url ?? "/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url ?? "/today", self.location.origin)
    .href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
