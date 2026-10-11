import { memo, type CSSProperties } from "react";
import type { Calendar } from "../calendar";
import { dayState, type DayState, type HabitRecord } from "../habitData";
import {
  formatDisplayDate,
  getMonthLabels,
  getWeekdayLabels,
  t,
} from "../i18n";

interface ContributionGridProps {
  calendar: Calendar;
  habit: HabitRecord;
  dayMap: Record<string, number>;
  today: string;
  onToggleDay: (date: string) => void;
}

export const ContributionGrid = ({
  calendar,
  habit,
  dayMap,
  today,
  onToggleDay,
}: ContributionGridProps) => {
  const monthLabels = getMonthLabels();

  return (
    <div className="pvhabits-grid-scroll">
      <div className="pvhabits-grid-wrapper">
        <div className="pvhabits-month-row">
          <div className="pvhabits-month-spacer" />
          <div className="pvhabits-month-labels">
            {calendar.months.map((span, index) => (
              <span
                key={index}
                className="pvhabits-month-label"
                style={
                  { "--pvhabits-month-weeks": span.weeks } as CSSProperties
                }
              >
                {monthLabels[span.month]}
              </span>
            ))}
          </div>
        </div>
        <div className="pvhabits-grid-body">
          <WeekdayLabels />
          <div className="pvhabits-grid">
            {calendar.weeks.flat().map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="pvhabits-cell pvhabits-cell-empty"
                  />
                );
              }
              const state = dayState(habit, dayMap, date);
              return (
                <DayCell
                  key={date}
                  date={date}
                  label={cellLabel(date, state)}
                  state={state}
                  today={date === today}
                  onToggle={onToggleDay}
                />
              );
            })}
          </div>
          <WeekdayLabels />
        </div>
      </div>
    </div>
  );
};

const WeekdayLabels = () => (
  <div className="pvhabits-weekday-col">
    {getWeekdayLabels().map((label, index) => (
      <span key={index} className="pvhabits-weekday-label">
        {label}
      </span>
    ))}
  </div>
);

const STATE_VIEWS: Record<DayState, { labelKey: string; className: string }> = {
  done: { labelKey: "grid.tooltipDone", className: "pvhabits-cell-done" },
  autoDone: {
    labelKey: "grid.tooltipAutoDone",
    className: "pvhabits-cell-auto",
  },
  missed: { labelKey: "grid.tooltipNotDone", className: "pvhabits-cell-none" },
};

const cellLabel = (date: string, state: DayState): string =>
  t("grid.tooltip", {
    date: formatDisplayDate(date),
    yes: t(STATE_VIEWS[state].labelKey),
  });

interface DayCellProps {
  date: string;
  label: string;
  state: DayState;
  today: boolean;
  onToggle: (date: string) => void;
}

const DayCell = memo(function DayCell({
  date,
  label,
  state,
  today,
  onToggle,
}: DayCellProps) {
  const className = `pvhabits-cell ${STATE_VIEWS[state].className}${
    today ? " pvhabits-cell-today" : ""
  }`;

  return (
    <div
      role="button"
      className={className}
      title={label}
      aria-label={label}
      aria-pressed={state !== "missed"}
      onClick={() => onToggle(date)}
    />
  );
});
