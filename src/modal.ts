import { App, Modal, Setting } from "obsidian";
import { t } from "./i18n";

export class AddHabitModal extends Modal {
  private habitName = "";
  private onSubmit: (name: string) => void;

  constructor(app: App, onSubmit: (name: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: t("modal.add.title") });

    new Setting(contentEl)
      .setName(t("modal.add.nameLabel"))
      .setDesc(t("modal.add.nameDesc"))
      .addText((text) => {
        text.setPlaceholder(t("modal.add.placeholder"));
        text.inputEl.style.width = "100%";
        text.onChange((value) => {
          this.habitName = value;
        });
        // Submit on Enter.
        text.inputEl.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") {
            evt.preventDefault();
            this.submit();
          }
        });
      });

    const buttonContainer = contentEl.createDiv({
      cls: "pvhabits-modal-buttons",
    });

    const cancelBtn = buttonContainer.createEl("button", {
      text: t("modal.cancel"),
    });
    cancelBtn.addEventListener("click", () => this.close());

    const createBtn = buttonContainer.createEl("button", {
      text: t("modal.create"),
      cls: "mod-cta",
    });
    createBtn.addEventListener("click", () => this.submit());
  }

  private submit() {
    const name = this.habitName.trim();
    if (!name) {
      return;
    }
    this.close();
    this.onSubmit(name);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
