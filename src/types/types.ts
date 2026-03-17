import { Static } from "elysia";
import { createHabit } from "../schema/habits.schema";

export type JwtPayload = {

    sub: string;
    
};



export type CreateHabitType = Static<typeof createHabit>;