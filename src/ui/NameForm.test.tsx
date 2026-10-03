import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "../i18n";
import { NameForm } from "./NameForm";

const renderForm = (initialName?: string) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <NameForm
      label="Название"
      submitLabel="Создать"
      initialName={initialName}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return {
    onSubmit,
    onCancel,
    input: screen.getByLabelText<HTMLInputElement>("Название"),
  };
};

describe("NameForm", () => {
  beforeEach(() => setLocale("ru"));

  it("submits the trimmed name on Enter", async () => {
    const { onSubmit, input } = renderForm();
    await userEvent.type(input, "  Бегать {Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Бегать");
  });

  it("does not submit a blank name", async () => {
    const { onSubmit } = renderForm("   ");
    await userEvent.click(screen.getByText("Создать"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("prefills the current name and cancels", async () => {
    const { onCancel, input } = renderForm("Читать");
    expect(input.value).toBe("Читать");
    await userEvent.click(screen.getByText("Отмена"));
    expect(onCancel).toHaveBeenCalled();
  });
});
