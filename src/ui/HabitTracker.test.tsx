import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HabitData } from "../habitManager";
import { setLocale } from "../i18n";
import { TrackerStore, type DisplaySettings } from "../store";
import { HabitTracker, type TrackerActions } from "./HabitTracker";

const settings: DisplaySettings = {
  numDays: 365,
  doneColor: "#40c463",
  emptyColor: "gray",
};
const read = { id: "read", name: "Читать", created: "2026-09-01" };
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
});

const renderLoaded = async (data: HabitData, actions = createActions()) => {
  const store = new TrackerStore(() => Promise.resolve(data), settings);
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
    const store = new TrackerStore(() => Promise.resolve(habitData), settings);
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
    await user.click(screen.getByText("Обновить"));
    await user.click(screen.getByText("Сегодня"));
    await user.click(screen.getByLabelText("Дата: 01.10.2026, Выполнено: Да"));
    await user.click(screen.getByLabelText("Переименовать"));
    await user.click(screen.getByLabelText("Удалить"));

    expect(actions.addHabit).toHaveBeenCalled();
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
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
  });
});
