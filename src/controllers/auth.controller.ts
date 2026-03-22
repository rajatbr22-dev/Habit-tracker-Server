import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";

export const AuthController = {

    register: async ({ body, set, jwt }: any) => {

        logger.info(`POST /auth/register - Request received for: ${body.email}`);

        const { email, password, displayName } = body;

        if(!email || !password || !displayName) {

            set.status = 401

            return createResponse({
                success: false,
                message: "Name, email and password are required"
            })
        }


        const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, body.email))

        if(existingUsers.length > 0) {

            set.status = 400

            return createResponse({
                success: false,
                message: "User is already registered"
            })
        }


        try {

            const passwordHash = await Bun.password.hash(body.password);
            const [user] = await db.insert(users).values({
                email: body.email,
                displayName: body.displayName,
                passwordHash,
            }).returning();
            
            const token = await jwt.sign({ sub: user.id });
            logger.info(`User registered successfully: ${user.id}`);

            set.status = 200

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
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, body.email));
            
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
    },


    forgotPassword: async ({ body, set }: any) => {
        const { email, newPassword } = body;

        if (!email || !newPassword) {

            set.status = 400

            return createResponse({
                success: false,
                message: "email and new password is required"
            });

        }

        try {
            const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

            if (!user) {
                set.status = 401
                return createResponse({
                    success: false,
                    message: "Email is not registered. Create new account"
                });
            }

            const passwordHash = await Bun.password.hash(newPassword);

            await db
            .update(users)
            .set({
                passwordHash,
                updatedAt: new Date(),
            })
            .where(eq(users.email, email));

            logger.info("Password reset successfully", email);

            set.status = 200

            return createResponse({
                success: true,
                message: "Password reset successfully"
            });

        } catch (error) {

            set.status = 500

            logger.error("Forgot password failed", error);

            return createResponse({
                success: false,
                message: "Failed to reset password"
            });

        }
    }
};
