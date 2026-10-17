import { Popover } from "@base-ui/react/popover";
import { ListFilter } from "lucide-react";
import { Button } from "../components/shared";

const options = Array.from({ length: 18 }, (_, i) => i + 3);
export function NameLengthFilter({
  lengths,
  onChange,
}: {
  lengths: number[];
  onChange: (lengths: number[]) => void;
}) {
  const summary = !lengths.length
    ? "All lengths"
    : lengths.length <= 3
      ? lengths.map((n) => `${n}L`).join(", ")
      : `${lengths.length} lengths`;
  return (
    <Popover.Root>
      <Popover.Trigger
        render={<Button variant="outline" size="sm" />}
        aria-label="Filter by length"
      >
        <ListFilter size={14} />
        {summary}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={8}
          align="end"
          className="length-filter-position"
        >
          <Popover.Popup className="length-filter-popup">
            <Popover.Title className="length-filter-title">
              Filter by length
            </Popover.Title>
            <div className="length-filter-grid">
              {options.map((n) => (
                <label key={n} className="checkbox-label">
                  <input
                    type="checkbox"
                    aria-label={`${n} letters`}
                    checked={lengths.includes(n)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...lengths, n].sort((a, b) => a - b)
                          : lengths.filter((x) => x !== n),
                      )
                    }
                  />
                  {n}L
                </label>
              ))}
            </div>
            <div className="actions">
              <Button size="sm" variant="ghost" onClick={() => onChange([])}>
                All lengths
              </Button>
              <Popover.Close render={<Button size="sm" variant="outline" />}>
                Done
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
