import {
  App,
  debounce,
  getLanguage,
  Notice,
  Plugin,
  PluginSettingTab,
  SettingDefinitionItem,
  WorkspaceLeaf,
} from "obsidian";
import { HabitManager } from "./habitManager";
import { NO_CATEGORY, type HabitData, type HabitRecord } from "./habitData";
import {
  withCategory,
  withoutCategory,
  withRenamedCategory,
} from "./categories";
import { selectCategories, TrackerStore, type DisplaySettings } from "./store";
import type { TrackerActions } from "./ui/HabitTracker";
import {
  HabitPickerModal,
  openAddCategoryModal,
  openAddHabitModal,
  openConfirmDeleteModal,
  openRenameCategoryModal,
  openRenameHabitModal,
} from "./ui/modals";
import { HabitTrackerView, VIEW_TYPE } from "./view";
import { formatDate } from "./csv";
import {
  AUTO_LANGUAGE,
  LANGUAGE_OPTIONS,
  resolveLocale,
  setLocale,
  t,
} from "./i18n";

interface PixVaultHabitsSettings {
  language: string;
  csvPath: string;
  numDays: number;
  doneColor: string;
  emptyColor: string;
  categories: string[];
}

const DEFAULT_SETTINGS: PixVaultHabitsSettings = {
  csvPath: "pixVaultHabits/habits.csv",
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "var(--background-modifier-border)",
  language: AUTO_LANGUAGE,
  categories: [],
};

export default class PixVaultHabitsPlugin extends Plugin {
  settings!: PixVaultHabitsSettings;
  habitManager!: HabitManager;
  private store!: TrackerStore;

  private readonly actions: TrackerActions = {
    addHabit: (category) => void this.addHabit(category),
    refresh: () => void this.reloadHabits(),
    toggleDay: (habitId, date) => void this.toggleDate(habitId, date),
    renameHabit: (habit) => void this.renameHabit(habit),
    deleteHabit: (habit) => this.deleteHabit(habit),
    moveHabit: (habit, category) => void this.moveHabit(habit, category),
    addCategory: () => this.addCategory(),
    renameCategory: (name) => this.renameCategory(name),
    deleteCategory: (name) => this.deleteCategory(name),
  };

  private readonly reloadFromNewPath = debounce(
    () => {
      this.habitManager = new HabitManager(this.app, this.settings.csvPath);
      void this.reloadHabits();
    },
    1000,
    true,
  );

  async onload() {
    await this.loadSettings();
    this.applyLocale();

    this.habitManager = new HabitManager(this.app, this.settings.csvPath);
    this.store = new TrackerStore(
      () => this.habitManager.loadHabits(),
      this.displaySettings(),
      this.settings.categories,
    );

    this.app.workspace.onLayoutReady(() => {
      this.habitManager.ensureFile().catch((err) => {
        console.error("[Pix Vault Habits] ensureFile error:", err);
      });
    });

    this.registerView(
      VIEW_TYPE,
      (leaf) => new HabitTrackerView(leaf, this.store, this.actions),
    );

    this.addRibbonIcon("activity", "Pix vault habits", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "add",
      name: t("command.addHabit"),
      callback: () => void this.addHabit(NO_CATEGORY),
    });

    this.addCommand({
      id: "open",
      name: t("command.openTracker"),
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "mark-today",
      name: t("command.markToday"),
      callback: () => this.markTodayViaPicker(),
    });

    this.addSettingTab(new PixVaultHabitsSettingTab(this.app, this));
  }

  onunload() {
    this.reloadFromNewPath.cancel();
  }

  async loadSettings() {
    const settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<PixVaultHabitsSettings>,
    );
    this.settings = { ...settings, numDays: Number(settings.numDays) };
  }

  onSettingChanged(key: string) {
    if (key === "language") this.applyLocale();
    this.store.setSettings(this.displaySettings());
    if (key === "csvPath") this.reloadFromNewPath();
  }

  private displaySettings(): DisplaySettings {
    const { numDays, doneColor, emptyColor } = this.settings;
    return { numDays, doneColor, emptyColor };
  }

  /**
   * Resolve the configured language (which may be "auto") against the
   * Obsidian interface language and activate the matching locale.
   */
  applyLocale() {
    const locale = resolveLocale(this.settings.language, getLanguage());
    setLocale(locale);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0 && leaves[0]) {
      leaf = leaves[0];
      void this.reloadHabits();
    } else {
      const newLeaf = workspace.getRightLeaf(false);
      if (!newLeaf) {
        new Notice(t("notice.openViewFailed"));
        return;
      }
      leaf = newLeaf;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }

    await workspace.revealLeaf(leaf);
  }

  async reloadHabits() {
    await this.store.reload();
  }

  private async attempt<T>(
    label: string,
    failureNotice: string,
    operation: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (err) {
      console.error(`[Pix Vault Habits] ${label} error:`, err);
      new Notice(t(failureNotice));
      return null;
    }
  }

  private async addHabit(category: string) {
    const name = await openAddHabitModal(this.app);
    if (!name) return;
    const data = await this.attempt("addHabit", "notice.addHabitFailed", () =>
      this.habitManager.addHabit(name, category),
    );
    if (!data) return;
    this.store.applyChanges({ data });
    new Notice(t("notice.habitAdded", { name }));
  }

  async toggleDate(habitId: string, date: string): Promise<number | null> {
    const data = await this.attempt("toggleDate", "notice.toggleFailed", () =>
      this.habitManager.toggleHabitStatus(habitId, date),
    );
    if (!data) return null;
    this.store.applyChanges({ data });
    return data.statuses[habitId]?.[date] ?? 0;
  }

  deleteHabit({ id, name }: HabitRecord) {
    openConfirmDeleteModal(
      this.app,
      t("confirm.deleteHabit", { name }),
      async () => {
        const data = await this.attempt(
          "deleteHabit",
          "notice.deleteHabitFailed",
          () => this.habitManager.deleteHabit(id),
        );
        if (!data) return;
        this.store.applyChanges({ data });
        new Notice(t("notice.habitDeleted", { name }));
      },
    );
  }

  private async renameHabit(habit: HabitRecord) {
    const name = await openRenameHabitModal(this.app, habit.name);
    if (!name) return;
    const data = await this.attempt(
      "renameHabit",
      "notice.renameHabitFailed",
      () => this.habitManager.renameHabit(habit.id, name),
    );
    if (!data) return;
    this.store.applyChanges({ data });
    new Notice(t("notice.habitRenamed"));
  }

  private async moveHabit(habit: HabitRecord, category: string) {
    const data = await this.attempt("moveHabit", "notice.moveHabitFailed", () =>
      this.habitManager.setHabitCategory(habit.id, category),
    );
    if (data) this.store.applyChanges({ data });
  }

  private async addCategory(): Promise<string | null> {
    const name = await openAddCategoryModal(this.app);
    if (!name) return null;
    const categories = withCategory(
      selectCategories(this.store.getSnapshot()),
      name,
    );
    if (!categories) {
      new Notice(t("notice.categoryExists", { name }));
      return null;
    }
    await this.saveCategories(categories);
    return name;
  }

  private async renameCategory(from: string): Promise<string | null> {
    const to = await openRenameCategoryModal(this.app, from);
    if (!to || to === from) return null;
    const categories = withRenamedCategory(
      selectCategories(this.store.getSnapshot()),
      from,
      to,
    );
    if (!categories) {
      new Notice(t("notice.categoryExists", { name: to }));
      return null;
    }
    const data = await this.attempt(
      "renameCategory",
      "notice.renameCategoryFailed",
      () => this.habitManager.replaceCategory(from, to),
    );
    if (!data) return null;
    await this.saveCategories(categories, data);
    return to;
  }

  private deleteCategory(name: string) {
    openConfirmDeleteModal(
      this.app,
      t("confirm.deleteCategory", { name }),
      async () => {
        const data = await this.attempt(
          "deleteCategory",
          "notice.deleteCategoryFailed",
          () => this.habitManager.replaceCategory(name, NO_CATEGORY),
        );
        if (!data) return;
        await this.saveCategories(
          withoutCategory(selectCategories(this.store.getSnapshot()), name),
          data,
        );
      },
    );
  }

  // `data` is the CSV as of this change; applying it after the saveData await
  // would let it overwrite habit changes that landed during that await.
  private async saveCategories(categories: string[], data?: HabitData) {
    this.store.applyChanges({ categories, data });
    this.settings = { ...this.settings, categories };
    await this.attempt(
      "saveCategories",
      "notice.saveCategoriesFailed",
      () => this.saveData(this.settings),
    );
  }

  private async markTodayViaPicker() {
    await this.reloadHabits();
    const { habits } = this.store.getSnapshot();
    if (habits.status !== "ready") {
      new Notice(t("picker.loadError"));
      return;
    }

    new HabitPickerModal(this.app, habits.data.habits, async (habit) => {
      const status = await this.toggleDate(habit.id, formatDate());
      if (status !== null) {
        new Notice(status ? t("notice.markedDone") : t("notice.markUndone"));
      }
    }).open();
  }
}

export class PixVaultHabitsSettingTab extends PluginSettingTab {
  plugin: PixVaultHabitsPlugin;

  constructor(app: App, plugin: PixVaultHabitsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // The dropdown control works with its option keys, which are strings,
  // while the plugin keeps numDays as a number.
  getControlValue(key: string): unknown {
    const value = super.getControlValue(key);
    return key === "numDays" ? String(value) : value;
  }

  async setControlValue(key: string, value: unknown) {
    await super.setControlValue(key, key === "numDays" ? Number(value) : value);
    this.plugin.onSettingChanged(key);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: t("settings.language.name"),
        desc: t("settings.language.desc"),
        control: {
          type: "dropdown",
          key: "language",
          options: LANGUAGE_OPTIONS.reduce(
            (acc, opt) => {
              acc[opt.value] = opt.label;
              return acc;
            },
            {} as Record<string, string>,
          ),
        },
      },
      {
        name: t("settings.csvPath.name"),
        desc: t("settings.csvPath.desc"),
        control: {
          type: "text",
          key: "csvPath",
          placeholder: "pixVaultHabits/habits.csv",
        },
      },
      {
        name: t("settings.numDays.name"),
        desc: t("settings.numDays.desc"),
        control: {
          type: "dropdown",
          key: "numDays",
          options: {
            30: t("settings.numDays.30"),
            90: t("settings.numDays.90"),
            365: t("settings.numDays.365"),
          },
        },
      },
      {
        name: t("settings.doneColor.name"),
        desc: t("settings.doneColor.desc"),
        control: {
          type: "text",
          key: "doneColor",
          placeholder: "#ff0000",
        },
      },
      {
        name: t("settings.emptyColor.name"),
        desc: t("settings.emptyColor.desc"),
        control: {
          type: "text",
          key: "emptyColor",
          placeholder: "var(--background-modifier-border)",
        },
      },
    ];
  }
}
