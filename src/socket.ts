import { Server } from "socket.io";
import { logger } from "./utils/logger";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (portOrServer: any) => {
    io = new Server(portOrServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });


    // Add JWT Authentication Middleware
    io.use((socket, next) => {
        const auth = socket.handshake.auth;
        const token = auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        logger.info(`Incoming socket connection attempt: ${socket.id}`);

        if (!token) {
            logger.error(`Socket auth failed: Token missing for socket ${socket.id}`);
            return next(new Error("Authentication error: Token missing"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
            socket.data.userId = decoded.sub;
            logger.info(`Socket auth success for user ${decoded.sub}`);
            next();
        } catch (err) {
            logger.error(`Socket auth failed for ${socket.id}: ${err instanceof Error ? err.message : "Invalid token"}`);
            return next(new Error("Authentication error: Invalid token"));
        }
    });


    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        
        if (userId) {
            socket.join(`user:${userId}`);
            logger.info(`User ${userId} authenticated and connected to socket ${socket.id}`);
        }

        socket.on("disconnect", () => {
            logger.info(`Socket ${socket.id} disconnected`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

export const emitToUser = (userId: string, event: string, payload: any) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, payload);
    }
};
