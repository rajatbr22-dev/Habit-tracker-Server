import { t } from "elysia";

export const createHabit = t.Object({
    
    name: t
    .String({
        minLength: 2
    }),

    color: t.Optional(
        t.String()
    ),

    category: t.String(),

    frequency: t.String(),

    icon: t.Optional(t.String()),

    targetCount: t.Optional(t.Number()),

    customDays: t.Optional(t.Array(t.String())),

    goalLabel: t.Optional(t.String()),

    goalValue: t.Optional(t.Number()),

    goalUnit: t.Optional(t.String()),

});