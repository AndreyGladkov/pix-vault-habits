import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Notice } from "obsidian";
import PixVaultHabitsPlugin from "./main";
import { createVault } from "./test/vault";
import {
  HabitPickerModal,
  openConfirmDeleteModal,
  openRenameCategoryModal,
} from "./ui/modals";

vi.mock("obsidian", async (importOriginal) => ({
  ...(await importOriginal<typeof import("obsidian")>()),
  Notice: vi.fn(),
}));

vi.mock("./view", () => ({
  VIEW_TYPE: "pix-vault-habits-view",
  HabitTrackerView: class {},
}));

vi.mock("./ui/modals", () => ({
  openAddHabitModal: vi.fn(),
  openRenameHabitModal: vi.fn(),
  openAddCategoryModal: vi.fn(),
  openRenameCategoryModal: vi.fn(),
  openConfirmDeleteModal: vi.fn(),
  HabitPickerModal: vi.fn(function (
    this: { open: () => void },
    _app: unknown,
  ) {
    this.open = () => {};
  }),
}));

const PATH = "pixVaultHabits/habits.csv";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => (resolve = res));
  return { promise, resolve };
};

const setup = async (
  csv: string,
  settings: Record<string, unknown> = { categories: ["Спорт"] },
) => {
  const vault = createVault({ [PATH]: csv });
  const leaves: unknown[] = [];
  const app = {
    vault: vault.vault,
    workspace: {
      onLayoutReady: () => {},
      getLeavesOfType: () => leaves,
      revealLeaf: async () => {},
    },
  };
  const plugin = new PixVaultHabitsPlugin(app as never, {} as never);
  vi.spyOn(plugin, "loadData").mockResolvedValue(settings);
  const saveData = vi.spyOn(plugin, "saveData");
  await plugin.onload();
  const store = plugin["store"];
  await store.reload();
  const habits = () => {
    const { habits } = store.getSnapshot();
    return habits.status === "ready" ? habits.data.habits : [];
  };
  return {
    plugin,
    vault,
    leaves,
    store,
    saveData,
    habits,
    actions: plugin["actions"],
  };
};

const confirmDeletes = () => {
  const confirmed: Promise<void>[] = [];
  vi.mocked(openConfirmDeleteModal).mockImplementation(
    (_app, _title, onConfirm) => void confirmed.push(onConfirm()),
  );
  return () => Promise.all(confirmed);
};

const noticeMessages = () =>
  vi.mocked(Notice).mock.calls.map(([message]) => message);

describe("PixVaultHabitsPlugin", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows the written data after a toggle", async () => {
    const { vault, actions, store } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,Спорт",
    );

    actions.toggleDay("run", "2026-10-02");
    await vi.waitFor(() =>
      expect(vault.files.get(PATH)).toContain("2026-10-02,1"),
    );

    const { habits } = store.getSnapshot();
    expect(habits.status === "ready" && habits.data.statuses.run).toEqual({
      "2026-10-01": 1,
      "2026-10-02": 1,
    });
  });

  it("renames a category in the CSV, the settings and the view", async () => {
    const { vault, actions, saveData, habits, store } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,Спорт",
    );
    vi.mocked(openRenameCategoryModal).mockResolvedValue("Движение");

    expect(await actions.renameCategory("Спорт")).toBe("Движение");

    expect(vault.files.get(PATH)).toBe(
      "run,Бег,2026-10-01,1,2026-09-01,Движение",
    );
    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ["Движение"] }),
    );
    expect(store.getSnapshot().categories).toEqual(["Движение"]);
    expect(habits()[0]?.category).toBe("Движение");
  });

  it("keeps a toggle made while the categories are being saved", async () => {
    const { actions, saveData, store } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,Спорт",
    );
    const saving = deferred();
    saveData.mockReturnValue(saving.promise);
    vi.mocked(openRenameCategoryModal).mockResolvedValue("Движение");

    const renamed = actions.renameCategory("Спорт");
    await vi.waitFor(() => expect(saveData).toHaveBeenCalled());
    actions.toggleDay("run", "2026-10-02");
    await vi.waitFor(() => {
      const { habits } = store.getSnapshot();
      expect(habits.status === "ready" && habits.data.statuses.run).toEqual({
        "2026-10-01": 1,
        "2026-10-02": 1,
      });
    });
    saving.resolve();
    await renamed;

    const { habits } = store.getSnapshot();
    expect(habits.status === "ready" && habits.data.statuses.run).toEqual({
      "2026-10-01": 1,
      "2026-10-02": 1,
    });
  });

  it("reports a failed settings write instead of rejecting", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { actions, saveData, habits, store } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,Спорт",
    );
    saveData.mockRejectedValue(new Error("disk full"));
    const confirmed = confirmDeletes();

    actions.deleteCategory("Спорт");
    await confirmed();

    expect(noticeMessages()).toEqual(["Failed to save categories"]);
    expect(store.getSnapshot().categories).toEqual([]);
    expect(habits()[0]?.category).toBe("");
  });

  it("deletes a category and leaves its habits uncategorized", async () => {
    const { vault, actions, saveData } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,Спорт",
    );
    const confirmed = confirmDeletes();

    actions.deleteCategory("Спорт");
    await confirmed();

    expect(vault.files.get(PATH)).toBe("run,Бег,2026-10-01,1,2026-09-01,");
    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [] }),
    );
  });

  it("moves a habit to another category", async () => {
    const { vault, actions, habits } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,",
    );

    actions.moveHabit(habits()[0]!, "Спорт");
    await vi.waitFor(() => expect(habits()[0]?.category).toBe("Спорт"));

    expect(vault.files.get(PATH)).toBe("run,Бег,2026-10-01,1,2026-09-01,Спорт");
  });

  it("re-reads the file before offering habits to mark", async () => {
    const { plugin, vault } = await setup("run,Бег,2026-10-01,1,2026-09-01,");
    vault.files.set(PATH, "swim,Плавать,2026-10-01,1,2026-09-01,");

    await plugin["markTodayViaPicker"]();

    const [, habits] = vi.mocked(HabitPickerModal).mock.calls[0]!;
    expect(habits.map((habit) => habit.name)).toEqual(["Плавать"]);
  });

  it("re-reads the file when revealing an open tracker", async () => {
    const { plugin, vault, leaves, habits } = await setup(
      "run,Бег,2026-10-01,1,2026-09-01,",
    );
    leaves.push({});
    vault.files.set(PATH, "swim,Плавать,2026-10-01,1,2026-09-01,");

    await plugin.activateView();

    await vi.waitFor(() => expect(habits()[0]?.name).toBe("Плавать"));
  });

  describe("changing the CSV path", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    });

    it("loads the new file once typing pauses, without creating files", async () => {
      const { plugin, vault, habits } = await setup(
        "run,Бег,2026-10-01,1,2026-09-01,",
      );
      vault.files.set("other.csv", "swim,Плавать,2026-10-01,1,2026-09-01,");

      for (const csvPath of ["oth", "other.c", "other.csv"]) {
        plugin.settings.csvPath = csvPath;
        plugin.onSettingChanged("csvPath");
        await vi.advanceTimersByTimeAsync(500);
      }
      await vi.advanceTimersByTimeAsync(1000);

      expect(habits().map((habit) => habit.name)).toEqual(["Плавать"]);
      expect([...vault.files.keys()]).toEqual([PATH, "other.csv"]);
      expect(vault.folders.size).toBe(0);
    });

    it("drops a pending reload when the plugin unloads", async () => {
      const { plugin, vault, habits } = await setup(
        "run,Бег,2026-10-01,1,2026-09-01,",
      );
      vault.files.set("other.csv", "swim,Плавать,2026-10-01,1,2026-09-01,");

      plugin.settings.csvPath = "other.csv";
      plugin.onSettingChanged("csvPath");
      plugin.onunload();
      await vi.advanceTimersByTimeAsync(2000);

      expect(habits().map((habit) => habit.name)).toEqual(["Бег"]);
    });
  });
});
