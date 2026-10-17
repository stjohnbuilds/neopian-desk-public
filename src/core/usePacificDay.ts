import { useEffect, useState } from "react";
import { day } from "./utils";
/** Refresh on a date change, and immediately after wake/focus. No ownership writes. */
export function usePacificDay() {
  const [today, setToday] = useState(() => day());
  useEffect(() => {
    const refresh = () => setToday(day());
    const interval = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
