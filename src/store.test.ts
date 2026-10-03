import { describe, expect, it, vi } from "vitest";
import type { HabitData } from "./habitManager";
import { TrackerStore, type DisplaySettings } from "./store";

const settings: DisplaySettings = {
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "gray",
};
const habitData: HabitData = {
  habits: [{ id: "a", name: "A", created: "2026-10-01" }],
  statuses: {},
};
const emptyData: HabitData = { habits: [], statuses: {} };

describe("TrackerStore", () => {
  it("moves from loading to ready and notifies subscribers", async () => {
    const store = new TrackerStore(() => Promise.resolve(habitData), settings);
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.getSnapshot().habits).toEqual({ status: "loading" });
    await store.reload();

    expect(store.getSnapshot().habits).toEqual({
      status: "ready",
      data: habitData,
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("reports load failures as an error state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = new TrackerStore(
      () => Promise.reject(new Error("boom")),
      settings,
    );

    await store.reload();

    expect(store.getSnapshot().habits).toEqual({ status: "error" });
  });

  it("ignores a reload that resolves after a newer one", async () => {
    let resolveFirst!: (data: HabitData) => void;
    const loads = [
      new Promise<HabitData>((resolve) => (resolveFirst = resolve)),
      Promise.resolve(habitData),
    ];
    const store = new TrackerStore(() => loads.shift()!, settings);

    const first = store.reload();
    await store.reload();
    resolveFirst(emptyData);
    await first;

    expect(store.getSnapshot().habits).toEqual({
      status: "ready",
      data: habitData,
    });
  });

  it("publishes settings changes and stops notifying after unsubscribe", () => {
    const store = new TrackerStore(() => Promise.resolve(habitData), settings);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setSettings({ ...settings, numDays: 30 });
    unsubscribe();
    store.setSettings(settings);

    expect(listener).toHaveBeenCalledOnce();
    expect(store.getSnapshot().settings).toBe(settings);
  });
});
