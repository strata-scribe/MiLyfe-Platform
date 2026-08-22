'use client';

import { useQueryState, parseAsString, parseAsInteger, parseAsStringEnum } from 'nuqs';

/**
 * URL state hooks powered by nuqs — type-safe, shareable, persistent filters.
 * Values sync to the URL query string so users can share filtered views.
 */

// — Market Filters —
export function useMarketFilters() {
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'));
  const [type, setType] = useQueryState('type', parseAsString.withDefault('all'));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('recent'));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(0));

  return {
    category, setCategory,
    type, setType,
    sort, setSort,
    page, setPage,
    reset: () => { setCategory('all'); setType('all'); setSort('recent'); setPage(0); },
  };
}

// — Forum Filters —
export function useForumFilters() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('feed'));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('hot'));
  const [space, setSpace] = useQueryState('space', parseAsString.withDefault(''));

  return {
    tab, setTab,
    sort, setSort,
    space, setSpace,
    reset: () => { setTab('feed'); setSort('hot'); setSpace(''); },
  };
}

// — News Filters —
export function useNewsFilters() {
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('recent'));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(0));

  return {
    category, setCategory,
    sort, setSort,
    page, setPage,
    reset: () => { setCategory('all'); setSort('recent'); setPage(0); },
  };
}

// — Learn Filters —
export function useLearnFilters() {
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('All'));
  const [difficulty, setDifficulty] = useQueryState('difficulty', parseAsString.withDefault('all'));
  const [view, setView] = useQueryState('view', parseAsString.withDefault('browse'));

  return {
    category, setCategory,
    difficulty, setDifficulty,
    view, setView,
    reset: () => { setCategory('All'); setDifficulty('all'); setView('browse'); },
  };
}

// — Media Filters —
export function useMediaFilters() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('feed'));
  const [genre, setGenre] = useQueryState('genre', parseAsString.withDefault('all'));

  return {
    tab, setTab,
    genre, setGenre,
    reset: () => { setTab('feed'); setGenre('all'); },
  };
}

// — Generic Search —
export function useSearchState() {
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(0));

  return { query, setQuery, page, setPage };
}
