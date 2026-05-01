import { Client } from "discord.js"
import { log, logError } from "../log";
import { StartCheckInCommand } from "./tournament_commands/start_checkin";
import { CheckInButton } from "./tournament_commands/checkin";
import { Iscriviti } from "./tournament_commands/iscriviti";
import { ConfermaIscrizione } from "./tournament_commands/conferma_iscrizione";
import { Unsubscribe } from "./tournament_commands/unsubscribe";
import { CommandsManager } from "./commands_manager";
import { CreateEvent } from "./tournament_commands/create_event";
import { AggiornaNomeTorneo } from "./tournament_commands/aggiorna_nome";
import { RimuoviEvento } from "./tournament_commands/rimuovi_evento";
import { ConfermaRimozioneTorneo } from "./tournament_commands/conferma_rimozione";
import { ManSubscribeEvent as ManSubscribeEvent, ManUnsubEvent } from "./tournament_commands/man_sub_unsub";
// Friend code commands
import { SetFc } from "./friend_codes_commands/setfc";
import { DelFc } from "./friend_codes_commands/delfc";
import { GetFc } from "./friend_codes_commands/getfc";
import { ManSetFc } from "./friend_codes_commands/mansetfc";
import { ManDelFc } from "./friend_codes_commands/mandelfc";
import { ListaFc } from "./friend_codes_commands/listafc";
import { SearchFc } from "./friend_codes_commands/searchfc";
import { SetMMR } from "./players_commands/set_mmr";
import { GetMMR } from "./players_commands/get_mmr";
import { RemoveMMR } from "./players_commands/rm_mmr";
import { AddMMRButton } from "./players_commands/add_mmr_button";
import { GetMMRButton } from "./players_commands/get_mmr_button";
import { RemoveMMRButton } from "./players_commands/remove_mmr_button";
import { ManSetMMR } from "./players_commands/man_set_mmr";
import { ManRemoveMMR } from "./players_commands/man_remove_mmr";
import { ResetRole } from "./util_commands/reset_role";
import { FeatureFlagsManager } from "../feature_flags/feature_flags_manager";
import { FeatureFlagKeys } from "../feature_flags/feature_flag_keys";

async function bindCommandsInner(commandsManager: CommandsManager) {
    //TOURNAMENT COMMANDS
    commandsManager.addCommand(new StartCheckInCommand());
    commandsManager.addCommand(new CheckInButton());
    commandsManager.addCommand(new Iscriviti());
    commandsManager.addCommand(new ConfermaIscrizione());
    commandsManager.addCommand(new Unsubscribe());
    commandsManager.addCommand(new CreateEvent());
    commandsManager.addCommand(new AggiornaNomeTorneo());
    commandsManager.addCommand(new RimuoviEvento());
    commandsManager.addCommand(new ConfermaRimozioneTorneo());
    commandsManager.addCommand(new ManSubscribeEvent())
    commandsManager.addCommand(new ManUnsubEvent())

    //FRIEND CODE COMMANDS
    commandsManager.addCommand(new SetFc());
    commandsManager.addCommand(new DelFc());
    commandsManager.addCommand(new GetFc());
    commandsManager.addCommand(new ManSetFc());
    commandsManager.addCommand(new ManDelFc());
    commandsManager.addCommand(new ListaFc());
    commandsManager.addCommand(new SearchFc());

    //PLAYERS COMMANDS
    commandsManager.addCommand(new SetMMR());
    commandsManager.addCommand(new GetMMR());
    commandsManager.addCommand(new RemoveMMR());
    commandsManager.addCommand(new AddMMRButton());
    commandsManager.addCommand(new GetMMRButton());
    commandsManager.addCommand(new RemoveMMRButton());
    commandsManager.addCommand(new ManSetMMR());
    commandsManager.addCommand(new ManRemoveMMR());

    //UTIL COMMANDS
    commandsManager.addCommand(new ResetRole());
}

export async function bindCommands(client: Client) {
    let commandsManager = new CommandsManager(client);

    await bindCommandsInner(commandsManager);
    log("Aggiornamento comandi in corso...");
    if(await FeatureFlagsManager.getBooleanValueFor(FeatureFlagKeys.UpdateSlashCommands, true)) {
        commandsManager.registerCommands(client).catch(e => logError(e));
    }
}




    