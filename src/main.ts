import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
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
  csvPath: string;
  numDays: number;
  doneColor: string;
  emptyColor: string;
  language: string;
}

const DEFAULT_SETTINGS: PixVaultHabitsSettings = {
  csvPath: "pixVaultHabits/habits.csv",
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "var(--background-modifier-border)",
  language: AUTO_LANGUAGE,
};

export default class PixVaultHabitsPlugin extends Plugin {
  settings: PixVaultHabitsSettings;
  habitManager: HabitManager;

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
    this.addRibbonIcon("activity", "Pix Vault Habits", () => {
      this.activateView();
    });

    // Commands.
    this.addCommand({
      id: "pix-vault-habits-add",
      name: t("command.addHabit"),
      callback: () => this.openAddHabitModal(),
    });

    this.addCommand({
      id: "pix-vault-habits-open",
      name: t("command.openTracker"),
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "pix-vault-habits-mark-today",
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
    const obsidianLang =
      (this.app as any).locale ||
      (this.app as any).vault?.getConfig?.("language");
    const locale = resolveLocale(this.settings.language, obsidianLang);
    setLocale(locale);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
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

    workspace.revealLeaf(leaf);
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

  /**
   * Toggle the status of a habit for today.
   */
  async toggleToday(habitId: string) {
    await this.toggleDate(habitId, formatDate());
  }

  /**
   * Toggle the status of a habit for a specific date and refresh the view.
   */
  async toggleDate(habitId: string, date: string) {
    try {
      const newStatus = await this.habitManager.toggleHabitStatus(
        habitId,
        date,
      );
      await this.refreshView();
      return newStatus;
    } catch (err) {
      console.error("[Pix Vault Habits] toggleDate error:", err);
      new Notice(t("notice.toggleFailed"));
    }
  }

  /**
   * Delete a habit after confirmation.
   */
  async deleteHabit(habitId: string) {
    const data = await this.habitManager.loadHabits();
    const habit = data.habits.find((h) => h.id === habitId);
    const name = habit?.name ?? habitId;
    const confirmed = confirm(t("confirm.deleteHabit", { name }));
    if (!confirmed) return;
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
  private onPick: (habitId: string) => void;

  constructor(
    app: App,
    manager: HabitManager,
    onPick: (habitId: string) => void,
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
      item.createEl("span", { text: habit.name });
      item.addEventListener("click", () => {
        this.close();
        this.onPick(habit.id);
      });
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

/**
 * Settings tab for the plugin.
 */
class PixVaultHabitsSettingTab extends PluginSettingTab {
  plugin: PixVaultHabitsPlugin;

  constructor(app: App, plugin: PixVaultHabitsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t("settings.language.name"))
      .setDesc(t("settings.language.desc"))
      .addDropdown((dropdown) => {
        for (const opt of LANGUAGE_OPTIONS) {
          dropdown.addOption(opt.value, opt.label);
        }
        dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            this.plugin.applyLocale();
            await this.plugin.saveSettings();
            // Re-render the settings tab so labels update immediately.
            this.display();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.csvPath.name"))
      .setDesc(t("settings.csvPath.desc"))
      .addText((text) =>
        text
          .setPlaceholder("pixVaultHabits/habits.csv")
          .setValue(this.plugin.settings.csvPath)
          .onChange(async (value) => {
            this.plugin.settings.csvPath = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.numDays.name"))
      .setDesc(t("settings.numDays.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("30", t("settings.numDays.30"))
          .addOption("90", t("settings.numDays.90"))
          .addOption("365", t("settings.numDays.365"))
          .setValue(String(this.plugin.settings.numDays))
          .onChange(async (value) => {
            this.plugin.settings.numDays = Number(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.doneColor.name"))
      .setDesc(t("settings.doneColor.desc"))
      .addColorPicker((color) =>
        color
          .setValue(rgbFromColor(this.plugin.settings.doneColor))
          .onChange(async (value) => {
            this.plugin.settings.doneColor = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.emptyColor.name"))
      .setDesc(t("settings.emptyColor.desc"))
      .addText((text) =>
        text
          .setPlaceholder("var(--background-modifier-border)")
          .setValue(this.plugin.settings.emptyColor)
          .onChange(async (value) => {
            this.plugin.settings.emptyColor = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}

const rgbFromColor = (color: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  // CSS variable / named color — the picker cannot display these, fall back.
  return "#40c463";
};
