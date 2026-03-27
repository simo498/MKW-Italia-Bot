import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { checkAndPopulateAutocomplete, createTournamentMessage } from "./common";

const TOURNAMENT_ID_OPTION = "tournament_id";

class MostraTorneo extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("mostra_torneo")
            .setDescription("Mostra le informazioni di un torneo")
            .addStringOption(option =>
                option.setName(TOURNAMENT_ID_OPTION)
                    .setDescription("ID del torneo da mostrare")
                    .setRequired(true)
                    .setAutocomplete(true)
            ).toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;
        if (await checkAndPopulateAutocomplete(interaction)) {
            return;
        }

        if (!interaction.isChatInputCommand()) {
            throw new TypeError();
        }

        const channel = interaction.channel;
        const id = interaction.options.getString(TOURNAMENT_ID_OPTION)!;
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);
        if (!tournament) {
            await replyEphemeral(interaction, "Il torneo non esiste");
            return;
        }

        if (channel?.isSendable()) {
            await channel.send(await createTournamentMessage(tournament!));
        }
    }
}