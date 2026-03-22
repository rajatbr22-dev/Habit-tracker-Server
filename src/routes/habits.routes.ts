import { Elysia, t } from "elysia";
import { HabitController } from "../controllers/habit.controller";
import { createHabit, createHabitCheckIns } from "../schema/habits.schema";
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

        .post('/checkin', HabitController.checkIn
            , {
            body: createHabitCheckIns,
            detail: { 
                tags: ['Habits'],
                summary: "Toggle habit current stats update",
                security: [{ bearerAuth: [] }],
            }
        })
    );
