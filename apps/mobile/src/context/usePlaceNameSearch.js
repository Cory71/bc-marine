import { useEffect, useState } from 'react';
import { searchPlaceNames } from '@bc-marine/shared';

// Look up BC place names (Deep Bay, Fanny Bay…) once typing pauses; searches under
// 3 letters are too vague. An older answer that arrives after a newer search is ignored.
const MIN_PLACE_SEARCH_LENGTH = 3;
const TYPING_PAUSE_MS = 300;

export function usePlaceNameSearch(query) {
  const [results, setResults] = useState({ query: '', places: [] });
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_PLACE_SEARCH_LENGTH) return undefined;
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchPlaceNames(trimmed)
        .then(places => isCurrent && setResults({ query: trimmed, places }))
        .catch(() => isCurrent && setResults({ query: trimmed, places: [] })); // offline: stations still work
    }, TYPING_PAUSE_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [trimmed]);

  return results.query === trimmed ? results.places : [];
}
