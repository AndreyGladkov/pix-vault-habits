import { beforeEach, describe, expect, it, vi } from "vitest";
import { TFile, TFolder } from "obsidian";
import { HabitManager } from "./habitManager";

const at = <T extends object>(entry: T, path: string): T =>
  Object.assign(entry, { path });

// In-memory vault mirroring Obsidian 1.13 semantics: process() skips the write
// when the callback returns the text unchanged.
const createVault = (initial: Record<string, string> = {}) => {
  const files = new Map(Object.entries(initial));
  const folders = new Set<string>();
  const writes: string[] = [];
  const vault = {
    getAbstractFileByPath: (path: string) =>
      files.has(path)
        ? at(new TFile(), path)
        : folders.has(path)
          ? at(new TFolder(), path)
          : null,
    createFolder: async (path: string) => {
      folders.add(path);
    },
    create: async (path: string, text: string) => {
      files.set(path, text);
      return at(new TFile(), path);
    },
    cachedRead: async (file: { path: string }) => files.get(file.path) ?? "",
    process: async (file: { path: string }, fn: (text: string) => string) => {
      const text = files.get(file.path) ?? "";
      const next = fn(text);
      if (next !== text) {
        files.set(file.path, next);
        writes.push(file.path);
      }
      return next;
    },
  };
  return { app: { vault } as never, files, folders, writes };
};

const PATH = "pixVaultHabits/habits.csv";

describe("HabitManager", () => {
  let vault: ReturnType<typeof createVault>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
    vault = createVault();
  });

  it("creates the data file and its folder on first load", async () => {
    const manager = new HabitManager(vault.app, PATH);

    expect(await manager.loadHabits()).toEqual({ habits: [], statuses: {} });
    expect(vault.folders.has("pixVaultHabits")).toBe(true);
    expect(vault.files.get(PATH)).toBe("");
  });

  it("adds a habit with a creation row in the given category", async () => {
    const manager = new HabitManager(vault.app, PATH);

    const id = await manager.addHabit("  Читать ", "Учёба");

    expect(vault.files.get(PATH)).toBe(
      `${id},Читать,2026-10-03,0,2026-10-03,Учёба`,
    );
  });

  it("toggles a day on and off and reports the new status", async () => {
    vault = createVault({ [PATH]: "read,Читать,2026-10-01,1,2026-09-01," });
    const manager = new HabitManager(vault.app, PATH);

    expect(await manager.toggleHabitStatus("read", "2026-10-02")).toBe(1);
    expect(await manager.toggleHabitStatus("read", "2026-10-02")).toBe(0);
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
    await manager.deleteHabit("run");

    expect(vault.files.get(PATH)).toBe("read,Read,2026-10-01,1,2026-09-01,");
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
