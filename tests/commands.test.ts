import { makeParameters, makeRunRequest } from "./runRequest.mock";
import { addTaskForSender, argAsUser, commandSender, editSenderTask, markSenderTaskAsDone, markSenderTaskAsNotDone, removeAllTasks, removeSenderTask, removeUserTask } from "../src/commands";

const filepath = "foo.json";

describe("parsers", () => {
    describe("commandSender", () => {
        it("returns the sender of the messeage", () => {
            const sender = "Sender";
            const runRequest = makeRunRequest(makeParameters(filepath), sender);
            const actual = commandSender(runRequest);
            expect(actual).toEqual({ sender });
        });

        it("returns null if the message sender is empty string", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            const actual = commandSender(runRequest);
            expect(actual).toBeNull();
        });

        it("returns null if the message sender is not present", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), undefined as unknown as string);
            const actual = commandSender(runRequest);
            expect(actual).toBeNull();
        });
    });

    describe("argAsUser", () => {
        it("returns a function", () => {
            const actual = argAsUser(1);
            expect(typeof actual === "function").toBeTruthy();
        });

        it("finds a username in the target index of the message words", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "Sender", { args: ["index0", "index1"] });
            const actual = argAsUser(1)(runRequest);
            expect(actual).toEqual({ user: "index1" });
        });

        it("trims a leading mention", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "Sender", { args: ["index0", "@username"] });
            const actual = argAsUser(1)(runRequest);
            expect(actual).toEqual({ user: "username" });
        });

        it("returns null if that index is not present", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "Sender", { args: ["index0"] });
            const actual = argAsUser(1)(runRequest);
            expect(actual).toBeNull();
        });

        it("returns null if there's no userCommand in the run request", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "Sender");
            expect(runRequest.trigger.metadata).not.toHaveProperty("userCommand");
            const actual = argAsUser(0)(runRequest);
            expect(actual).toBeNull();
        });
    });
});

describe("handlers", () => {
    describe("addTaskForSender", () => {
        it("adds the sender's task to the task list", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "", { args: ["add", "my", "task"] });
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user1: { task: "existing task", done: true } });
            const actual = addTaskForSender(runRequest, { sender: "user2" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user1: { task: "existing task", done: true }, user2: { task: "my task", done: false } });
        });
    });

    describe("editSenderTask", () => {
        it("edits the sender's task in the task list", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "", { args: ["edit", "new", "task"] });
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user: { task: "existing task", done: false } });
            const actual = editSenderTask(runRequest, { sender: "user" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user: { task: "new task", done: false } });
        });
    });

    describe("markSenderTaskAsDone", () => {
        it("marks the sender's task in the task list as done", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user: { task: "existing task", done: false } });
            const actual = markSenderTaskAsDone(runRequest, { sender: "user" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user: { task: "existing task", done: true } });
        });
    });

    describe("markSenderTaskAsNotDone", () => {
        it("marks the sender's task in the task list as not done", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user: { task: "existing task", done: true } });
            const actual = markSenderTaskAsNotDone(runRequest, { sender: "user" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user: { task: "existing task", done: false } });
        });
    });

    describe("removeSenderTask", () => {
        it("remove's the sender's task from the task list", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user1: { task: "existing task", done: true }, user2: { task: "other task", done: false } });
            const actual = removeSenderTask(runRequest, { sender: "user1" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user2: { task: "other task", done: false } });
        });
    });

    describe("removeAllTasks", () => {
        it("removes all the tasks in the task list", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user1: { task: "existing task", done: true }, user2: { task: "other task", done: false } });
            const actual = removeAllTasks(runRequest);
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(1);
            expect(actual[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[0].text as string)).toEqual({});
        });
    });

    describe("removeUserTask", () => {
        it("removes the specified user's task from the task list", () => {
            const runRequest = makeRunRequest(makeParameters(filepath), "");
            jest.spyOn(runRequest.modules.fs, "readJsonSync").mockReturnValue({ user1: { task: "existing task", done: true }, user2: { task: "other task", done: false } });
            const actual = removeUserTask(runRequest, { user: "user2" });
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(2);
            expect(actual[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(actual[1].text as string)).toEqual({ user1: { task: "existing task", done: true } });
        });
    });
});
