import { db } from "@/lib/db";

export async function cancelPendingReminders(taskId: number) {
  await db.reminderDelivery.updateMany({
    where: {
      taskId,
      status: { in: ["PENDING", "FAILED", "PROCESSING"] },
    },
    data: { status: "CANCELLED", lockedAt: null },
  });
}
