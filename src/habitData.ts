import { formatDate, parseCsv, toCsv } from "./csv";

export const NO_CATEGORY = "";

export interface HabitRecord {
  id: string;
  name: string;
  created: string; // YYYY-MM-DD
  category: string;
}

export interface HabitStatusMap {
  [habitId: string]: Record<string, number>;
}

export interface HabitData {
  habits: HabitRecord[];
  statuses: HabitStatusMap;
}

// Row: <id>,<name>,<date>,<status 1|0>,<created>,<category>. The category
// column was added later, so files written by older versions have 5 columns.
export const parseHabitData = (text: string): HabitData => {
  const habitsById = new Map<string, HabitRecord>();
  const statuses: HabitStatusMap = {};

  for (const row of parseCsv(text)) {
    const [id, name, date, status, createdField, category = NO_CATEGORY] = row;
    const created = createdField || formatDate();
    if (!id || !name || !date || status === undefined) continue;

    const existing = habitsById.get(id);
    if (!existing) {
      habitsById.set(id, { id, name, created, category });
    } else {
      if (created < existing.created) existing.created = created;
      existing.name = name;
      existing.category = category;
    }

    (statuses[id] ??= {})[date] = status === "1" ? 1 : 0;
  }

  return { habits: Array.from(habitsById.values()), statuses };
};

export const serializeHabitData = (data: HabitData): string => {
  const rows = data.habits.flatMap(({ id, name, created, category }) => {
    const dayMap = data.statuses[id] ?? {};
    const dates = Object.keys(dayMap).sort();
    if (dates.length === 0) {
      return [[id, name, created, "0", created, category]];
    }
    return dates.map((date) => [
      id,
      name,
      date,
      String(dayMap[date]),
      created,
      category,
    ]);
  });
  return toCsv(rows);
};
