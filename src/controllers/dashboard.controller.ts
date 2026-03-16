import { db } from "../db";
import { habits, checkIns } from "../db/schema";
import { eq, count, and, sql } from "drizzle-orm";

export const DashboardController = {
    getSummary: async (userId: string) => {
        // Total Habits
        const [habitCount] = await db
            .select({ count: count() })
            .from(habits)
            .where(eq(habits.userId, userId));

        // Active Habits
        const [activeHabitCount] = await db
            .select({ count: count() })
            .from(habits)
            .where(and(eq(habits.userId, userId), eq(habits.status, 'active')));

        // Total Check-ins
        const [totalCheckIns] = await db
            .select({ count: count() })
            .from(checkIns)
            .innerJoin(habits, eq(checkIns.habitId, habits.id))
            .where(eq(habits.userId, userId));

        // Average Completion Rate (simplified logic for now)
        // total completed / total habits
        const completionRate = habitCount.count > 0 ? (totalCheckIns.count / habitCount.count) : 0;

        return {
            totalHabits: habitCount.count,
            activeHabits: activeHabitCount.count,
            totalCheckIns: totalCheckIns.count,
            averageCompletionRate: completionRate,
            currentOverallStreak: 0, // Simplified for brevity
            longestOverallStreak: 0,
        };
    },

    getWeeklyOverview: async (userId: string) => {
        // Return 7 days of completion rates
        // Placeholder for complex query
        return {
            weekStart: new Date().toISOString(),
            dailyRates: [0.8, 0.9, 0.7, 1.0, 0.6, 0.5, 0.9],
            overallRate: 0.78
        };
    }
};
