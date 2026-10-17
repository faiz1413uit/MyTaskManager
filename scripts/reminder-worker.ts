import "dotenv/config";
import { pathToFileURL } from "node:url";
import webpush from "web-push";
import { db } from "../src/lib/db";
import { getVapidConfig } from "../src/lib/push/config";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const POLL_INTERVAL_MS = Number(process.env.REMINDER_POLL_INTERVAL_MS ?? 60_000);

type ClaimedJob = {
  id: bigint;
};

const vapid = getVapidConfig();
if (vapid) {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
}

export async function runReminderCycle() {
  await db.$executeRaw`
    INSERT INTO "reminder_deliveries"
      ("task_id", "reminder_at", "status", "attempt_count", "next_attempt_at", "created_at", "updated_at")
    SELECT
      "id", "reminder_at", 'PENDING'::"reminder_status", 0, NOW(), NOW(), NOW()
    FROM "tasks"
    WHERE
      "reminder_at" IS NOT NULL
      AND "reminder_at" <= NOW()
      AND "reminder_sent_at" IS NULL
      AND "status" = 'PENDING'::"task_status"
      AND "is_notification_enabled" = TRUE
    ON CONFLICT ("task_id", "reminder_at") DO NOTHING
  `;

  const jobs = await db.$queryRaw<ClaimedJob[]>`
    WITH candidates AS (
      SELECT "id"
      FROM "reminder_deliveries"
      WHERE
        (
          ("status" IN ('PENDING', 'FAILED') AND "next_attempt_at" <= NOW())
          OR
          (
            "status" = 'PROCESSING'
            AND "locked_at" < NOW() - INTERVAL '5 minutes'
          )
        )
        AND "attempt_count" < ${MAX_ATTEMPTS}
      ORDER BY "next_attempt_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    UPDATE "reminder_deliveries" AS delivery
    SET
      "status" = 'PROCESSING',
      "locked_at" = NOW(),
      "attempt_count" = "attempt_count" + 1,
      "updated_at" = NOW()
    FROM candidates
    WHERE delivery."id" = candidates."id"
    RETURNING delivery."id"
  `;

  await Promise.all(jobs.map(({ id }) => processReminder(id)));
  return jobs.length;
}

async function processReminder(id: bigint) {
  const delivery = await db.reminderDelivery.findUnique({
    where: { id },
    include: {
      task: {
        include: {
          user: {
            include: { pushSubscriptions: true },
          },
        },
      },
    },
  });

  if (!delivery) return;

  const { task } = delivery;
  const reminderIsCurrent =
    task.status === "PENDING" &&
    task.isNotificationEnabled &&
    task.reminderAt?.getTime() === delivery.reminderAt.getTime() &&
    !task.reminderSentAt;

  if (!reminderIsCurrent) {
    await db.reminderDelivery.update({
      where: { id },
      data: { status: "CANCELLED", lockedAt: null },
    });
    return;
  }

  if (task.user.inAppNotifications) {
    await db.notification.upsert({
      where: {
        taskId_reminderAt: {
          taskId: task.id,
          reminderAt: delivery.reminderAt,
        },
      },
      create: {
        userId: task.userId,
        taskId: task.id,
        reminderAt: delivery.reminderAt,
        title: task.title,
        body: task.description || "This task needs your attention.",
      },
      update: {},
    });
  }

  const subscriptions = task.user.pushNotifications
    ? task.user.pushSubscriptions
    : [];
  let submitted = 0;
  let transientFailures = 0;

  if (vapid) {
    const payload = JSON.stringify({
      title: `Reminder: ${task.title}`,
      body: task.description || "This task needs your attention.",
      tag: `task-${task.id}-${delivery.reminderAt.getTime()}`,
      url: "/today",
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          { TTL: 60 * 60 },
        );
        submitted += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({
            where: { id: subscription.id },
          });
        } else {
          transientFailures += 1;
          console.error(`Push submission failed for task ${task.id}`, error);
        }
      }
    }
  } else if (subscriptions.length) {
    transientFailures = subscriptions.length;
  }

  if (transientFailures > 0 && submitted === 0) {
    const delayMinutes = Math.min(2 ** delivery.attemptCount, 30);
    await db.reminderDelivery.update({
      where: { id },
      data: {
        status: "FAILED",
        lockedAt: null,
        nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
        lastError: vapid
          ? "Push service submission failed."
          : "VAPID is not configured.",
      },
    });
    return;
  }

  await db.$transaction([
    db.reminderDelivery.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        lockedAt: null,
        submittedAt: submitted ? new Date() : null,
        lastError: null,
      },
    }),
    db.task.updateMany({
      where: {
        id: task.id,
        status: "PENDING",
        reminderAt: delivery.reminderAt,
        reminderSentAt: null,
      },
      data: {
        reminderSentAt: new Date(),
        isNotificationEnabled: false,
      },
    }),
  ]);

  if (task.user.pushNotifications) {
    const remaining = await db.pushSubscription.count({
      where: { userId: task.userId },
    });
    if (remaining === 0) {
      await db.user.update({
        where: { id: task.userId },
        data: { pushNotifications: false },
      });
    }
  }
}

async function start() {
  console.log(`Zeinth reminder worker started (${POLL_INTERVAL_MS}ms interval)`);

  while (true) {
    try {
      const processed = await runReminderCycle();
      if (processed) {
        console.log(`Processed ${processed} reminder job(s)`);
      }
    } catch (error) {
      console.error("Reminder cycle failed", error);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  void start();
}
