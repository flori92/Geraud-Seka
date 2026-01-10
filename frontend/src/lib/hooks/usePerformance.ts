import { useCallback, useRef, useEffect } from 'react';

export function useBatchedDOMUpdates() {
    const readTasksRef = useRef<Array<() => void>>([]);
    const writeTasksRef = useRef<Array<() => void>>([]);
    const pendingRef = useRef(false);

    const scheduleBatch = useCallback(() => {
        if (pendingRef.current) return;
        pendingRef.current = true;

        requestAnimationFrame(() => {
            readTasksRef.current.forEach(task => task());
            readTasksRef.current = [];

            writeTasksRef.current.forEach(task => task());
            writeTasksRef.current = [];

            pendingRef.current = false;
        });
    }, []);

    const scheduleRead = useCallback((task: () => void) => {
        readTasksRef.current.push(task);
        scheduleBatch();
    }, [scheduleBatch]);

    const scheduleWrite = useCallback((task: () => void) => {
        writeTasksRef.current.push(task);
        scheduleBatch();
    }, [scheduleBatch]);

    return { scheduleRead, scheduleWrite };
}

export function useOptimizedTimeout(callback: () => void, delay: number = 0) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const start = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            requestAnimationFrame(() => {
                callback();
            });
        }, delay);
    }, [callback, delay]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        return cancel;
    }, [cancel]);

    return { start, cancel };
}

export function useOptimizedChangeHandler<T>(
    handler: (value: T) => void | Promise<void>,
    delay: number = 300
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastValueRef = useRef<T | null>(null);

    const onChange = useCallback((value: T) => {
        lastValueRef.current = value;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            const currentValue = lastValueRef.current;
            if (currentValue !== null) {
                requestAnimationFrame(() => {
                    handler(currentValue);
                });
            }
        }, delay);
    }, [handler, delay]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return onChange;
}

export function usePerformanceMonitor(componentName: string) {
    const renderStartRef = useRef(performance.now());

    useEffect(() => {
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStartRef.current;

        if (renderTime > 16) {
            console.warn(
                `⚠️ Performance: ${componentName} render took ${renderTime.toFixed(2)}ms (> 16ms)`
            );
        }

        renderStartRef.current = performance.now();
    });

    return null;
}
