import { db } from "../db";
import { habits, checkIns, users } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { CreateHabitCheckIns, CreateHabitType, GetAllHabitsQueryType, JwtPayload } from "../types/types";
import { logger } from "../utils/logger";
import { createResponse } from "../utils/responseReusable";

export const HabitController = {
    getAll: async ({
        user,
        set,
        query,
    } : any) => {
        
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

        try {

            const today = new Date().toISOString().split("T")[0];

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
                .where(eq(habits.userId, user.sub))
                .limit(pageSize)
                .offset(offset)
                .orderBy(habits.createdAt);


            const [{count}] = await db
                .select({ count: sql<number>`count(*)` })
                .from(habits)
                .where(eq(habits.userId, user.sub));

            
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

            return createResponse({
                success: true,
                message: "Habits fetched successfully",
                data: allHabits,
                pagination
            })

        } catch (error) {

            logger.error("Error fetching habits");

            set.status = 500;

            return createResponse({
                success: false,
                message: "Error fetching habits"
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

            // 3. Perform check-in
            const [newCheckIn] = await db
                .insert(checkIns)
                .values({
                    habitId: habitId,
                    userId: user.sub,
                    date: today,
                    completed: completed,
                }).returning();

            return createResponse({
                success: true,
                message: "Habit check-in successful",
                data: newCheckIn
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
