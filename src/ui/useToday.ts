import { useEffect, useState } from "react";
import { formatDate } from "../csv";

export const useToday = (): string => {
  const [today, setToday] = useState(formatDate);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setToday(formatDate()),
      msUntilNextDay(),
    );
    return () => window.clearTimeout(timer);
  }, [today]);

  return today;
};

const msUntilNextDay = (): number => {
  const now = new Date();
  const nextDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return nextDay.getTime() - now.getTime();
};
