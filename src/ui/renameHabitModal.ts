import { App, Modal, Setting } from "obsidian";
import { t } from "../i18n";

export class RenameHabitModal extends Modal {
  private name = "";
  private onSubmit: (name: string) => void;

  constructor(app: App, currentName: string, onSubmit: (name: string) => void) {
    super(app);
    this.name = currentName;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: t("modal.rename.title") });

    const setting = new Setting(contentEl)
      .setName(t("modal.rename.nameLabel"))
      .addText((text) => {
        text.setValue(this.name);
        text.inputEl.style.width = "100%";
        text.onChange((value) => {
          this.name = value;
        });
        text.inputEl.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") {
            evt.preventDefault();
            this.submit();
          }
        });
      });

    const buttons = setting.controlEl.createDiv({
      cls: "pvhabits-modal-buttons",
    });
    buttons
      .createEl("button", { text: t("modal.cancel"), cls: "pvhabits-btn" })
      .addEventListener("click", () => this.close());
    buttons
      .createEl("button", { text: t("modal.save"), cls: "mod-cta" })
      .addEventListener("click", () => this.submit());
  }

  private submit() {
    const name = this.name.trim();
    if (!name) return;
    this.close();
    this.onSubmit(name);
  }

  onClose() {
    this.contentEl.empty();
  }
}
