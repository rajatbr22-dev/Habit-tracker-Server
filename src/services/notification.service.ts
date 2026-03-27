import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { emitToUser } from "../socket";
import { logger } from "../utils/logger";

export const NotificationService = {
    createNotification: async ({
        userId,
        title,
        message,
        type,
        metadata,
        scheduledAt
    }: {
        userId: string;
        title: string;
        message: string;
        type: any;
        metadata?: any;
        scheduledAt?: Date;
    }) => {
        try {
            const [notification] = await db
                .insert(notifications)
                .values({
                    userId,
                    title,
                    message,
                    type,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                    scheduledAt,
                })
                .returning();

            logger.info(`Notification created for user ${userId}: ${title}`);

            // Emit real-time event if it's not a future scheduled notification
            if (!scheduledAt || scheduledAt <= new Date()) {
                emitToUser(userId, "notification:new", {
                    ...notification,
                    metadata: metadata // Return actual object for real-time
                });
                
                // Update delivered at
                await db
                    .update(notifications)
                    .set({ deliveredAt: new Date() })
                    .where(eq(notifications.id, notification.id));
            }

            return notification;
        } catch (error: any) {
            logger.error(`Error creating notification: ${error.message}`);
            throw error;
        }
    },

    getUserNotifications: async (userId: string, limit = 20, offset = 0) => {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);
    },

    markAsRead: async (id: string, userId: string) => {
        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .returning();
        
        if (updated) {
            emitToUser(userId, "notification:read", { id });
        }
        return updated;
    },

    markAllAsRead: async (userId: string) => {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        
        emitToUser(userId, "notification:bulk_read", {});
    },

    getUnreadCount: async (userId: string) => {
        const [result] = await db
            .select({ count: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return result.count;
    },

    deleteNotification: async (id: string, userId: string) => {
        return await db
            .delete(notifications)
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .returning();
    }
};
