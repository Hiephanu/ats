interface SuccessResponse<T> {
    message: string;
    data: T;
}

interface ErrorResponse {
    message: string;
    error?: any;
}

export const createSuccessResponse = <T>(msg: string, data: T): SuccessResponse<T> => {
    return {
        message: msg,
        data: data
    }
}

export const createErrorResponse = (msg: string, error?: any): ErrorResponse => {
    return {
        message: msg,
        error
    }
}