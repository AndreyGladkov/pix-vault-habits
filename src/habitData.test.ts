import { describe, expect, it } from "vitest";
import {
  parseHabitData,
  serializeHabitData,
  type HabitData,
} from "./habitData";

describe("parseHabitData", () => {
  it("reads legacy 5-column rows as uncategorized", () => {
    const data = parseHabitData("read,Читать,2026-10-01,1,2026-09-01");

    expect(data.habits).toEqual([
      { id: "read", name: "Читать", created: "2026-09-01", category: "" },
    ]);
    expect(data.statuses).toEqual({ read: { "2026-10-01": 1 } });
  });

  it("merges rows per habit: earliest created date, latest name and category", () => {
    const data = parseHabitData(
      [
        "read,Read,2026-10-01,1,2026-09-02,Учёба",
        "read,Читать,2026-10-02,0,2026-09-01,Здоровье",
        "broken,row",
        ",no id,2026-10-01,1",
      ].join("\n"),
    );

    expect(data.habits).toEqual([
      {
        id: "read",
        name: "Читать",
        created: "2026-09-01",
        category: "Здоровье",
      },
    ]);
    expect(data.statuses.read).toEqual({ "2026-10-01": 1, "2026-10-02": 0 });
  });
});

describe("serializeHabitData", () => {
  it("round-trips habits with categories, including names that need quoting", () => {
    const data: HabitData = {
      habits: [
        {
          id: "run",
          name: "Бег, 5 км",
          created: "2026-09-01",
          category: 'Спорт "утро"',
        },
        { id: "read", name: "Читать", created: "2026-09-02", category: "" },
      ],
      statuses: { run: { "2026-10-02": 1, "2026-10-01": 0 } },
    };

    expect(parseHabitData(serializeHabitData(data))).toEqual({
      ...data,
      statuses: { ...data.statuses, read: { "2026-09-02": 0 } },
    });
  });

  it("writes a definition row for a habit without marked days", () => {
    const data: HabitData = {
      habits: [
        {
          id: "read",
          name: "Читать",
          created: "2026-09-01",
          category: "Учёба",
        },
      ],
      statuses: {},
    };
    expect(serializeHabitData(data)).toBe(
      "read,Читать,2026-09-01,0,2026-09-01,Учёба",
    );
  });
});
