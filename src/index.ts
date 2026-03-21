import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { habitRoutes } from "./routes/habits.routes";
import { dashboardRoutes } from "./routes/dashboard";
import { app } from "./app";

app
    .use(cors())
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

console.log(
    `🚀 Swagger UI is running at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
