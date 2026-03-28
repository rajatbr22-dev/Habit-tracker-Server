import { db } from "../db";
import { habits, checkIns } from "../db/schema";
import { eq, count, and, max, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";

export const DashboardController = {
    getSummary: async (userId: string) => {
        try {
            logger.info(`Fetching dashboard summary for user: ${userId}`);

            // Total Habits
            const [habitStats] = await db
                .select({
                    totalHabits: count(),
                    longestOverallStreak: max(habits.longestStreak)
                })
                .from(habits)
                .where(eq(habits.userId, userId));

            // Total Check-ins (Done)
            const [totalDone] = await db
                .select({ count: count() })
                .from(checkIns)
                .where(and(eq(checkIns.userId, userId), eq(checkIns.completed, true)));

            // Completion Rate Calculation
            // For a more accurate completion rate, we ideally need (actual checkins / expected checkins)
            // For now, let's simplify as (total successful checkins / (total habits * days since first habit))
            // BUT a simpler version is just (total successful checkins / total checkins) if we have data for missed ones
            // Since we only record when user checks in (typically), let's use a reasonable placeholder or simple ratio
            const [totalPossible] = await db
                .select({ count: count() })
                .from(checkIns)
                .where(eq(checkIns.userId, userId));

            const completionRate = totalPossible.count > 0
                ? Math.round((totalDone.count / totalPossible.count) * 100)
                : 0;

            return createResponse({
                success: true,
                message: "Dashboard summary fetched successfully",
                data: {
                    totalDone: totalDone.count,
                    longestStreak: habitStats.longestOverallStreak || 0,
                    completionRate: completionRate,
                    globalRank: "Top 5%", // Placeholder for now
                }
            });
        } catch (error: any) {
            logger.error(`Error in getSummary for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch dashboard summary",
                data: null
            });
        }
    },

    getWeeklyOverview: async (userId: string) => {
        try {
            logger.info(`Fetching weekly overview for user: ${userId}`);

            // Get the last 7 days of check-ins
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() - (6 - i));
                return date.toISOString().split('T')[0];
            });

            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

            // Fetch all check-ins for the last 7 days for this user
            const recentCheckIns = await db
                .select()
                .from(checkIns)
                .where(and(
                    eq(checkIns.userId, userId),
                    sql`${checkIns.date} >= ${last7Days[0]}`,
                    sql`${checkIns.date} <= ${last7Days[6]}`
                ));

            const weeklyProgress = last7Days.map(dateStr => {
                const dayDate = new Date(dateStr);
                const dayName = dayNames[dayDate.getDay()];

                const dayCheckIns = recentCheckIns.filter(ci => ci.date === dateStr);
                const isToday = dateStr === today.toISOString().split('T')[0];

                let status: 'done' | 'missed' | 'active' | 'pending' = 'pending';

                if (dayCheckIns.length > 0) {
                    const allCompleted = dayCheckIns.every(ci => ci.completed);
                    status = allCompleted ? 'done' : 'missed';
                } else if (isToday) {
                    status = 'active';
                } else if (new Date(dateStr) < today) {
                    // If it's a past day and no check-ins, we can consider it missed if there were habits
                    status = 'missed';
                }

                return { day: dayName, status, date: dateStr };
            });

            return createResponse({
                success: true,
                message: "Weekly overview fetched successfully",
                data: weeklyProgress
            });
        } catch (error: any) {
            logger.error(`Error in getWeeklyOverview for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch weekly overview",
                data: null
            });
        }
    },

    getTodayHabits: async (userId: string) => {
        try {
            logger.info(`Fetching today's habits for user: ${userId}`);

            const todayStr = new Date().toISOString().split('T')[0];

            // Get all active habits for the user
            const userHabits = await db
                .select()
                .from(habits)
                .where(and(
                    eq(habits.userId, userId),
                    eq(habits.status, 'active')
                ))
                .orderBy(desc(habits.createdAt));

            // Get today's check-ins
            const todayCheckIns = await db
                .select()
                .from(checkIns)
                .where(and(
                    eq(checkIns.userId, userId),
                    eq(checkIns.date, todayStr)
                ));

            const habitsWithProgress = userHabits.map(habit => {
                const checkIn = todayCheckIns.find(ci => ci.habitId === habit.id);
                // Simple progress: 1 if checked in, 0 if not (could be more complex based on targetCount)
                const progress = checkIn && checkIn.completed ? 1 : 0;

                return {
                    id: habit.id,
                    name: habit.name,
                    streak: habit.currentStreak,
                    progress,
                    color: habit.color
                };
            });

            return createResponse({
                success: true,
                message: "Today's habits fetched successfully",
                data: habitsWithProgress
            });
        } catch (error: any) {
            logger.error(`Error in getTodayHabits for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch today's habits",
                data: null
            });
        }
    }
};
