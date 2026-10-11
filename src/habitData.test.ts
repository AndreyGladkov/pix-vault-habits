import { describe, expect, it, vi } from "vitest";
import {
  dayState,
  parseHabitData,
  serializeHabitData,
  type HabitData,
} from "./habitData";

describe("parseHabitData", () => {
  it("falls back to today when the created column is blank", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
    try {
      const data = parseHabitData("run,Бег,2026-10-01,1,,Спорт");

      expect(data.habits[0]?.created).toBe("2026-10-03");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads legacy 5-column rows as uncategorized", () => {
    const data = parseHabitData("read,Читать,2026-10-01,1,2026-09-01");

    expect(data.habits).toEqual([
      {
        id: "read",
        name: "Читать",
        created: "2026-09-01",
        category: "",
        autoDoneSince: "",
      },
    ]);
    expect(data.statuses).toEqual({ read: { "2026-10-01": 1 } });
  });

  it("merges rows per habit: earliest created date, latest name and category", () => {
    const data = parseHabitData(
      [
        "read,Read,2026-10-01,1,2026-09-02,Учёба",
        "read,Читать,2026-10-02,0,2026-09-01,Здоровье,2026-10-02",
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
        autoDoneSince: "2026-10-02",
      },
    ]);
    expect(data.statuses.read).toEqual({ "2026-10-01": 1, "2026-10-02": 0 });
  });

  it("reads an empty status as a habit definition without a marked day", () => {
    const data = parseHabitData("read,Читать,2026-09-01,,2026-09-01,,");

    expect(data.habits).toHaveLength(1);
    expect(data.statuses).toEqual({});
  });
});

describe("dayState", () => {
  const habit = {
    id: "read",
    name: "Читать",
    created: "2026-09-01",
    category: "",
    autoDoneSince: "2026-10-02",
  };

  it("treats unmarked days as done from the auto-done date on", () => {
    expect(dayState(habit, {}, "2026-10-01")).toBe("missed");
    expect(dayState(habit, {}, "2026-10-02")).toBe("autoDone");
  });

  it("lets an explicit mark override the auto-done default", () => {
    const days = { "2026-10-01": 1, "2026-10-03": 0 };
    expect(dayState(habit, days, "2026-10-01")).toBe("done");
    expect(dayState(habit, days, "2026-10-03")).toBe("missed");
  });

  it("never auto-completes a habit without an auto-done date", () => {
    expect(dayState({ ...habit, autoDoneSince: "" }, {}, "2026-10-05")).toBe(
      "missed",
    );
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
          autoDoneSince: "2026-10-01",
        },
        {
          id: "read",
          name: "Читать",
          created: "2026-09-02",
          category: "",
          autoDoneSince: "",
        },
      ],
      statuses: { run: { "2026-10-02": 1, "2026-10-01": 0 } },
    };

    expect(parseHabitData(serializeHabitData(data))).toEqual(data);
  });

  it("writes a definition row for a habit without marked days", () => {
    const data: HabitData = {
      habits: [
        {
          id: "read",
          name: "Читать",
          created: "2026-09-01",
          category: "Учёба",
          autoDoneSince: "2026-09-01",
        },
      ],
      statuses: {},
    };
    expect(serializeHabitData(data)).toBe(
      "read,Читать,2026-09-01,,2026-09-01,Учёба,2026-09-01",
    );
  });
});
