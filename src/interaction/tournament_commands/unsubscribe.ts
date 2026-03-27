import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, ChatInputCommandInteraction, ButtonInteraction, ButtonStyle, ButtonBuilder } from "discord.js";
import { checkAndPopulateAutocomplete } from "./common";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { log } from "../../log";

export class Unsubscribe extends SlashCommandBase {
    override get commandName(): string {
        return "disiscriviti";
    }

    override get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription("Disiscriviti da un torneo")
            .addStringOption(option =>
                option.setName("evento")
                    .setDescription("ID del torneo da cui disiscriversi")
                    .setRequired(true)
                    .setAutocomplete(true)
            ).toJSON();

    }

    override async exec(options: InteractionOptions): Promise<void> {
        if (await checkAndPopulateAutocomplete(options.interaction)) {
            return;
        }
        const id = options.getRequiredStringOption("evento");

        log(`Rimozione giocatore ${options.getInteractionUser().username} da torneo ${id}`);

        if (!(options.interaction instanceof ChatInputCommandInteraction)
            && !(options.interaction instanceof ButtonInteraction)) {
            throw new TypeError();
        }

        const tournament = await Application.getInstance().getTournamentManager().getTournamentById(id);

        if (!tournament) {
            await replyEphemeral(options.interaction, "Torneo non trovato");
            return;
        }

        if (tournament?.isPlayerPartecipating(options.getInteractionUser().id) === false) {
            await options.interaction.reply({
                content: `Non sei iscritto al torneo **${tournament?.getName()}**`,
                ephemeral: true
            });
            return;
        }

        tournament.removePlayer(options.getInteractionUser().id);
        await Application.getInstance().getTournamentManager().updateTournament(tournament);
        await replyEphemeral(options.interaction, "Disiscrizione avvenuta con successo, utente: " + options.getInteractionUser().username);
    }
}

export class UnsubscribeBtn extends Unsubscribe {
    private tournamentId: string;
    public constructor(tournament: string) {
        super()
        this.tournamentId = tournament;
    }

    public createButton() {
        let options = new Map();
        options.set("evento", this.tournamentId);
        return new ButtonBuilder()
            .setCustomId(super.createCustomId(options))
            .setLabel("Disiscriviti")
            .setStyle(ButtonStyle.Danger);
    }
}