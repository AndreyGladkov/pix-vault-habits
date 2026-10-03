import type { Calendar } from "../calendar";
import type { HabitRecord } from "../habitManager";
import { t } from "../i18n";
import { ContributionGrid } from "./ContributionGrid";
import { computeStreak, countDone } from "./stats";
import type { TrackerActions } from "./HabitTracker";

interface HabitCardProps {
  habit: HabitRecord;
  dayMap: Record<string, number>;
  calendar: Calendar;
  today: string;
  actions: TrackerActions;
}

export const HabitCard = ({
  habit,
  dayMap,
  calendar,
  today,
  actions,
}: HabitCardProps) => {
  const toggleDay = (date: string) => actions.toggleDay(habit.id, date);

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
        <div className="pvhabits-habit-actions">
          <button
            className="pvhabits-btn pvhabits-btn-today"
            onClick={() => toggleDay(today)}
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
