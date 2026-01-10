export const networkOptimization = {
    batchGetWindow: 100,
    cacheDuration: 60000,
    inputDebounceDelay: 300,
    maxConcurrentRequests: 3,
    requestTimeout: 30000,
    retryAttempts: 2,
    retryDelay: 1000,
};

export const performanceThresholds = {
    maxSyncTime: 50,
    maxChangeHandlerTime: 100,
    maxTimeoutHandlerTime: 50,
    maxReflowTime: 33,
    maxRenderTime: 16,
};

export const monitoringConfig = {
    // Enable performance warnings in development
    enableWarnings: process.env.NODE_ENV === 'development',

    // Enable detailed logging
    enableDetailedLogging: false,

    // Batch monitoring data before sending
    monitoringBatchSize: 10,

    // Send monitoring data after delay (ms)
    monitoringBatchDelay: 5000,
};
