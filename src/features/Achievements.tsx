import {
  findAvatar,
  isPetpetAvatarCollected,
  withAvatarCollected,
} from "../core/avatars";
import { Avatars } from "./Avatars";
import { SectionTabs } from "../components/SectionTabs";
import { navigate, useNavigation } from "../app/useNavigation";
import { useState } from "react";
import goals from "../data/goals.json";
import petpets from "../data/petpets.json";

import {
  readLegacy,
  setLegacy,
  useStore,
  updateStore,
} from "../persistence/store";
import { defaultReminders, type Reminders } from "../core/timers";
import { day } from "../core/utils";
import { Button, Panel, Link, Feedback, useAction } from "../components/shared";
import { Battledome } from "./Battledome";
import { Stamps } from "./Stamps";
export function Achievements() {
  const { achievements: view } = useNavigation();
  return (
    <div className="feature-stack">
      <SectionTabs
        label="Trophy sections"
        value={view}
        onChange={(achievements) => navigate({ achievements })}
        options={[
          ["avatars", "Avatars"],
          ["goals", "Goals"],
          ["battledome", "Battledome"],
          ["stamps", "Stamp collection"],
          ["petpets", "Petpet timers"],
        ]}
      />
      {view === "avatars" ? (
        <Avatars />
      ) : view === "goals" ? (
        <Goals />
      ) : view === "battledome" ? (
        <Battledome />
      ) : view === "stamps" ? (
        <Stamps />
      ) : (
        <Petpets />
      )}
    </div>
  );
}
function Goals() {
  const store = useStore(),
    saved = readLegacy<Record<string, number | boolean | string>>(
      store,
      "nd_goals",
      {},
    );
  const { run, message } = useAction();
  return (
    <div className="feature-stack">
      {goals.map((g) => (
        <Panel collapsible title={g.name} key={g.id}>
          <div className="table-toolbar">
            <p>{g.what}</p>
            {g.kind === "count" ? (
              <input
                className="count-input"
                type="number"
                min="0"
                step="1"
                aria-label={g.name}
                value={Number(saved[g.id]) || 0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isSafeInteger(n) && n >= 0)
                    void run(
                      () => setLegacy("nd_goals", { ...saved, [g.id]: n }),
                      "Progress saved",
                    );
                }}
              />
            ) : (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!saved[g.id]}
                  onChange={(e) =>
                    void run(
                      () =>
                        setLegacy("nd_goals", {
                          ...saved,
                          [g.id]: e.target.checked,
                        }),
                      "Goal saved",
                    )
                  }
                />
                Achieved
              </label>
            )}
            <Link href={g.u}>Open</Link>
          </div>
          <p className="panel-note muted">{g.how}</p>
          <div className="panel-note actions">
            {g.guides.map((guide) => (
              <Link key={guide.url} href={guide.url}>
                {guide.label}
              </Link>
            ))}
          </div>
          {g.tiers && (
            <p className="muted panel-note text-small">
              {g.tiers.map((t) => t[0] + " · " + t[1]).join(" / ")}
            </p>
          )}
        </Panel>
      ))}
      <Feedback message={message} />
    </div>
  );
}
function Petpets() {
  const pets = useStore().profile.pets;
  const store = useStore(),
    saved = readLegacy<Reminders>(store, "nd_reminders", defaultReminders);
  const [pet, setPet] = useState(pets[0] ?? ""),
    [avatar, setAvatar] = useState(petpets[0].id),
    [date, setDate] = useState(day()),
    [estimated, setEstimated] = useState(true);
  const { run, message } = useAction();
  return (
    <Panel collapsible title="Petpet countdowns">
      <div className="checklist">
        {saved.petpets.map((p) => {
          const task = petpets.find((a) => a.id === p.avatar),
            due = new Date(p.attachedOn + "T12:00:00Z");
          due.setUTCDate(due.getUTCDate() + (task?.days || 0));
          const left = Math.ceil(
            (due.getTime() - new Date(day() + "T12:00:00Z").getTime()) /
              86400000,
          );
          return (
            <div className="checklist-row" key={p.id}>
              <input
                aria-label={"Completed " + p.pet}
                type="checkbox"
                checked={
                  p.done || isPetpetAvatarCollected(store.legacy, p.avatar)
                }
                onChange={(e) => {
                  const checked = e.target.checked;
                  void run(
                    () =>
                      updateStore((current) => {
                        const entry = findAvatar("nd_reminders", p.avatar);
                        if (!entry)
                          throw Error(
                            "This petpet has no confirmed avatar match. Its countdown is unchanged.",
                          );
                        return {
                          ...current,
                          legacy: withAvatarCollected(
                            current.legacy,
                            entry,
                            checked,
                          ),
                        };
                      }),
                    "Petpet avatar saved",
                  );
                }}
              />
              <div>
                <strong>
                  {p.pet} · {task?.name || p.avatar}
                </strong>
                <p>
                  {p.done || isPetpetAvatarCollected(store.legacy, p.avatar)
                    ? "Collected"
                    : left > 0
                      ? left + " days left"
                      : "Age reached"}{" "}
                  · {p.estimated ? "Estimated" : "Recorded"} attachment{" "}
                  {p.attachedOn}
                </p>
                <Link
                  href={"https://www.neopets.com/petlookup.phtml?pet=" + p.pet}
                >
                  Pet lookup
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  run(
                    () =>
                      setLegacy("nd_reminders", {
                        ...saved,
                        petpets: saved.petpets.filter((x) => x.id !== p.id),
                      }),
                    "Countdown removed",
                  )
                }
              >
                Remove
              </Button>
            </div>
          );
        })}
      </div>
      <form
        className="form-grid panel-note"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              setLegacy("nd_reminders", {
                ...saved,
                petpets: [
                  ...saved.petpets,
                  {
                    id: crypto.randomUUID(),
                    pet,
                    avatar,
                    attachedOn: date,
                    estimated,
                    done: false,
                  },
                ],
              }),
            "Countdown added",
          );
        }}
      >
        <label>
          Pet
          <select required value={pet} onChange={(e) => setPet(e.target.value)}><option value="" disabled>Choose a pet from Settings</option>
            {pets.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Petpet
          <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
            {petpets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.days} days
              </option>
            ))}
          </select>
        </label>
        <label>
          Attached
          <input
            required
            type="date"
            max={day()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={estimated}
            onChange={(e) => setEstimated(e.target.checked)}
          />
          Estimated date
        </label>
        <Button type="submit">Add countdown</Button>
      </form>
      <Feedback message={message} />
    </Panel>
  );
}
