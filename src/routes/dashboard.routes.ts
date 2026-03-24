import { Elysia } from "elysia";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .group("", app => app
        .use(authMiddleware)
        .get('/summary', async ({ user }) => {
            return await DashboardController.getSummary(user.sub);
        }, {
            detail: { 
                tags: ['Dashboard'],
                summary: "Get dashboard summary stats (streaks, completion, etc.)",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/weekly', async ({ user }) => {
            return await DashboardController.getWeeklyOverview(user.sub);
        }, {
            detail: { 
                tags: ['Dashboard'],
                summary: "Get weekly habit completion overview",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/today-habits', async ({ user }) => {
            return await DashboardController.getTodayHabits(user.sub);
        }, {
            detail: { 
                tags: ['Dashboard'],
                summary: "Get list of habits for today with progress and streaks",
                security: [{ bearerAuth: [] }],
            }
        })
    );
