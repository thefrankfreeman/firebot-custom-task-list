import { RunRequest } from "@crowbartools/firebot-custom-scripts-types";
import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { TaskList } from "./task-list";
import { cleanUserName } from "./utils";

/**
 * The set of commands the script handles
 */
export type TaskCommand = "add" | "edit" | "done" | "undo" | "remove" | "clearAll" | "clearUser";

/**
 * The parameters for the main firebot custom script config
 */
export interface Params extends Record<string, any> {
    /**
     * The action to be taken on the user's task
     */
    command: TaskCommand;

    /**
     * The default help text to use for the command
     */
    commandHelpText: string;

    /**
     * The path to the file to save the task list in JSON format
     */
    filepath: string;

    /**
     * Pass this back to the `response.effects.chatter` field for firebot
     */
    sendMessagesAs: Enumerator;
}

/**
 * An object linking a command to the handler for its action, and optional parser to find necessary args
 */
interface CommandHandler<THandlerArgs extends {} = {}> {
    /**
     * The command this handler should handle
     */
    command: TaskCommand;

    /**
     * The parser that takes the runRequest object from firebot and returns the args value needed by the handler
     * 
     * @param runRequest The runRequest object from firebot
     * @returns The args for the handler if they could be parsed, null if not
     */
    parser?: (runRequest: RunRequest<Params>) => THandlerArgs | null;

    /**
     * Does all the actions necessary for the command
     * 
     * @param runRequest The runRequest object from firebot
     * @param args Any specific data that the handler needs. Should be pulled from the runRequest using the parser
     * @returns The effects to return to firebot
     */
    handler: (runRequest: RunRequest<Params>, args: THandlerArgs) => Effects.Effect[];
}

/**
 * A parser to find the username of the sender of a chat message
 * 
 * @param runRequest The runRequest object from firebot
 * @returns The message sender, or null
 */
export function commandSender(runRequest: RunRequest<Params>): { sender: string } | null {
    const sender = runRequest.trigger.metadata.username ?? null;
    return !!sender ? { sender } : null;
}

/**
 * A factory function that creates a parser to find a username in chat message
 * 
 * @param index The target index in the chat message words
 * @returns The parser that returns a username or null
 */
export function argAsUser(index: number): (runRequest: RunRequest<Params>) => ({ user: string } | null) {
    return (runRequest: RunRequest<Params>) => {
        const user = cleanUserName(runRequest.trigger.metadata.userCommand?.args[index]);
        return user?.length ? { user } : null;
    }
}

/**
 * Handler function to add a task for the sender
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function addTaskForSender(runRequest: RunRequest<Params>, args: { sender: string }): Effects.Effect[] {
    const task = runRequest.trigger.metadata.userCommand.args.slice(1).join(' ');
    return new TaskList(runRequest.modules.fs).addTaskForUser(runRequest.parameters.filepath, args.sender, task);
}

/**
 * Handler function to edit the sender's task
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function editSenderTask(runRequest: RunRequest<Params>, args: { sender: string }): Effects.Effect[] {
    const task = runRequest.trigger.metadata.userCommand.args.slice(1).join(' ');
    return new TaskList(runRequest.modules.fs).editUserTask(runRequest.parameters.filepath, args.sender, task);
}

/**
 * Handler function to mark the sender's task as done
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function markSenderTaskAsDone(runRequest: RunRequest<Params>, args: { sender: string }): Effects.Effect[] {
    return new TaskList(runRequest.modules.fs).markUserTaskAsDone(runRequest.parameters.filepath, args.sender);
}

/**
 * Handler function to mark the sender's task as not done
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function markSenderTaskAsNotDone(runRequest: RunRequest<Params>, args: { sender: string }): Effects.Effect[] {
    return new TaskList(runRequest.modules.fs).markUserTaskAsNotDone(runRequest.parameters.filepath, args.sender);
}

/**
 * Handler function to remove the sender's task
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function removeSenderTask(runRequest: RunRequest<Params>, args: { sender: string }): Effects.Effect[] {
    return new TaskList(runRequest.modules.fs).removeUserTask(runRequest.parameters.filepath, args.sender);
}

/**
 * Handler function to remove all tasks
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function removeAllTasks(runRequest: RunRequest<Params>): Effects.Effect[] {
    return new TaskList(runRequest.modules.fs).removeAllTasks(runRequest.parameters.filepath);
}

/**
 * Handler function to remove a given user's task
 *
 * @param runRequest The RunRequest object from firebot
 * @param sender The name of the command sender
 */
export function removeUserTask(runRequest: RunRequest<Params>, args: { user: string }): Effects.Effect[] {
    return new TaskList(runRequest.modules.fs).removeUserTask(runRequest.parameters.filepath, args.user);
}

const addHandler: CommandHandler<{ sender: string }> = { command: "add", parser: commandSender, handler: addTaskForSender };
const editHandler: CommandHandler<{ sender: string }> = { command: "edit", parser: commandSender, handler: editSenderTask };
const doneHandler: CommandHandler<{ sender: string }> = { command: "done", parser: commandSender, handler: markSenderTaskAsDone };
const undoHandler: CommandHandler<{ sender: string }> = { command: "undo", parser: commandSender, handler: markSenderTaskAsNotDone };
const removeHandler: CommandHandler<{ sender: string }> = { command: "remove", parser: commandSender, handler: removeSenderTask };
const clearAllHandler: CommandHandler = { command: "clearAll", handler: removeAllTasks };
const clearUserHandler: CommandHandler<{ user: string }> = { command: "clearUser", parser: argAsUser(1), handler: removeUserTask };

export const taskHandlers = [
    addHandler,
    editHandler,
    doneHandler,
    undoHandler,
    removeHandler,
    clearAllHandler,
    clearUserHandler,
];
