import { Elysia, t } from "elysia";
import { HabitController } from "../controllers/habit.controller";
import { createHabit } from "../schema/habits.schema";
import { JwtPayload } from "../types/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const habitRoutes = new Elysia({ prefix: '/habits' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {

        const userId = (user as JwtPayload).sub

        const allHabits = await HabitController.getAll(userId);

        return { success: true, data: allHabits };
    }, {
        detail: { 
            tags: ['Habits'],
            summary: "Get all habits for the authenticated user"
        }
    })

    .post('/', HabitController.create, {
        body: createHabit,
        detail: { 
            tags: ['Habits'],
            summary: "Add/Create new Habit for authenticated user"
        }
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
