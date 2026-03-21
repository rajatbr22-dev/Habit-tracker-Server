import { Static } from "elysia";
import { createHabit } from "../schema/habits.schema";
import { getAllHabitsQuery } from "../schema/query/getHabits.query.schema";

export type JwtPayload = {

    sub: string;
    
};



export type CreateHabitType = Static<typeof createHabit>;


export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: Pagination;
}


export type GetAllHabitsQueryType = Static<typeof getAllHabitsQuery>;