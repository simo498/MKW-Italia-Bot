import { Document, Model, Schema } from "mongoose";
import { Application } from "../application";
import { Tournament } from "./tournaments";
import { ObjectId } from "mongodb";
import { errors } from "@typegoose/typegoose";
import { log } from "../log";
import { assertCond } from "../assert";

export class TournamentRepo {
    private tournaments;

    public constructor() {
        this.tournaments = Application.getInstance().getDb().getModels().tournamentModel;
    }

    public async updateTournament(tournament: Tournament) {
        let t = await this.tournaments.findById(tournament.getId()).exec();
        
        if(!t) {
            await this.tournaments.create(tournament);
            log(`Created tournament ${tournament.getId()}`);
            return;
        }
        await this.tournaments.findByIdAndUpdate(tournament.getId(), tournament).exec();
        log(`Updated tournament ${tournament.getId()}`);
    }

    public async removeTournament(tournament: Tournament) {
        await this.tournaments.findByIdAndDelete(tournament.getId()).exec();
        log(`Removed tournament ${tournament.getId()}`);
    }

    public async getAllTournaments(includeOtherEvents: boolean) {
        const res = await this.tournaments.find().exec();
        let tournaments: Tournament[] = [];
        
        for (const doc of res) {
            const tournament = (doc as any) as Tournament;
            tournaments.push(tournament);
        }
        return tournaments;
    }

    public async getTournamentById(id: ObjectId): Promise<Tournament | undefined> {
        let res = await this.tournaments.findById(id).exec();

        if (res) {
            return (res as any) as Tournament;
        }
    }
}


