import { Elysia, t } from "elysia";
import { HabitController } from "../controllers/habit.controller";
import { createHabit } from "../schema/habits.schema";
import { JwtPayload } from "../types/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAllHabitsQuery } from "../schema/query/getHabits.query.schema";

export const habitRoutes = new Elysia({ prefix: '/habits' })
    .group('', app => app
        .use(authMiddleware)
        .get('',  HabitController.getAll,{
            query: getAllHabitsQuery,
            detail: { 
                tags: ['Habits'],
                summary: "Get all habits for the authenticated user",
                security: [{ bearerAuth: [] }],
            }
        })

        .post('', HabitController.create, {
            body: createHabit,
            detail: { 
                tags: ['Habits'],
                summary: "Add/Create new Habit for authenticated user",
                security: [{ bearerAuth: [] }],
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
            detail: { 
                tags: ['Habits'],
                security: [{ bearerAuth: [] }],
            }
        })
    );
