import { NO_CATEGORY, type HabitRecord } from "./habitData";

export type CategoryTab =
  | { type: "all" }
  | { type: "uncategorized" }
  | { type: "category"; name: string };

export const ALL_TAB: CategoryTab = { type: "all" };
const UNCATEGORIZED_TAB: CategoryTab = { type: "uncategorized" };

// Categories created in this vault are kept in plugin settings so that empty
// ones survive; the CSV may still reference categories missing from that list
// (e.g. synced from another device), and those are shown too.
export const listCategories = (
  savedCategories: string[],
  habits: HabitRecord[],
): string[] => {
  const categories = new Set(savedCategories);
  for (const { category } of habits) {
    if (category !== NO_CATEGORY) categories.add(category);
  }
  return [...categories];
};

export const withCategory = (
  categories: string[],
  name: string,
): string[] | null =>
  categories.includes(name) ? null : [...categories, name];

export const withRenamedCategory = (
  categories: string[],
  from: string,
  to: string,
): string[] | null =>
  categories.includes(to)
    ? null
    : categories.map((category) => (category === from ? to : category));

export const withoutCategory = (categories: string[], name: string): string[] =>
  categories.filter((category) => category !== name);

export const buildTabs = (
  categories: string[],
  habits: HabitRecord[],
): CategoryTab[] => {
  if (categories.length === 0) return [ALL_TAB];

  const tabs: CategoryTab[] = [
    ALL_TAB,
    ...categories.map((name): CategoryTab => ({ type: "category", name })),
  ];
  if (habits.some((habit) => habit.category === NO_CATEGORY)) {
    tabs.push(UNCATEGORIZED_TAB);
  }
  return tabs;
};

export const tabKey = (tab: CategoryTab): string =>
  tab.type === "category" ? `category:${tab.name}` : tab.type;

export const categoryOf = (tab: CategoryTab): string =>
  tab.type === "category" ? tab.name : NO_CATEGORY;

export const habitsInTab = (
  habits: HabitRecord[],
  tab: CategoryTab,
): HabitRecord[] =>
  tab.type === "all"
    ? habits
    : habits.filter((habit) => habit.category === categoryOf(tab));
