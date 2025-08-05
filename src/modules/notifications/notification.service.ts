import { eq, and } from "drizzle-orm";
import {
  db,
  notifications as notificationsTable,
} from "../../db/Drizzle.config";

export class NotificationService {
  async listNotifications(userId: string) {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId)); // ✅ FIXED

    return notifications.map((n) => ({
      ...n,
      read: n.read === "true", // ✅ cast safely
    }));
  }

  async markAsRead(userId: string, notificationId: string) {
    const [notification] = await db
      .update(notificationsTable)
      .set({ read: "true" })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.user_id, userId)
        )
      ) // ✅ FIXED
      .returning();

    return {
      ...notification,
      read: notification.read === "true", // ✅ safe cast
    };
  }
}
