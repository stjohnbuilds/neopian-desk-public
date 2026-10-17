/** One navigation style for sibling views throughout Desk. */
export function SectionTabs<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <nav className="segmented" aria-label={label}>
      {options.map(([id, title]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const buttons = Array.from(
              event.currentTarget.parentElement!.querySelectorAll("button"),
            );
            const index = buttons.indexOf(event.currentTarget);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? buttons.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      buttons.length) %
                    buttons.length;
            buttons[next].focus();
            buttons[next].click();
          }}
          onClick={() => onChange(id)}
        >
          {title}
        </button>
      ))}
    </nav>
  );
}
