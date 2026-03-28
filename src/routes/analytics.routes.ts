import { Elysia } from "elysia";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const analyticsRoutes = new Elysia({ prefix: '/analytics' })
    .group("", app => app
        .use(authMiddleware)
        .get('/summary', async ({ user }) => {
            return await AnalyticsController.getSummary(user.sub);
        }, {
            detail: { 
                tags: ['Analytics'],
                summary: "Get analytics summary (streaks, completion, etc.)",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/weekly-overview', async ({ user }) => {
            return await AnalyticsController.getWeeklyOverview(user.sub);
        }, {
            detail: { 
                tags: ['Analytics'],
                summary: "Get weekly completion rates",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/habit-performance', async ({ user }) => {
            return await AnalyticsController.getHabitPerformance(user.sub);
        }, {
            detail: { 
                tags: ['Analytics'],
                summary: "Get detailed performance stats for all active habits",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/activity-heatmap', async ({ user }) => {
            return await AnalyticsController.getActivityHeatmap(user.sub);
        }, {
            detail: { 
                tags: ['Analytics'],
                summary: "Get activity heatmap data for the last 70 days",
                security: [{ bearerAuth: [] }],
            }
        })
    );
