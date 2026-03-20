import { Static } from "elysia";
import { createHabit } from "../schema/habits.schema";

export type JwtPayload = {

    sub: string;
    
};



export type CreateHabitType = Static<typeof createHabit>;


export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: Pagination;
}