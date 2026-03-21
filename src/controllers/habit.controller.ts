import { db } from "../db";
import { habits, checkIns } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { CreateHabitType, JwtPayload } from "../types/types";

export const HabitController = {
    getAll: async (userId: string) => {
        return await db.select().from(habits).where(eq(habits.userId, userId));
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
            goalValue
        } = body;


        

        try {
            const [newHabit] = await db.insert(habits).values({
                userId: user.sub,
                name,
                color: color ?? "#4A90E2",
                category: category as any,
                frequency: frequency as any,
                icon: icon,
                targetCount: targetCount ?? 1,
                customDays,
                goalLabel,
                goalValue,
                goalUnit,
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
    
    checkIn: async (data: any) => {
        const [checkin] = await db.insert(checkIns).values(data).returning();
        return checkin;
    }
};
