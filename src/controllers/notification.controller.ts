import { NotificationService } from "../services/notification.service";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";
import { JwtPayload } from "../types/types";

export const NotificationController = {
    getAll: async ({ user, query, set }: { user: JwtPayload, query: any, set: any }) => {
        try {
            const page = Number(query.page ?? 1);
            const pageSize = Number(query.pageSize ?? 20);
            const offset = (page - 1) * pageSize;

            const notifications = await NotificationService.getUserNotifications(user.sub, pageSize, offset);
            const unreadCount = await NotificationService.getUnreadCount(user.sub);

            return createResponse({
                success: true,
                message: "Notifications fetched successfully",
                data: {
                    notifications,
                    unreadCount
                }
            });
        } catch (error: any) {
            logger.error(`Error fetching notifications: ${error.message}`);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to fetch notifications"
            });
        }
    },

    markAsRead: async ({ user, params, set }: { user: JwtPayload, params: { id: string }, set: any }) => {
        try {
            const updated = await NotificationService.markAsRead(params.id, user.sub);
            if (!updated) {
                set.status = 404;
                return createResponse({
                    success: false,
                    message: "Notification not found"
                });
            }
            return createResponse({
                success: true,
                message: "Notification marked as read",
                data: updated
            });
        } catch (error: any) {
            logger.error(`Error marking notification as read: ${error.message}`);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to mark notification as read"
            });
        }
    },

    markAllAsRead: async ({ user, set }: { user: JwtPayload, set: any }) => {
        try {
            await NotificationService.markAllAsRead(user.sub);
            return createResponse({
                success: true,
                message: "All notifications marked as read"
            });
        } catch (error: any) {
            logger.error(`Error marking all as read: ${error.message}`);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to mark all as read"
            });
        }
    },

    delete: async ({ user, params, set }: { user: JwtPayload, params: { id: string }, set: any }) => {
        try {
            const deleted = await NotificationService.deleteNotification(params.id, user.sub);
            if (!deleted) {
                set.status = 404;
                return createResponse({
                    success: false,
                    message: "Notification not found"
                });
            }
            return createResponse({
                success: true,
                message: "Notification deleted successfully"
            });
        } catch (error: any) {
            logger.error(`Error deleting notification: ${error.message}`);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to delete notification"
            });
        }
    },

    getUnreadCount: async ({ user, set }: { user: JwtPayload, set: any }) => {
        try {
            const count = await NotificationService.getUnreadCount(user.sub);
            return createResponse({
                success: true,
                message: "Unread count fetched",
                data: { count }
            });
        } catch (error: any) {
            logger.error(`Error fetching unread count: ${error.message}`);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to fetch unread count"
            });
        }
    }
};
