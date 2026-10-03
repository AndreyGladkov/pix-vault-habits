import {
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { buildCalendar } from "../calendar";
import {
  ALL_TAB,
  buildTabs,
  categoryOf,
  habitsInTab,
  tabKey,
  type CategoryTab,
} from "../categories";
import type { HabitRecord, HabitStatusMap } from "../habitData";
import { t } from "../i18n";
import {
  selectCategories,
  type DisplaySettings,
  type TrackerStore,
} from "../store";
import { CategoryTabs } from "./CategoryTabs";
import { HabitCard } from "./HabitCard";
import { RefreshIcon } from "./RefreshIcon";
import { useToday } from "./useToday";

export interface TrackerActions {
  addHabit: (category: string) => void;
  refresh: () => void;
  toggleDay: (habitId: string, date: string) => void;
  renameHabit: (habit: HabitRecord) => void;
  deleteHabit: (habit: HabitRecord) => void;
  moveHabit: (habit: HabitRecord, category: string) => void;
  addCategory: () => Promise<string | null>;
  renameCategory: (name: string) => Promise<string | null>;
  deleteCategory: (name: string) => void;
}

interface HabitTrackerProps {
  store: TrackerStore;
  actions: TrackerActions;
}

export const HabitTracker = ({ store, actions }: HabitTrackerProps) => {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { settings, habits } = snapshot;
  const [selectedTab, setSelectedTab] = useState<CategoryTab>(ALL_TAB);

  const data = habits.status === "ready" ? habits.data : null;
  const allHabits = data?.habits ?? [];
  const categories = selectCategories(snapshot);
  const tabs = buildTabs(categories, allHabits);
  const selectionShown = tabs.some(
    (tab) => tabKey(tab) === tabKey(selectedTab),
  );
  if (data && !selectionShown) setSelectedTab(ALL_TAB);
  const activeTab = selectionShown ? selectedTab : ALL_TAB;

  const selectCategory = (name: string | null) => {
    if (name !== null) setSelectedTab({ type: "category", name });
  };

  return (
    <div className="pvhabits-container" style={cellColors(settings)}>
      <div className="pvhabits-header">
        <h2>{t("view.title")}</h2>
        <div className="pvhabits-toolbar">
          <button
            className="pvhabits-btn"
            onClick={() => actions.addHabit(categoryOf(activeTab))}
          >
            {t("view.addButton")}
          </button>
          <button
            className="clickable-icon pvhabits-refresh"
            aria-label={t("view.refreshButton")}
            onClick={actions.refresh}
          >
            <RefreshIcon />
          </button>
        </div>
      </div>
      {data && (
        <CategoryTabs
          tabs={tabs}
          activeTab={activeTab}
          onSelect={setSelectedTab}
          onAddCategory={() => void actions.addCategory().then(selectCategory)}
          onRenameCategory={(name) =>
            void actions.renameCategory(name).then(selectCategory)
          }
          onDeleteCategory={actions.deleteCategory}
        />
      )}
      <div className="pvhabits-list">
        {habits.status === "error" && (
          <Placeholder text={t("view.loadError")} />
        )}
        {data && (
          <HabitList
            habits={habitsInTab(allHabits, activeTab)}
            statuses={data.statuses}
            emptyText={
              allHabits.length === 0 ? t("view.empty") : t("tabs.empty")
            }
            categories={categories}
            settings={settings}
            actions={actions}
          />
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
  habits: HabitRecord[];
  statuses: HabitStatusMap;
  emptyText: string;
  categories: string[];
  settings: DisplaySettings;
  actions: TrackerActions;
}

const HabitList = ({
  habits,
  statuses,
  emptyText,
  categories,
  settings,
  actions,
}: HabitListProps) => {
  const today = useToday();
  const { numDays } = settings;
  const calendar = useMemo(
    () => buildCalendar(today, numDays),
    [today, numDays],
  );

  if (habits.length === 0) {
    return <Placeholder text={emptyText} />;
  }

  return habits.map((habit) => (
    <HabitCard
      key={habit.id}
      habit={habit}
      dayMap={statuses[habit.id] ?? EMPTY_DAY_MAP}
      categories={categories}
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
