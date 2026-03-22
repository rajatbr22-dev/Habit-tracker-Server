import { ApiResponse } from "../types/types";

export const createResponse = <T>({
    success,
    message,
    data,
    pagination,
}: ApiResponse<T>): ApiResponse<T> => {
    return {
        success,
        message,
        ...(data !== undefined && { data }),
        ...(pagination && { pagination }),
    };
};