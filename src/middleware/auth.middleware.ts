import { Elysia } from "elysia";
import { JwtPayload } from "../types/types";
import { logger } from "../utils/logger";

export const authMiddleware = new Elysia({ name: "authMiddleware" })
    .derive({ as: 'global' }, async ({ jwt, request, set }: any) => {

        const authHeader =
        request.headers.get("authorization") ??
        request.headers.get("Authorization");

        if (!authHeader) {

            set.status = 401;

            logger.error("Missing Authorization header");

            throw new Error("Unauthorized");

        }


        const [scheme, rawToken] = authHeader.split(" ");

        if (scheme !== "Bearer" || !rawToken) {

            set.status = 401;

            logger.error("Unauthorized access")

            throw new Error("Unauthorized");

        }

        const token = rawToken.replace(/^"|"$/g, "").trim();

        const payload = await (jwt as any).verify(token) as JwtPayload;

        if (!payload) {

            set.status = 401;

            logger.error("Invalid Token")
            
            throw new Error("Invalid token");

        }

        return { user: payload };
    });