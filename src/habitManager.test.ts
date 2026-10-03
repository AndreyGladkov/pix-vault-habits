import { beforeEach, describe, expect, it, vi } from "vitest";
import { HabitManager } from "./habitManager";
import { createVault } from "./test/vault";

const PATH = "pixVaultHabits/habits.csv";

describe("HabitManager", () => {
  let vault: ReturnType<typeof createVault>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
    vault = createVault();
  });

  it("loads a missing file as empty data without creating it", async () => {
    const manager = new HabitManager(vault.app, PATH);

    expect(await manager.loadHabits()).toEqual({ habits: [], statuses: {} });
    expect(vault.folders.size).toBe(0);
    expect(vault.files.size).toBe(0);
  });

  it("creates the data file and its folder on first write", async () => {
    const manager = new HabitManager(vault.app, PATH);

    await manager.addHabit("Бег", "");

    expect(vault.folders.has("pixVaultHabits")).toBe(true);
    expect(vault.files.has(PATH)).toBe(true);
  });

  it("adds a habit with a creation row in the given category", async () => {
    const manager = new HabitManager(vault.app, PATH);

    const data = await manager.addHabit("  Читать ", "Учёба");
    const id = data.habits[0]?.id;

    expect(data.habits).toEqual([
      { id, name: "Читать", created: "2026-10-03", category: "Учёба" },
    ]);
    expect(vault.files.get(PATH)).toBe(
      `${id},Читать,2026-10-03,0,2026-10-03,Учёба`,
    );
  });

  it("toggles a day on and off and returns the written data", async () => {
    vault = createVault({ [PATH]: "read,Читать,2026-10-01,1,2026-09-01," });
    const manager = new HabitManager(vault.app, PATH);

    const marked = await manager.toggleHabitStatus("read", "2026-10-02");
    expect(marked.statuses.read?.["2026-10-02"]).toBe(1);
    const unmarked = await manager.toggleHabitStatus("read", "2026-10-02");
    expect(unmarked.statuses.read?.["2026-10-02"]).toBe(0);
    expect((await manager.loadHabits()).statuses.read).toEqual({
      "2026-10-01": 1,
      "2026-10-02": 0,
    });
    await expect(
      manager.toggleHabitStatus("missing", "2026-10-02"),
    ).rejects.toThrow("missing");
  });

  it("renames and deletes habits", async () => {
    vault = createVault({
      [PATH]: [
        "read,Читать,2026-10-01,1,2026-09-01,",
        "run,Бег,2026-10-01,1,2026-09-01,",
      ].join("\n"),
    });
    const manager = new HabitManager(vault.app, PATH);

    await manager.renameHabit("read", "Read");
    const data = await manager.deleteHabit("run");

    expect(data.habits.map((h) => h.name)).toEqual(["Read"]);
    expect(vault.files.get(PATH)).toBe("read,Read,2026-10-01,1,2026-09-01,");
    await expect(manager.renameHabit("read", "  ")).rejects.toThrow();
  });

  it("moves habits between categories and returns the written data", async () => {
    vault = createVault({ [PATH]: "run,Бег,2026-10-01,1,2026-09-01,Спорт" });
    const manager = new HabitManager(vault.app, PATH);

    const data = await manager.setHabitCategory("run", "Здоровье");

    expect(data.habits[0]?.category).toBe("Здоровье");
    expect(vault.files.get(PATH)).toBe(
      "run,Бег,2026-10-01,1,2026-09-01,Здоровье",
    );
  });

  it("replaces a category across habits and skips the write when nothing uses it", async () => {
    vault = createVault({
      [PATH]: [
        "run,Бег,2026-10-01,1,2026-09-01,Спорт",
        "swim,Плавать,2026-10-01,0,2026-09-01,Спорт",
      ].join("\n"),
    });
    const manager = new HabitManager(vault.app, PATH);

    const renamed = await manager.replaceCategory("Спорт", "Движение");
    expect(renamed.habits.map((h) => h.category)).toEqual([
      "Движение",
      "Движение",
    ]);
    expect(vault.writes).toHaveLength(1);

    await manager.replaceCategory("Работа", "");
    await manager.setHabitCategory("run", "Движение");
    expect(vault.writes).toHaveLength(1);
  });
});
