import { t } from "elysia";

export const registerSchema = t.Object({

    email: t.
        String({
            format: 'email'
        }),

    password: t.String({
        minLength: 6,
        maxLength: 100,
    }),

    displayName: t.String({
        minLength: 2,
        maxLength: 100,
    }),
})



export const loginSchema = t.Object({

    email: t.
        String({
            format: 'email'
        }),

    password: t.String({
        minLength: 6,
        maxLength: 100,
    }),
    
})



export const forgotPasswordSchema = t.Object({

    email: t.String({
        format: "email"
    }),

    newPassword: t.String({
        minLength: 6,
        maxLength: 100,
    })
    
})