import { Elysia, t } from "elysia";
import { HabitController } from "../controllers/habit.controller";
import { createHabit, createHabitCheckIns, updateHabit } from "../schema/habits.schema";
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

        .get('/archived', HabitController.getArchived,{
            query: getAllHabitsQuery,
            detail: { 
                tags: ['Habits'],
                summary: "Get all archived habits for the authenticated user",
                security: [{ bearerAuth: [] }],
            }
        })

        .get('/:id', HabitController.getById,{
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            detail: { 
                tags: ['Habits'],
                summary: "Get a habit by ID",
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

        .patch('/:id', HabitController.update, {
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            body: updateHabit,
            detail: {
                tags: ['Habits'],
                summary: "Update an existing habit",
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

        .get('/:id/detail', HabitController.getDetail, {
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            detail: {
                tags: ['Habits'],
                summary: "Get detailed habit info with infographics and heatmap",
                security: [{ bearerAuth: [] }],
            }
        })

        .patch('/:id/archive', HabitController.archive, {
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            detail: {
                tags: ['Habits'],
                summary: "Archive a habit",
                security: [{ bearerAuth: [] }],
            }
        })

        .patch('/:id/unarchive', HabitController.unarchive, {
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            detail: {
                tags: ['Habits'],
                summary: "Unarchive a habit",
                security: [{ bearerAuth: [] }],
            }
        })

        .patch('/:id/delete', HabitController.delete, {
            params: t.Object({
                id: t.String({ format: 'uuid' })
            }),
            detail: {
                tags: ['Habits'],
                summary: "Soft delete a habit (change status to deleted)",
                security: [{ bearerAuth: [] }],
            }
        })
    );
