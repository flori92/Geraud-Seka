import { useState } from 'react';
import Head from 'next/head';
import * as Sentry from "@sentry/nextjs";
import { DashboardLayout } from '@/components/DashboardLayout';

export default function SentryTestPage() {
    const [loading, setLoading] = useState(false);

    const handleExceptionClick = () => {
        try {
            throw new Error("Sentry Test Exception");
        } catch (error) {
            Sentry.captureException(error);
            alert("Exception captured! Check Sentry dashboard.");
        }
    };

    const handleTraceClick = () => {
        setLoading(true);
        Sentry.startSpan(
            {
                op: "ui.click",
                name: "Test Trace Button Click",
            },
            async (span) => {
                try {
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    const value = "test-config";
                    const metric = "performance-metric";

                    span.setAttribute("config", value);
                    span.setAttribute("metric", metric);

                    alert("Trace completed! Check Sentry dashboard.");
                } finally {
                    setLoading(false);
                    span.end();
                }
            },
        );
    };

    const handleLogClick = () => {
        console.log("Test Log Message", { context: "sentry-test" });
        console.warn("Test Warning Message", { context: "sentry-test" });
        console.error("Test Error Message", { context: "sentry-test" });
        alert("Logs generated! Check Sentry dashboard.");
    };

    return (
        <DashboardLayout>
            <Head>
                <title>Sentry Test - SEKA</title>
            </Head>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Sentry Integration Test</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Use these buttons to verify that Sentry is correctly configured and capturing events.
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Exception Card */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Exception Catching</h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500">
                                <p>Triggers a test error and captures it using Sentry.captureException().</p>
                            </div>
                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={handleExceptionClick}
                                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                >
                                    Trigger Error
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tracing Card */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Performance Tracing</h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500">
                                <p>Starts a custom span transaction to measure performance of an action.</p>
                            </div>
                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={handleTraceClick}
                                    disabled={loading}
                                    className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                                >
                                    {loading ? 'Tracing...' : 'Start Trace'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Logging Card */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Console Logging</h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500">
                                <p>Generates console logs (log, warn, error) which are automatically captured.</p>
                            </div>
                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={handleLogClick}
                                    className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                                >
                                    Generate Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
