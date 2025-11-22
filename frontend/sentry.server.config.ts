import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://8e9a51dd8600ae14b9da41db1b035f92@o4510402307031040.ingest.de.sentry.io/4510408244920400",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    enableLogs: true,
});
