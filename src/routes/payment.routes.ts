import { Elysia } from "elysia";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const paymentRoutes = new Elysia({ prefix: "/payments" })
    .post("/webhook", PaymentController.handleWebhook as any, {
        detail: {
            tags: ["Payments"],
            summary: "Adapty Webhook Handler",
            description: "Receives and processes IAP events from Adapty"
        }
    })
    .group("", app => app
        .use(authMiddleware as any)
        .get("/status", PaymentController.getSubscriptionStatus as any, {
            detail: {
                tags: ["Payments"],
                summary: "Get Subscription Status",
                description: "Returns the current user's subscription status"
            }
        })
    );
