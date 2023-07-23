/* istanbul ignore file */

import { RunRequest, ScriptModules, UserAccount } from "@crowbartools/firebot-custom-scripts-types";
import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { LeveledLogMethod } from "@crowbartools/firebot-custom-scripts-types/types/modules/logger";
import { FirebotSettings } from "@crowbartools/firebot-custom-scripts-types/types/settings";
import { Params, TaskCommand } from "../src/commands";

function makeUserAccount(): UserAccount {
    return {
        username: "",
        displayName: "",
        userId: "",
        avatar: "",
        loggedIn: true,
        auth: { access_token: "", expires_at: "", refresh_token: "" },
    };
}

const readJsonSync: ScriptModules["fs"]["readJsonSync"] = () => null;
const log: LeveledLogMethod = () => void 0;

export function makeParameters(filepath: string, command: TaskCommand = "add"): Params {
    return {
        command,
        commandHelpText: "",
        filepath,
        sendMessagesAs: "",
    };
}

export function makeRunRequest(
    parameters: Params,
    sender: string,
    userCommand?: Partial<Effects.Trigger["metadata"]["userCommand"]>,
): RunRequest<Params> {
    return {
        parameters,
        modules: {
            logger: { debug: log, info: log, warn: log, error: log },
            fs: { readJsonSync },
        } as unknown as ScriptModules,
        firebot: { accounts: { streamer: makeUserAccount(), bot: makeUserAccount() }, settings: {} as FirebotSettings, version: "" },
        trigger: {
            type: "command",
            metadata: { username: sender, ...(userCommand ? { userCommand: { trigger: "", args: [], ...userCommand } } : {}) },
        },
    };
}
