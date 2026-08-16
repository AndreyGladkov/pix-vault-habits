import { App } from "obsidian";
import type PixVaultHabitsPlugin from "../main";
import type { HabitData, HabitRecord } from "../habitManager";
import { renderHabitGrid } from "./habitGrid";
import { RenameHabitModal } from "./renameHabitModal";
import { computeStreak, countDone } from "./stats";
import { t } from "../i18n";

export const renderHabitBlock = (
  habit: HabitRecord,
  data: HabitData,
  container: HTMLElement,
  plugin: PixVaultHabitsPlugin,
  app: App,
) => {
  const block = container.createDiv({ cls: "pvhabits-habit-block" });

  const titleRow = block.createDiv({ cls: "pvhabits-habit-title-row" });
  const title = titleRow.createEl("span", {
    cls: "pvhabits-habit-name",
    text: habit.name,
  });
  title.setAttribute("title", t("habit.idTooltip", { id: habit.id }));

  // Streak / stats.
  const dayMap = data.statuses[habit.id] || {};
  const streak = computeStreak(dayMap);
  const doneCount = countDone(dayMap);
  titleRow.createEl("span", {
    cls: "pvhabits-habit-stats",
    text: t("habit.stats", { streak, done: doneCount }),
  });

  // Per-habit actions.
  const actions = titleRow.createDiv({ cls: "pvhabits-habit-actions" });
  const todayBtn = actions.createEl("button", {
    text: t("habit.today"),
    cls: "pvhabits-btn pvhabits-btn-today",
  });
  todayBtn.addEventListener("click", async () => {
    await plugin.toggleToday(habit.id);
  });

  const renameBtn = actions.createEl("button", {
    text: "✎",
    cls: "pvhabits-btn pvhabits-btn-icon",
    attr: { "aria-label": t("habit.renameAria") },
  });
  renameBtn.addEventListener("click", () => {
    openRenameModal(app, plugin, habit.id, habit.name);
  });

  const deleteBtn = actions.createEl("button", {
    text: "🗑",
    cls: "pvhabits-btn pvhabits-btn-icon",
    attr: { "aria-label": t("habit.deleteAria") },
  });
  deleteBtn.addEventListener("click", async () => {
    await plugin.deleteHabit(habit.id);
  });

  // Grid wrapper (scrollable horizontally). $0.scrollTo({left: $0.scrollWidth, behavior: 'smooth'});
  const gridScroll = block.createDiv({ cls: "pvhabits-grid-scroll" });
  renderHabitGrid(habit, dayMap, gridScroll, plugin);

  if (gridScroll.offsetWidth + gridScroll.scrollLeft < gridScroll.scrollWidth) {
    gridScroll.scrollTo({
      left: gridScroll.offsetWidth - gridScroll.scrollLeft,
      behavior: "smooth",
    });
  }
};

const openRenameModal = (
  app: App,
  plugin: PixVaultHabitsPlugin,
  habitId: string,
  currentName: string,
) => {
  new RenameHabitModal(app, currentName, async (newName) => {
    await plugin.renameHabit(habitId, newName);
  }).open();
};
