import { TypedEmitter } from "tiny-typed-emitter";
import { Application } from "../application";
import { PlayerEntry } from "./PlayerEntry";
import { BeAnObject, ReturnModelType } from "@typegoose/typegoose/lib/types";
import { execAndLoop } from "../utils";
import { MMR, Rank } from "./MMRManager";
import { createMMRTable, onRankChange, updateMMRTable } from "./discord_common";

interface PlayerEvent {
    update: (player: PlayerEntry) => void;
    rankChange: (player: PlayerEntry, oldRank : Rank, newRank: Rank) => void;
}

export class PlayersEvent extends TypedEmitter<PlayerEvent> {
    constructor() {
        super();
    }
}

export class PlayersManager {
    public emitter: PlayersEvent = new PlayersEvent();

    playersRepo!: ReturnModelType<typeof PlayerEntry, BeAnObject>;

    public constructor() { }

    public async start() {
        const PLAYER_INFO_UPDATE_INTERVAL_MS = 60 * 60 * 1000;
        this.playersRepo = Application.getInstance().getDb().getModels().playersModel;
        Application.getInstance().getClient().on("ready", async () => {
            execAndLoop(this.updateAllPlayersInfo.bind(this), PLAYER_INFO_UPDATE_INTERVAL_MS);
            await createMMRTable();
            this.emitter.on("update", updateMMRTable);
            this.emitter.on("rankChange", onRankChange);
        });
    }

    public async updateAllPlayersInfo() {
        const players = await this.getAllPlayers();
        for (const player of players) {
            await this.updatePlayerInfo(player);
        }
    }

    public async updatePlayerInfo(player: PlayerEntry) {
        if (player.MMR) {
            player.MMR = await MMR.getHighestMMR(player.MMR.MKCLoungeId.toString());
            await this.updatePlayer(player);
        }
    }

    public async updatePlayer(player: PlayerEntry) {
        const oldPlayer = await this.getPlayer(player.playerId);
        if (!oldPlayer) {
            throw new Error(`Player with id ${player.playerId} not found`);
        }
        if (oldPlayer.MMR && player.MMR && oldPlayer.MMR.rank !== player.MMR.rank) {
            this.emitter.emit("rankChange", player, player.MMR.rank, oldPlayer.MMR.rank);
        }

        const res = await this.playersRepo.findOneAndUpdate({ playerId: player.playerId }, player).exec();
        if (!res) {
            throw new Error(`Player with id ${player.playerId} not found`);
        }
        this.emitter.emit("update", player);
    }

    public async updateOrCreatePlayer(player: PlayerEntry) {
        let p = await this.playersRepo.findOne({ playerId: player.playerId }).exec();

        if (!p) {
            await this.playersRepo.create(player);
            this.emitter.emit("update", player);
            return;
        }
        await this.playersRepo.findOneAndUpdate({ playerId: player.playerId }, player).exec();
        this.emitter.emit("update", player);
    }

    public async getPlayer(playerId: String): Promise<PlayerEntry | undefined> {
        let res = await this.playersRepo.findOne({ playerId: playerId }).exec();

        if (res) {
            return res.toObject() as PlayerEntry;
        }
    }

    public async getOrCreatePlayer(playerId: String): Promise<PlayerEntry> {
        let player = await this.getPlayer(playerId);
        if (!player) {
            player = new PlayerEntry(playerId);
            await this.updateOrCreatePlayer(player);
        }
        return player;
    }

    public async getAllPlayers() {
        const res = await this.playersRepo.find().exec();
        let players: PlayerEntry[] = [];

        for (const doc of res) {
            const player = doc.toObject() as PlayerEntry;
            players.push(player);
        }
        return players;
    }
}