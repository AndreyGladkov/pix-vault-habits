import { useState, type ReactNode, type SyntheticEvent } from "react";
import { t } from "../i18n";

export interface NameFormProps {
  label: string;
  description?: string;
  placeholder?: string;
  submitLabel: string;
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export const NameForm = ({
  label,
  description,
  placeholder,
  submitLabel,
  initialName = "",
  onSubmit,
  onCancel,
  children,
}: NameFormProps) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SettingRow label={label} description={description}>
        <input
          type="text"
          aria-label={label}
          placeholder={placeholder}
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </SettingRow>
      {children}
      <div className="modal-button-container">
        <button type="button" onClick={onCancel}>
          {t("modal.cancel")}
        </button>
        <button type="submit" className="mod-cta">
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export const SettingRow = ({
  label,
  description,
  children,
}: SettingRowProps) => (
  <div className="setting-item">
    <div className="setting-item-info">
      <div className="setting-item-name">{label}</div>
      {description && (
        <div className="setting-item-description">{description}</div>
      )}
    </div>
    <div className="setting-item-control">{children}</div>
  </div>
);
