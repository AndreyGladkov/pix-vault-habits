import type PixVaultHabitsPlugin from "../main";
import type { HabitRecord } from "../habitManager";
import { dateFromString, formatDate } from "../csv";
import {
  getMonthLabels,
  getWeekdayLabels,
  t,
  formatDisplayDate,
} from "../i18n";

export const renderHabitGrid = (
  habit: HabitRecord,
  dayMap: Record<string, number>,
  container: HTMLElement,
  plugin: PixVaultHabitsPlugin,
) => {
  const settings = plugin.settings;
  const numDays = settings.numDays;
  const todayStr = formatDate();
  const today = dateFromString(todayStr);

  // Start date: today - (numDays - 1), aligned back to Monday so every
  // column is a full week.
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (numDays - 1));
  const startDow = (rangeStart.getDay() + 6) % 7; // 0 = Monday
  rangeStart.setDate(rangeStart.getDate() - startDow);
  rangeStart.setHours(0, 0, 0, 0);

  // Collect all days from start to today (inclusive).
  const days: string[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= today) {
    days.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Group days into weeks (columns of 7).
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    const week: (string | null)[] = [];
    for (let j = 0; j < 7; j++) {
      week.push(days[i + j] ?? null);
    }
    weeks.push(week);
  }

  const wrapper = container.createDiv({ cls: "pvhabits-grid-wrapper" });

  // --- Month labels row (aligned with week columns) ---
  const monthRow = wrapper.createDiv({ cls: "pvhabits-month-row" });
  monthRow.createDiv({ cls: "pvhabits-month-spacer" });
  const monthLabelsEl = monthRow.createDiv({ cls: "pvhabits-month-labels" });
  const monthLabels = getMonthLabels();

  let lastMonth = -1;
  let runStart = 0;
  for (let w = 0; w <= weeks.length; w++) {
    const firstDay = weeks[w]?.[0];
    const month = firstDay ? dateFromString(firstDay).getMonth() : -1;
    if (month !== lastMonth) {
      if (lastMonth !== -1 && w > runStart) {
        const label = monthLabelsEl.createEl("span", {
          cls: "pvhabits-month-label",
          text: monthLabels[lastMonth],
        });
        label.style.flexGrow = String(w - runStart);
      }
      lastMonth = month;
      runStart = w;
    }
  }

  // --- Body: weekday labels + squares grid ---
  const body = wrapper.createDiv({ cls: "pvhabits-grid-body" });

  const weekdayCol = body.createDiv({ cls: "pvhabits-weekday-col" });
  for (const label of getWeekdayLabels()) {
    weekdayCol.createEl("span", {
      cls: "pvhabits-weekday-label",
      text: label,
    });
  }

  const grid = body.createDiv({ cls: "pvhabits-grid" });
  grid.style.gridTemplateRows = `repeat(7, var(--pvhabits-cell-size))`;

  for (const week of weeks) {
    for (let i = 0; i < 7; i++) {
      const dateStr = week[i];
      const cell = grid.createDiv({ cls: "pvhabits-cell" });

      if (!dateStr) {
        // Empty placeholder to keep the column aligned.
        cell.addClass("pvhabits-cell-empty");
        continue;
      }

      const isDone = dayMap[dateStr] === 1;
      const isToday = dateStr === todayStr;
      const isFuture = dateFromString(dateStr) > today;

      if (isFuture) {
        cell.addClass("pvhabits-cell-future");
        continue;
      }

      cell.addClass(isDone ? "pvhabits-cell-done" : "pvhabits-cell-none");
      cell.style.backgroundColor = isDone
        ? settings.doneColor
        : settings.emptyColor;
      if (isToday) {
        cell.addClass("pvhabits-cell-today");
      }

      const tooltip = t("grid.tooltip", {
        date: formatDisplayDate(dateStr),
        yes: isDone ? t("grid.tooltipDone") : t("grid.tooltipNotDone"),
      });
      cell.setAttribute("title", tooltip);
      cell.setAttribute("aria-label", tooltip);

      cell.addEventListener("click", async () => {
        await plugin.toggleDate(habit.id, dateStr);
      });
    }
  }

  const weekdayColEnd = body.createDiv({ cls: "pvhabits-weekday-col" });
  for (const label of getWeekdayLabels()) {
    weekdayColEnd.createEl("span", {
      cls: "pvhabits-weekday-label",
      text: label,
    });
  }
};
