import { ApplicationIntegrationType, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Events, Interaction, InteractionCollector, MessageFlags, MessagePayload, ModalAssertions, ModalBuilder, ModalSubmitInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, User } from "discord.js"
import { log, logError } from "../log";
import { assertCond } from "../assert";
import { StartCheckInCommand } from "./tournament_commands/start_checkin";
import { CheckInButton } from "./tournament_commands/checkin";
import { Iscriviti } from "./tournament_commands/iscriviti";
import { ConfermaIscrizione } from "./tournament_commands/conferma_iscrizione";
import { Unsubscribe } from "./tournament_commands/unsubscribe";
import { CommandsManager } from "./commands_manager";

export class InteractionOptions {
    public interaction: Interaction;
    optionsOverride: Map<string, any> = new Map();

    public constructor(interaction: Interaction, optionsOverride?: Map<string, any>) {
        this.interaction = interaction;
        if (optionsOverride) {
            this.optionsOverride = optionsOverride;
        }
    }

    public overrideOption<T>(name: string, value: T) {
        this.optionsOverride.set(name, value);
    }

    public getInteractionUser(): User {
        if (this.optionsOverride.has("__user__")) {
            return this.optionsOverride.get("__user__") as User;
        }
        return this.interaction.user;
    }

    public getRequiredUserOption(name: string): User {
        const user = this.getUserOption(name);
        if (!user) {
            throw new Error(`Required user option ${name} not found`);
        }
        return user;
    }

    public getUserOption(name: string): User | null {
        if(this.optionsOverride.has(name)) {
            return this.optionsOverride.get(name) as User;
        }
        if (this.interaction.isChatInputCommand()) {
            const user = this.interaction.options.getUser(name);
            return user;
        }
        else if(this.interaction.isModalSubmit()) {
            const userId = this.interaction.fields.getSelectedUsers(name, false);
            if (!userId || userId.size === 0) {
                return null;
            }
            return userId.first()!;
        }
        else throw new Error("Invalid interaction type");
    }

    public getRequiredIntOption(name: string): number {
        return this.getOption<number>(name)!;
    }

    public getRequiredStringOption(name: string): string {
        return this.getOption<string>(name)!;
    }

    public getStringOption(name: string, required: boolean = false): string | undefined {
        return this.getOption<string>(name) as string | undefined;
    }

    public getRequiredOption<T>(name: string, required: true): T {
        return this.getOption<T>(name)!;
    }

    public getOption<T>(name: string): T | undefined {
        if (this.optionsOverride.has(name)) {
            return this.optionsOverride.get(name) as T;
        }
        else {
            if (this.interaction.isChatInputCommand()) {
                return this.interaction.options.get(name)?.value as T | undefined;
            }
            return undefined;
        }
    }
}

export abstract class CommandBase {
    public abstract get commandName(): string;
    public abstract exec(options: InteractionOptions): Promise<void>;
    public async guardedExec(options: InteractionOptions): Promise<void> {
        try {
            return this.exec(options);
        }  catch (e) {
                let err = "Can't execute command " + this.commandName + ": " + e;
                if (e instanceof Error) {
                    err = err + "\nStack trace:\n" + e.stack;
                }
                logError(err);
                const interaction = options.interaction;
                try {
                    if (interaction.isRepliable() && !interaction.replied) {
                        await interaction.reply({
                            content: "Si è verificato un errore durante l'esecuzione del comando.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                } catch (e) {
                    // Interaction may already be replied to or expired; ignore secondary reply errors
                }
            }
    }

    public static s_CreateCustomId(commandName: string,options?: Map<string, string>): string {
        let modalName = commandName;
        if (!options) {
            return modalName;
        }
        for (const option of options) {
            modalName += (" " + option[0] + ":" + option[1]);
        }
        return modalName;
    }

    public createCustomId(options?: Map<string, string>) {
        return CommandBase.s_CreateCustomId(this.commandName, options);
    }
}

export abstract class SlashCommandBase extends CommandBase {
    abstract get builder(): SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody;

    override get commandName(): string {
        return this.builder.name;
    }
}

export abstract class ButtonOrModalCommandBase extends CommandBase {

}