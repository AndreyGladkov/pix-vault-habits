import { dateFromString, formatDate } from "./csv";

type Week = (string | null)[];

interface MonthSpan {
  month: number;
  weeks: number;
}

export interface Calendar {
  weeks: Week[];
  months: MonthSpan[];
}

export const buildCalendar = (today: string, numDays: number): Calendar => {
  const weeks = buildWeeks(today, numDays);
  return { weeks, months: monthSpans(weeks) };
};

const buildWeeks = (today: string, numDays: number): Week[] => {
  const cursor = dateFromString(today);
  cursor.setDate(cursor.getDate() - (numDays - 1));
  cursor.setDate(cursor.getDate() - mondayBasedWeekday(cursor));

  const weeks: Week[] = [];
  while (formatDate(cursor) <= today) {
    const week: Week = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = formatDate(cursor);
      week.push(date <= today ? date : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const mondayBasedWeekday = (date: Date): number => (date.getDay() + 6) % 7;

const monthSpans = (weeks: Week[]): MonthSpan[] => {
  const spans: MonthSpan[] = [];
  for (const [firstDay] of weeks) {
    if (!firstDay) continue;
    const month = dateFromString(firstDay).getMonth();
    const last = spans[spans.length - 1];
    if (last?.month === month) {
      last.weeks++;
    } else {
      spans.push({ month, weeks: 1 });
    }
  }
  return spans;
};
