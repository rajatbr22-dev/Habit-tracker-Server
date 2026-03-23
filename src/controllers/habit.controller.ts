import { db } from "../db";
import { habits, checkIns, users } from "../db/schema";
import { eq, and, sql, or, ilike, SQL, desc } from "drizzle-orm";
import { Category, CreateHabitCheckIns, CreateHabitType, Frequency, GetAllHabitsQueryType, JwtPayload } from "../types/types";
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
    }
};
