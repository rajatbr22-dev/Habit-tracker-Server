import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { jwt } from "@elysiajs/jwt";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../schema/auth.schema";

export const authRoutes = new Elysia({ prefix: '/auth' })
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
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
    
