import { SectionTabs } from "../components/SectionTabs";
import { navigate, useNavigation } from "../app/useNavigation";
import { useEffect, useRef, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import {
  otherDailies,
  dailyFavorites,
  dailyId,
  featuredDailies,
  withDailyFavorite,
} from "../core/daily-favorites";
import { readScoreTries } from "../core/high-score-tries";
import { day } from "../core/utils";
import { usePacificDay } from "../core/usePacificDay";
import { visitedToday, withDailyVisit } from "../core/dailies";
import { useStore, updateStore } from "../persistence/store";
import { isNative, request } from "../core/bridge";
import { Button, Panel, Link, Feedback, useAction } from "../components/shared";
import { HighScoreTries } from "./HighScoreTries";
import { AvatarDailies } from "./AvatarDailies";
import { QuestShortcuts } from "./QuestShortcuts";
export function Dailies({ search = "" }: { search?: string }) {
  const { dailies: view } = useNavigation();
  const store = useStore(),
    today = usePacificDay();
  const [actionGroup, setActionGroup] = useState("");
  const [showOther, setShowOther] = useState(false);
  const opened = visitedToday(store.legacy, today);
  const { run, message, busy } = useAction();
  const favoriteIds = dailyFavorites(store.legacy);
  const starFocus = useRef("");
  useEffect(() => {
    if (busy || !starFocus.current) return;
    const id = starFocus.current;
    starFocus.current = "";
    if (document.activeElement === document.body || document.activeElement?.id === id)
      document.getElementById(id)?.focus();
  }, [busy, store.revision]);
  const mark = (urls: string[], checked = true) =>
    updateStore((s) => ({
      ...s,
      legacy: withDailyVisit(s.legacy, urls, day(), checked),
    }));
  const openPages = (urls: string[], group: string) => {
    setActionGroup(group);
    void run(async () => {
      await request("openDailyPages", { urls });
      try {
        await mark(urls);
      } catch {
        throw Error(
          "Pages opened, but checks could not be saved. Try saving again.",
        );
      }
    }, `Opened ${urls.length} pages in Chrome.`);
  };
  return (
    <div className="feature-stack">
      <SectionTabs
        label="Dailies sections"
        value={view ?? "daily"}
        onChange={(dailies) => navigate({ dailies })}
        options={[
          ["daily", "Dailies"],
          ["avatars", "Avatar dailies"],
          [
            "scores",
            `Trophy games (${readScoreTries(store.legacy).games.length})`,
          ],
        ]}
      />
      <div hidden={view !== "daily"} className="feature-stack">
        <p className="muted text-small">
          Daily checks · {today} · Pacific time
        </p>
        <p className="muted text-small">
          Star a daily to add it to My dailies. Unstarred dailies move to More dailies
          below, where you can star them again. Each daily appears once.
        </p>
        <Feedback message={message} />
        {["My dailies", "More dailies"].map((group) => {
          const entries = (
            group === "My dailies"
              ? featuredDailies(store.legacy)
              : otherDailies(store.legacy)
          ).filter((d) =>
            `${d.name} ${d.note} ${[...d.links, ...(d.shortcuts ?? [])].map((l) => l.label).join(" ")}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          );
          const urls = [
            ...new Set(entries.flatMap((d) => d.links.map((l) => l.url))),
          ];
          const batchUrls =
            urls.length <= 20
              ? urls
              : urls.filter((url) => !opened.includes(url)).slice(0, 20);
          return (
            <Panel
              key={group}
              title={group}
              collapsible={group === "More dailies"}
              defaultOpen={showOther || !!search.trim()}
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Open all ${group} pages`}
                  disabled={busy || !isNative() || !batchUrls.length}
                  title={`Open ${batchUrls.length} pages in Chrome${urls.length > 20 ? "; up to 20 unchecked pages at a time" : ""}`}
                  onClick={() => openPages(batchUrls, group)}
                >
                  <ExternalLink size={14} />
                  {busy && actionGroup === group
                    ? "Opening…"
                    : urls.length > 20
                      ? batchUrls.length
                        ? `Open next ${batchUrls.length} unchecked`
                        : "All pages checked"
                      : `Open all (${urls.length})`}
                </Button>
              }
            >
              <div className="daily-grid">
                {!entries.length && (
                  <p role="status">
                    {search.trim()
                      ? "No dailies match your search."
                      : group === "My dailies"
                        ? "No My dailies. Star one in More dailies below."
                        : "All dailies are in My dailies."}
                  </p>
                )}
                {entries.map((d) => (
                  <article key={d.name} className="daily-card">
                    <div className="daily-title">
                      <strong>{d.name}</strong>
                      <Button
                        id={`daily-star-${dailyId(d)}`}
                        variant="ghost"
                        size="icon"
                        className="avatar-favorite-button"
                        aria-label={`${favoriteIds.includes(dailyId(d)) ? "Unstar" : "Star"} ${d.name}`}
                        aria-pressed={favoriteIds.includes(dailyId(d))}
                        title={
                          favoriteIds.includes(dailyId(d))
                            ? `Remove ${d.name} from My dailies`
                            : `Add ${d.name} to My dailies`
                        }
                        disabled={busy}
                        onClick={(event) => {
                          const hadFocus =
                            document.activeElement === event.currentTarget;
                          if (hadFocus) starFocus.current = `daily-star-${dailyId(d)}`;
                          const checked = !favoriteIds.includes(dailyId(d));
                          if (!checked) setShowOther(true);
                          void run(
                            () =>
                              updateStore((s) => ({
                                ...s,
                                legacy: withDailyFavorite(
                                  s.legacy,
                                  dailyId(d),
                                  checked,
                                ),
                              })),
                            `${d.name} ${checked ? "added to" : "removed from"} My dailies`,
                          );
                        }}
                      >
                        <Star
                          aria-hidden="true"
                          fill={
                            favoriteIds.includes(dailyId(d))
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </Button>
                    </div>
                    <p>{d.note}</p>
                    <div className="daily-link-list">
                      {d.links.map((l) => (
                        <div className="actions" key={l.url}>
                          <input
                            type="checkbox"
                            aria-label={`Opened ${d.links.length > 1 ? `${d.name} · ${l.label}` : d.name} today`}
                            checked={opened.includes(l.url)}
                            disabled={busy}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setActionGroup(group);
                              void run(() => mark([l.url], checked));
                            }}
                          />
                          <span
                            onClick={(e) => {
                              if ((e.target as Element).closest("a")) {
                                setActionGroup(group);
                                void run(() => mark([l.url]));
                              }
                            }}
                          >
                            <Link href={l.url}>{l.label}</Link>
                          </span>
                        </div>
                      ))}
                    </div>
                    {d.shortcuts && (
                      <QuestShortcuts
                        links={d.shortcuts}
                        busy={busy}
                        opening={busy && actionGroup === d.name}
                        onOpen={() =>
                          openPages(
                            [
                              ...new Set(
                                [...d.links, ...d.shortcuts].map(
                                  (link) => link.url,
                                ),
                              ),
                            ],
                            d.name,
                          )
                        }
                        onVisit={(url) => {
                          void run(() => mark([url]));
                        }}
                      />
                    )}
                  </article>
                ))}
              </div>
            </Panel>
          );
        })}

        <p className="muted text-small">
          A daily check records a page visit, not completion of an activity.
          Avatar attempt checks are separate.
        </p>
      </div>
      <div hidden={view !== "avatars"}>
        <AvatarDailies />
      </div>
      <div hidden={view !== "scores"}>
        <HighScoreTries />
      </div>
    </div>
  );
}
