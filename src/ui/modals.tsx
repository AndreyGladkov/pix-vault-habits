import { App, FuzzySuggestModal, Modal } from "obsidian";
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";
import type { HabitRecord } from "../habitManager";
import { t } from "../i18n";
import { HabitNameForm, type HabitNameFormProps } from "./HabitNameForm";
import { mountReactRoot } from "./reactRoot";

class ReactModal extends Modal {
  private root: Root | null = null;

  constructor(
    app: App,
    title: string,
    private readonly renderContent: (close: () => void) => ReactNode,
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
  }
}

type OnSubmitName = (name: string) => void | Promise<void>;

type HabitNameModalOptions = Omit<
  HabitNameFormProps,
  "onSubmit" | "onCancel"
> & {
  title: string;
  onSubmit: OnSubmitName;
};

export const openAddHabitModal = (app: App, onSubmit: OnSubmitName) =>
  openHabitNameModal(app, {
    title: t("modal.add.title"),
    label: t("modal.add.nameLabel"),
    description: t("modal.add.nameDesc"),
    placeholder: t("modal.add.placeholder"),
    submitLabel: t("modal.create"),
    onSubmit,
  });

export const openRenameHabitModal = (
  app: App,
  currentName: string,
  onSubmit: OnSubmitName,
) =>
  openHabitNameModal(app, {
    title: t("modal.rename.title"),
    label: t("modal.rename.nameLabel"),
    submitLabel: t("modal.save"),
    initialName: currentName,
    onSubmit,
  });

const openHabitNameModal = (
  app: App,
  { title, onSubmit, ...formProps }: HabitNameModalOptions,
) =>
  new ReactModal(app, title, (close) => (
    <HabitNameForm
      {...formProps}
      onCancel={close}
      onSubmit={(name) => {
        close();
        void onSubmit(name);
      }}
    />
  )).open();

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
