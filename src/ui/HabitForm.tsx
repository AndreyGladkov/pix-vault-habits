import { useState } from "react";
import type { HabitEdit } from "../habitData";
import { t } from "../i18n";
import { NameForm, SettingRow, type NameFormProps } from "./NameForm";

interface HabitFormProps extends Omit<NameFormProps, "onSubmit" | "children"> {
  initialAutoDone?: boolean;
  onSubmit: (edit: HabitEdit) => void;
}

export const HabitForm = ({
  initialAutoDone = false,
  onSubmit,
  ...nameFormProps
}: HabitFormProps) => {
  const [autoDone, setAutoDone] = useState(initialAutoDone);
  const label = t("modal.habit.autoDoneLabel");

  return (
    <NameForm
      {...nameFormProps}
      onSubmit={(name) => onSubmit({ name, autoDone })}
    >
      <SettingRow label={label} description={t("modal.habit.autoDoneDesc")}>
        <input
          type="checkbox"
          aria-label={label}
          checked={autoDone}
          onChange={(event) => setAutoDone(event.target.checked)}
        />
      </SettingRow>
    </NameForm>
  );
};
