import { app } from "./app";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { habitRoutes } from "./routes/habits.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { notificationRoutes } from "./routes/notification.routes";
import { initSocket } from "./socket";
import { initScheduler } from "./services/scheduler.service";

app
    .use(cors())
    .group("/api", (app) => 
        app
            .use(authRoutes)
            .use(habitRoutes)
            .use(dashboardRoutes)
            .use(analyticsRoutes)
            .use(paymentRoutes)
            .use(notificationRoutes)
    );

const server = app.listen(8000);

// Initialize Socket.io on a dedicated port to avoid Elysia conflict
initSocket(8085); 
initScheduler();

console.log(
    `🚀 Server is running at ${app.server?.hostname}:${app.server?.port} (WebSockets enabled on port 8001)`
);


console.log(
    `🚀 Swagger UI is running at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
