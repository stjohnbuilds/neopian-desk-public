import { InfoHelp } from "../components/InfoHelp";
import { byActivityDifficulty } from "../core/avatar-workbook";
import { useState } from "react";
import { avatarDailyGroups, avatarConcerts } from "../core/dailies";
import {
  avatarFavorites,
  withAvatarFavorite,
} from "../core/avatar-daily-favorites";
import { usePacificDay } from "../core/usePacificDay";
import { useStore, updateStore } from "../persistence/store";
import { Panel, Link, Feedback, useAction } from "../components/shared";
import { AvatarConcertRow } from "./AvatarConcerts";
import { AvatarDailyActivity } from "./AvatarDailyActivity";
import type { AvatarFavoriteControl } from "../components/AvatarFavoriteButton";

export function AvatarDailies() {
  const store = useStore(),
    today = usePacificDay();
  const [search, setSearch] = useState("");
  const action = useAction();
  const ids = avatarFavorites(store.legacy);
  const dailyRows = avatarDailyGroups(store.legacy, today, search);
  const concertRows = avatarConcerts(store.legacy, today, search);
  const starred = dailyRows.filter((g) => ids.includes(g.activityId));
  const starredConcerts = concertRows.filter((c) =>
    ids.includes(`concert:${c.entry.concertId}`),
  );
  const ordinary = byActivityDifficulty(
    dailyRows.filter((g) => !ids.includes(g.activityId)),
  );
  const ordinaryConcerts = concertRows.filter(
    (c) => !ids.includes(`concert:${c.entry.concertId}`),
  );
  const favouriteCount = starred.length + starredConcerts.length;
  const searching = !!search.trim();
  const matchCount = dailyRows.length + concertRows.length;
  const favorites: AvatarFavoriteControl = {
    ids,
    busy: action.busy,
    toggle: (id, name, checked) => {
      const buttonId = `avatar-favorite-${id}`;
      const hadFocus = document.activeElement?.id === buttonId;
      void action
        .run(
          () =>
            updateStore((s) => ({
              ...s,
              legacy: withAvatarFavorite(s.legacy, id, checked),
            })),
          checked
            ? `${name} added to favourites`
            : `${name} removed from favourites`,
        )
        .then(() => {
          // Moving between sections remounts the row. Restore keyboard focus, but
          // do not steal it if the user moved to another control during the save.
          if (hadFocus)
            requestAnimationFrame(() => {
              if (
                document.activeElement === document.body ||
                document.activeElement?.id === buttonId
              )
                document.getElementById(buttonId)?.focus();
            });
        });
    },
  };
  return (
    <div className="feature-stack">
      <label className="field">
        <span>Find an avatar activity</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Grumpy Old King, wheels, concert tickets…"
        />
      </label>
      <p className="muted text-small avatar-activity-help">
        Star favourites to pin them. Other activities show lowest effort first.
        <InfoHelp title="About avatar activities">
          <p>
            Your starred activities stay first. Other activities use reliable
            effort estimates from the spreadsheet; activities without an
            estimate follow.
          </p>
          <p>
            Tried today resets at midnight Pacific. Collected is permanent and
            removes that avatar. Uncheck it in Achievements → Avatars to bring
            it back.
          </p>
          <p>
            Concerts keep their dates and ticket controls below the routine
            list. Other avatar goals stay in Achievements → Avatars.
          </p>
        </InfoHelp>
      </p>
      <Feedback message={action.message} />
      {favouriteCount > 0 && (
        <Panel title={`Favourites · ${favouriteCount}`}>
          <div className="panel-body checklist">
            {starred.map((g) => (
              <AvatarDailyActivity
                key={g.activityId}
                group={g}
                today={today}
                action={action}
                favorites={favorites}
              />
            ))}
            {starredConcerts.map((c) => (
              <AvatarConcertRow
                key={c.entry.id}
                concert={c}
                action={action}
                favorites={favorites}
              />
            ))}
          </div>
        </Panel>
      )}
      {ordinary.length > 0 && (
        <Panel
          title={`Avatar dailies · ${ordinary.length} ${ordinary.length === 1 ? "activity" : "activities"}`}
        >
          <div className="panel-body">
            <div className="checklist">
              {ordinary.map((g) => (
                <AvatarDailyActivity
                  key={g.activityId}
                  group={g}
                  today={today}
                  action={action}
                  favorites={favorites}
                />
              ))}
            </div>
          </div>
        </Panel>
      )}
      {ordinaryConcerts.length > 0 && (
        <Panel
          title={`Concert tickets · ${ordinaryConcerts.length}`}
          collapsible
          defaultOpen={
            searching || ordinaryConcerts.some((concert) => concert.today)
          }
        >
          <div className="panel-body">
            <p className="muted text-small">
              Attend with the matching ticket to earn the avatar.
            </p>
            <div className="actions">
              <Link href="https://www.neopets.com/prehistoric/ticketbooth.phtml">
                Ticket booth
              </Link>
              <Link href="https://www.jellyneo.net/?go=concerts">
                Concert schedule · Jellyneo
              </Link>
            </div>
            <div className="checklist">
              {ordinaryConcerts.map((concert) => (
                <AvatarConcertRow
                  key={concert.entry.id}
                  concert={concert}
                  action={action}
                  favorites={favorites}
                />
              ))}
            </div>
          </div>
        </Panel>
      )}
      {!matchCount && (
        <p role="status">
          {searching
            ? "No avatar activities match your search."
            : "No uncollected daily or concert avatars remain."}
        </p>
      )}
    </div>
  );
}
