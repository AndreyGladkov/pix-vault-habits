import { App, ConfirmationModal, FuzzySuggestModal, Modal } from "obsidian";
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";
import type { HabitRecord } from "../habitData";
import { t } from "../i18n";
import { NameForm, type NameFormProps } from "./NameForm";
import { mountReactRoot } from "./reactRoot";

class ReactModal extends Modal {
  private root: Root | null = null;

  constructor(
    app: App,
    title: string,
    private readonly renderContent: (close: () => void) => ReactNode,
    private readonly onClosed: () => void,
  ) {
    super(app);
    this.setTitle(title);
  }

  onOpen() {
    this.root = mountReactRoot(
      this.contentEl,
      this.renderContent(() => this.close()),
    );
  }

  onClose() {
    this.root?.unmount();
    this.root = null;
    this.onClosed();
  }
}

type NameModalOptions = Omit<NameFormProps, "onSubmit" | "onCancel"> & {
  title: string;
};

export const openAddHabitModal = (app: App) =>
  openNameModal(app, {
    title: t("modal.add.title"),
    label: t("modal.add.nameLabel"),
    description: t("modal.add.nameDesc"),
    placeholder: t("modal.add.placeholder"),
    submitLabel: t("modal.create"),
  });

export const openRenameHabitModal = (app: App, currentName: string) =>
  openNameModal(app, {
    title: t("modal.rename.title"),
    label: t("modal.rename.nameLabel"),
    submitLabel: t("modal.save"),
    initialName: currentName,
  });

export const openAddCategoryModal = (app: App) =>
  openNameModal(app, {
    title: t("modal.category.title"),
    label: t("modal.category.nameLabel"),
    placeholder: t("modal.category.placeholder"),
    submitLabel: t("modal.create"),
  });

export const openRenameCategoryModal = (app: App, currentName: string) =>
  openNameModal(app, {
    title: t("modal.renameCategory.title"),
    label: t("modal.category.nameLabel"),
    submitLabel: t("modal.save"),
    initialName: currentName,
  });

const openNameModal = (
  app: App,
  { title, ...formProps }: NameModalOptions,
): Promise<string | null> =>
  new Promise((resolve) => {
    new ReactModal(
      app,
      title,
      (close) => (
        <NameForm
          {...formProps}
          onCancel={close}
          onSubmit={(name) => {
            resolve(name);
            close();
          }}
        />
      ),
      () => resolve(null),
    ).open();
  });

export const openConfirmDeleteModal = (
  app: App,
  title: string,
  onConfirm: () => Promise<void>,
) => {
  const modal = new ConfirmationModal(app);
  modal.setTitle(title);
  modal.addCancelButton(t("modal.cancel"));
  modal.addButton((btn) => {
    btn.setButtonText(t("confirm.delete"));
    btn.setDestructive().setCta();
    btn.onClick(() => {
      void onConfirm();
    });
  });
  modal.open();
};

export class HabitPickerModal extends FuzzySuggestModal<HabitRecord> {
  constructor(
    app: App,
    private readonly habits: HabitRecord[],
    private readonly onPick: (habit: HabitRecord) => void | Promise<void>,
  ) {
    super(app);
    this.setPlaceholder(t("picker.title"));
    this.emptyStateText = t("picker.empty");
  }

  getItems(): HabitRecord[] {
    return this.habits;
  }

  getItemText(habit: HabitRecord): string {
    return habit.name;
  }

  onChooseItem(habit: HabitRecord): void {
    void this.onPick(habit);
  }
}
