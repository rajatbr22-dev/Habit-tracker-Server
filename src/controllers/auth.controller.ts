import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";

export const AuthController = {
    register: async ({ body, set, jwt }: any) => {
        logger.info(`POST /auth/register - Request received for: ${body.email}`);
        try {
            const passwordHash = await Bun.password.hash(body.password);
            const [user] = await db.insert(users).values({
                email: body.email,
                displayName: body.displayName,
                passwordHash,
            }).returning();
            
            const token = await jwt.sign({ sub: user.id });
            logger.info(`User registered successfully: ${user.id}`);

            return {
                success: true,
                message: 'Registration successful',
                data: { 
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                        createdAt: user.createdAt,
                    },
                    token
                }
            };
        } catch (error: any) {
            logger.error(`Registration failed for ${body.email}: ${error.message}`, error);
            
            const isDuplicate = error.message?.includes('unique constraint') || error.code === '23505';
            set.status = isDuplicate ? 409 : 400;
            
            const message = isDuplicate ? 'Email already exists' : (error.message || 'Registration failed');
            
            return { 
                success: false, 
                message,
                error: { message } 
            };
        }
    },
    
    login: async ({ body, set, jwt }: any) => {
        logger.info(`POST /auth/login - Request received for: ${body.email}`);
        try {
            const [user] = await db.select().from(users).where(eq(users.email, body.email));
            
            if (!user) {
                logger.warn(`Login failed: Email not found - ${body.email}`);
                set.status = 401;
                return { 
                    success: false, 
                    message: 'User not found',
                    error: { message: 'User not found' } 
                };
            }

            if (!(await Bun.password.verify(body.password, user.passwordHash))) {
                logger.warn(`Login failed: Incorrect password for ${body.email}`);
                set.status = 401;
                return { 
                    success: false, 
                    message: 'Incorrect password',
                    error: { message: 'Incorrect password' } 
                };
            }
            
            const token = await jwt.sign({ sub: user.id });
            logger.info(`User logged in successfully: ${user.id}`);

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                    },
                    token
                }
            };
        } catch (error: any) {
            logger.error(`Login error for ${body.email}: ${error.message}`);
            set.status = 500;
            return { 
                success: false, 
                message: 'Internal server error',
                error: { message: error.message } 
            };
        }
    },

    findByEmail: async (email: string) => {
        try {
            const [user] = await db.select().from(users).where(eq(users.email, email));
            return user;
        } catch (error: any) {
            logger.error(`Error finding user by email ${email}: ${error.message}`);
            throw error;
        }
    }
};
