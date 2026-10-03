import { describe, expect, it } from "vitest";
import { dateFromString, formatDate, generateId, parseCsv, toCsv } from "./csv";

describe("parseCsv", () => {
  it("handles quoted commas, escaped quotes, newlines and CRLF", () => {
    expect(parseCsv('a,"b, ""c""\nd"\r\ne,f')).toEqual([
      ["a", 'b, "c"\nd'],
      ["e", "f"],
    ]);
  });

  it("round-trips fields that need escaping", () => {
    const rows = [
      ["id", 'say "hi", then\nleave'],
      ["x", ""],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("dates", () => {
  it("formats and parses local YYYY-MM-DD dates", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dateFromString("2026-01-05")).toEqual(new Date(2026, 0, 5));
  });
});

describe("generateId", () => {
  it("slugifies latin and cyrillic names", () => {
    expect(generateId("  Читать 20 min! ")).toMatch(
      /^habit_читать-20-min-[a-z0-9]{1,4}$/,
    );
  });
});
