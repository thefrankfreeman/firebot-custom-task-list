/**
 * Cleans a value that could be a username string
 *
 * Intended to be used on input from a chat command
 *
 * @param raw Value to clean
 * @returns Cleaned string or null
 */
export function cleanUserName(raw: string): string;
export function cleanUserName(raw: null | undefined): null;
export function cleanUserName(raw: string | null | undefined): string | null {
    if (typeof raw === "string") {
        raw = raw.trim();
        return raw.startsWith("@") ? raw.substring(1) : raw;
    } else {
        return null;
    }
}

/**
 * Makes a deep copy of something
 *
 * Typings should be fully maintained
 *
 * @param obj Value to deep copy
 * @returns Deep copy of obj
 */
export function deepCopy<T extends any>(obj: T[]): T[];
export function deepCopy<T extends any>(obj: T): T;
export function deepCopy(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((x) => deepCopy(x));
    }
    if (typeof obj === "object" && obj !== null) {
        return Object.entries(obj).reduce((result, [key, value]) => ({ ...result, [key]: deepCopy(value) }), {});
    }
    return obj;
}
