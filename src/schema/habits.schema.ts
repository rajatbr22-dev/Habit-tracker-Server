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

    reminderTime: t.Optional(t.String({ format: "date-time" })),

    goalUnit: t.Optional(t.String()),

});