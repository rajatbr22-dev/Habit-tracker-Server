import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { jwt } from "@elysiajs/jwt";

export const authRoutes = new Elysia({ prefix: '/auth' })
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'habit-tracker-secret-key-2026'
    }))
    .post('/register', AuthController.register, {
        body: t.Object({
            email: t.String(),
            password: t.String(),
            displayName: t.String()
        }),
        detail: { tags: ['Auth'] }
    })

    .post('/login', AuthController.login, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        }),
        detail: { tags: ['Auth'] }
    });
    
