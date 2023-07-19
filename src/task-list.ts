import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { deepCopy } from "./utils";

/**
 * The shape of a user's task
 */
export interface UserTask {
    /**
     * The text of the task
     */
    task: string;

    /**
     * Whether the task is done yet
     */
    done: boolean;
}

/**
 * The shape of all users' tasks
 */
export interface AllTasks {
    [user: string]: UserTask;
}

/**
 * The manager class for user tasks
 * 
 * Responsible for loading the data from file, making changes to the tasks, and returning firebot effects
 */
export class TaskList {
    /**
     * A map of filepath string to the tasks in that file
     */
    readonly tasksCache: Record<string, AllTasks> = {};

    private readonly _fs: Pick<ScriptModules["fs"], "readJsonSync">;

    /**
     * @param fs Use `runRequest.modules.fs` for this
     */
    constructor(fs: ScriptModules["fs"]) {
        this._fs = fs;
    }

    /**
     * Load the given file from disk and populate the tasks cache with the cleaned data
     *
     * @param filepath The path to the file on disk
     */
    loadData(filepath: string): void {
        if (filepath in this.tasksCache) {
            return;
        }

        const tasks: AllTasks = this._fs.readJsonSync(filepath, { throws: false }) ?? {};

        // TODO structure cleaning

        this.tasksCache[filepath] = tasks;
    }

    /**
     * Creates a list of Firebot effects to write the current contents of the tasks cache to file
     *
     * @returns The effects to return to Firebot
     */
    writeFileEffects(): Effects.Effect[] {
        return Object.keys(this.tasksCache).map((filepath) => ({
            type: "firebot:filewriter",
            filepath,
            writeMode: "replace",
            text: JSON.stringify(this.tasksCache[filepath]),
        }));
    }

    /**
     * Gets the tasks in the given file
     *
     * Modifying this result in place will not affect the tasks on file
     *
     * @param filepath The disk path of interest
     * @returns
     */
    getTasks(filepath: string): AllTasks {
        this.loadData(filepath);
        return deepCopy(this.tasksCache[filepath]);
    }

    /**
     * Sets a file as the given tasks
     * 
     * NOTE: this does not yet write the file, you need to call `this.writeFileEffects()`
     * to get the list of effects to return to firebot
     *
     * @param filepath The disk path of interest
     * @param tasks The tasks to set
     */
    setTasks(filepath: string, tasks: AllTasks): void {
        this.tasksCache[filepath] = deepCopy(tasks);
    }

    /**
     * Adds a task for the given user
     * 
     * @param filepath The path of the tasks file
     * @param user The user whose task this is
     * @param task The discription of the task
     * @returns The effects to return to firebot
     */
    addTaskForUser(filepath: string, user: string, task: string): Effects.Effect[] {
        const tasks = this.getTasks(filepath);
        tasks[user] = { task, done: false };
        this.setTasks(filepath, tasks);
        return [
            { type: "firebot:chat", message: `@${user} your task has been added.` },
            ...this.writeFileEffects(),
        ];
    }

    /**
     * Edits the task description for the given user
     * 
     * @param filepath The path of the tasks file
     * @param user The user whose task should be changed
     * @param task The new discription of the task
     * @returns The effects to return to firebot
     */
    editUserTask(filepath: string, user: string, task: string): Effects.Effect[] {
        const tasks = this.getTasks(filepath);
        if (user in tasks) {
            tasks[user].task = task;
            this.setTasks(filepath, tasks);
            return [
                { type: "firebot:chat", message: `@${user} your task has been changed.` },
                ...this.writeFileEffects(),
            ];
        } else {
            return this.addTaskForUser(filepath, user, task);
        }
    }

    /**
     * Marks the user's task as done
     * 
     * @param filepath The path of the tasks file
     * @param user The user whose task should be marked as done
     * @returns The effects to return to firebot
     */
    markUserTaskAsDone(filepath: string, user: string): Effects.Effect[] {
        const tasks = this.getTasks(filepath);
        if (user in tasks) {
            tasks[user].done = true;
            this.setTasks(filepath, tasks);
            return [
                { type: "firebot:chat", message: `@${user} your task is complete.` },
                ...this.writeFileEffects(),
            ];
        } else {
            return [
                { type: "firebot:chat", message: `@${user} you have no task.` },
            ];
        }
    }

    /**
     * Marks the user's task as not done
     * 
     * @param filepath The path of the tasks file
     * @param user The user whose task should be marked as not done
     * @returns The effects to return to firebot
     */
    markUserTaskAsNotDone(filepath: string, user: string): Effects.Effect[] {
        const tasks = this.getTasks(filepath);
        if (user in tasks) {
            tasks[user].done = false;
            this.setTasks(filepath, tasks);
            return [
                { type: "firebot:chat", message: `@${user} back at it again.` },
                ...this.writeFileEffects(),
            ];
        } else {
            return [
                { type: "firebot:chat", message: `@${user} you have no task.` },
            ];
        }
    }

    /**
     * Removes the user's task from the task list
     * 
     * @param filepath The path of the tasks file
     * @param user The user whose task should be removed
     * @returns The effects to return to firebot
     */
    removeUserTask(filepath: string, user: string): Effects.Effect[] {
        const tasks = this.getTasks(filepath);
        if (user in tasks) {
            delete tasks[user];
            this.setTasks(filepath, tasks);
            return [
                { type: "firebot:chat", message: `@${user} your task has been removed.` },
                ...this.writeFileEffects(),
            ];
        } else {
            return [
                { type: "firebot:chat", message: `@${user} has no task.` },
            ];
        }
    }

    /**
     * Removes all tasks from the list
     * 
     * @param filepath The path of the tasks file
     * @returns The effects to return to firebot
     */
    removeAllTasks(filepath: string): Effects.Effect[] {
        this.setTasks(filepath, {});
        return [
            ...this.writeFileEffects(),
        ];
    }
}
