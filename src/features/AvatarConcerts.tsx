import { AvatarWorkbookDetails } from "./AvatarWorkbook";
import { avatarConcerts } from "../core/dailies";
import { withAvatarCollected } from "../core/avatars";
import { useStore, updateStore } from "../persistence/store";
import { ConcertTicket } from "../components/ConcertTicket";
import { Link, useAction } from "../components/shared";
import {
  AvatarFavoriteButton,
  type AvatarFavoriteControl,
} from "../components/AvatarFavoriteButton";
export function AvatarConcertRow({
  concert: c,
  action,
  favorites,
}: {
  concert: ReturnType<typeof avatarConcerts>[number];
  action: ReturnType<typeof useAction>;
  favorites: AvatarFavoriteControl;
}) {
  const store = useStore();
  const { run, busy } = action;
  return (
    <section
      key={c.entry.id}
      className="avatar-daily-activity"
      aria-label={`${c.band} concert`}
    >
      <div className="actions avatar-daily-heading">
        <div className="avatar-activity-title">
          <AvatarFavoriteButton
            id={`concert:${c.entry.concertId}`}
            name={c.band}
            control={favorites}
          />
          <strong>{c.band}</strong>
        </div>
        <span>{c.today ? "Today" : `Next: ${c.date}`}</span>
        <Link href={c.entry.url}>Concert hall</Link>
      </div>
      <p>{c.entry.name}</p>
      <p className="text-small">{c.entry.detail}</p>
      <AvatarWorkbookDetails entry={c.entry} />
      {c.entry.guide && (
        <Link href={c.entry.guide}>
          {c.entry.guideLabel || "Concert guide"}
        </Link>
      )}
      <div className="actions">
        <ConcertTicket id={c.entry.concertId!} name={c.band} />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={false}
            disabled={busy}
            aria-label={`Collected ${c.entry.name}`}
            onChange={() =>
              void run(
                () =>
                  updateStore((s) => ({
                    ...s,
                    legacy: withAvatarCollected(s.legacy, c.entry, true),
                  })),
                `${c.entry.name} collected`,
              )
            }
          />
          Avatar collected
        </label>
      </div>
    </section>
  );
}
