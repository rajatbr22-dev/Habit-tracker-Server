import { Elysia, t } from "elysia";
import { DashboardController } from "../controllers/dashboard.controller";

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .get('/summary', async ({ user }) => {
        const userId = (user as any).sub;
        const data = await DashboardController.getSummary(userId);
        return { success: true, data };
    }, {
        detail: { 
            tags: ['Dashboard'],
            summary: "Get dashboard summary for authenticated user"
        }
    })
    .get('/weekly', async ({ user }) => {
        const userId = (user as any).sub;
        const data = await DashboardController.getWeeklyOverview(userId);
        return { success: true, data };
    }, {
        detail: { 
            tags: ['Dashboard'],
            summary: "Get weekly overview for authenticated user"
        }
    });
