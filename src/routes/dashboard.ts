import { Elysia, t } from "elysia";
import { DashboardController } from "../controllers/dashboard.controller";

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .get('/summary', async ({ query }) => {
        const data = await DashboardController.getSummary(query.userId);
        return { success: true, data };
    }, {
        query: t.Object({ userId: t.String() }),
        detail: { tags: ['Dashboard'] }
    })
    .get('/weekly', async ({ query }) => {
        const data = await DashboardController.getWeeklyOverview(query.userId);
        return { success: true, data };
    }, {
        query: t.Object({ userId: t.String() }),
        detail: { tags: ['Dashboard'] }
    });
