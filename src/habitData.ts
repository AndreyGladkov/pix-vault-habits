import { datesBetween, formatDate, parseCsv, toCsv } from "./csv";

export const NO_CATEGORY = "";
export const NOT_AUTO_DONE = "";

export interface HabitRecord {
  id: string;
  name: string;
  created: string; // YYYY-MM-DD
  category: string;
  autoDoneSince: string; // YYYY-MM-DD or NOT_AUTO_DONE
}

export interface HabitEdit {
  name: string;
  autoDone: boolean;
}

export interface HabitStatusMap {
  [habitId: string]: Record<string, number>;
}

export interface HabitData {
  habits: HabitRecord[];
  statuses: HabitStatusMap;
}

export type DayState = "done" | "autoDone" | "missed";

// An auto-done habit counts every day since it was switched on as done until
// the user marks the day explicitly, so a missing row means "done" there.
export const dayState = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  date: string,
): DayState => {
  const status = dayMap[date];
  if (status !== undefined) return status === 1 ? "done" : "missed";
  return isAutoDoneDay(habit, date) ? "autoDone" : "missed";
};

export const isDone = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  date: string,
): boolean => dayState(habit, dayMap, date) !== "missed";

export const isAutoDone = (habit: HabitRecord): boolean =>
  habit.autoDoneSince !== NOT_AUTO_DONE;

export const isAutoDoneDay = (habit: HabitRecord, date: string): boolean =>
  isAutoDone(habit) && date >= habit.autoDoneSince;

// Unmarking a missed auto-done day drops the row instead of writing 1, so the
// day goes back to the auto-done default.
export const toggleDay = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  date: string,
): void => {
  if (isDone(habit, dayMap, date)) {
    dayMap[date] = 0;
  } else if (isAutoDoneDay(habit, date)) {
    delete dayMap[date];
  } else {
    dayMap[date] = 1;
  }
};

// Days before today stay done once auto-done is switched off, so they are
// written out explicitly; today becomes a regular unmarked day.
export const setAutoDone = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  autoDone: boolean,
  today: string,
): void => {
  if (autoDone === isAutoDone(habit)) return;
  if (autoDone) {
    habit.autoDoneSince = today;
    return;
  }
  for (const date of datesBetween(habit.autoDoneSince, today).slice(0, -1)) {
    dayMap[date] ??= 1;
  }
  habit.autoDoneSince = NOT_AUTO_DONE;
};

// Row: <id>,<name>,<date>,<status 1|0|empty>,<created>,<category>,<auto-done
// since>. Columns were appended over time, so files written by older versions
// have 5 or 6 columns. An empty status marks the definition row of a habit
// without marked days; older versions read it as 0.
export const parseHabitData = (text: string): HabitData => {
  const habitsById = new Map<string, HabitRecord>();
  const statuses: HabitStatusMap = {};

  for (const row of parseCsv(text)) {
    const [
      id,
      name,
      date,
      status,
      createdField,
      category = NO_CATEGORY,
      autoDoneSince = NOT_AUTO_DONE,
    ] = row;
    const created = createdField || formatDate();
    if (!id || !name || !date || status === undefined) continue;

    const existing = habitsById.get(id);
    if (!existing) {
      habitsById.set(id, { id, name, created, category, autoDoneSince });
    } else {
      if (created < existing.created) existing.created = created;
      existing.name = name;
      existing.category = category;
      existing.autoDoneSince = autoDoneSince;
    }

    if (status !== "") {
      (statuses[id] ??= {})[date] = status === "1" ? 1 : 0;
    }
  }

  return { habits: Array.from(habitsById.values()), statuses };
};

export const serializeHabitData = (data: HabitData): string => {
  const rows = data.habits.flatMap(
    ({ id, name, created, category, autoDoneSince }) => {
      const dayMap = data.statuses[id] ?? {};
      const marked = Object.keys(dayMap).sort();
      const dates = marked.length > 0 ? marked : [created];
      return dates.map((date) => [
        id,
        name,
        date,
        String(dayMap[date] ?? ""),
        created,
        category,
        autoDoneSince,
      ]);
    },
  );
  return toCsv(rows);
};
