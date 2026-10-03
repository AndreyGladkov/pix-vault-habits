import type { CSSProperties } from "react";
import type { Calendar } from "../calendar";
import {
  formatDisplayDate,
  getMonthLabels,
  getWeekdayLabels,
  t,
} from "../i18n";

interface ContributionGridProps {
  calendar: Calendar;
  dayMap: Record<string, number>;
  today: string;
  onToggleDay: (date: string) => void;
}

export const ContributionGrid = ({
  calendar,
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
            {calendar.weeks
              .flat()
              .map((date, index) =>
                date ? (
                  <DayCell
                    key={date}
                    date={date}
                    done={dayMap[date] === 1}
                    today={date === today}
                    onToggle={onToggleDay}
                  />
                ) : (
                  <div
                    key={`empty-${index}`}
                    className="pvhabits-cell pvhabits-cell-empty"
                  />
                ),
              )}
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

interface DayCellProps {
  date: string;
  done: boolean;
  today: boolean;
  onToggle: (date: string) => void;
}

const DayCell = ({ date, done, today, onToggle }: DayCellProps) => {
  const tooltip = t("grid.tooltip", {
    date: formatDisplayDate(date),
    yes: done ? t("grid.tooltipDone") : t("grid.tooltipNotDone"),
  });
  const className = `pvhabits-cell ${done ? "pvhabits-cell-done" : "pvhabits-cell-none"}${
    today ? " pvhabits-cell-today" : ""
  }`;

  return (
    <div
      role="button"
      className={className}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={done}
      onClick={() => onToggle(date)}
    />
  );
};
