import type { ReactNode } from "react";

interface PressableProps {
  role: "tab" | "button";
  className: string;
  label?: string;
  selected?: boolean;
  onPress: () => void;
  children: ReactNode;
}

// Not a <button> on purpose: themes such as e-ink restyle every button with
// !important borders and backgrounds, which breaks pill-shaped controls.
export const Pressable = ({
  role,
  className,
  label,
  selected,
  onPress,
  children,
}: PressableProps) => (
  <span
    role={role}
    tabIndex={0}
    className={className}
    aria-label={label}
    aria-selected={selected}
    onClick={onPress}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPress();
      }
    }}
  >
    {children}
  </span>
);
