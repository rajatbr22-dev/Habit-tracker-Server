import { db } from "../db";
import { habits, checkIns } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const HabitController = {
    getAll: async (userId: string) => {
        return await db.select().from(habits).where(eq(habits.userId, userId));
    },
    
    create: async (data: any) => {
        const [habit] = await db.insert(habits).values({
            ...data,
            customDays: data.customDays || [],
        }).returning();
        return habit;
    },
    
    checkIn: async (data: any) => {
        const [checkin] = await db.insert(checkIns).values(data).returning();
        return checkin;
    }
};
