import { App, TFile, TFolder, normalizePath } from "obsidian";
import { parseCsv, toCsv, generateId, formatDate } from "./csv";

export interface HabitRecord {
  id: string;
  name: string;
  created: string; // YYYY-MM-DD
}

export interface HabitStatusMap {
  [habitId: string]: Record<string, number>;
}

export interface HabitData {
  habits: HabitRecord[];
  statuses: HabitStatusMap;
}

export class HabitManager {
  app: App;
  filePath: string;

  constructor(app: App, filePath: string) {
    this.app = app;
    this.filePath = normalizePath(filePath);
  }

  async ensureFile(): Promise<TFile> {
    const { vault } = this.app;

    const existing = vault.getAbstractFileByPath(this.filePath);
    if (existing instanceof TFile) {
      return existing;
    }

    const folderPath = this.filePath.substring(
      0,
      this.filePath.lastIndexOf("/"),
    );
    if (folderPath) {
      const folder = vault.getAbstractFileByPath(folderPath);
      if (!(folder instanceof TFolder)) {
        await vault.createFolder(folderPath).catch(() => {
          // Folder may already exist (race), ignore.
        });
      }
    }

    // Create the file. In rare cases the file already exists on disk but
    // was not yet indexed by the vault (or a race occurred between the
    // existence check above and the create call). In that case, fall back
    // to reading the existing file instead of throwing.
    try {
      return await vault.create(this.filePath, "");
    } catch (err) {
      const file = vault.getAbstractFileByPath(this.filePath);
      if (file instanceof TFile) {
        return file;
      }
      throw err;
    }
  }

  async readRaw(): Promise<string> {
    console.log("readRaw");
    const file = await this.ensureFile();
    console.log("readRaw file:", file);
    return this.app.vault.read(file);
  }

  async writeRaw(text: string): Promise<void> {
    const file = await this.ensureFile();
    await this.app.vault.modify(file, text);
  }

  async loadHabits(): Promise<HabitData> {
    const text = await this.readRaw();
    console.log("raw", text);
    const rows = parseCsv(text);
    console.log("parsed", rows);

    const habitsById = new Map<string, HabitRecord>();
    const statuses: HabitStatusMap = {};

    for (const row of rows) {
      // Skip blank lines / malformed rows.
      if (row.length === 0) continue;
      if (row.length < 4) continue;

      const [id, name, date, statusStr, created] = [
        row[0],
        row[1],
        row[2],
        row[3],
        row[4] || formatDate(),
      ];

      if (!id || !date) continue;

      const status = statusStr === "1" ? 1 : 0;

      if (!habitsById.has(id)) {
        habitsById.set(id, { id, name, created });
      } else {
        // Keep the earliest creation date and latest name.
        const existing = habitsById.get(id)!;
        if (created < existing.created) {
          existing.created = created;
        }
        if (name) existing.name = name;
      }

      if (!statuses[id]) {
        statuses[id] = {};
      }
      statuses[id][date] = status;
    }

    const habits = Array.from(habitsById.values());

    return { habits, statuses };
  }

  async saveAll(data: HabitData): Promise<void> {
    const rows: string[][] = [];

    for (const habit of data.habits) {
      const dayMap = data.statuses[habit.id] || {};
      const dates = Object.keys(dayMap).sort();
      if (dates.length === 0) {
        rows.push([habit.id, habit.name, habit.created, "0", habit.created]);
        continue;
      }
      for (const date of dates) {
        rows.push([
          habit.id,
          habit.name,
          date,
          String(dayMap[date]),
          habit.created,
        ]);
      }
    }

    await this.writeRaw(toCsv(rows));
  }

  async addHabit(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Habit name cannot be empty");
    }

    const id = generateId(trimmed);
    const created = formatDate();

    const data = await this.loadHabits();
    data.habits.push({ id, name: trimmed, created });
    if (!data.statuses[id]) {
      data.statuses[id] = {};
    }
    // Initial creation row (status 0 for the creation day).
    data.statuses[id][created] = 0;

    await this.saveAll(data);
    return id;
  }

  async saveHabitStatus(
    habitId: string,
    date: string,
    status: number,
  ): Promise<void> {
    const data = await this.loadHabits();
    const habit = data.habits.find((h) => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }
    if (!data.statuses[habitId]) {
      data.statuses[habitId] = {};
    }
    data.statuses[habitId][date] = status ? 1 : 0;
    await this.saveAll(data);
  }

  async toggleHabitStatus(habitId: string, date: string): Promise<number> {
    const data = await this.loadHabits();
    const current = data.statuses[habitId]?.[date] ?? 0;
    const next = current ? 0 : 1;
    await this.saveHabitStatus(habitId, date, next);
    return next;
  }

  async deleteHabit(habitId: string): Promise<void> {
    const data = await this.loadHabits();
    data.habits = data.habits.filter((h) => h.id !== habitId);
    delete data.statuses[habitId];
    await this.saveAll(data);
  }

  async renameHabit(habitId: string, newName: string): Promise<void> {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const data = await this.loadHabits();
    const habit = data.habits.find((h) => h.id === habitId);
    if (!habit) return;
    habit.name = trimmed;
    await this.saveAll(data);
  }

  async getHabitNames(): Promise<string[]> {
    const { habits } = await this.loadHabits();
    return habits.map((h) => h.name);
  }
}
