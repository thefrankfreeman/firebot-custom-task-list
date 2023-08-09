import { ScriptReturnObject } from "@crowbartools/firebot-custom-scripts-types";
import { TaskCommand } from "../src/commands";
import script from "../src/main";
import { makeParameters, makeRunRequest } from "./runRequest.mock";
import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";

describe("script", () => {
    describe("getScriptManifest", () => {
        it("returns the expected manifest", () => {
            const expected = {
                name: "Local Task List",
                description: "Playing with task lists",
                author: "thefrankfreeman",
                version: "1.0",
                firebotVersion: "5",
            };
            const actual = script.getScriptManifest();
            expect(actual).toEqual(expected);
        });
    });

    describe("getDefaultParameters", () => {
        it("returns the expected parameters", () => {
            const expected = {
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
            const actual = script.getDefaultParameters();
            expect(actual).toEqual(expected);
        });
    });

    describe("run", () => {
        const filepath = "foo.json";

        describe("add", () => {
            it("adds the sender's task to the task list", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "add"), "Sender", { args: ["add", "my", "task"] });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "my task", done: false } });
            });

            it("does nothing with no sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "add"), "", { args: ["add", "my", "task"] });
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"add\" could not be run");
            });
        });

        describe("edit", () => {
            it("edits the sender's task in the task list", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "edit"), "Sender", { args: ["edit", "new", "task"] });
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "existing task", done: false } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "new task", done: false } });
            });

            it("does nothing with no sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "edit"), "", { args: ["edit", "new", "task"] });
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"edit\" could not be run");
            });
        });

        describe("done", () => {
            it("marks the sender's task in the task list as done", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "done"), "Sender");
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "my task", done: false } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "my task", done: true } });
            });

            it("does nothing with no sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "done"), "");
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"done\" could not be run");
            });
        });

        describe("undo", () => {
            it("marks the sender's task in the task list as not done", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "undo"), "Sender");
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "my task", done: true } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "my task", done: false } });
            });

            it("does nothing with no sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "undo"), "");
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"undo\" could not be run");
            });
        });

        describe("remove", () => {
            it("removes the sender's task from the task list", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "remove"), "Sender");
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "my task", done: true } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({});
            });

            it("does nothing with no sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "remove"), "");
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"remove\" could not be run");
            });
        });

        describe("clearAll", () => {
            it("removes all tasks from the task list", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "clearAll"), "Sender");
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user: { task: "my task", done: true } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(1);
                expect(actual[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[0].text as string)).toEqual({});
            });

            it("still works without a sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "clearAll"), "");
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user: { task: "my task", done: true } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(1);
                expect(actual[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[0].text as string)).toEqual({});
            });
        });

        describe("clearUser", () => {
            it("removes the specified user's task from the task list", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "clearUser"), "Sender", { args: ["clearUser", "user"] });
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "my task", done: true }, user: { task: "remove me", done: false } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "my task", done: true } });
            });

            it("still works without a sender", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "clearUser"), "", { args: ["clearUser", "user"] });
                jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ Sender: { task: "my task", done: true }, user: { task: "remove me", done: false } });
                const actual = (script.run(runRequest) as ScriptReturnObject).effects as Effects.Effect[];
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual).toHaveLength(2);
                expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
                expect(JSON.parse(actual[1].text as string)).toEqual({ Sender: { task: "my task", done: true } });
            });

            it("does nothing with no user", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "clearUser"), "Sender", { args: ["clearUser"] });
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("The command \"clearUser\" could not be run");
            });
        });

        describe("UNHANDLED", () => {
            it("only logs a warning and does nothing else", () => {
                const runRequest = makeRunRequest(makeParameters(filepath, "UNHANDLED" as TaskCommand), "Sender");
                jest.spyOn(runRequest.modules.logger, "warn");
                const actual = script.run(runRequest);
                expect(actual).toEqual({ success: true, effects: [] });
                expect(runRequest.modules.logger.warn).toHaveBeenCalledTimes(1);
                expect(runRequest.modules.logger.warn).toHaveBeenCalledWith("Unhandled command \"UNHANDLED\"");
            });
        });
    });
});
