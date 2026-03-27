import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandStringOption, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { checkAndPopulateAutocomplete } from "./common";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { ConfermaIscrizioneModal } from "./conferma_iscrizione";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { log } from "../../log";

export class Iscriviti extends SlashCommandBase {
    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        let _builder = new SlashCommandBuilder()
            .setName("iscriviti")
            .setDescription("Iscriviti ad un evento");

        let t_id = new SlashCommandStringOption()
            .setName("tournament_id")
            .setDescription("Seleziona un evento")
            .setAutocomplete(true)
            .setRequired(true);

        _builder.addStringOption(t_id);
        return _builder.toJSON();
    }

    override async exec(options: InteractionOptions): Promise<void> {
        let interaction = options.interaction;
        if (options.interaction.isAutocomplete()) {
            await checkAndPopulateAutocomplete(options.interaction);
            return;
        }

        let id = options.getRequiredStringOption("tournament_id");
        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            await replyEphemeral(interaction, "Errore, torneo non trovato");
            return;
        }

        if (tournament?.isPlayerPartecipating(options.getInteractionUser().id) === true) {
            await replyEphemeral(
                interaction,
                `Sei già iscritto al torneo **${tournament?.getName()}**`
            )
            return;
        }

        if (interaction.isChatInputCommand() || interaction.isButton()) {
            interaction.showModal(
                new ConfermaIscrizioneModal(tournament._id!.toString(), options.getInteractionUser()).getModal());
        }
    }
}

export class IscrivitiBtn extends Iscriviti {
    private tournamentId: string;
    public constructor(tournament: string) {
        super()
        this.tournamentId = tournament;
    }

    public createButton(): ButtonBuilder {
        let options = new Map();
        options.set("tournament_id", this.tournamentId);

        return new ButtonBuilder()
            .setCustomId(this.createCustomId(options))
            .setLabel("Iscriviti")
            .setStyle(ButtonStyle.Primary);
    }

}
