import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://8e9a51dd8600ae14b9da41db1b035f92@o4510402307031040.ingest.de.sentry.io/4510408244920400",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
        Sentry.replayIntegration({
            // Additional Replay configuration goes here,
            maskAllText: true,
            blockAllMedia: true,
        }),
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],

    enableLogs: true,
});
