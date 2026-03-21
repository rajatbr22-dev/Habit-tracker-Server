import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../schema/auth.schema";

export const authRoutes = new Elysia({ prefix: '/auth' })
    .post('/register', AuthController.register, {
        body: registerSchema,
        detail: { 
            tags: ['Auth'],
            summary: "Sign up a new user"
        }
    })

    .post('/login', AuthController.login, {
        body: loginSchema,
        detail: { 
            tags: ["Auth"],
            summary: "login/sign in user"
        }
    })
    
    .post("/forgot-password", AuthController.forgotPassword, {
        body: forgotPasswordSchema,

        detail: {
            tags: ["Auth"],
            summary: "Forgot Password"
        }
    });
    
