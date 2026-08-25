import {
  App,
  ConfirmationModal,
  getLanguage,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  SettingDefinitionItem,
  WorkspaceLeaf,
} from "obsidian";
import { HabitManager } from "./habitManager";
import type { HabitData } from "./habitManager";
import { AddHabitModal } from "./modal";
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

  async onload() {
    await this.loadSettings();
    this.applyLocale();

    this.habitManager = new HabitManager(this.app, this.settings.csvPath);

    this.app.workspace.onLayoutReady(() => {
      this.habitManager.ensureFile().catch((err) => {
        console.error("[Pix Vault Habits] ensureFile error:", err);
      });
    });

    // Register the custom view.
    this.registerView(VIEW_TYPE, (leaf) => new HabitTrackerView(leaf, this));

    // Ribbon icon to open the tracker.
    this.addRibbonIcon("activity", "Pix vault habits", () => {
      void this.activateView();
    });

    // Commands.
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
      callback: () => this.openHabitPicker("today"),
    });

    // Settings tab.
    this.addSettingTab(new PixVaultHabitsSettingTab(this.app, this));
  }

  onunload() {
    // Views are cleaned up automatically by Obsidian.
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<PixVaultHabitsSettings>,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update the manager path in case it changed.
    this.habitManager = new HabitManager(this.app, this.settings.csvPath);
    await this.refreshView();
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

    void workspace.revealLeaf(leaf);
    await this.refreshView();
  }

  async refreshView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof HabitTrackerView) {
        await view.render();
      }
    }
  }

  openAddHabitModal() {
    new AddHabitModal(this.app, async (name) => {
      try {
        await this.habitManager.addHabit(name);
        new Notice(t("notice.habitAdded", { name }));
        await this.refreshView();
      } catch (err) {
        console.error("[Pix Vault Habits] addHabit error:", err);
        new Notice(t("notice.addHabitFailed"));
      }
    }).open();
  }

  async toggleToday(habitId: string) {
    await this.toggleDate(habitId, formatDate());
  }

  async toggleDate(habitId: string, date: string): Promise<void> {
    try {
      await this.habitManager.toggleHabitStatus(habitId, date);
      await this.refreshView();
    } catch (err) {
      console.error("[Pix Vault Habits] toggleDate error:", err);
      new Notice(t("notice.toggleFailed"));
    }
  }

  async deleteHabit(habitId: string) {
    const data = await this.habitManager.loadHabits();
    const habit = data.habits.find((h) => h.id === habitId);
    const name = habit?.name ?? habitId;

    const modal = new ConfirmationModal(this.app);
    modal.setTitle(t("confirm.deleteHabit", { name }));
    modal.addCancelButton(t("modal.cancel"));
    modal.addButton((btn) => {
      btn.setButtonText(t("confirm.delete"));
      btn.setDestructive().setCta();
      btn.onClick(() => {
        void this.performDelete(habitId, name);
      });
    });
    modal.open();
  }

  private async performDelete(habitId: string, name: string) {
    try {
      await this.habitManager.deleteHabit(habitId);
      new Notice(t("notice.habitDeleted", { name }));
      await this.refreshView();
    } catch (err) {
      console.error("[Pix Vault Habits] deleteHabit error:", err);
      new Notice(t("notice.deleteHabitFailed"));
    }
  }

  /**
   * Rename a habit.
   */
  async renameHabit(habitId: string, newName: string) {
    try {
      await this.habitManager.renameHabit(habitId, newName);
      new Notice(t("notice.habitRenamed"));
      await this.refreshView();
    } catch (err) {
      console.error("[Pix Vault Habits] renameHabit error:", err);
      new Notice(t("notice.renameHabitFailed"));
    }
  }

  /**
   * Open a quick-pick modal to choose a habit, then act on it.
   *
   * @param mode "today" toggles today's status for the chosen habit.
   */
  private openHabitPicker(mode: "today") {
    new HabitPickerModal(this.app, this.habitManager, async (habitId) => {
      if (mode === "today") {
        const status = await this.habitManager.toggleHabitStatus(
          habitId,
          formatDate(),
        );
        new Notice(status ? t("notice.markedDone") : t("notice.markUndone"));
        await this.refreshView();
      }
    }).open();
  }
}

/**
 * Modal that lets the user pick one of the existing habits.
 */
class HabitPickerModal extends Modal {
  private manager: HabitManager;
  private onPick: (habitId: string) => void | Promise<void>;

  constructor(
    app: App,
    manager: HabitManager,
    onPick: (habitId: string) => void | Promise<void>,
  ) {
    super(app);
    this.manager = manager;
    this.onPick = onPick;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: t("picker.title") });

    let data: HabitData;
    try {
      data = await this.manager.loadHabits();
    } catch (err) {
      contentEl.createEl("p", { text: t("picker.loadError") });
      console.error(err);
      return;
    }

    if (data.habits.length === 0) {
      contentEl.createEl("p", { text: t("picker.empty") });
      return;
    }

    const list = contentEl.createDiv({ cls: "pvhabits-picker-list" });
    for (const habit of data.habits) {
      const item = list.createDiv({ cls: "pvhabits-picker-item" });
      item.createSpan({ text: habit.name });
      item.addEventListener("click", () => {
        this.close();
        void this.onPick(habit.id);
      });
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class PixVaultHabitsSettingTab extends PluginSettingTab {
  plugin: PixVaultHabitsPlugin;

  constructor(app: App, plugin: PixVaultHabitsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
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
