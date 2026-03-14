interface SuccessResponse<T> {
    message: string;
    data: T;
}

export const createSuccessResponse = <T>(msg: string, data: T): SuccessResponse<T> => {
    return {
        message: msg,
        data: data
    }
}