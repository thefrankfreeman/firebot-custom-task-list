import { Firebot, ScriptReturnObject } from "@crowbartools/firebot-custom-scripts-types";
import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { Params, taskHandlers } from "./commands";

const script: Firebot.CustomScript<Params> = {
    getScriptManifest: () => {
        return {
            name: "Local Task List",
            description: "Playing with task lists",
            author: "thefrankfreeman",
            version: "1.0",
            firebotVersion: "5",
        };
    },
    getDefaultParameters: () => {
        return {
            command: {
                type: "enum",
                options: ["add", "edit", "done", "undo", "remove", "clearAll", "clearUser"],
                default: "add",
                description: "Task Action",
                secondaryDescription: "Choose which task action to run",
            },
            commandHelpText: {
                type: "string",
                default: "Add your task item with `add`. Other sub-commands are: edit, done, undo, remove.",
                description: "Chat help text",
                secondaryDescription: "Write your own help text to display in chat, or use the default one.",
            },
            filepath: {
                type: "filepath",
                description: "Save File",
                secondaryDescription: "Pick the save file that the task list will be saved to",
            },
            sendMessagesAs: {
                type: "enum",
                options: ["Streamer", "Bot"],
                default: "Streamer",
                description: "Chat as",
                secondaryDescription: "Choose from which account to send messages",
            },
        };
    },
    run: (runRequest): ScriptReturnObject => {
        const { logger } = runRequest.modules;
        const result = { success: true, effects: [] as Effects.Effect[] };
        const requestHandler = taskHandlers.find((handler) => handler.command === (runRequest.parameters.command as unknown as string));  // HACK this is a workaround until the parameter type hinting aligns better with enum parameters
        if (!!requestHandler) {
            const isParserPresent = Object.prototype.hasOwnProperty.call(requestHandler, "parser");
            const args = isParserPresent ? requestHandler.parser(runRequest) : {};
            if (!!args) {
                result.effects.push(...requestHandler.handler(runRequest, args));
            } else {
                logger.warn(`The command "${runRequest.parameters.command}" could not be run`);
            }
        } else {
            logger.warn(`Unhandled command "${runRequest.parameters.command}"`);
        }
        return result as ScriptReturnObject;
    },
};

export default script;
