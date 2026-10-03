import { describe, expect, it } from "vitest";
import { computeStreak, countDone } from "./stats";

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const days = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1 };
    expect(computeStreak(days, "2026-10-03")).toBe(3);
  });

  it("keeps the streak alive from yesterday while today is unmarked", () => {
    const days = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 0 };
    expect(computeStreak(days, "2026-10-03")).toBe(2);
  });

  it("stops at a gap and crosses month boundaries", () => {
    expect(
      computeStreak(
        { "2026-09-29": 1, "2026-09-30": 1, "2026-10-02": 1 },
        "2026-10-03",
      ),
    ).toBe(1);
    expect(
      computeStreak({ "2026-09-30": 1, "2026-10-01": 1 }, "2026-10-01"),
    ).toBe(2);
    expect(computeStreak({ "2026-10-01": 1 }, "2026-10-03")).toBe(0);
  });
});

describe("countDone", () => {
  it("counts only completed days", () => {
    expect(countDone({ a: 1, b: 0, c: 1 })).toBe(2);
  });
});
