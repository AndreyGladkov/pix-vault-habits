import { ItemView, WorkspaceLeaf } from "obsidian";
import type { Root } from "react-dom/client";
import type { TrackerStore } from "./store";
import { HabitTracker, type TrackerActions } from "./ui/HabitTracker";
import { mountReactRoot } from "./ui/reactRoot";

export const VIEW_TYPE = "pix-vault-habits-view";

export class HabitTrackerView extends ItemView {
  private root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: TrackerStore,
    private readonly actions: TrackerActions,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Pix vault habits";
  }

  getIcon(): string {
    return "activity";
  }

  async onOpen() {
    this.root = mountReactRoot(
      this.contentEl,
      <HabitTracker store={this.store} actions={this.actions} />,
    );
    await this.store.reload();
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
}
