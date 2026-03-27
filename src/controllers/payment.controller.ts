import { db } from "../db";
import { users, userSubscriptions } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";
import { NotificationService } from "../services/notification.service";

export const PaymentController = {
    handleWebhook: async ({ body, headers, set }: { body: any, headers: Record<string, string | undefined>, set: any }) => {
        const webhookSecret = process.env.ADAPTY_WEBHOOK_SECRET;
        const authHeader = headers['authorization'];

        // Initial verification from Adapty (sends empty body {})
        if (Object.keys(body).length === 0) {
            logger.info("Adapty webhook: Received initial verification request");
            return { status: "ok" };
        }

        // Security check
        if (webhookSecret && authHeader !== webhookSecret) {
            logger.error("Adapty webhook: Unauthorized access attempt");
            set.status = 401;
            return { error: "Unauthorized" };
        }

        const {
            event_type,
            customer_user_id,
            profile_id,
            subscription_expires_at
        } = body;

        logger.info(`Adapty webhook: Received event ${event_type} for user ${customer_user_id}`);

        // Log the event to DB
        try {
            if (customer_user_id) {
                await db.insert(userSubscriptions).values({
                    userId: customer_user_id,
                    adaptyProfileId: profile_id,
                    eventType: event_type,
                    payload: JSON.stringify(body),
                });

                // Map event to subscription status
                let status: 'none' | 'active' | 'expired' | 'past_due' | 'trialing' = 'none';
                let premiumUntil: Date | null = null;

                if (subscription_expires_at) {
                    premiumUntil = new Date(subscription_expires_at);
                }

                switch (event_type) {
                    case 'subscription_started':
                    case 'subscription_renewed':
                        status = 'active';
                        break;
                    case 'trial_started':
                        status = 'trialing';
                        break;
                    case 'subscription_expired':
                        status = 'expired';
                        break;
                    case 'subscription_renewal_cancelled':
                        // User still has access until expiry
                        status = 'active'; 
                        break;
                    // Add more cases as needed
                }

                if (status !== 'none' || premiumUntil) {
                    await db.update(users)
                        .set({
                            subscriptionStatus: status,
                            premiumUntil: premiumUntil,
                            adaptyId: profile_id,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, customer_user_id));
                    
                    logger.info(`Updated subscription for user ${customer_user_id} to ${status}`);

                    if (event_type === 'subscription_started' || event_type === 'subscription_renewed') {
                        await NotificationService.createNotification({
                            userId: customer_user_id,
                            title: "Premium Activated! 💎",
                            message: "Thank you for supporting Habit Tracker. Your premium features are now active!",
                            type: 'premium'
                        });
                    }
                }
            }

            return { status: "success" };
        } catch (error) {
            logger.error(`Adapty webhook error: ${error}`);
            set.status = 500;
            return { error: "Internal Server Error" };
        }
    },

    getSubscriptionStatus: async ({ user }: { user: any }) => {
        try {
            const userData = await db.select({
                subscriptionStatus: users.subscriptionStatus,
                premiumUntil: users.premiumUntil
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

            if (!userData || userData.length === 0) {
                return { status: 'none', isPremium: false };
            }

            const status = userData[0].subscriptionStatus;
            const premiumUntil = userData[0].premiumUntil;
            const isPremium = status === 'active' || status === 'trialing';

            return {
                status,
                premiumUntil,
                isPremium
            };
        } catch (error) {
            logger.error(`Get subscription status error: ${error}`);
            throw error;
        }
    }
};
