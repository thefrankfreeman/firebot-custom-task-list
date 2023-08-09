import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import { AllTasks, TaskList } from "../src/task-list";

describe("TaskList", () => {
    let taskList: TaskList;
    let readJsonSync: jest.Mock<ReturnType<ScriptModules["fs"]["readJsonSync"]>, jest.ArgsType<ScriptModules["fs"]["readJsonSync"]>>;
    const filepath = "foo.json";

    beforeEach(() => {
        readJsonSync = jest.fn((..._args) => null);
        taskList = new TaskList({ readJsonSync } as unknown as ScriptModules["fs"]);
    });

    describe("tasksCache", () => {
        it("is empty to start", () => {
            expect(taskList.tasksCache).toEqual({});
        });
    });

    describe("loadData", () => {
        it("sets the file contents if valid", () => {
            const valid: AllTasks = {
                frank: { task: "Write the initial script", done: true },
                hammy: { task: "Write these tests", done: false },
            };
            readJsonSync.mockReturnValue(valid);
            taskList.loadData(filepath);
            expect(taskList.tasksCache).toEqual({ [filepath]: valid });
        });

        // it("cleans the file contents if partially valid", () => { });

        // it("cleans the file contents of any unexpected properties in the tasks", () => { });

        // it("sets the default if the file contents are fully invalid", () => { });
    });

    describe("writeFileEffects", () => {
        it("returns a list of effects for Firebot", () => {
            // Populate the cache
            taskList.getTasks(filepath);
            const actual = taskList.writeFileEffects();
            expect(Array.isArray(actual)).toBeTruthy();
            expect(actual).toHaveLength(1);
            expect(Object.keys(actual[0]).sort()).toEqual(["filepath", "text", "type", "writeMode"]);
            expect(actual[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" }); // toMatchObject is partial
            expect(JSON.parse(actual[0].text as string)).toEqual({});
        });

        // it("is different after a change has happened", () => { });

        it("returns an empty list when nothing is loaded", () => {
            const actual = taskList.writeFileEffects();
            expect(actual).toEqual([]);
        });
    });

    describe("getTasks", () => {
        it("returns the expected tasks", () => {
            const tasks: AllTasks = {
                user: { task: "do something", done: false }
            };
            readJsonSync.mockReturnValue(tasks);
            const actual = taskList.getTasks(filepath);
            expect(actual).toEqual(tasks);
        });

        it("populates the cache", () => {
            expect(taskList.tasksCache).not.toHaveProperty([filepath]);
            taskList.getTasks(filepath);
            expect(taskList.tasksCache).toHaveProperty([filepath]);
        });

        it("is unaffected by changing the given value after the fact", () => {
            const actual = taskList.getTasks(filepath);
            taskList.tasksCache[filepath]["user"] = { task: "new task", done: false };
            expect(actual).toEqual({});
        });
    });

    describe("setTasks", () => {
        it("populates the cache with the new tasks", () => {
            const expected: AllTasks = {
                user: { task: "do something", done: false }
            };
            taskList.setTasks(filepath, expected);
            expect(taskList.tasksCache).toEqual({ [filepath]: expected });
        });
    });

    describe("addTaskForUser", () => {
        it("adds the given user's task to the list and returns the correct effects", () => {
            const effects = taskList.addTaskForUser(filepath, "user", "new task");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "new task", done: false } } });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user your task has been added.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({ user: { task: "new task", done: false } });
        });

        it("replaces the given user's task if it already exists", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true } };
            taskList.addTaskForUser(filepath, "user", "replacement task");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "replacement task", done: false } } });
        });

        it("can accept empty string as a task", () => {
            const effects = taskList.addTaskForUser(filepath, "user", "");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "", done: false } } });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
        });
    });

    describe("editUserTask", () => {
        it("replaces the given user's existing task without changing whether it's done and returns the correct effects", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true } };
            const effects = taskList.editUserTask(filepath, "user", "replacement task");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "replacement task", done: true } } });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user your task has been changed.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({ user: { task: "replacement task", done: true } });
        });

        it("reverts to the normal add task behavior if the user had no task yet", () => {
            const effects = taskList.editUserTask(filepath, "user", "new task");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "new task", done: false } } });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user your task has been added.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({ user: { task: "new task", done: false } });
        });

        it("can accept empty string as a task", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true } };
            const effects = taskList.editUserTask(filepath, "user", "");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "", done: true } } });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
        });
    });

    describe("markUserTaskAsDone", () => {
        it("marks the user's existing task as done and returns the correct effects", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: false } };
            const effects = taskList.markUserTaskAsDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "existing task", done: true } } });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user your task is complete.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({ user: { task: "existing task", done: true } });
        });

        it("still works if the task is already done", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true } };
            const effects = taskList.markUserTaskAsDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "existing task", done: true } } });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
        });

        it("does nothing if the user has to task", () => {
            const effects = taskList.markUserTaskAsDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(1);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user you have no task.` });
        });
    });

    describe("markUserTaskAsNotDone", () => {
        it("marks the user's existing task as not done and returns the correct effects", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true } };
            const effects = taskList.markUserTaskAsNotDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "existing task", done: false } } });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user back at it again.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({ user: { task: "existing task", done: false } });
        });

        it("still works if the task is already not done", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: false } };
            const effects = taskList.markUserTaskAsNotDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: { user: { task: "existing task", done: false } } });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
        });

        it("does nothing if the user has to task", () => {
            const effects = taskList.markUserTaskAsNotDone(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(1);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user you have no task.` });
        });
    });

    describe("removeUserTask", () => {
        it.each`
        isDone   | isDoneRepr
        ${true}  | ${"done"}
        ${false} | ${"not done"}
        `("removes the user's $isDoneRepr task and returns the correct effects", ({ isDone }: { isDone: boolean; }) => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: isDone } };
            const effects = taskList.removeUserTask(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(2);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user your task has been removed.` });
            expect(effects[1]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[1].text as string)).toEqual({});
        });

        it("does nothing if the user has no task", () => {
            const effects = taskList.removeUserTask(filepath, "user");
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(1);
            expect(effects[0]).toEqual({ type: "firebot:chat", message: `@user has no task.` });
        });
    });

    describe("removeAllTasks", () => {
        it("removes all tasks and returns the correct effects", () => {
            taskList.tasksCache[filepath] = { user: { task: "existing task", done: true }, otherUser: { task: "unfinished", done: false } };
            const effects = taskList.removeAllTasks(filepath);
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(1);
            expect(effects[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[0].text as string)).toEqual({});
        });

        it("still works if there were no tasks", () => {
            const effects = taskList.removeAllTasks(filepath);
            expect(taskList.tasksCache).toEqual({ [filepath]: {} });

            // Check the effects
            expect(Array.isArray(effects)).toBeTruthy();
            expect(effects).toHaveLength(1);
            expect(effects[0]).toMatchObject({ type: "firebot:filewriter", filepath, writeMode: "replace" });
            expect(JSON.parse(effects[0].text as string)).toEqual({});
        });
    });
});
