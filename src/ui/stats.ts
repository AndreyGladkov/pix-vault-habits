import { dateFromString, datesBetween, formatDate } from "../csv";
import { dayState, isAutoDone, isDone, type HabitRecord } from "../habitData";

// A streak is still alive while today is not marked yet: it is counted back
// from yesterday so the user does not see it reset every morning.
export const computeStreak = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  today: string,
): number => {
  const cursor = dateFromString(today);
  if (!isDone(habit, dayMap, today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (isDone(habit, dayMap, formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const countDone = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  today: string,
): number => {
  const marked = Object.values(dayMap).filter((status) => status === 1).length;
  const autoDone = isAutoDone(habit)
    ? datesBetween(habit.autoDoneSince, today).filter(
        (date) => dayState(habit, dayMap, date) === "autoDone",
      ).length
    : 0;
  return marked + autoDone;
};
