import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true") {
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://8e9a51dd8600ae14b9da41db1b035f92@o4510402307031040.ingest.de.sentry.io/4510408244920400",
        tracesSampleRate: 1,
        debug: false,
        enableLogs: true,
    });
}
