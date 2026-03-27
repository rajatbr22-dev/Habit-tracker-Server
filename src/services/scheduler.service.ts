import cron from "node-cron";
import { db } from "../db";
import { habits, checkIns, users } from "../db/schema";
import { eq, and, sql, notInArray, isNotNull } from "drizzle-orm";
import { NotificationService } from "./notification.service";
import { logger } from "../utils/logger";

export const initScheduler = () => {
    // 8:00 AM Daily Reminder
    cron.schedule("0 8 * * *", async () => {
        logger.info("Running daily 8:00 AM notification scheduler");
        await sendDailyReminders();
    });

    // 9:00 PM Missed Habit Check
    cron.schedule("0 21 * * *", async () => {
        logger.info("Running nightly missed habit check");
        await sendMissedHabitReminders();
    });

    // Random Motivational Tips (e.g., Every 4 hours)
    cron.schedule("0 */4 * * *", async () => {
        logger.info("Running motivational tip scheduler");
        await sendMotivationalTips();
    });
};

const sendDailyReminders = async () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Find users who have active habits for today but haven't checked in yet
        // Simplified: Fetch all active habits
        const activeHabits = await db
            .select()
            .from(habits)
            .where(eq(habits.status, 'active'));

        for (const habit of activeHabits) {
            // Check if already checked in today
            const [checkIn] = await db
                .select()
                .from(checkIns)
                .where(and(
                    eq(checkIns.habitId, habit.id),
                    eq(checkIns.date, todayStr)
                ));

            if (!checkIn) {
                await NotificationService.createNotification({
                    userId: habit.userId,
                    title: "Ready for today?",
                    message: `Don't forget to complete your habit: ${habit.name}`,
                    type: 'habit_due',
                    metadata: { habitId: habit.id }
                });
            }
        }
    } catch (error: any) {
        logger.error(`Error in sendDailyReminders: ${error.message}`);
    }
};

const sendMissedHabitReminders = async () => {
    try {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        
        // Find all active habits
        const activeHabits = await db
            .select()
            .from(habits)
            .where(eq(habits.status, 'active'));

        for (const habit of activeHabits) {
            // Check if checked in yesterday
            const [checkIn] = await db
                .select()
                .from(checkIns)
                .where(and(
                    eq(checkIns.habitId, habit.id),
                    eq(checkIns.date, yesterdayStr),
                    eq(checkIns.completed, true)
                ));

            if (!checkIn) {
                await NotificationService.createNotification({
                    userId: habit.userId,
                    title: "Don't break the chain! 🔗",
                    message: `You missed your habit yesterday: ${habit.name}. Let's get back on track today!`,
                    type: 'habit_missed',
                    metadata: { habitId: habit.id }
                });
            }
        }
    } catch (error: any) {
        logger.error(`Error in sendMissedHabitReminders: ${error.message}`);
    }
};

const sendMotivationalTips = async () => {
    const TIPS = [
        "Consistency is the key to success!",
        "Small steps lead to big changes.",
        "You're doing great, keep it up!",
        "Every day is a new chance to improve.",
        "Discipline is choosing between what you want now and what you want most."
    ];

    try {
        const allUsers = await db.select().from(users);
        for (const user of allUsers) {
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            await NotificationService.createNotification({
                userId: user.id,
                title: "Daily Motivation",
                message: randomTip,
                type: 'motivational'
            });
        }
    } catch (error: any) {
        logger.error(`Error in sendMotivationalTips: ${error.message}`);
    }
};
