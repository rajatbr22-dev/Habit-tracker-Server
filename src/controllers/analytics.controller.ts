import { db } from "../db";
import { habits, checkIns } from "../db/schema";
import { eq, count, and, max, sql, desc, gte, lte } from "drizzle-orm";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";

export const AnalyticsController = {
    getSummary: async (userId: string) => {
        try {
            logger.info(`Fetching analytics summary for user: ${userId}`);

            // 1. Total & Active Habits
            const [habitStats] = await db
                .select({
                    totalHabits: count(),
                    activeHabits: sql<number>`count(*) filter (where ${habits.status} = 'active')`,
                    longestOverallStreak: max(habits.longestStreak)
                })
                .from(habits)
                .where(eq(habits.userId, userId));

            // 2. Total Check-ins (Completed)
            const [totalDone] = await db
                .select({ count: count() })
                .from(checkIns)
                .where(and(eq(checkIns.userId, userId), eq(checkIns.completed, true)));

            // 3. Current Overall Streak (Max of all active habits)
            const [currentStreakResult] = await db
                .select({ maxStreak: max(habits.currentStreak) })
                .from(habits)
                .where(and(eq(habits.userId, userId), eq(habits.status, 'active')));

            // 4. Average Completion Rate
            // Fetch total check-ins (both completed and missed if recorded)
            const [totalPossible] = await db
                .select({ count: count() })
                .from(checkIns)
                .where(eq(checkIns.userId, userId));

            const completionRate = totalPossible.count > 0
                ? totalDone.count / totalPossible.count
                : 0;

            return createResponse({
                success: true,
                message: "Analytics summary fetched successfully",
                data: {
                    totalHabits: Number(habitStats.totalHabits) || 0,
                    activeHabits: Number(habitStats.activeHabits) || 0,
                    averageCompletionRate: completionRate,
                    currentOverallStreak: currentStreakResult.maxStreak || 0,
                    longestOverallStreak: habitStats.longestOverallStreak || 0,
                    totalCheckIns: Number(totalDone.count) || 0,
                }
            });
        } catch (error: any) {
            logger.error(`Error in getSummary (Analytics) for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch analytics summary",
                data: null
            });
        }
    },

    getWeeklyOverview: async (userId: string) => {
        try {
            logger.info(`Fetching analytics weekly overview for user: ${userId}`);

            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
            // Adjust to make Monday the start (0) if needed, but here we'll follow standard
            
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Start on Monday
            startOfWeek.setHours(0, 0, 0, 0);

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                return date.toISOString().split('T')[0];
            });

            // Fetch all check-ins for this week
            const weeklyCheckIns = await db
                .select()
                .from(checkIns)
                .where(and(
                    eq(checkIns.userId, userId),
                    gte(checkIns.date, last7Days[0]),
                    lte(checkIns.date, last7Days[6])
                ));

            // Fetch active habits to know how many were expected
            const [activeHabitsCount] = await db
                .select({ count: count() })
                .from(habits)
                .where(and(eq(habits.userId, userId), eq(habits.status, 'active')));
            
            const expectedCount = Number(activeHabitsCount.count) || 1;

            const dailyRates = last7Days.map(dateStr => {
                const dayCheckIns = weeklyCheckIns.filter(ci => ci.date === dateStr && ci.completed);
                return dayCheckIns.length / expectedCount;
            });

            const overallRate = dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length;

            return createResponse({
                success: true,
                message: "Weekly overview fetched successfully",
                data: {
                    weekStart: last7Days[0],
                    dailyRates,
                    overallRate
                }
            });
        } catch (error: any) {
            logger.error(`Error in getWeeklyOverview (Analytics) for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch weekly overview",
                data: null
            });
        }
    },

    getHabitPerformance: async (userId: string) => {
        try {
            logger.info(`Fetching habit performance for user: ${userId}`);

            const userHabits = await db
                .select()
                .from(habits)
                .where(and(eq(habits.userId, userId), eq(habits.status, 'active')))
                .orderBy(desc(habits.createdAt));

            // For each habit, calculate completion rate and total completions
            const performance = await Promise.all(userHabits.map(async (habit) => {
                const [completions] = await db
                    .select({ 
                        done: count(sql`case when ${checkIns.completed} = true then 1 end`),
                        total: count()
                    })
                    .from(checkIns)
                    .where(eq(checkIns.habitId, habit.id));

                const rate = Number(completions.total) > 0 
                    ? Number(completions.done) / Number(completions.total)
                    : 0;

                return {
                    habitId: habit.id,
                    habitName: habit.name,
                    habitColor: habit.color,
                    completionRate: rate,
                    currentStreak: habit.currentStreak,
                    longestStreak: habit.longestStreak,
                    totalCompletions: Number(completions.done)
                };
            }));

            return createResponse({
                success: true,
                message: "Habit performance fetched successfully",
                data: performance
            });
        } catch (error: any) {
            logger.error(`Error in getHabitPerformance for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch habit performance",
                data: null
            });
        }
    },

    getActivityHeatmap: async (userId: string) => {
        try {
            logger.info(`Fetching activity heatmap for user: ${userId}`);

            // Get last 70 days
            const today = new Date();
            const seventyDaysAgo = new Date(today);
            seventyDaysAgo.setDate(today.getDate() - 69);
            const startDateStr = seventyDaysAgo.toISOString().split('T')[0];

            const recentCheckIns = await db
                .select({
                    date: checkIns.date,
                    count: count()
                })
                .from(checkIns)
                .where(and(
                    eq(checkIns.userId, userId),
                    eq(checkIns.completed, true),
                    gte(checkIns.date, startDateStr)
                ))
                .groupBy(checkIns.date);

            // Fetch max completions on any single day to normalize levels (0-4)
            const maxCompletions = recentCheckIns.reduce((max, curr) => Math.max(max, Number(curr.count)), 0) || 1;

            // Map to 70 days
            const heatmap = Array.from({ length: 70 }, (_, i) => {
                const date = new Date(seventyDaysAgo);
                date.setDate(seventyDaysAgo.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayData = recentCheckIns.find(ci => ci.date === dateStr);
                const completions = dayData ? Number(dayData.count) : 0;
                
                // Calculate level 0-4
                let level = 0;
                if (completions > 0) {
                    level = Math.ceil((completions / maxCompletions) * 4);
                }

                return { date: dateStr, level };
            });

            return createResponse({
                success: true,
                message: "Activity heatmap fetched successfully",
                data: heatmap
            });
        } catch (error: any) {
            logger.error(`Error in getActivityHeatmap for user ${userId}: ${error.message}`);
            return createResponse({
                success: false,
                message: "Failed to fetch activity heatmap",
                data: null
            });
        }
    }
};
