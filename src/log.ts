import { Colors, EmbedBuilder } from "discord.js";
import { Application } from "./application";
import { Globals } from "./globals";
import { tz } from "moment-timezone";
import { standardDiscordTimeFormat } from "./utils";
import { captureException, logger } from "@sentry/node";

class Logger {
    static async log(...args: any[]) {
        console.log(...args);

        let server = await Application.getInstance().getMainGuild();
        let channel = await server.channels.fetch(Globals.LOG_REPORT_CHANNEL_ID!);
        if (channel && channel.isTextBased()) {
            let time = standardDiscordTimeFormat(new Date());
            for (let arg of args) {
                let content = String(arg);
                let format = `[${time}] ${content}`;
                await channel.send(format);
            }
        }
    }

    static async logError(...args: any[]) {
        console.error(...args);

        try {
            for (let i = 0; i < args.length; i++) {
                await this.printErrToServer(args[i]);
            }
        }
        catch (e) {
            console.error("Failed to log error to server:", e);
        }
    }

    static async printErrToServer(arg: any) {
        let server = await Application.getInstance().getMainGuild();
        let channel = await server.channels.fetch(Globals.ERR_REPORT_CHANNEL_ID!);
        let user = "";
        if (Globals.ERR_REPORT_USER_ID) {
            user = `<@${Globals.ERR_REPORT_USER_ID}>`;
        }
        let content = String(arg);

        if (channel && channel.isTextBased()) {

            if (arg instanceof Error
                && arg.stack != undefined
                && (!content.toLowerCase().includes("stack"))) {
                content = content.concat("\nStack trace:\n" + arg.stack);
            }

            let embed = new EmbedBuilder()
                .setTitle("Error Report")
                .setColor(Colors.Red)
                .setDescription("Error content:\n" + content)
                .setTimestamp(new Date());
            await channel.send({ content: user, embeds: [embed] });
        }
    }
}


export async function log(...args: any[]) {
    const str = args.map(arg => String(arg)).join('\n');
    logger.info(str); //sentry
    try { await Logger.log(...args); }
    catch (e) { console.error("Failed to log:", e); }
}

export async function logError(...args: any[]) {
    captureException(args); //sentry
    try { await Logger.logError(...args); }
    catch (e) { console.error("Failed to log error:", e); }
}
