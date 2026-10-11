import { App, ConfirmationModal, FuzzySuggestModal, Modal } from "obsidian";
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";
import { isAutoDone, type HabitEdit, type HabitRecord } from "../habitData";
import { t } from "../i18n";
import { HabitForm } from "./HabitForm";
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
  openFormModal<HabitEdit>(app, t("modal.add.title"), (submit, cancel) => (
    <HabitForm
      label={t("modal.add.nameLabel")}
      description={t("modal.add.nameDesc")}
      placeholder={t("modal.add.placeholder")}
      submitLabel={t("modal.create")}
      onSubmit={submit}
      onCancel={cancel}
    />
  ));

export const openEditHabitModal = (app: App, habit: HabitRecord) =>
  openFormModal<HabitEdit>(app, t("modal.edit.title"), (submit, cancel) => (
    <HabitForm
      label={t("modal.edit.nameLabel")}
      submitLabel={t("modal.save")}
      initialName={habit.name}
      initialAutoDone={isAutoDone(habit)}
      onSubmit={submit}
      onCancel={cancel}
    />
  ));

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
  openFormModal<string>(app, title, (submit, cancel) => (
    <NameForm {...formProps} onSubmit={submit} onCancel={cancel} />
  ));

const openFormModal = <T,>(
  app: App,
  title: string,
  renderForm: (submit: (value: T) => void, cancel: () => void) => ReactNode,
): Promise<T | null> =>
  new Promise((resolve) => {
    new ReactModal(
      app,
      title,
      (close) =>
        renderForm((value) => {
          resolve(value);
          close();
        }, close),
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
