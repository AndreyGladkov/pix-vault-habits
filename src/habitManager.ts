import { App, TFile, TFolder, normalizePath } from "obsidian";
import { generateId, formatDate } from "./csv";
import {
  parseHabitData,
  serializeHabitData,
  type HabitData,
} from "./habitData";

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

  async loadHabits(): Promise<HabitData> {
    const file = this.app.vault.getAbstractFileByPath(this.filePath);
    if (!(file instanceof TFile)) return { habits: [], statuses: {} };
    return parseHabitData(await this.app.vault.read(file));
  }

  async addHabit(name: string, category: string): Promise<HabitData> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Habit name cannot be empty");
    }

    const habit = {
      id: generateId(trimmed),
      name: trimmed,
      created: formatDate(),
      category,
    };
    return this.updateHabits((data) => {
      data.habits.push(habit);
      return true;
    });
  }

  async toggleHabitStatus(habitId: string, date: string): Promise<HabitData> {
    return this.updateHabits((data) => {
      if (!data.habits.some((h) => h.id === habitId)) {
        throw new Error(`Habit not found: ${habitId}`);
      }
      const dayMap = (data.statuses[habitId] ??= {});
      dayMap[date] = dayMap[date] ? 0 : 1;
      return true;
    });
  }

  async deleteHabit(habitId: string): Promise<HabitData> {
    return this.updateHabits((data) => {
      data.habits = data.habits.filter((h) => h.id !== habitId);
      delete data.statuses[habitId];
      return true;
    });
  }

  async renameHabit(habitId: string, newName: string): Promise<HabitData> {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error("Habit name cannot be empty");
    }
    return this.updateHabits((data) => {
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return false;
      habit.name = trimmed;
      return true;
    });
  }

  async setHabitCategory(
    habitId: string,
    category: string,
  ): Promise<HabitData> {
    return this.updateHabits((data) => {
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) {
        throw new Error(`Habit not found: ${habitId}`);
      }
      if (habit.category === category) return false;
      habit.category = category;
      return true;
    });
  }

  async replaceCategory(from: string, to: string): Promise<HabitData> {
    return this.updateHabits((data) => {
      let changed = false;
      for (const habit of data.habits) {
        if (habit.category === from) {
          habit.category = to;
          changed = true;
        }
      }
      return changed;
    });
  }

  // Vault.process reads and writes atomically, so a sync landing between the
  // read and the write cannot be overwritten; returning the text unchanged
  // makes it skip the write entirely.
  private async updateHabits(
    mutate: (data: HabitData) => boolean,
  ): Promise<HabitData> {
    const file = await this.ensureFile();
    let data: HabitData = { habits: [], statuses: {} };
    await this.app.vault.process(file, (text) => {
      data = parseHabitData(text);
      return mutate(data) ? serializeHabitData(data) : text;
    });
    return data;
  }
}
