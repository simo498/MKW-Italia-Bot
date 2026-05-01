import { ActionRowBuilder, inlineCode, LabelBuilder, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } from "discord.js";
import { dBGetFriendCode } from "../../frend_codes";
import { awaitModalSubmit, replyEphemeral } from "../../utils";
import { log } from "../../log";
import { Application } from "../../application";
import { randomUUID } from "crypto";
import { ButtonOrModalCommandBase, InteractionOptions } from "../interaction_base_classes";

export class SearchFc extends ButtonOrModalCommandBase {
    override get commandName(): string {
        return "searchfc";
    }

    override async exec(options: InteractionOptions): Promise<void> {
        const interaction = options.interaction;
        let replyInteraction: ModalSubmitInteraction | undefined = undefined;

        if (!interaction.isButton())
            return;

        const user = new LabelBuilder()
            .setLabel("Utente")
            .setUserSelectMenuComponent(
                new UserSelectMenuBuilder()
                    .setCustomId("user")
                    .setPlaceholder("Utente di cui vuoi vedere il codice amico")
                    .setRequired(true)
            );
        const modal = new ModalBuilder()
            .setCustomId("searchfc_modal id:" + randomUUID())
            .setTitle("Cerca Codice Amico Utente")
            .addLabelComponents(user);

        await interaction.showModal(modal);
        replyInteraction = await awaitModalSubmit(interaction);
        if (!replyInteraction) {
            log("Modal submit for friend code search timed out");
            return;
        }

        const foundUser = replyInteraction.fields.getSelectedUsers("user")?.first();
        if (foundUser === undefined) {
            throw new Error("User tag is undefined");
        }

        const fc = await dBGetFriendCode(foundUser);
        if (!fc) {
            await replyEphemeral(replyInteraction, `${foundUser} non ha un codice amico registrato`);
            return;
        }
        await replyEphemeral(replyInteraction, `Il codice amico di ${foundUser} è: ${inlineCode(fc.toString())}`);

    }
}
