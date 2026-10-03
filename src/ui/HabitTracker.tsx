import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { buildCalendar } from "../calendar";
import { formatDate } from "../csv";
import type { HabitData, HabitRecord } from "../habitManager";
import { t } from "../i18n";
import type { DisplaySettings, TrackerStore } from "../store";
import { HabitCard } from "./HabitCard";

export interface TrackerActions {
  addHabit: () => void;
  refresh: () => void;
  toggleDay: (habitId: string, date: string) => void;
  renameHabit: (habit: HabitRecord) => void;
  deleteHabit: (habit: HabitRecord) => void;
}

interface HabitTrackerProps {
  store: TrackerStore;
  actions: TrackerActions;
}

export const HabitTracker = ({ store, actions }: HabitTrackerProps) => {
  const { settings, habits } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  return (
    <div className="pvhabits-container" style={cellColors(settings)}>
      <div className="pvhabits-header">
        <h2>{t("view.title")}</h2>
        <div className="pvhabits-toolbar">
          <button className="pvhabits-btn" onClick={actions.addHabit}>
            {t("view.addButton")}
          </button>
          <button className="pvhabits-btn" onClick={actions.refresh}>
            {t("view.refreshButton")}
          </button>
        </div>
      </div>
      <div className="pvhabits-list">
        {habits.status === "error" && (
          <Placeholder text={t("view.loadError")} />
        )}
        {habits.status === "ready" && (
          <HabitList data={habits.data} settings={settings} actions={actions} />
        )}
      </div>
    </div>
  );
};

const cellColors = (settings: DisplaySettings) =>
  ({
    "--pvhabits-done-color": settings.doneColor,
    "--pvhabits-empty-color": settings.emptyColor,
  }) as CSSProperties;

interface HabitListProps {
  data: HabitData;
  settings: DisplaySettings;
  actions: TrackerActions;
}

const HabitList = ({ data, settings, actions }: HabitListProps) => {
  const today = formatDate();
  const { numDays } = settings;
  const calendar = useMemo(
    () => buildCalendar(today, numDays),
    [today, numDays],
  );

  if (data.habits.length === 0) {
    return <Placeholder text={t("view.empty")} />;
  }

  return data.habits.map((habit) => (
    <HabitCard
      key={habit.id}
      habit={habit}
      dayMap={data.statuses[habit.id] ?? EMPTY_DAY_MAP}
      calendar={calendar}
      today={today}
      actions={actions}
    />
  ));
};

const EMPTY_DAY_MAP: Record<string, number> = {};

const Placeholder = ({ text }: { text: string }) => (
  <p className="pvhabits-placeholder">{text}</p>
);
