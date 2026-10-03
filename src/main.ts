import {
  App,
  ConfirmationModal,
  debounce,
  getLanguage,
  Notice,
  Plugin,
  PluginSettingTab,
  SettingDefinitionItem,
  WorkspaceLeaf,
} from "obsidian";
import { HabitManager } from "./habitManager";
import type { HabitRecord } from "./habitManager";
import { TrackerStore, type DisplaySettings } from "./store";
import type { TrackerActions } from "./ui/HabitTracker";
import {
  HabitPickerModal,
  openAddHabitModal,
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
}

const DEFAULT_SETTINGS: PixVaultHabitsSettings = {
  csvPath: "pixVaultHabits/habits.csv",
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "var(--background-modifier-border)",
  language: AUTO_LANGUAGE,
};

export default class PixVaultHabitsPlugin extends Plugin {
  settings!: PixVaultHabitsSettings;
  habitManager!: HabitManager;
  private store!: TrackerStore;

  private readonly actions: TrackerActions = {
    addHabit: () => this.openAddHabitModal(),
    refresh: () => void this.reloadHabits(),
    toggleDay: (habitId, date) => void this.toggleDate(habitId, date),
    renameHabit: (habit) => this.openRenameHabitModal(habit),
    deleteHabit: (habit) => this.deleteHabit(habit),
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
      callback: () => this.openAddHabitModal(),
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

  openAddHabitModal() {
    openAddHabitModal(this.app, async (name) => {
      try {
        await this.habitManager.addHabit(name);
        new Notice(t("notice.habitAdded", { name }));
        await this.reloadHabits();
      } catch (err) {
        console.error("[Pix Vault Habits] addHabit error:", err);
        new Notice(t("notice.addHabitFailed"));
      }
    });
  }

  async toggleDate(habitId: string, date: string): Promise<number | null> {
    try {
      const status = await this.habitManager.toggleHabitStatus(habitId, date);
      await this.reloadHabits();
      return status;
    } catch (err) {
      console.error("[Pix Vault Habits] toggleDate error:", err);
      new Notice(t("notice.toggleFailed"));
      return null;
    }
  }

  deleteHabit(habit: HabitRecord) {
    const modal = new ConfirmationModal(this.app);
    modal.setTitle(t("confirm.deleteHabit", { name: habit.name }));
    modal.addCancelButton(t("modal.cancel"));
    modal.addButton((btn) => {
      btn.setButtonText(t("confirm.delete"));
      btn.setDestructive().setCta();
      btn.onClick(() => {
        void this.performDelete(habit);
      });
    });
    modal.open();
  }

  private async performDelete({ id, name }: HabitRecord) {
    try {
      await this.habitManager.deleteHabit(id);
      new Notice(t("notice.habitDeleted", { name }));
      await this.reloadHabits();
    } catch (err) {
      console.error("[Pix Vault Habits] deleteHabit error:", err);
      new Notice(t("notice.deleteHabitFailed"));
    }
  }

  private openRenameHabitModal(habit: HabitRecord) {
    openRenameHabitModal(this.app, habit.name, async (name) => {
      try {
        await this.habitManager.renameHabit(habit.id, name);
        new Notice(t("notice.habitRenamed"));
        await this.reloadHabits();
      } catch (err) {
        console.error("[Pix Vault Habits] renameHabit error:", err);
        new Notice(t("notice.renameHabitFailed"));
      }
    });
  }

  private async markTodayViaPicker() {
    if (this.store.getSnapshot().habits.status !== "ready") {
      await this.reloadHabits();
    }
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
