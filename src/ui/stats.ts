import { formatDate } from "../csv";

export const computeStreak = (dayMap: Record<string, number>): number => {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (dayMap[formatDate(cursor)] !== 1) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dayMap[formatDate(cursor)] === 1) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const countDone = (dayMap: Record<string, number>): number => {
  let count = 0;
  for (const key in dayMap) {
    if (dayMap[key] === 1) count++;
  }
  return count;
};
