import { Elysia, t } from "elysia";
import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { habitRoutes } from "./routes/habits";
import { dashboardRoutes } from "./routes/dashboard";
import { jwt } from "@elysiajs/jwt";

const app = new Elysia()
    .use(cors())
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'habit-tracker-secret-key-2026'
    }))
    .use(swagger({
        documentation: {
            info: {
                title: 'Habit Tracker API',
                version: '1.0.0'
            },
            tags: [
                { name: 'Auth', description: 'Authentication endpoints' },
                { name: 'Habits', description: 'Habit management' },
                { name: 'Dashboard', description: 'Dashboard overview' }
            ]
        }
    }))
    .group("/api", (app) => 
        app
            .use(authRoutes)
            .use(habitRoutes)
            .use(dashboardRoutes)
    )
    .listen(8000);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);
