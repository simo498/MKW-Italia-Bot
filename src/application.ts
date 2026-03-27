import { assertCond } from "./assert.js"
import { Client, Events, Guild } from "discord.js";
import { log, logError } from "./log.js";
import { Globals } from "./globals.js";
import { TournamentManager } from "./tournament_manager/tournaments.js";
import { bindCommands } from "./interaction/commands.js";
import "process"
import { abort, exit } from "process";
import { Database } from "./database/database.js";
import express from "express"
import { Server } from "http";
import { FeatureFlagsManager } from "./feature_flags/feature_flags_manager.js";
import { PlayersManager } from "./player_details/PlayersManager.js";
import * as Sentry from "@sentry/node";

export class Application {
    private static instance: Application;
    private tournamentManager!: TournamentManager;
    private client: Client;
    private webServer!: Server;
    private db: Database;
    private featureFlagsManager: FeatureFlagsManager;
    private playersManager!: PlayersManager;

    public constructor() {
        this.client = new Client({ intents: Globals.DEFAULT_INTENTS, ws: { large_threshold: 250 } });
        this.db = new Database(undefined);
        this.featureFlagsManager = new FeatureFlagsManager();
        this.playersManager = new PlayersManager();
    }

    public async getMainGuild(): Promise<Guild> {
        return this.client.guilds.fetch(Globals.MAIN_GUILD);
    }

    public getTournamentManager(): TournamentManager {
        return this.tournamentManager;
    }

    public static setInstance(instance: Application) {
        assertCond(!Application.instance, "instance già presente");
        Application.instance = instance;
    }

    public static getInstance(): Application {
        assertCond(Application.instance !== undefined, "instance non presente");
        return Application.instance as Application;
    }

    public getClient(): Client {
        return this.client;
    }

    public getDb(): Database {
        return this.db;
    }

    public getPlayersManager(): PlayersManager {
        return this.playersManager;
    }

    public async start() {
        let startFunctions: Array<Promise<void>> = [];

        startFunctions.push(this.db.init());
        startFunctions.push(this.featureFlagsManager.waitForInitialization());

        this.client.once(Events.ClientReady, async (client) => await this.onReady(client));
        //the client is not supposed to join guilds
        this.client.on(Events.GuildCreate, () => exit(1));

        this.client.on(Events.Warn, log);
        this.client.on(Events.Error, logError);

        await Promise.all(startFunctions);
        await this.playersManager.start();
        this.tournamentManager = new TournamentManager();

        await this.client.login(Globals.BOT_TOKEN);

        //initial fetch, then refresh every 35 secs to avoid rate limits
        await (await this.getMainGuild()).members.fetch({ time: 60 * 1000 }).catch(logError);

        const MEMBERS_CACHE_CHECK_INTERVAL_MS = 15 * 60 * 1000;
        setInterval(async () => {
            let guild = await (await Application.getInstance().getMainGuild()).fetch();
            if (!(guild.members.cache.size >= guild.memberCount)) {
                logError("Error checking members cache size: \nCache size: " + guild.members.cache.size + "\nMember count: " + guild.memberCount);
            }
        }, MEMBERS_CACHE_CHECK_INTERVAL_MS);

        let server = express();
        server.get("/", (req, res) => { res.send("MKW Italia Bot is running") });
        server.get("/ping", (req, res) => { res.send("pong") });
        this.webServer = server.listen(process.env.PORT, () => { log("Webserver started on port: " + process.env.PORT); });
    }


    private async onReady(client: Client) {
        log(`Logged in as ${client.user?.tag}`);
        log(`Version ${Globals.VERSION}`);
        log(
            `Currently into: ${client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`).join(", ")}`
        );

        if (client.guilds.cache.size > Globals.MAX_SERVERS) {
            log(`Non possono esserci più di ${Globals.MAX_SERVERS} connessi in contemporanea`);
            abort();
        }

        if (client.guilds.cache.size > 0
            && client.guilds.cache.at(0)?.id != Globals.MAIN_GUILD
        ) {
            log("Il client non può essere connesso a server non autorizzati");
            abort();
        }

        await bindCommands(this.client);
    }

    public async shutdown() {
        log("Starting application shutdown...");
        await this.client.destroy();
        log("Discord client correctly closed");
        await this.db.close();
        log("Database connection closed");
        this.webServer.close((err) => {
            if (err) {
                log(`Error closing web server: ${err.message}`);
                exit(1);
            }
            log("Web server closed successfully");
        });
    }
}