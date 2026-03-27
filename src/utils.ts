import { ButtonInteraction, ChatInputCommandInteraction, GuildMember, Interaction, MessageComponentInteraction, MessageFlags, ModalSubmitInteraction, Role, User } from "discord.js";
import { log, logError } from "./log";
import { Application } from "./application";

export async function replyEphemeral(interaction: Interaction, msg: string) {
    if (interaction.isRepliable()) {
        await interaction.reply({
            content: msg,
            flags: MessageFlags.Ephemeral
        })
        return;
    }

    else {
        let interactionName = "";
        if (interaction.isChatInputCommand()) {
            const cmd = interaction as ChatInputCommandInteraction;
            interactionName = cmd.commandName;
        } else if (interaction.isButton()) {
            const btn = interaction as ButtonInteraction;
            interactionName = btn.customId;
        } else if (interaction.isModalSubmit()) {
            const modal = interaction as ModalSubmitInteraction;
            interactionName = modal.customId;
        }
        else return;

        logError(`Error: ${interactionName} (id: ${(interaction as Interaction).id}) is not repliable, or already replied`)
        log(`Further details, printing stack...\n ${new Error().stack || "No data available"}`);
    }
}

export function standardDiscordTimeFormat(ts: Date): string {
    return `<t:${Math.floor(ts.getTime() / 1000)}:f>`;
}
export async function resetRole(roleId: string) {
    const guild = await Application.getInstance().getMainGuild();
    const role = await guild.roles.fetch(roleId);

    if (!role) {
        throw new Error("Role not found");
    }
    
    let members = role.members;

    for (const member of members.values()) {
        await member.roles.remove(role);
    }
}

export async function utilFetchUser(userId: string): Promise<User | undefined> {
    const guild = await Application.getInstance().getMainGuild();
    if(guild.members.cache.has(userId)) {
        return guild.members.cache.get(userId)?.user;
    }
    else {
        return undefined;
    }
}

export async function awaitModalSubmit(interaction: MessageComponentInteraction, timeout?: number): Promise<ModalSubmitInteraction | undefined> {
   const STANDARD_TIMEOUT = 15 * 60 * 1000;
   if(!timeout) { timeout = STANDARD_TIMEOUT; }
   let retInteraction: ModalSubmitInteraction | undefined = undefined;

   try { retInteraction = await interaction.awaitModalSubmit({time: timeout})}
   catch (e) {
         // Modal submit timed out or was dismissed; return undefined to let the caller handle it
   }

   return retInteraction;
}

export async function execAndLoop(fn: () => Promise<void>, delay: number, stopOnError?: boolean) {
    try {
        await fn();
    }
    catch(e) {
        if(stopOnError && stopOnError === true)
            throw e;
        else 
            logError(e);
    }
    setTimeout(() => execAndLoop(fn, delay, stopOnError), delay);
}