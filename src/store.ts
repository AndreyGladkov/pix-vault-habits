import { listCategories } from "./categories";
import type { HabitData } from "./habitData";

export interface DisplaySettings {
  numDays: number;
  doneColor: string;
  emptyColor: string;
}

type HabitsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: HabitData };

export interface TrackerSnapshot {
  settings: DisplaySettings;
  categories: string[];
  habits: HabitsState;
}

export class TrackerStore {
  private snapshot: TrackerSnapshot;
  private readonly listeners = new Set<() => void>();
  private generation = 0;

  constructor(
    private readonly loadHabits: () => Promise<HabitData>,
    settings: DisplaySettings,
    categories: string[],
  ) {
    this.snapshot = { settings, categories, habits: { status: "loading" } };
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): TrackerSnapshot => this.snapshot;

  async reload(): Promise<void> {
    const generation = ++this.generation;
    try {
      const data = await this.loadHabits();
      if (generation === this.generation) {
        this.update({ habits: { status: "ready", data } });
      }
    } catch (err) {
      console.error("[Pix Vault Habits] loadHabits error:", err);
      if (generation === this.generation) {
        this.update({ habits: { status: "error" } });
      }
    }
  }

  setSettings(settings: DisplaySettings): void {
    this.update({ settings });
  }

  applyChanges({
    categories,
    data,
  }: {
    categories?: string[];
    data?: HabitData;
  }): void {
    if (data) this.generation++;
    this.update({
      ...(categories && { categories }),
      ...(data && { habits: { status: "ready", data } }),
    });
  }

  private update(patch: Partial<TrackerSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}

export const selectCategories = ({
  categories,
  habits,
}: TrackerSnapshot): string[] =>
  listCategories(
    categories,
    habits.status === "ready" ? habits.data.habits : [],
  );
