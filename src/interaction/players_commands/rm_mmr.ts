import { SlashCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { InteractionOptions, SlashCommandBase } from "../interaction_base_classes";
import { Application } from "../../application";
import { replyEphemeral } from "../../utils";
import { MMR } from "../../player_details/MMRManager";

export class RemoveMMR extends SlashCommandBase {
    get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName("delmmr")
            .setDescription("Rimuove l'MMR del profilo lounge di Mario Kart Central")
            .toJSON();
    }

    public async exec(options: InteractionOptions): Promise<void> {
        const user_id = options.getInteractionUser().id;
        const player = await Application.getInstance().getPlayersManager().getPlayer(user_id);
        if(!player) {
            await replyEphemeral(options.interaction, "Non hai un MMR da rimuovere!");
            return;
        }
        else {
            player.MMR = undefined;
            await Application.getInstance().getPlayersManager().updatePlayer(player);
            await replyEphemeral(options.interaction, "Il tuo MMR è stato rimosso!");
            await MMR.removeRole(player);
        }
    }
}