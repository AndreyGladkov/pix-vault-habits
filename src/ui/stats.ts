import { dateFromString, formatDate } from "../csv";

// A streak is still alive while today is not marked yet: it is counted back
// from yesterday so the user does not see it reset every morning.
export const computeStreak = (
  dayMap: Record<string, number>,
  today: string,
): number => {
  const cursor = dateFromString(today);
  if (dayMap[today] !== 1) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dayMap[formatDate(cursor)] === 1) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const countDone = (dayMap: Record<string, number>): number =>
  Object.values(dayMap).filter((status) => status === 1).length;
