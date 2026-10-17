import { withConcertTicket } from "../core/dailies";
import { readLegacy, updateStore, useStore } from "../persistence/store";
import { Feedback, useAction } from "./shared";

export function ConcertTicket({ id, name }: { id: string; name: string }) {
  const store = useStore();
  const bands = readLegacy(store, "nd_concerts", {
    tickets: [] as string[],
    avatars: [] as string[],
  });
  const { run, message, busy } = useAction();
  return (
    <div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          aria-label={`Have ticket for ${name}`}
          disabled={busy}
          checked={bands.tickets.includes(id)}
          onChange={(event) => {
            const checked = event.target.checked;
            void run(
              () =>
                updateStore((s) => ({
                  ...s,
                  legacy: withConcertTicket(s.legacy, id, checked),
                })),
              checked ? "Ticket saved" : "Ticket cleared",
            );
          }}
        />
        Have ticket
      </label>
      <Feedback message={message} />
    </div>
  );
}
