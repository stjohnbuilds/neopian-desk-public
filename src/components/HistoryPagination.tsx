import { Button } from "./shared";

export function HistoryPagination({
  page,
  pages,
  total,
  start,
  end,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  start: number;
  end: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="actions history-pagination" aria-label="History pages">
      <span className="muted text-small" aria-live="polite">
        {start}–{end} of {total} · Page {page + 1} of {pages}
      </span>
      <Button
        variant="outline"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        disabled={page + 1 >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
