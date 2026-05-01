import { Application } from "./application";
import { log, logError } from "./log.js";
import express, { application } from "express"
import dotenv from "dotenv"
import { Globals } from "./globals";
import { FeatureFlagsManager } from "./feature_flags/feature_flags_manager";
import { FeatureFlagKeys } from "./feature_flags/feature_flag_keys";
import * as Sentry from "@sentry/node";

function handleError(error: Error) {
    logError(`\nFATAL ERROR:\n${error.message}`
        + `\n\nStack trace:\n${error.stack}`
    ).catch(console.error)
        .then(() => {
            FeatureFlagsManager.getBooleanValueFor(FeatureFlagKeys.ExitOnUnhandledError, true)
                .then((val) => {
                    if (val) {
                        process.exit(1);
                    }
                })
                .catch((e) => {
                    logError(`Error retrieving feature flag value: ${e.message}`).catch(console.error);
                    process.exit(1);
                })
        })

}

async function main() {
    Sentry.init({
        dsn: Globals.SENTRY_DSN,
        sendDefaultPii: true,
        tracesSampleRate: 1.0,
        enableLogs: true,
        beforeBreadcrumb(breadcrumb, hint) {
            if (breadcrumb.category === 'http' && hint?.request) {
                const body = hint.request.body;
                if (Buffer.isBuffer(body)) {
                    try {
                        breadcrumb.data = {
                            ...breadcrumb.data,
                            'request.body': body.toString('utf-8'),
                        };
                    } catch {
                        // ignore body decode errors
                    }
                }
            }
            return breadcrumb;
        },
    });

    process.on("uncaughtException", (e) => {
        log("ERROR: uncaughtException");
        handleError(e);
    });

    process.on("unhandledRejection", (e) => {
        log("ERROR: unhandledRejection");
        if (e instanceof Error) {
            handleError(e);
        } else {
            handleError(new Error(String(e)));
        }
    });

    process.on("exit", (exitCode) => { console.log("Exiting process with code " + exitCode); });

    process.on("SIGTERM", (_) => processTermination(app, "SIGTERM"));
    process.on("SIGINT", (_) => processTermination(app, "SIGINT"));

    const app = new Application();
    Application.setInstance(app);
    app.start();
}

function processTermination(app: Application, signal: string) {
    log(`Received ${signal}. Cleaning up...`);
    app.shutdown().then(() => {
        log("Cleanup complete. Exiting...");
        process.exit(0);
    }).catch((error) => {
        logError(`Error during cleanup: ${error.message}`);
        process.exit(1);
    });
}

//-------------ENTRY POINT----------------
main();
//----------------------------------------