import { managerToFetchingStrategyOptions, Message, ThreadMemberFlagsBitField } from "discord.js";
import { Application } from "../application";
import { ObjectId } from "mongodb";
import { TournamentRepo } from "./tournament_repo";
import { log } from "../log";
import { prop } from "@typegoose/typegoose";
import { TournamentEvent } from "./events";
import { removeTournamentThread, updateTournamentName, updateTournamentTable } from "../interaction/tournament_commands/common";

export class TournamentPlayerEntry {
    public playerId: string;
    public joinDateTime: Date;
    public displayName: string;
    public checkedIn: boolean = false;

    public constructor(playerId: string, joinDateTime: Date, displayName: string = "") {
        this.playerId = playerId;
        this.joinDateTime = joinDateTime;
        this.displayName = displayName;
    }
}

export class Tournament {
    @prop({ required: true, type: Boolean })
    public isCompiled: boolean = true;

    @prop({ type: String })
    public checkinMsg?: string;

    @prop({ required: true, type: Date })
    public dateTime: Date;

    @prop({ required: false, type: Date })
    public bracket2Date?: Date;

    @prop({ required: true })
    public name: string;

    @prop({ required: false, type: ObjectId })
    public _id?: ObjectId;

    @prop({ required: false, type: Array<TournamentPlayerEntry> })
    public players: TournamentPlayerEntry[] = [];

    @prop({ required: false, type: String })
    public description?: string;

    @prop({ required: false, type: String })
    public serverMessage?: Message;

    @prop({ required: true })
    public mode: string;

    @prop({ required: false, type: Number })
    public nRaces?: Number;

    @prop({ required: false, type: Number })
    public minPlayers?: Number;

    @prop({ required: false, type: Number })
    public maxPlayers?: Number;

    @prop({ required: false, type: String })
    public tournamentChannelId?: string;

    @prop({ required: false, type: String })
    public tableMsgId?: string;

    public constructor(dateTime: Date, name: string, mode: string) {
        this.dateTime = dateTime;
        this.name = name;
        this.mode = mode;

        this._id = new ObjectId();
    }

    public setId(id: ObjectId) {
        this._id = id;
    }

    public setSecondBracketDate(date: Date) {
        this.bracket2Date = date;
    }

    public getSecondBracketDate() {
        return this.bracket2Date;
    }

    public setMode(mode: string) {
        this.mode = mode;
    }

    public getMode() {
        return this.mode;
    }

    public setNumberOfRaces(n: number) {
        this.nRaces = n;
    }

    public getNumberOfRaces() {
        return this.nRaces;
    }

    public setMinPlayers(n: number) {
        this.minPlayers = n;
    }

    public getMinPlayers() {
        return this.minPlayers;
    }

    public setMaxPlayers(n: number) {
        this.maxPlayers = n;
    }

    public getMaxPlayers() {
        return this.maxPlayers;
    }

    public setServerMessage(msg?: Message) {
        this.serverMessage = msg;
    }

    public getServerMessage() {
        return this.serverMessage;
    }

    public getDescription() {
        return this.description;
    }

    public setDescription(str?: string) {
        this.description = str;
    }

    public addPlayer(userId: string, displayName: string = "") {
        if (!this.players.find((entry) => entry.playerId === userId)) {
            this.players.push(new TournamentPlayerEntry(userId, new Date(), displayName));
        }
    }

    public removePlayer(userId: string) {
        const index = this.players.findIndex((entry) => entry.playerId === userId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    public isPlayerPartecipating(userId: string): boolean {
        for (const player of this.players) {
            if (player.playerId === userId) {
                return true;
            }
        }
        return false;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setDateTime(dateTime: Date) {
        this.dateTime = dateTime;
    }

    public getName(): String {
        return this.name;
    }

    public getDateTime(): Date {
        return this.dateTime;
    }

    public getId() {
        return this._id;
    }

    public getPlayers(): TournamentPlayerEntry[] {
        return [...this.players];
    }
}

export class TournamentManager {
    tournaments: TournamentRepo;
    emitter: TournamentEvent = new TournamentEvent();

    public constructor() {
        this.tournaments = new TournamentRepo();
        this.emitter.on("update", updateTournamentName);
        this.emitter.on("update", updateTournamentTable);
        this.emitter.on("remove", removeTournamentThread);
    }

    public async setDefaultAddRole(id: string) {
        const db = Application.getInstance().getDb();
        db.getModels();
    }

    public async addTournament(tournament: Tournament) {
        this.tournaments.updateTournament(tournament);
        this.emitter.emit("update", tournament);
    }

    public async updateTournament(tournament: Tournament) {
        this.tournaments.updateTournament(tournament);
        this.emitter.emit("update", tournament);
    }

    public async removeTournament(tournament: Tournament) {
        this.emitter.emit("remove", tournament);
        return this.tournaments.removeTournament(tournament);
    }

    public async getTournaments(includeOtherEvents: boolean = true) {
        return this.tournaments.getAllTournaments(includeOtherEvents);
    }

    public async getTournamentById(uuid: ObjectId | string): Promise<Tournament | undefined> {
        if (typeof uuid === 'string') {
            uuid = new ObjectId(uuid);
        }

        return this.tournaments.getTournamentById(uuid as ObjectId);
    }

}
