import { useCallback, useRef, useEffect } from 'react';

interface FetchRequest {
    url: string;
    options?: RequestInit;
    id: string;
}

interface PendingRequest {
    request: FetchRequest;
    resolve: (value: Response) => void;
    reject: (reason?: Error) => void;
}

export function useOptimizedFetch(batchDelay: number = 100) {
    const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const executeBatch = useCallback(async () => {
        const requests = Array.from(pendingRequestsRef.current.values());
        pendingRequestsRef.current.clear();

        for (const { request, resolve, reject } of requests) {
            try {
                const response = await fetch(request.url, request.options);
                resolve(response);
            } catch (error) {
                reject(error as Error);
            }
        }
    }, []);

    const batchedFetch = useCallback((
        url: string,
        options?: RequestInit,
        requestId?: string
    ): Promise<Response> => {
        const id = requestId || url;

        return new Promise((resolve, reject) => {
            const request: FetchRequest = { url, options, id };
            pendingRequestsRef.current.set(id, { request, resolve, reject });

            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }

            batchTimeoutRef.current = setTimeout(executeBatch, batchDelay);
        });
    }, [batchDelay, executeBatch]);

    useEffect(() => {
        return () => {
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
        };
    }, []);

    return batchedFetch;
}

export function useRequestCache<T = unknown>(duration: number = 60000) {
    const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

    const getFromCache = useCallback((url: string): T | null => {
        const cached = cacheRef.current.get(url);
        if (cached && Date.now() - cached.timestamp < duration) {
            return cached.data;
        }
        cacheRef.current.delete(url);
        return null;
    }, [duration]);

    const setInCache = useCallback((url: string, data: T) => {
        cacheRef.current.set(url, { data, timestamp: Date.now() });
    }, []);

    return { getFromCache, setInCache };
}
