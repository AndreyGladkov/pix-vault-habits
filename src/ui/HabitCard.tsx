import { useCallback } from "react";
import type { Calendar } from "../calendar";
import { formatDate } from "../csv";
import { NO_CATEGORY, type HabitRecord } from "../habitData";
import { t } from "../i18n";
import { ContributionGrid } from "./ContributionGrid";
import { HorizontalScroller } from "./HorizontalScroller";
import { computeStreak, countDone } from "./stats";
import type { TrackerActions } from "./HabitTracker";

interface HabitCardProps {
  habit: HabitRecord;
  dayMap: Record<string, number>;
  categories: string[];
  calendar: Calendar;
  today: string;
  actions: TrackerActions;
}

export const HabitCard = ({
  habit,
  dayMap,
  categories,
  calendar,
  today,
  actions,
}: HabitCardProps) => {
  const toggleDay = useCallback(
    (date: string) => actions.toggleDay(habit.id, date),
    [actions, habit.id],
  );

  return (
    <div className="pvhabits-habit-block">
      <div className="pvhabits-habit-title-row">
        <span
          className="pvhabits-habit-name"
          title={t("habit.idTooltip", { id: habit.id })}
        >
          {habit.name}
        </span>
        <span className="pvhabits-habit-stats">
          {t("habit.stats", {
            streak: computeStreak(dayMap, today),
            done: countDone(dayMap),
          })}
        </span>
        <HorizontalScroller className="pvhabits-habit-actions-scroller">
          <div className="pvhabits-habit-actions">
            {categories.length > 0 && (
              <select
                className="dropdown pvhabits-category-select"
                aria-label={t("habit.categoryAria")}
                value={habit.category}
                onChange={(event) =>
                  actions.moveHabit(habit, event.target.value)
                }
              >
                <option value={NO_CATEGORY}>{t("tabs.uncategorized")}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
            <button
              className="pvhabits-btn pvhabits-btn-today"
              onClick={() => toggleDay(formatDate())}
            >
              {t("habit.today")}
            </button>
            <button
              className="pvhabits-btn pvhabits-btn-icon"
              aria-label={t("habit.renameAria")}
              onClick={() => actions.renameHabit(habit)}
            >
              ✎
            </button>
            <button
              className="pvhabits-btn pvhabits-btn-icon"
              aria-label={t("habit.deleteAria")}
              onClick={() => actions.deleteHabit(habit)}
            >
              🗑
            </button>
          </div>
        </HorizontalScroller>
      </div>
      <ContributionGrid
        calendar={calendar}
        dayMap={dayMap}
        today={today}
        onToggleDay={toggleDay}
      />
    </div>
  );
};
