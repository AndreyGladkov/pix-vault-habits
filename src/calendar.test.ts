import { describe, expect, it } from "vitest";
import { buildCalendar } from "./calendar";

describe("buildCalendar", () => {
  it("starts on Monday and leaves days after today empty", () => {
    expect(buildCalendar("2026-10-03", 7).weeks).toEqual([
      [
        "2026-09-21",
        "2026-09-22",
        "2026-09-23",
        "2026-09-24",
        "2026-09-25",
        "2026-09-26",
        "2026-09-27",
      ],
      [
        "2026-09-28",
        "2026-09-29",
        "2026-09-30",
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        null,
      ],
    ]);
  });

  it("covers at least the requested number of days, ending today", () => {
    const days = buildCalendar("2026-10-03", 365).weeks.flat().filter(Boolean);
    expect(days.length).toBeGreaterThanOrEqual(365);
    expect(days.at(-1)).toBe("2026-10-03");
  });

  it("groups weeks into month spans by their first day", () => {
    expect(buildCalendar("2026-10-03", 30).months).toEqual([
      { month: 7, weeks: 1 },
      { month: 8, weeks: 4 },
    ]);
  });
});
