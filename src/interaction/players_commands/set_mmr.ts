import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, Options, EmbedBuilder, MessageFlags } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { MMR, Rank } from "../../player_details/MMRManager";
import { replyEphemeral } from "../../utils";
import { BotDefaults, Globals } from "../../globals";
import { log, logError } from "../../log";

export class SetMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("setmmr")
            .setDescription("Inserisce l'MMR del profilo lounge di Mario Kart Central")
            .addStringOption(option =>
                option.setName("mkc_link")
                    .setDescription("Link al profilo Lounge di Mario Kart Central")
                    .setRequired(true)
            ).toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        if (!options.interaction.isRepliable()) {
            return;
        }
        await options.interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const playersManager = Application.getInstance().getPlayersManager();
        const mkcLink = options.getRequiredStringOption("mkc_link");

        try {
            const playerId = MMR.getPlayerIdFromUrl(mkcLink);
            const mmr = await MMR.getHighestMMR(playerId);

            let player = await playersManager.getOrCreatePlayer(options.getInteractionUser().id);
            player.setMMR(mmr);
            await playersManager.updateOrCreatePlayer(player);
            const embed = new EmbedBuilder()
                .setTitle("MMR aggiornato")
                .setDescription(`Il tuo MMR è stato aggiornato a ${mmr.getMMRValue()}.\n Rank: ${Rank[mmr.rank]}\n[Link](${await player.MMR?.getMMRLink()})\n In caso avessi falsificato (volontariamente o non) il tuo mmr uno staff si appresterà a correggerlo`)
                .setColor(Globals.STANDARD_HEX_COLOR);
            if (options.interaction.isRepliable()) {
                await options.interaction.editReply({
                    embeds: [embed]
                })
            }

            const guild = Application.getInstance().getMainGuild();
            const staffMMRChannel = await (await guild).channels.fetch((await BotDefaults.getDefaults()).staffMMRAddChannelId);
            const staffEmbed = new EmbedBuilder()
                .setTitle("Nuovo MMR inserito")
                .setColor(Globals.STANDARD_HEX_COLOR)
                .setDescription(`${options.getInteractionUser()}\nMMR:${mmr.getMMRValue()}.\nRank: ${Rank[mmr.rank]}\n[Link](${await player.MMR?.getMMRLink()})\n`)
            if (staffMMRChannel && staffMMRChannel.isSendable()) {
                await staffMMRChannel.send({ embeds: [staffEmbed] });
            }
            await MMR.setRole(player);
        }
        catch (e) {
            log(e);
            await options.interaction.editReply("Link MKC non valido. Assicurati di inserire il link al tuo profilo Lounge di MKC, e non quello del registry.");
            return;
        }

    }
}