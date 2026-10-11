import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "../i18n";
import { HabitForm } from "./HabitForm";

const renderForm = (initialAutoDone?: boolean) => {
  const onSubmit = vi.fn();
  render(
    <HabitForm
      label="Название"
      submitLabel="Сохранить"
      initialName="Не курить"
      initialAutoDone={initialAutoDone}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );
  return {
    onSubmit,
    checkbox: screen.getByLabelText<HTMLInputElement>("Автовыполнение"),
  };
};

describe("HabitForm", () => {
  beforeEach(() => setLocale("ru"));

  it("submits the name with auto-done switched on", async () => {
    const { onSubmit, checkbox } = renderForm();
    expect(checkbox.checked).toBe(false);

    await userEvent.click(checkbox);
    await userEvent.click(screen.getByText("Сохранить"));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Не курить",
      autoDone: true,
    });
  });

  it("prefills auto-done and submits it switched off", async () => {
    const { onSubmit, checkbox } = renderForm(true);
    expect(checkbox.checked).toBe(true);

    await userEvent.click(checkbox);
    await userEvent.click(screen.getByText("Сохранить"));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Не курить",
      autoDone: false,
    });
  });
});
