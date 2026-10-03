import { describe, expect, it } from "vitest";
import {
  ALL_TAB,
  buildTabs,
  categoryOf,
  habitsInTab,
  listCategories,
  tabKey,
  withCategory,
  withoutCategory,
  withRenamedCategory,
} from "./categories";
import type { HabitRecord } from "./habitData";

const habit = (id: string, category: string): HabitRecord => ({
  id,
  name: id,
  created: "2026-10-01",
  category,
});

const habits = [
  habit("run", "Спорт"),
  habit("read", ""),
  habit("sleep", "Здоровье"),
];

describe("listCategories", () => {
  it("keeps saved order, empty saved categories and appends unknown ones from habits", () => {
    expect(listCategories(["Здоровье", "Работа"], habits)).toEqual([
      "Здоровье",
      "Работа",
      "Спорт",
    ]);
  });
});

describe("category list operations", () => {
  it("adds a category at the end unless it already exists", () => {
    expect(withCategory(["Спорт"], "Работа")).toEqual(["Спорт", "Работа"]);
    expect(withCategory(["Спорт"], "Спорт")).toBeNull();
  });

  it("renames in place unless the new name is taken", () => {
    expect(withRenamedCategory(["Спорт", "Работа"], "Спорт", "Бег")).toEqual([
      "Бег",
      "Работа",
    ]);
    expect(
      withRenamedCategory(["Спорт", "Работа"], "Спорт", "Работа"),
    ).toBeNull();
  });

  it("removes a category", () => {
    expect(withoutCategory(["Спорт", "Работа"], "Спорт")).toEqual(["Работа"]);
  });
});

describe("buildTabs", () => {
  it("shows only the all tab when there are no categories", () => {
    expect(buildTabs([], [habit("read", "")])).toEqual([ALL_TAB]);
  });

  it("adds an uncategorized tab only when some habit has no category", () => {
    expect(buildTabs(["Спорт"], habits).map(tabKey)).toEqual([
      "all",
      "category:Спорт",
      "uncategorized",
    ]);
    expect(buildTabs(["Спорт"], [habit("run", "Спорт")]).map(tabKey)).toEqual([
      "all",
      "category:Спорт",
    ]);
  });
});

describe("habitsInTab", () => {
  it("filters by category, with the all tab showing everything", () => {
    expect(habitsInTab(habits, ALL_TAB)).toBe(habits);
    expect(
      habitsInTab(habits, { type: "category", name: "Спорт" }).map((h) => h.id),
    ).toEqual(["run"]);
    expect(
      habitsInTab(habits, { type: "uncategorized" }).map((h) => h.id),
    ).toEqual(["read"]);
  });
});

describe("categoryOf", () => {
  it("gives the category new habits in a tab belong to", () => {
    expect(categoryOf({ type: "category", name: "Спорт" })).toBe("Спорт");
    expect(categoryOf({ type: "uncategorized" })).toBe("");
    expect(categoryOf(ALL_TAB)).toBe("");
  });
});
