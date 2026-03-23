import { t } from "elysia";

export const getAllHabitsQuery = t.Object({

    page: t.Optional(
        t.Numeric({ minimum: 1 }),
    ),

    pageSize: t.Optional(
        t.Numeric({ minimum: 1, maximum: 100 }),
    ),

    search: t.Optional(
        t.String({ minLength: 1 })
    ),

    categoryFrequency: t.Optional(
        t.String()
    ),

    date: t.Optional(
        t.String({ format: "date"})
    )
})