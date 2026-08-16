import { ItemView, WorkspaceLeaf } from "obsidian";
import type PixVaultHabitsPlugin from "./main";
import type { HabitData } from "./habitManager";
import { renderHabitBlock } from "./ui/habitBlock";
import { t } from "./i18n";

export const VIEW_TYPE = "pix-vault-habits-view";

export class HabitTrackerView extends ItemView {
  plugin: PixVaultHabitsPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: PixVaultHabitsPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Pix Vault Habits";
  }

  getIcon(): string {
    return "activity";
  }

  async onOpen() {
    await this.render();
  }

  async onClose() {
    // Nothing to clean up.
  }

  async render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("pvhabits-container");

    // --- Header / toolbar ---
    const header = container.createDiv({ cls: "pvhabits-header" });
    header.createEl("h2", { text: t("view.title") });

    const toolbar = header.createDiv({ cls: "pvhabits-toolbar" });

    const addBtn = toolbar.createEl("button", {
      text: t("view.addButton"),
      cls: "pvhabits-btn",
    });
    addBtn.addEventListener("click", () => {
      this.plugin.openAddHabitModal();
    });

    const refreshBtn = toolbar.createEl("button", {
      text: t("view.refreshButton"),
      cls: "pvhabits-btn",
    });
    refreshBtn.addEventListener("click", async () => {
      await this.render();
    });

    // --- Habits list ---
    const listEl = container.createDiv({ cls: "pvhabits-list" });

    let data: HabitData;
    try {
      data = await this.plugin.habitManager.loadHabits();
    } catch (err) {
      listEl.createEl("p", {
        text: t("view.loadError"),
        cls: "pvhabits-placeholder",
      });
      console.error("[Pix Vault Habits] loadHabits error:", err);
      return;
    }

    if (data.habits.length === 0) {
      listEl.createEl("p", {
        text: t("view.empty"),
        cls: "pvhabits-placeholder",
      });
      return;
    }

    for (const habit of data.habits) {
      renderHabitBlock(habit, data, listEl, this.plugin, this.app);
    }
  }
}
