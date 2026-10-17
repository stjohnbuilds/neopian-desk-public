import { useEffect, useRef, useState } from "react";
import { onStoreRestore, updateStore, type Store } from "../persistence/store";
import {
  emptyBookmark,
  initialNameReview,
  combinedPokemonReview,
  reviewKey,
  isResultView,
  type NameBookmark,
  type NameReview,
} from "../core/name-review";
import type { NameCategory } from "../core/name-catalogue";

/** UI responds immediately; each change joins the same serialized save queue as results. */
export function useNameReview(store: Store) {
  const [review, setReview] = useState<NameReview>(() =>
    combinedPokemonReview(store.nameReview || initialNameReview()),
  );
  const current = useRef(review);
  const [error, setError] = useState("");
  useEffect(
    () =>
      onStoreRestore((restored) => {
        const next = combinedPokemonReview(
          restored.nameReview || initialNameReview(),
        );
        current.current = next;
        setReview(next);
        setError("");
      }),
    [],
  );
  const key = reviewKey(review.category, review.filter, review.resultCategory);
  const bookmark = review.bookmarks[key] || emptyBookmark();
  const change = (next: NameReview) => {
    current.current = next;
    setReview(next);
    void updateStore((s) => ({ ...s, nameReview: next }))
      .then(() => setError(""))
      .catch(() =>
        setError(
          "Your list position could not be saved. Results have not been changed.",
        ),
      );
  };
  const updateBookmark = (patch: Partial<NameBookmark>) => {
    const value = current.current,
      k = reviewKey(value.category, value.filter, value.resultCategory);
    const next = { ...(value.bookmarks[k] || emptyBookmark()), ...patch };
    if (
      JSON.stringify(next) ===
      JSON.stringify(value.bookmarks[k] || emptyBookmark())
    )
      return;
    change({ ...value, bookmarks: { ...value.bookmarks, [k]: next } });
  };
  const navigate = (category: NameCategory, filter: string) => {
    const next = { ...current.current, category, filter };
    if (isResultView(filter)) {
      const k = reviewKey(category, filter, next.resultCategory);
      next.bookmarks = {
        ...next.bookmarks,
        [k]: {
          ...(next.bookmarks[k] || emptyBookmark()),
          start: "",
          offset: 0,
          selected: [],
        },
      };
    }
    change(next);
  };
  const resultCategory = (category: NameCategory | "all") =>
    change({ ...current.current, resultCategory: category });
  return { review, bookmark, error, updateBookmark, navigate, resultCategory };
}
