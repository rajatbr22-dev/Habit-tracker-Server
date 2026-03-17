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
            
        } catch (error) {
            
        }
    },
    
    checkIn: async (data: any) => {
        const [checkin] = await db.insert(checkIns).values(data).returning();
        return checkin;
    }
};
