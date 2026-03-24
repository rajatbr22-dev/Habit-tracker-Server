import { db } from "../db";
import { habits, checkIns, users } from "../db/schema";
import { eq, and, sql, or, ilike, SQL, desc } from "drizzle-orm";
import { Category, CreateHabitCheckIns, CreateHabitType, Frequency, GetAllHabitsQueryType, JwtPayload, UpdateHabitType } from "../types/types";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";

export const HabitController = {
    getAll: async ({
        user,
        set,
        query,
    } : {
        user:JwtPayload,
        set: any,
        query: GetAllHabitsQueryType
    }) => {
        
        if(!user.sub){

            logger.error("Unauthorized access");

            set.status = 401;

            return createResponse({
                success: false,
                message: "Unauthorized access"
            })
        }

        const page = Number(query.page ?? 1)

        const pageSize = Number(query.pageSize ?? 10)
    
        const offset = (page - 1) * pageSize;

        logger.info("query data", query)

        try {

            const today = query.date ?? new Date().toISOString().split("T")[0];

            const normalize = (value: string) => value.trim().toLowerCase();

            const normalizedCategory =
                query.categoryFrequency && query.categoryFrequency !== "All"
                    ? normalize(query.categoryFrequency)
                    : undefined;

            const VALID_CATEGORIES = ["health", "productivity", "fitness", "mindfulness", "financial", "social", "other"];
            const VALID_FREQUENCIES = ["daily", "weekly", "custom"];

            const isCategory = VALID_CATEGORIES.includes(normalizedCategory as any);
            const isFrequency = VALID_FREQUENCIES.includes(normalizedCategory as any);

            const categoryFrequencyFilters = [];
            if (isCategory) categoryFrequencyFilters.push(eq(habits.category, normalizedCategory as Category));
            if (isFrequency) categoryFrequencyFilters.push(eq(habits.frequency, normalizedCategory as Frequency));


            const filters = [
            eq(habits.userId, user.sub),
            eq(habits.status, "active"),
            categoryFrequencyFilters.length > 0
                ? or(...categoryFrequencyFilters)
                : undefined,
            query.search
                ? ilike(habits.name, `%${query.search}%`)
                : undefined
            ].filter(Boolean) as SQL[];


            const allHabits = await db
                .select({
                    id: habits.id,
                    name: habits.name,
                    category: habits.category,
                    meta: habits.meta,
                    currentStreak: habits.currentStreak,
                    icon: habits.icon,
                    color: habits.color,
                    frequency: habits.frequency,
                    targetCount: habits.targetCount,
                    reminderTime: habits.reminderTime,
                    createdAt: habits.createdAt,
                    completed: checkIns.completed,
                    customDays: habits.customDays,

                    goalLabel: habits.goalLabel,
                    goalValue: habits.goalValue,
                    goalUnit: habits.goalUnit,
                    notes: habits.notes,
                    longestStreak: habits.longestStreak,
                    lastCompletedAt: habits.lastCompletedAt,
                    
                })
                .from(habits)
                .leftJoin(
                    checkIns,
                    and(
                    eq(checkIns.habitId, habits.id),
                    eq(checkIns.userId, user.sub),
                    eq(checkIns.date, today)
                    )
                )
                .where(
                    and(
                        ...filters
                    )
                )
                .limit(pageSize)
                .offset(offset)
                .orderBy(desc(habits.createdAt));


            const [{count}] = await db
                .select({ count: sql<number>`count(*)` })
                .from(habits)
                .where(and(...filters));

            
            if(allHabits.length <= 0){

                logger.info("No habits found");

                set.status = 200;

                return createResponse({
                    success: true,
                    message: "No habits found",
                    data: []
                });
            }

            const pagination = {

                page,
                pageSize,
                total: Number(count),
                totalPages: Math.ceil(count / pageSize),

            };

            const formattedHabits = allHabits.map(h => ({
                ...h,
                completed: h.completed ?? false
            }));

            return createResponse({
                success: true,
                message: "Habits fetched successfully",
                data: formattedHabits,
                pagination
            })

        } catch (error) {

            logger.error("Error fetching habits", error);

            set.status = 500;

            return createResponse({
                success: false,
                message: "Error fetching habits",
                
            })

        }
    },

    getById: async ({
        user,
        set,
        params,
    } : {
        user: JwtPayload,
        set: any,
        params: { id: string }
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access to get habit by ID");
            set.status = 401;
            return createResponse({
                success: false,
                message: "Unauthorized access"
            });
        }

        try {
            const today = new Date().toISOString().split("T")[0];

            logger.info(`Fetching habit with ID: ${id} for user: ${user.sub}`);

            const [habit] = await db
                .select({
                    id: habits.id,
                    name: habits.name,
                    category: habits.category,
                    meta: habits.meta,
                    currentStreak: habits.currentStreak,
                    icon: habits.icon,
                    color: habits.color,
                    frequency: habits.frequency,
                    targetCount: habits.targetCount,
                    reminderTime: habits.reminderTime,
                    createdAt: habits.createdAt,
                    completed: checkIns.completed,
                    customDays: habits.customDays,
                    goalLabel: habits.goalLabel,
                    goalValue: habits.goalValue,
                    goalUnit: habits.goalUnit,
                    notes: habits.notes,
                    longestStreak: habits.longestStreak,
                    lastCompletedAt: habits.lastCompletedAt,
                })
                .from(habits)
                .leftJoin(
                    checkIns,
                    and(
                        eq(checkIns.habitId, habits.id),
                        eq(checkIns.userId, user.sub),
                        eq(checkIns.date, today)
                    )
                )
                .where(
                    and(
                        eq(habits.id, id),
                        eq(habits.userId, user.sub),
                        eq(habits.status, "active")
                    )
                );

            if (!habit) {
                logger.error(`Habit with ID ${id} not found or doesn't belong to user ${user.sub}`);
                set.status = 404;
                return createResponse({
                    success: false,
                    message: "Habit not found"
                });
            }

            logger.info(`Successfully fetched habit with ID: ${id}`);

            return createResponse({
                success: true,
                message: "Habit fetched successfully",
                data: {
                    ...habit,
                    completed: habit.completed ?? false
                }
            });

        } catch (error) {
            logger.error(`Error fetching habit with ID ${id}:`, error);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Error fetching habit",
                data: error
            });
        }
    },
    
    create: async ({
        user,
        body,
        set
    } : {
        user: JwtPayload,
        body: CreateHabitType,
        set: any
    }) => {
        const {
            name,
            color,
            category,
            frequency,
            icon,
            targetCount,
            customDays,
            goalLabel,
            goalUnit,
            goalValue,
            reminderTime,
        } = body;


        if(!name || !frequency || !targetCount){
            logger.error("Missing required fields for habit creation");

            set.status = 400;

            return {

                success: false,
                message: "Missing required fields for habit creation"

            };

        }


        

        try {

            const existingHabits = await db
                .select()
                .from(habits)
                .where(
                    and(
                        eq(habits.userId, user.sub),
                        eq(habits.status, "active"),
                        sql`LOWER(${habits.name}) = LOWER(${name.trim()})`
                    )
                );

            if(existingHabits.length > 0){
                logger.error("Habit with same name already exists");

                set.status = 400;

                return {

                    success: false,
                    message: "Habit with same name already exists"

                };
            }

            // Get user subscription
            const [currentUser] = await db
                .select({
                    subscriptionStatus: users.subscriptionStatus,
                    premiumUntil: users.premiumUntil
                })
                .from(users)
                .where(eq(users.id, user.sub));

            
            if (!currentUser) {
                logger.error("User not found");

                set.status = 404;

                return {

                    success: false,
                    message: "User not found"

                };

            }


            // Check if user is premium
            const isPremium =
            currentUser?.subscriptionStatus === "active" &&
            currentUser?.premiumUntil &&
            new Date(currentUser.premiumUntil).getTime() > Date.now();

            // If NOT premium → check habit limit'

            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(habits)
                .where(
                    and(
                    eq(habits.userId, user.sub),
                    eq(habits.status, "active")
                    )
                );

           
            if (!isPremium && count >= 2) {
                logger.error("User reached free plan habit limit");

                set.status = 400;

                return {
                    success: false,
                    message: "Free plan allows only 2 habits. Upgrade to premium 🚀"
                };
            }

            const [newHabit] = await db.insert(habits).values({
                userId: user.sub,
                name: name.trim(),
                color: color ?? "#4A90E2",
                category: category as any,
                frequency: frequency as any,
                icon: icon,
                targetCount: targetCount ?? 1,
                customDays,
                goalLabel,
                goalValue,
                goalUnit,
                reminderTime
            }).returning();

            return {
                success: true,
                message: "Habit created successfully",
                data: newHabit
            };
        } catch (error) {
            console.error("Error creating habit:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to create habit"
            };
        }
    },
    
    checkIn: async ({
        user,
        set,
        body,
    }: {
        user: JwtPayload,
        set: any,
        body: CreateHabitCheckIns
    }) => {
        
        const {
            habitId,
            completed
        } = body;

        if(!habitId || completed === undefined){
            logger.error("Missing required fields for habit check-in");

            set.status = 400;

            return createResponse({
                success: false,
                message: "Missing required fields for habit check-in"
            });
        }

        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        try {
            // 1. Verify habit exists and belongs to the user
            const [habit] = await db
                .select()
                .from(habits)
                .where(
                    and(
                        eq(habits.id, habitId),
                        eq(habits.userId, user.sub)
                    )
                );

            if (!habit) {
                logger.error("Habit not found or doesn't belong to user");
                set.status = 404;
                return createResponse({
                    success: false,
                    message: "Habit not found"
                });
            }

            // 2. Check if check-in for today already exists
            const [existingCheckIn] = await db
                .select()
                .from(checkIns)
                .where(
                    and(
                        eq(checkIns.userId, user.sub),
                        eq(checkIns.habitId, habitId),
                        eq(checkIns.date, today)
                    )
                );

            if (existingCheckIn) {
                logger.info("Habit check-in for today already exists");
                set.status = 400;
                return createResponse({
                    success: false,
                    message: "Habit already checked-in for today"
                });
            }

            // 3. Calculate Streaks
            let newStreak = habit.currentStreak || 0;
            let newLongestStreak = habit.longestStreak || 0;
            let lastCompletedAt = habit.lastCompletedAt;

            if (completed) {
                // If last completion was yesterday, increment
                if (habit.lastCompletedAt === yesterday) {
                    newStreak += 1;
                } 
                // If it's the first check-in or streak was broken
                else if (habit.lastCompletedAt !== today) {
                    newStreak = 1;
                }
                
                newLongestStreak = Math.max(newStreak, newLongestStreak);
                lastCompletedAt = today;
            } else {
                // If marked as not completed, reset current streak
                newStreak = 0;
            }

            // 4. Perform check-in and habit update in a transaction
            const result = await db.transaction(async (tx) => {
                const [checkIn] = await tx
                    .insert(checkIns)
                    .values({
                        habitId: habitId,
                        userId: user.sub,
                        date: today,
                        completed: completed,
                    })
                    .returning();

                await tx
                    .update(habits)
                    .set({
                        currentStreak: newStreak,
                        longestStreak: newLongestStreak,
                        lastCompletedAt: lastCompletedAt,
                        updatedAt: new Date(),
                    })
                    .where(eq(habits.id, habitId));

                return checkIn;
            });

            return createResponse({
                success: true,
                message: "Habit check-in successful",
                data: result
            });

        } catch (error) {

            logger.error("Error checking in to habit", error);

            set.status = 500;

            return createResponse({
                success: false,
                message: "Failed to check in to habit",
                data: error
            });
        }
    },

    update: async ({
        user,
        params,
        body,
        set
    }: {
        user: JwtPayload,
        params: { id: string },
        body: UpdateHabitType,
        set: any
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access");
            set.status = 401;
            return createResponse({
                success: false,
                message: "Unauthorized access"
            });
        }

        try {
            // 1. Check if habit exists and belongs to user
            const [existingHabit] = await db
                .select()
                .from(habits)
                .where(
                    and(
                        eq(habits.id, id),
                        eq(habits.userId, user.sub)
                    )
                );

            if (!existingHabit) {
                logger.error(`Habit with id ${id} not found or doesn't belong to user`);
                set.status = 404;
                return createResponse({
                    success: false,
                    message: "Habit not found"
                });
            }

            // 2. If name is being updated, check for collision
            if (body.name && body.name.trim().toLowerCase() !== existingHabit.name.toLowerCase()) {
                const [collision] = await db
                    .select()
                    .from(habits)
                    .where(
                        and(
                            eq(habits.userId, user.sub),
                            eq(habits.status, "active"),
                            sql`LOWER(${habits.name}) = LOWER(${body.name.trim()})`,
                            sql`${habits.id} != ${id}`
                        )
                    );

                if (collision) {
                    logger.error("Habit with same name already exists");
                    set.status = 400;
                    return createResponse({
                        success: false,
                        message: "Habit with same name already exists"
                    });
                }
            }

            // 3. Update the habit
            const [updatedHabit] = await db
                .update(habits)
                .set({
                    ...body,
                    name: body.name ? body.name.trim() : undefined,
                    updatedAt: new Date(),
                })
                .where(eq(habits.id, id))
                .returning();

            return createResponse({
                success: true,
                message: "Habit updated successfully",
                data: updatedHabit
            });

        } catch (error) {
            logger.error("Error updating habit", error);
            set.status = 500;
            return createResponse({
                success: false,
                message: "Failed to update habit",
                data: error
            });
        }
    },

    archive: async ({
        user,
        params,
        set
    }: {
        user: JwtPayload,
        params: { id: string },
        set: any
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access for archive");
            set.status = 401;
            return createResponse({ success: false, message: "Unauthorized access" });
        }

        try {
            const [updatedHabit] = await db
                .update(habits)
                .set({ status: "archived", updatedAt: new Date() })
                .where(and(eq(habits.id, id), eq(habits.userId, user.sub)))
                .returning();

            if (!updatedHabit) {
                set.status = 404;
                return createResponse({ success: false, message: "Habit not found" });
            }

            logger.info(`Habit ${id} archived for user ${user.sub}`);
            return createResponse({
                success: true,
                message: "Habit archived successfully",
                data: updatedHabit
            });
        } catch (error) {
            logger.error(`Error archiving habit ${id}`, error);
            set.status = 500;
            return createResponse({ success: false, message: "Failed to archive habit", data: error });
        }
    },

    unarchive: async ({
        user,
        params,
        set
    }: {
        user: JwtPayload,
        params: { id: string },
        set: any
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access for unarchive");
            set.status = 401;
            return createResponse({ success: false, message: "Unauthorized access" });
        }

        try {
            const [updatedHabit] = await db
                .update(habits)
                .set({ status: "active", updatedAt: new Date() })
                .where(and(eq(habits.id, id), eq(habits.userId, user.sub)))
                .returning();

            if (!updatedHabit) {
                set.status = 404;
                return createResponse({ success: false, message: "Habit not found" });
            }

            logger.info(`Habit ${id} unarchived for user ${user.sub}`);
            return createResponse({
                success: true,
                message: "Habit unarchived successfully",
                data: updatedHabit
            });
        } catch (error) {
            logger.error(`Error unarchiving habit ${id}`, error);
            set.status = 500;
            return createResponse({ success: false, message: "Failed to unarchive habit", data: error });
        }
    },

    delete: async ({
        user,
        params,
        set
    }: {
        user: JwtPayload,
        params: { id: string },
        set: any
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access for delete");
            set.status = 401;
            return createResponse({ success: false, message: "Unauthorized access" });
        }

        try {
            const [updatedHabit] = await db
                .update(habits)
                .set({ status: "deleted", updatedAt: new Date() })
                .where(and(eq(habits.id, id), eq(habits.userId, user.sub)))
                .returning();

            if (!updatedHabit) {
                set.status = 404;
                return createResponse({ success: false, message: "Habit not found" });
            }

            logger.info(`Habit ${id} marked as deleted for user ${user.sub}`);
            return createResponse({
                success: true,
                message: "Habit deleted successfully",
                data: updatedHabit
            });
        } catch (error) {
            logger.error(`Error deleting habit ${id}`, error);
            set.status = 500;
            return createResponse({ success: false, message: "Failed to delete habit", data: error });
        }
    },

    getArchived: async ({
        user,
        set,
        query,
    } : {
        user:JwtPayload,
        set: any,
        query: GetAllHabitsQueryType
    }) => {
        if(!user.sub){
            logger.error("Unauthorized access to get archived habits");
            set.status = 401;
            return createResponse({ success: false, message: "Unauthorized access" });
        }

        const page = Number(query.page ?? 1)
        const pageSize = Number(query.pageSize ?? 10)
        const offset = (page - 1) * pageSize;

        try {
            const filters = [
                eq(habits.userId, user.sub),
                eq(habits.status, "archived")
            ];

            const archivedHabits = await db
                .select()
                .from(habits)
                .where(and(...filters))
                .limit(pageSize)
                .offset(offset)
                .orderBy(desc(habits.updatedAt));

            const [{count}] = await db
                .select({ count: sql<number>`count(*)` })
                .from(habits)
                .where(and(...filters));

            const pagination = {
                page,
                pageSize,
                total: Number(count),
                totalPages: Math.ceil(count / pageSize),
            };

            return createResponse({
                success: true,
                message: "Archived habits fetched successfully",
                data: archivedHabits,
                pagination
            });

        } catch (error) {
            logger.error("Error fetching archived habits", error);
            set.status = 500;
            return createResponse({ success: false, message: "Error fetching archived habits" });
        }
    },

    getDetail: async ({
        user,
        params,
        set
    }: {
        user: JwtPayload,
        params: { id: string },
        set: any
    }) => {
        const { id } = params;

        if (!user.sub) {
            logger.error("Unauthorized access for habit detail");
            set.status = 401;
            return createResponse({ success: false, message: "Unauthorized access" });
        }

        try {
            // 1. Fetch Habit Basic Info
            const [habit] = await db
                .select()
                .from(habits)
                .where(and(eq(habits.id, id), eq(habits.userId, user.sub)));

            if (!habit) {
                set.status = 404;
                return createResponse({ success: false, message: "Habit not found" });
            }

            // 2. Fetch Check-ins for the last 365 days for heatmap and infographics
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const startDate = oneYearAgo.toISOString().split('T')[0];

            const allCheckIns = await db
                .select()
                .from(checkIns)
                .where(
                    and(
                        eq(checkIns.habitId, id),
                        eq(checkIns.userId, user.sub),
                        sql`${checkIns.date} >= ${startDate}`
                    )
                )
                .orderBy(desc(checkIns.date));

            // 3. Process Heatmap Data
            // Format: { [date]: { completed: boolean, value?: number } }
            const heatmapData = allCheckIns.reduce((acc: any, checkIn) => {
                acc[checkIn.date] = {
                    completed: checkIn.completed,
                    value: checkIn.value
                };
                return acc;
            }, {});

            // 4. Process Weekly Stats (completion rate per day of week)
            const dayOfWeekStats: { [key: string]: { completed: number, total: number } } = {
                'Sunday': { completed: 0, total: 0 },
                'Monday': { completed: 0, total: 0 },
                'Tuesday': { completed: 0, total: 0 },
                'Wednesday': { completed: 0, total: 0 },
                'Thursday': { completed: 0, total: 0 },
                'Friday': { completed: 0, total: 0 },
                'Saturday': { completed: 0, total: 0 }
            };

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            allCheckIns.forEach(checkIn => {
                const date = new Date(checkIn.date);
                const dayName = days[date.getDay()];
                dayOfWeekStats[dayName].total += 1;
                if (checkIn.completed) {
                    dayOfWeekStats[dayName].completed += 1;
                }
            });

            // Calculate percentages
            const weeklyProgress = Object.keys(dayOfWeekStats).map(day => ({
                day,
                percentage: dayOfWeekStats[day].total > 0 
                    ? Math.round((dayOfWeekStats[day].completed / dayOfWeekStats[day].total) * 100) 
                    : 0
            }));

            // 5. Completion Rate (Overall in the last year)
            const totalCheckIns = allCheckIns.length;
            const completedCount = allCheckIns.filter(c => c.completed).length;
            const completionRate = totalCheckIns > 0 ? Math.round((completedCount / totalCheckIns) * 100) : 0;

            // 6. Monthly Progress (Last 6 months)
            const monthlyStats: { [key: string]: { completed: number, total: number } } = {};
            const last6Months = [];
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                last6Months.push(monthYear);
                monthlyStats[monthYear] = { completed: 0, total: 0 };
            }

            allCheckIns.forEach(checkIn => {
                const date = new Date(checkIn.date);
                const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                if (monthlyStats[monthYear]) {
                    monthlyStats[monthYear].total += 1;
                    if (checkIn.completed) {
                        monthlyStats[monthYear].completed += 1;
                    }
                }
            });

            const monthlyProgress = last6Months.reverse().map(month => ({
                month,
                percentage: monthlyStats[month].total > 0 
                    ? Math.round((monthlyStats[month].completed / monthlyStats[month].total) * 100) 
                    : 0
            }));

            return createResponse({
                success: true,
                message: "Habit details fetched successfully",
                data: {
                    habit,
                    analytics: {
                        heatmapData,
                        weeklyProgress,
                        monthlyProgress,
                        completionRate,
                        totalCheckIns,
                        completedCount
                    }
                }
            });

        } catch (error) {
            logger.error(`Error fetching habit detail for ${id}`, error);
            set.status = 500;
            return createResponse({ success: false, message: "Failed to fetch habit details", data: error });
        }
    }
};
