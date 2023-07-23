import { Firebot, ScriptReturnObject } from "@crowbartools/firebot-custom-scripts-types";

interface Params {
    command: Enumerator;
    commandHelpText: string;
    filepath: string;
    sendMessagesAs: Enumerator;
}

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
                options: ["main", "add", "edit", "done", "undo", "remove", "clearAll", "clearUser"],
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
    run: (runRequest): Promise<ScriptReturnObject> => {
        const { logger } = runRequest.modules;
        const filepath = runRequest.parameters.filepath;

        let taskList = runRequest.modules.customVariableManager.getCustomVariable('taskList') || {};

        const username = runRequest.trigger.metadata.username;
        const args = runRequest.trigger.metadata.userCommand.args;
        //const trigger = runRequest.trigger.metadata.userCommand.trigger;

        // For storing the message sent to chat
        let chatMessage: string;

        if (args.length == 0) {
            logger.debug("No sub commands specified");
            chatMessage = runRequest.parameters.commandHelpText;
        } else {
            logger.debug("args: " + runRequest.trigger.metadata.userCommand.args);

            let taskText;
            switch (String(runRequest.parameters.command)) {
                // ["add", "edit", "parameters.command "undo", "remove", "clearAll", "clearUser"],
                case "add":
                    taskText = args.slice(1).join(' ');
                    logger.debug(`Adding task "${taskText}" for ${username}`);
                    taskList[username] = { task: taskText, done: false };
                    chatMessage = `@${username} your task has been added.`;
                    break;
                case "edit":
                    taskText = args.slice(1).join(' ');
                    logger.debug(`Editing task  "${taskText}" for ${username}`);
                    taskList[username] = { task: taskText, done: taskList[username].done !== undefined ? taskList[username].done : false };
                    //chatMessage = `@${username} your task has been changed.`;
                    break;
                case "done":
                    logger.debug(`Completeing task for ${username}`);
                    taskList[username] = { task: taskList[username].task, done: true };
                    chatMessage = `Well done @${username}. You task is complete.`;
                    break;
                case "undo":
                    logger.debug(`Unding task for ${username}`);
                    taskList[username] = { task: taskList[username].task, done: false };
                    //chatMessage = `@${username}, back at it again.`;
                    break;
                case "remove":
                    logger.debug(`Removing task for ${username}`);
                    delete taskList[username];
                    //chatMessage = `@${username} your task has been removed.`;
                    break;
                case "clearAll":
                    logger.debug("Clearing all tasks");
                    taskList = {};
                    break;
                case "clearUser":
                    const obsoleteUsername = args[1].replace(/^@/, '');
                    delete taskList[obsoleteUsername];
                    logger.debug(`Clearing ${obsoleteUsername}`);
                    //chatMessage = `@${obsoleteUsername}'s task is no more.`;
                    break;
                default:
            }
            runRequest.modules.customVariableManager.addCustomVariable('taskList', taskList);
        }

        // Return a Promise object, because we want to use effects
        return new Promise((resolve, reject) => {

            // Create a response
            const response: ScriptReturnObject = {
                success: true,
                errorMessage: "Failed to run the script!", // If 'success' is false, this message is shown in a Firebot popup.
                effects: [ // An array of effect objects to run
                    {
                        type: "firebot:chat",
                        message: chatMessage,
                        chatter: runRequest.parameters.sendMessagesAs
                    },
                    {
                        type: "firebot:filewriter",
                        filepath: filepath,
                        text: JSON.stringify(taskList)
                    },
                ]
            };

            resolve(response);
        });

    },
};


export default script;
