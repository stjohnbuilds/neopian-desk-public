import { useState } from "react";
import { Timer as TimerIcon } from "lucide-react";
import { countdown, type Timer } from "../core/timers";
import { Link } from "./shared";
function CountdownPill({ timer, now }: { timer: Timer; now: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="countdown-pill-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        className="countdown-pill"
        aria-expanded={open}
        aria-label={`${timer.title}: ${countdown(timer, now)}`}
        onClick={() => setOpen(true)}
      >
        <TimerIcon size={13} />
        {timer.title.split(" — ")[0]}
      </button>
      {open && (
        <div className="countdown-popover">
          <strong>{countdown(timer, now)} left</strong>
          <Link href={timer.url}>Open {timer.title.split(" — ")[0]}</Link>
        </div>
      )}
    </div>
  );
}
export function CountdownPills({
  timers,
  now,
}: {
  timers: Timer[];
  now: number;
}) {
  return timers.length ? (
    <div className="countdown-strip" aria-label="Running countdowns">
      {timers.map((timer) => (
        <CountdownPill key={timer.id} timer={timer} now={now} />
      ))}
    </div>
  ) : null;
}
