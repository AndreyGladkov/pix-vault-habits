import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HabitData } from "../habitData";
import { setLocale } from "../i18n";
import { TrackerStore, type DisplaySettings } from "../store";
import { HabitTracker, type TrackerActions } from "./HabitTracker";

const settings: DisplaySettings = {
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "gray",
};
const read = {
  id: "read",
  name: "Читать",
  created: "2026-09-01",
  category: "",
};
const habitData: HabitData = {
  habits: [read],
  statuses: { read: { "2026-10-01": 1, "2026-10-02": 1 } },
};

const createActions = (): TrackerActions => ({
  addHabit: vi.fn(),
  refresh: vi.fn(),
  toggleDay: vi.fn(),
  renameHabit: vi.fn(),
  deleteHabit: vi.fn(),
  moveHabit: vi.fn(),
  addCategory: vi.fn(() => Promise.resolve(null)),
  renameCategory: vi.fn(() => Promise.resolve(null)),
  deleteCategory: vi.fn(),
});

const renderLoaded = async (
  data: HabitData,
  { actions = createActions(), categories = [] as string[] } = {},
) => {
  const store = new TrackerStore(
    () => Promise.resolve(data),
    settings,
    categories,
  );
  await store.reload();
  render(<HabitTracker store={store} actions={actions} />);
  return { store, actions };
};

describe("HabitTracker", () => {
  beforeEach(() => {
    setLocale("ru");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders habits once the store has loaded", async () => {
    const store = new TrackerStore(
      () => Promise.resolve(habitData),
      settings,
      [],
    );
    render(<HabitTracker store={store} actions={createActions()} />);
    expect(screen.queryByText("Читать")).toBeNull();

    await act(() => store.reload());

    expect(screen.getByText("Читать")).toBeTruthy();
    expect(screen.getByText("🔥 2 дн. · ✅ 2")).toBeTruthy();
  });

  it("shows empty and error placeholders", async () => {
    await renderLoaded({ habits: [], statuses: {} });
    expect(screen.getByText(/Пока нет привычек/)).toBeTruthy();

    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = new TrackerStore(
      () => Promise.reject(new Error("boom")),
      settings,
      [],
    );
    await failing.reload();
    render(<HabitTracker store={failing} actions={createActions()} />);
    expect(
      screen.getByText("Не удалось загрузить данные привычек."),
    ).toBeTruthy();
  });

  it("routes user interactions to actions", async () => {
    const user = userEvent.setup();
    const { actions } = await renderLoaded(habitData);

    await user.click(screen.getByText("Добавить привычку"));
    await user.click(screen.getByLabelText("Обновить"));
    await user.click(screen.getByText("Сегодня"));
    await user.click(screen.getByLabelText("Дата: 01.10.2026, Выполнено: Да"));
    await user.click(screen.getByLabelText("Переименовать"));
    await user.click(screen.getByLabelText("Удалить"));

    expect(actions.addHabit).toHaveBeenCalledWith("");
    expect(actions.refresh).toHaveBeenCalled();
    expect(actions.toggleDay).toHaveBeenNthCalledWith(1, "read", "2026-10-03");
    expect(actions.toggleDay).toHaveBeenNthCalledWith(2, "read", "2026-10-01");
    expect(actions.renameHabit).toHaveBeenCalledWith(read);
    expect(actions.deleteHabit).toHaveBeenCalledWith(read);
  });

  it("marks done days and today, and exposes colors as CSS variables", async () => {
    await renderLoaded(habitData);

    const done = screen.getByLabelText("Дата: 01.10.2026, Выполнено: Да");
    const today = screen.getByLabelText("Дата: 03.10.2026, Выполнено: Нет");
    expect(done.className).toContain("pvhabits-cell-done");
    expect(today.className).toContain("pvhabits-cell-none");
    expect(today.className).toContain("pvhabits-cell-today");

    const root = document.querySelector<HTMLElement>(".pvhabits-container")!;
    expect(root.style.getPropertyValue("--pvhabits-done-color")).toBe(
      "#40c463",
    );
    expect(root.style.getPropertyValue("--pvhabits-empty-color")).toBe("gray");
  });

  it("re-renders on store updates, including a locale switch", async () => {
    const { store } = await renderLoaded(habitData);

    setLocale("en");
    act(() => store.setSettings({ ...settings, numDays: 30 }));

    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("🔥 2 days · ✅ 2")).toBeTruthy();
    expect(screen.getByLabelText("Date: 01.10.2026, Done: Yes")).toBeTruthy();
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
  });

  it("marks the date of the click, not of the last render, via Today", async () => {
    const user = userEvent.setup();
    vi.setSystemTime(new Date(2026, 9, 3, 23, 59));
    const { actions } = await renderLoaded(habitData);

    vi.setSystemTime(new Date(2026, 9, 4, 0, 10));
    await user.click(screen.getByText("Сегодня"));

    expect(actions.toggleDay).toHaveBeenCalledWith("read", "2026-10-04");
  });

  it("moves the grid to the new day at midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 9, 3, 23, 59));
    await renderLoaded(habitData);
    expect(
      screen.queryByLabelText("Дата: 04.10.2026, Выполнено: Нет"),
    ).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    const today = screen.getByLabelText("Дата: 04.10.2026, Выполнено: Нет");
    expect(today.className).toContain("pvhabits-cell-today");
  });

  describe("categories", () => {
    const run = {
      id: "run",
      name: "Бегать",
      created: "2026-09-01",
      category: "Спорт",
    };
    const categorized: HabitData = { habits: [run, read], statuses: {} };

    it("shows tabs and filters habits by the selected category", async () => {
      const user = userEvent.setup();
      await renderLoaded(categorized, { categories: ["Спорт", "Работа"] });

      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
        "Все",
        "Спорт",
        "Работа",
        "Без категории",
      ]);
      expect(screen.getByText("Бегать")).toBeTruthy();
      expect(screen.getByText("Читать")).toBeTruthy();

      await user.click(screen.getByRole("tab", { name: "Спорт" }));
      expect(screen.getByText("Бегать")).toBeTruthy();
      expect(screen.queryByText("Читать")).toBeNull();

      await user.click(screen.getByRole("tab", { name: "Без категории" }));
      expect(screen.queryByText("Бегать")).toBeNull();
      expect(screen.getByText("Читать")).toBeTruthy();

      await user.click(screen.getByRole("tab", { name: "Работа" }));
      expect(
        screen.getByText("В этой категории пока нет привычек."),
      ).toBeTruthy();
    });

    it("adds new habits to the active category", async () => {
      const user = userEvent.setup();
      const { actions } = await renderLoaded(categorized, {
        categories: ["Спорт"],
      });

      await user.click(screen.getByRole("tab", { name: "Спорт" }));
      await user.click(screen.getByText("Добавить привычку"));

      expect(actions.addHabit).toHaveBeenCalledWith("Спорт");
    });

    it("moves a habit to another category", async () => {
      const user = userEvent.setup();
      const { actions } = await renderLoaded(categorized, {
        categories: ["Спорт", "Работа"],
      });

      const [runSelect] =
        screen.getAllByLabelText<HTMLSelectElement>("Категория");
      expect(runSelect!.value).toBe("Спорт");
      await user.selectOptions(runSelect!, "Работа");

      expect(actions.moveHabit).toHaveBeenCalledWith(run, "Работа");
    });

    it("hides the category selector until a category exists", async () => {
      await renderLoaded(habitData);
      expect(screen.queryByLabelText("Категория")).toBeNull();
      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
        "Все",
      ]);
    });

    it("adds categories and deletes only the active real category", async () => {
      const user = userEvent.setup();
      const { actions } = await renderLoaded(categorized, {
        categories: ["Спорт"],
      });

      await user.click(screen.getByLabelText("Добавить категорию"));
      expect(actions.addCategory).toHaveBeenCalled();

      expect(screen.queryByLabelText("Удалить категорию")).toBeNull();
      await user.click(screen.getByRole("tab", { name: "Без категории" }));
      expect(screen.queryByLabelText("Удалить категорию")).toBeNull();

      await user.click(screen.getByRole("tab", { name: "Спорт" }));
      await user.click(screen.getByLabelText("Удалить категорию"));
      expect(actions.deleteCategory).toHaveBeenCalledWith("Спорт");
    });

    it("renames the active category and keeps it selected", async () => {
      const user = userEvent.setup();
      const actions = createActions();
      const { store } = await renderLoaded(categorized, {
        actions,
        categories: ["Спорт"],
      });
      vi.mocked(actions.renameCategory).mockImplementation(async () => {
        store.applyChanges({
          categories: ["Бег"],
          data: { habits: [{ ...run, category: "Бег" }, read], statuses: {} },
        });
        return "Бег";
      });

      expect(screen.queryByLabelText("Переименовать категорию")).toBeNull();
      await user.click(screen.getByRole("tab", { name: "Спорт" }));
      await user.click(screen.getByLabelText("Переименовать категорию"));

      expect(actions.renameCategory).toHaveBeenCalledWith("Спорт");
      expect(screen.getByRole("tab", { selected: true }).textContent).toBe(
        "Бег",
      );
      expect(screen.getByText("Бегать")).toBeTruthy();
    });

    it("selects a newly added category", async () => {
      const user = userEvent.setup();
      const actions = createActions();
      const { store } = await renderLoaded(categorized, {
        actions,
        categories: ["Спорт"],
      });
      vi.mocked(actions.addCategory).mockImplementation(async () => {
        store.applyChanges({ categories: ["Спорт", "Работа"] });
        return "Работа";
      });

      await user.click(screen.getByLabelText("Добавить категорию"));

      expect(screen.getByRole("tab", { selected: true }).textContent).toBe(
        "Работа",
      );
    });

    it("falls back to all habits when the active category disappears", async () => {
      const user = userEvent.setup();
      const { store } = await renderLoaded(categorized, {
        categories: ["Спорт", "Работа"],
      });

      await user.click(screen.getByRole("tab", { name: "Работа" }));
      act(() => store.applyChanges({ categories: ["Спорт"] }));

      expect(screen.getByRole("tab", { selected: true }).textContent).toBe(
        "Все",
      );
      expect(screen.getByText("Читать")).toBeTruthy();
    });

    it("forgets a selected tab once it disappears", async () => {
      const user = userEvent.setup();
      const { store } = await renderLoaded(categorized, {
        categories: ["Спорт"],
      });

      await user.click(screen.getByRole("tab", { name: "Без категории" }));
      act(() =>
        store.applyChanges({
          data: {
            ...categorized,
            habits: [run, { ...read, category: "Спорт" }],
          },
        }),
      );
      act(() => store.applyChanges({ data: categorized }));

      expect(screen.getByRole("tab", { selected: true }).textContent).toBe(
        "Все",
      );
    });
  });
});
