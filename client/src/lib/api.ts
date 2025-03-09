type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiError = {
    message: string;
    status?: number;
};

export async function apiRequest<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown
): Promise<Response> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${baseUrl}${endpoint}`;

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const error: ApiError = {
                message: 'An error occurred while fetching the data.',
                status: response.status,
            };
            throw error;
        }

        return response;
    } catch (error) {
        const apiError: ApiError = {
            message: error instanceof Error ? error.message : 'An unknown error occurred',
        };
        throw apiError;
    }
}