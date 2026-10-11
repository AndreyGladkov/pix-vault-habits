import { describe, expect, it } from "vitest";
import type { HabitRecord } from "../habitData";
import { computeStreak, countDone } from "./stats";

const manual: HabitRecord = {
  id: "read",
  name: "Читать",
  created: "2026-09-01",
  category: "",
  autoDoneSince: "",
};
const autoDone: HabitRecord = { ...manual, autoDoneSince: "2026-09-29" };

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const days = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1 };
    expect(computeStreak(manual, days, "2026-10-03")).toBe(3);
  });

  it("keeps the streak alive from yesterday while today is unmarked", () => {
    const days = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 0 };
    expect(computeStreak(manual, days, "2026-10-03")).toBe(2);
  });

  it("stops at a gap and crosses month boundaries", () => {
    expect(
      computeStreak(
        manual,
        { "2026-09-29": 1, "2026-09-30": 1, "2026-10-02": 1 },
        "2026-10-03",
      ),
    ).toBe(1);
    expect(
      computeStreak(manual, { "2026-09-30": 1, "2026-10-01": 1 }, "2026-10-01"),
    ).toBe(2);
    expect(computeStreak(manual, { "2026-10-01": 1 }, "2026-10-03")).toBe(0);
  });

  it("counts auto-done days, including today, back to the first miss", () => {
    expect(computeStreak(autoDone, {}, "2026-10-03")).toBe(5);
    expect(computeStreak(autoDone, { "2026-09-28": 1 }, "2026-10-03")).toBe(6);
    expect(computeStreak(autoDone, { "2026-10-01": 0 }, "2026-10-03")).toBe(2);
  });
});

describe("countDone", () => {
  it("counts only completed days", () => {
    expect(countDone(manual, { a: 1, b: 0, c: 1 }, "2026-10-03")).toBe(2);
  });

  it("adds unmarked days since auto-done was switched on, up to today", () => {
    const days = { "2026-09-01": 1, "2026-09-30": 0, "2026-10-01": 1 };
    expect(countDone(autoDone, days, "2026-10-03")).toBe(5);
    expect(countDone(autoDone, {}, "2026-09-28")).toBe(0);
  });
});
