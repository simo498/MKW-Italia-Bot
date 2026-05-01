import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Application } from "../application";
import { BotDefaults, Globals } from "../globals";
import { MMR, Rank } from "./MMRManager";
import { PlayerEntry } from "./PlayerEntry";
import { BotEmojis, EmojisManager } from "../emoijs_manager";

export async function onMMRSet(player: PlayerEntry) {
    const defaults = await BotDefaults.getDefaults();
}

export async function createMMRTable() {
    const defaults = await BotDefaults.getDefaults();
    if (!defaults.MMRTableChannelId) {
        throw new Error("MMR Table channel id not set");
    }
    if (defaults.MMRTableMessageId) {
        return;
    }

    const buttons = await createTableButtons();

    const channel = await (await Application.getInstance().getMainGuild()).channels.fetch(defaults.MMRTableChannelId);
    if (channel && channel.isTextBased()) {
        await channel.send("https://cdn.discordapp.com/attachments/1376213461251526797/1472964352028967064/4WzwX5f.png?ex=69947c73&is=69932af3&hm=a56c1efbf19a494a6406a5df3953a6fdf208e2c627545c3d050181d9724499ac&");
        const msg = await channel.send(
            {
                content: "Caricamento tabella MMR...",
                components: [new ActionRowBuilder().addComponents(buttons).toJSON()]
            }
        );
        defaults.MMRTableMessageId = msg.id;
        await BotDefaults.setDefaults(defaults);
    }
    await updateMMRTable();
}

export async function updateMMRTable() {
    const defaults = await BotDefaults.getDefaults();
    if (!defaults.MMRTableChannelId) {
        throw new Error("MMR Table channel id not set");
    }

    const players = (await Application.getInstance().getPlayersManager().getAllPlayers())
        .filter(p => p.MMR)
        .sort((a, b) => b.MMR!.getMMRValue() - a.MMR!.getMMRValue());

    let msg = "# Tabella MMR\n";
    let counter = 1;
    for (const player of players) {
        const dsUser = (await Application.getInstance().getMainGuild()).members.cache.get(player.playerId.toString());
        if (!dsUser) {
            continue;
        }
        if (player.MMR) {
            msg += `\`${counter}.\` ${dsUser} (${dsUser.displayName}) - MMR: \`${player.MMR.getMMRValue()}\` ${Rank[player.MMR.rank]} ${await MMR.rankToEmoji(player.MMR.rank)}\n`;
            counter++;
        }
    }
    msg += `-# Ultimo aggiornamento: <t:${Math.floor(Date.now() / 1000)}:R>`
    const embed = new EmbedBuilder()
        .setDescription(msg)
        .setColor(Globals.STANDARD_HEX_COLOR);

    const channel = await (await Application.getInstance().getMainGuild()).channels.fetch(defaults.MMRTableChannelId);
    if (channel && channel.isTextBased()) {
        if (defaults.MMRTableMessageId) {
            const message = await channel.messages.fetch(defaults.MMRTableMessageId);
            if (message) {
                await message.edit({ content: null, embeds: [embed] });

            }
            else {
                throw new Error("MMR Table message not found");
            }
        }
    }
}

export async function onRankChange(player: PlayerEntry, newRank: Rank, oldRank: Rank) {
    const guild = await Application.getInstance().getMainGuild();
    const defaults = await BotDefaults.getDefaults();
    const channel = await guild.channels.fetch(defaults.publicRankChangeChannelId);
    const user = await guild.members.fetch(player.playerId.toString());

    let embed = new EmbedBuilder()
        .setColor(Globals.STANDARD_HEX_COLOR)
        .setThumbnail(MMR.RankToImage(newRank))

    if (newRank > oldRank) {
        embed.setTitle("Rank Up!")
            .setDescription(`Congratulazioni ${user}, sei salito al rank ${Rank[newRank]}!`);
    }
    else if (newRank < oldRank) {
        embed.setTitle("Nuovo rank")
            .setDescription(`${user} sei stato delcassato al rank ${Rank[newRank]}`);
    }
    else return;
    
    if (channel?.isSendable()) {
        await channel.send({ embeds: [embed] });
    }
    MMR.setRole(player);
}

export async function createTableButtons() {
    const addButton = new ButtonBuilder()
        .setCustomId("add_mmr_button")
        .setLabel("Aggiungi MMR")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKADD))
        .setStyle(ButtonStyle.Success);

    const getButton = new ButtonBuilder()
        .setCustomId("get_mmr_button")
        .setLabel("Cerca MMR")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKFIND))
        .setStyle(ButtonStyle.Secondary);

    const removeButton = new ButtonBuilder()
        .setCustomId("remove_mmr_button")
        .setLabel("Rimuovi MMR")
        .setEmoji(await EmojisManager.getEmoji(BotEmojis.MKDEL))
        .setStyle(ButtonStyle.Danger);
    return [addButton, getButton, removeButton];

}