import axios from "axios";
import * as cheerio from 'cheerio';
import { BotDefaults } from "../globals";
import { prop } from "@typegoose/typegoose";
import { log, logError } from "../log";
import { PlayerEntry } from "./PlayerEntry";
import { Application } from "../application";
import { BotEmojis, EmojisManager } from "../emoijs_manager";

export enum Rank {
    Iron = 0,
    Bronze,
    Silver,
    Gold,
    Platinum,
    Sapphire,
    Ruby,
    Diamond,
    Master,
    Grandmaster,
}

enum MogiType {
    p12 = 12,
    p24 = 24,
}

export class MMR {

    @prop({ required: true })
    public MKCLoungeId: string;

    @prop({ required: true })
    public MMR: number; //last fetched MMR

    @prop({ required: true })
    public mogiType: MogiType;

    @prop({ required: true })
    public rank: Rank;

    constructor(MKCLoungeId: string, MMR: number, mogiType: MogiType, rank: Rank) {
        this.MKCLoungeId = MKCLoungeId;
        this.MMR = MMR;
        this.mogiType = mogiType;
        this.rank = rank;
    }

    public getMMRValue(): number {
        return this.MMR;
    }
    
    public static async rankToEmoji(rank: Rank): Promise<string> {
        return await EmojisManager.getEmoji(BotEmojis[Rank[rank].toUpperCase() as keyof typeof BotEmojis]);
    }

    public static RankToImage(rank: Rank): string {
        let map: Map<Rank, string> = new Map([
            [Rank.Iron, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942289759244299/JhTS7v9.png?ex=699467e7&is=69931667&hm=baff242f546d6ecc4ebd4196d48862fa47209a064218997b8713bb650d328692&"],
            [Rank.Bronze, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942289402724386/nfG9kUz.png?ex=699467e7&is=69931667&hm=5f0afd20c630a5d8c8b75a5216a3b86b3134ceda4a6b591a58a9d08310d66275&"],
            [Rank.Silver, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942288735834224/jDmI2IM.png?ex=699467e7&is=69931667&hm=f3d2452b6fa8abd0ad15719fa6f4950ce3521ab0d84aff61ebf2e9c4b4d66cbf&"],
            [Rank.Gold, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942288324788296/TsNOHhk.png?ex=699467e7&is=69931667&hm=7f03615bc7034c4c921e3cf7ec718d0e1063f80d871ba88993e5f8f16cd7d6b7&"],
            [Rank.Platinum, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942287813087344/OzpEXX8.png?ex=699467e7&is=69931667&hm=79e28cfda507269504dfc5f3e9eba652d6809f256d795922bfe7ef4a3007ee33&"],
            [Rank.Sapphire, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942287288926372/EcL5L92.png?ex=699467e7&is=69931667&hm=1e4729c50efd5b664c14c1169a20dc05bb54e0dcb1fc4a132e7e3e408bc055db&"],
            [Rank.Ruby, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942286810644582/w5vf0zl.png?ex=699467e7&is=69931667&hm=15ecaa9febb114ef5e7bf3097322f2d47cb156efac6c70f2fc7ab0e61278a3d2&"],
            [Rank.Diamond, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942286324109557/s265sHr.png?ex=699467e7&is=69931667&hm=62413589e5d2c5fba211c9e1cf193435606bca9a79739b124b3027ca8475873d&"],
            [Rank.Master, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942285564936335/aXqblsq.png?ex=699467e6&is=69931666&hm=95bde9ad77c2e7a9a14bb1031b875ac117c2e846dac6005b70e6417707ceed6e&"],
            [Rank.Grandmaster, "https://cdn.discordapp.com/attachments/1376213461251526797/1472942285007097970/N9wOest.png?ex=699467e6&is=69931666&hm=cd07829ac5e2f7b78240ae3c2691acf11b7f775f1480db25ba68eb8fc16fe686&"],
        ]);
        return map.get(rank)!;
    }

    public static async removeRole(player: PlayerEntry) {
        const guild = await Application.getInstance().getMainGuild();
        const roles = (await BotDefaults.getDefaults()).rankRoles;
        const user = await guild.members.fetch(player.playerId.toString());
        if (!user) {
            throw new Error(`User with id ${player.playerId} not found in guild`);
        }
        for (const roleId of roles) {
            const role = await guild.roles.fetch(roleId);
            if (role) {
                await user.roles.remove(role);
            }
        }
    }

    public static async setRole(player: PlayerEntry) {
        await MMR.removeRole(player);

        if (!player.MMR) {
            logError(`Player ${player.playerId} has no MMR, cannot set role`);
            return;
        }
        const guild = await Application.getInstance().getMainGuild();
        const roles = (await BotDefaults.getDefaults()).rankRoles;
        const user = await guild.members.fetch(player.playerId.toString());
        if (!user) {
            throw new Error(`User with id ${player.playerId} not found in guild`);
        }
        const newRole = await guild.roles.fetch(roles[player.MMR?.rank]);
        if (!newRole) {
            throw new Error(`Role with id ${roles[player.MMR.rank]} not found in guild`);
        }
        await user.roles.add(newRole);
    }

    public static async getHighestMMR(id: string): Promise<MMR> {
        const p12MMR = await this.getMMRFromPlayerId(id, MogiType.p12);
        const p24MMR = await this.getMMRFromPlayerId(id, MogiType.p24);

        let mmr = 0;
        let mogi: MogiType;
        if (p12MMR >= p24MMR) {
            mmr = p12MMR;
            mogi = MogiType.p12;
        }
        else {
            mmr = p24MMR;
            mogi = MogiType.p24;
        }
        return new MMR(id, mmr, mogi, this.getRankFromMMR(mmr, mogi));
    }

    public static async getMMRFromLink(url: string, mogiType: MogiType): Promise<MMR> {
        const playerId = this.getPlayerIdFromUrl(url);
        const mmr = await this.getMMRFromPlayerId(playerId, mogiType);
        return new MMR(playerId, mmr, mogiType, this.getRankFromMMR(mmr, mogiType));
    }

    private static async getMMRFromPlayerId(playerId: string, mogiType: MogiType): Promise<number> {
        const url = `https://lounge.mkcentral.com/mkworld/PlayerDetails/${playerId}?season=${(await BotDefaults.getDefaults()).mkCentralSeason}&p=${mogiType}`;
        return MMR.scrapeMMR(url);
    }

    public async getMMRLink(): Promise<string> {
        const season = (await BotDefaults.getDefaults()).mkCentralSeason;
        return `https://lounge.mkcentral.com/mkworld/PlayerDetails/${this.MKCLoungeId}?season=${season}&p=${this.mogiType}`;
    }

    public static getPlayerIdFromUrl(url: string): string {
        const cleanUrl = url.trim();
        const patterns = [
            /\/PlayerDetails\/(\d+)/i,
            /PlayerDetails[\/:](\d+)/i,
            /player[_-]?details[\/:](\d+)/i,
        ];

        for (const pattern of patterns) {
            const match = cleanUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        throw new Error(`Invalid player details URL. URL fornito: "${cleanUrl}". Formato atteso: https://lounge.mkcentral.com/mkworld/PlayerDetails/[ID]`);
    }

    private static async scrapeMMR(url: string) {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        const mmrLabel = $('div, span, p, label, b, strong')
            .filter((_: number, el: any) => {
                return $(el).text().includes('MMR');
            })
            .last();

        if (mmrLabel.length > 0) {
            const parent = mmrLabel.parent();
            const fullText = parent.text().trim();

            const valueMatch = fullText.match(/MMR\s*[:|-]?\s*([\d,]+)/i);
            if (valueMatch && valueMatch[1]) {
                return Number(valueMatch[1]);
            }
        }
        throw new Error("Cannot scrape MMR")
    }

    public static getRankFromMMR(mmr: number, mogiType: MogiType): Rank {
        const p12Thresholds = [0, 1999, 3999, 5999, 7499, 8999, 10499, 11999, 13499, 14499];
        const p24Thresholds = [0, 1999, 3999, 5999, 7999, 9999, 11499, 12999, 14499, 15499];

        let selectedThresholds: number[];
        if (mogiType === MogiType.p12) {
            selectedThresholds = p12Thresholds;
        } else if (mogiType === MogiType.p24) {
            selectedThresholds = p24Thresholds;
        }
        else {
            throw new Error("Invalid mogi type");
        }

        for (let i = selectedThresholds.length - 1; i >= 0; i--) {
            if (mmr >= selectedThresholds[i]) {
                return i as Rank;
            }
        }
        return Rank.Iron;
    }
}