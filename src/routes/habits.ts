import { Elysia, t } from "elysia";
import { HabitController } from "../controllers/habit.controller";

export const habitRoutes = new Elysia({ prefix: '/habits' })
    .get('/', async ({ query }) => {
        const { userId } = query;
        const allHabits = await HabitController.getAll(userId);
        return { success: true, data: allHabits };
    }, {
        query: t.Object({ userId: t.String() }),
        detail: { tags: ['Habits'] }
    })
    .post('/', async ({ body }) => {
        const habit = await HabitController.create(body);
        return { success: true, data: habit };
    }, {
        body: t.Object({
            userId: t.String(),
            name: t.String(),
            color: t.String(),
            category: t.String(),
            frequency: t.String(),
            icon: t.Optional(t.String()),
            targetCount: t.Optional(t.Number()),
            customDays: t.Optional(t.Array(t.String())),
            goalLabel: t.Optional(t.String()),
            goalValue: t.Optional(t.Number()),
            goalUnit: t.Optional(t.String()),
        }),
        detail: { tags: ['Habits'] }
    })
    .post('/checkin', async ({ body }) => {
        const checkin = await HabitController.checkIn(body);
        return { success: true, data: checkin };
    }, {
        body: t.Object({
            habitId: t.String(),
            date: t.String(),
            completed: t.Boolean(),
            value: t.Optional(t.Number()),
            note: t.Optional(t.String()),
        }),
        detail: { tags: ['Habits'] }
    });
