import { AvatarWorkbookDetails } from "./AvatarWorkbook";
import {
  avatarDailyGroups,
  triedToday,
  withActivityAttempt,
} from "../core/dailies";
import { withAvatarCollected } from "../core/avatars";
import { useStore, updateStore } from "../persistence/store";
import { Link, useAction } from "../components/shared";
import {
  AvatarFavoriteButton,
  type AvatarFavoriteControl,
} from "../components/AvatarFavoriteButton";
export function AvatarDailyActivity({
  group: g,
  today,
  action,
  favorites,
}: {
  group: ReturnType<typeof avatarDailyGroups>[number];
  today: string;
  action: ReturnType<typeof useAction>;
  favorites: AvatarFavoriteControl;
}) {
  const store = useStore();
  const { run, busy } = action;
  return (
    <section
      className="avatar-daily-activity"
      key={g.activityId}
      aria-label={g.activity}
    >
      <div className="actions avatar-daily-heading">
        <div className="avatar-activity-title">
          <AvatarFavoriteButton
            id={g.activityId}
            name={g.activity}
            control={favorites}
          />
          <strong>{g.activity}</strong>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={busy}
            aria-label={`Tried ${g.activity} today`}
            checked={g.entries.every((e) => triedToday(store.legacy, e, today))}
            onChange={(event) => {
              const checked = event.target.checked;
              void run(
                () =>
                  updateStore((s) => ({
                    ...s,
                    legacy: withActivityAttempt(
                      s.legacy,
                      g.entries,
                      today,
                      checked,
                    ),
                  })),
                checked ? "Attempt saved" : "Attempt cleared",
              );
            }}
          />
          Tried today
        </label>
        <Link href={g.url}>Open activity</Link>
      </div>
      <p className="muted text-small">{g.cadence}</p>
      {g.entries.map((e) => (
        <div className="avatar-daily-target" key={e.id}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              disabled={busy}
              aria-label={`Collected ${e.name}`}
              checked={false}
              onChange={() =>
                void run(
                  () =>
                    updateStore((s) => ({
                      ...s,
                      legacy: withAvatarCollected(s.legacy, e, true),
                    })),
                  `${e.name} collected`,
                )
              }
            />{" "}
            <strong>{e.name}</strong>
            <span className="muted">Collected</span>
          </label>
          <p>{e.detail}</p>
          <AvatarWorkbookDetails entry={e} />
          {e.guide && (
            <Link href={e.guide}>{e.guideLabel || "Avatar requirements"}</Link>
          )}
        </div>
      ))}
    </section>
  );
}
