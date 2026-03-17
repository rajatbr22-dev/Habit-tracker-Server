import { App } from "../app";
import { JwtPayload } from "../types/types";
import { logger } from "../utils/logger";

export const authMiddleware = (app: App) =>
    app.derive<{ user: JwtPayload }>(async ({ jwt, request, set }) => {

        const authHeader =
        request.headers.get("authorization") ??
        request.headers.get("Authorization");

        // console.log("AUTH HEADER =>", request.headers.get("authorization"));
        // console.log("ALL HEADERS =>", Object.fromEntries(request.headers.entries()));


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

        const payload = await jwt.verify(token) as JwtPayload;

        if (!payload) {

            set.status = 401;

            logger.error("Invalid Token")
            
            throw new Error("Invalid token");

        }

        return { user: payload };
    });