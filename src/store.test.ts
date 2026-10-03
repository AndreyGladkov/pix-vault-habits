import { describe, expect, it, vi } from "vitest";
import type { HabitData } from "./habitData";
import { selectCategories, TrackerStore, type DisplaySettings } from "./store";

const settings: DisplaySettings = {
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "gray",
};
const habitData: HabitData = {
  habits: [{ id: "a", name: "A", created: "2026-10-01", category: "" }],
  statuses: {},
};
const emptyData: HabitData = { habits: [], statuses: {} };

describe("TrackerStore", () => {
  it("moves from loading to ready and notifies subscribers", async () => {
    const store = new TrackerStore(
      () => Promise.resolve(habitData),
      settings,
      [],
    );
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
      [],
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
    const store = new TrackerStore(() => loads.shift()!, settings, []);

    const first = store.reload();
    await store.reload();
    resolveFirst(emptyData);
    await first;

    expect(store.getSnapshot().habits).toEqual({
      status: "ready",
      data: habitData,
    });
  });

  it("applies categories and habit data in a single update", () => {
    const store = new TrackerStore(
      () => Promise.resolve(habitData),
      settings,
      [],
    );
    const listener = vi.fn();
    store.subscribe(listener);

    store.applyChanges({ categories: ["Здоровье"], data: habitData });

    expect(store.getSnapshot().categories).toEqual(["Здоровье"]);
    expect(store.getSnapshot().habits).toEqual({
      status: "ready",
      data: habitData,
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("does not let an older in-flight reload overwrite applied data", async () => {
    let resolveLoad!: (data: HabitData) => void;
    const store = new TrackerStore(
      () => new Promise((resolve) => (resolveLoad = resolve)),
      settings,
      [],
    );

    const reload = store.reload();
    store.applyChanges({ data: habitData });
    resolveLoad(emptyData);
    await reload;

    expect(store.getSnapshot().habits).toEqual({
      status: "ready",
      data: habitData,
    });
  });

  it("selects saved categories merged with ones found in the habits", async () => {
    const sport: HabitData = {
      habits: [
        { id: "run", name: "Бег", created: "2026-10-01", category: "Спорт" },
      ],
      statuses: {},
    };
    const store = new TrackerStore(() => Promise.resolve(sport), settings, [
      "Здоровье",
    ]);

    expect(selectCategories(store.getSnapshot())).toEqual(["Здоровье"]);
    await store.reload();
    expect(selectCategories(store.getSnapshot())).toEqual([
      "Здоровье",
      "Спорт",
    ]);
  });

  it("publishes settings changes and stops notifying after unsubscribe", () => {
    const store = new TrackerStore(
      () => Promise.resolve(habitData),
      settings,
      [],
    );
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setSettings({ ...settings, numDays: 30 });
    unsubscribe();
    store.setSettings(settings);

    expect(listener).toHaveBeenCalledOnce();
    expect(store.getSnapshot().settings).toBe(settings);
  });
});
