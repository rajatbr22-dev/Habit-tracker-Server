import { Elysia } from "elysia";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .group("", app => app
        .use(authMiddleware)
        .get('/summary', async ({ user }) => {
            const userId = user.sub;
            const data = await DashboardController.getSummary(userId);
            return { success: true, data };
        }, {
            detail: { 
                tags: ['Dashboard'],
                summary: "Get dashboard summary for authenticated user",
                security: [{ bearerAuth: [] }],
            }
        })
        .get('/weekly', async ({ user }) => {
            const userId = user.sub;
            const data = await DashboardController.getWeeklyOverview(userId);
            return { success: true, data };
        }, {
            detail: { 
                tags: ['Dashboard'],
                summary: "Get weekly overview for authenticated user",
                security: [{ bearerAuth: [] }],
            }
        })
    );
