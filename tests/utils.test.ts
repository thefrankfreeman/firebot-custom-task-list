import { cleanUserName, deepCopy } from "../src/utils";

describe("cleanUserName", () => {
    it("trims whitespace", () => {
        const actual = cleanUserName(" withSpace ");
        expect(actual).toEqual("withSpace");
    });

    it("drops the notifier", () => {
        const actual = cleanUserName("@username");
        expect(actual).toEqual("username");
    });

    it("returns null when not a string", () => {
        const actual = cleanUserName([][0]);
        expect(actual).toBeNull();
    });
});

describe("deepCopy", () => {
    it.each`
        typeName     | value
        ${"string"}  | ${"hello"}
        ${"number"}  | ${1}
        ${"boolean"} | ${true}
    `("maintains $typeName primitives", ({ value }) => {
        const result = deepCopy(value);
        expect(result).toBe(result);
    });

    it("deep copies inside a list", () => {
        const original: [number, { b: number }] = [1, { b: 2 }];
        const actual = deepCopy(original);
        original[0] = 3;
        original[1].b = 4;
        expect(actual).toEqual([1, { b: 2 }]);
    });

    it("deep copies inside an object", () => {
        const original = { a: [1, 2], b: "c" };
        const actual = deepCopy(original);
        original.a[0] = 3;
        original.b = "f";
        expect(actual).toEqual({ a: [1, 2], b: "c" });
    });
});
