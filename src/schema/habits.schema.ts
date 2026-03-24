import { t } from "elysia";

export const createHabit = t.Object({
    
    name: t
    .String({
        minLength: 2
    }),

    color: t.Optional(
        t.String()
    ),

    category: t.Enum({
        health: 'health',
        productivity: 'productivity',
        fitness: 'fitness',
        mindfulness: 'mindfulness',
        financial: 'financial',
        social: 'social',
        other: 'other'
    }),

    frequency: t.Enum({
        daily: 'daily',
        weekly: 'weekly',
        custom: 'custom'
    }),

    icon: t.Optional(t.String()),

    targetCount: t.Optional(t.Number()),

    customDays: t.Optional(t.Array(t.String())),

    goalLabel: t.Optional(t.String()),

    goalValue: t.Optional(t.Number()),

    meta: t.Optional(t.String({
        minLength: 2,
        maxLength: 50
    })),

    notes: t.Optional(t.String({
        minLength: 2,
        maxLength: 100
    })),

    reminderTime: t.Optional(t.String({ format: "time" })),

    goalUnit: t.Optional(t.String()),

});

export const createHabitCheckIns = t.Object({
    habitId: t.String({
        format: "uuid"
    }),

    completed: t.Boolean()
})

export const updateHabit = t.Partial(createHabit);