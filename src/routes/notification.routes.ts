import { Elysia, t } from "elysia";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
    .group("", app => app
        .use(authMiddleware)
        
        .get('', ({ user, query, set }) => NotificationController.getAll({ user, query, set }), {
            detail: {
                tags: ['Notifications'],
                summary: "Get all notifications for the user",
                security: [{ bearerAuth: [] }]
            }
        })

        .patch('/:id/read', ({ user, params, set }) => NotificationController.markAsRead({ user, params, set }), {
            detail: {
                tags: ['Notifications'],
                summary: "Mark a specific notification as read",
                security: [{ bearerAuth: [] }]
            }
        })

        .patch('/read-all', ({ user, set }) => NotificationController.markAllAsRead({ user, set }), {
            detail: {
                tags: ['Notifications'],
                summary: "Mark all notifications as read for the user",
                security: [{ bearerAuth: [] }]
            }
        })

        .get('/unread-count', ({ user, set }) => NotificationController.getUnreadCount({ user, set }), {
            detail: {
                tags: ['Notifications'],
                summary: "Get the count of unread notifications",
                security: [{ bearerAuth: [] }]
            }
        })

        .delete('/:id', ({ user, params, set }) => NotificationController.delete({ user, params, set }), {
            detail: {
                tags: ['Notifications'],
                summary: "Delete a specific notification",
                security: [{ bearerAuth: [] }]
            }
        })
    );
