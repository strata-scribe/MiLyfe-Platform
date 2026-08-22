'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { searchApps, type SearchResult } from '@/lib/search/search-index';
import { createClient } from '@/lib/supabase/client';
import { trackSearchUsed } from '@/lib/analytics/track';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [peopleResults, setPeopleResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setPeopleResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search logic
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setPeopleResults([]);
      return;
    }

    // Static app search
    const appResults = searchApps(q);
    setResults(appResults);

    // People search from Supabase
    if (q.length >= 2) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(5);

        if (data && data.length > 0) {
          const people: SearchResult[] = data.map((p) => ({
            id: `person-${p.id}`,
            type: 'person' as const,
            title: p.display_name || p.email,
            description: p.email,
            href: `/connect?user=${p.id}`,
            icon: '👤',
            keywords: [],
          }));
          setPeopleResults(people);
        } else {
          setPeopleResults([]);
        }
      } catch {
        setPeopleResults([]);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timeout);
  }, [query, doSearch]);

  const allResults = [...results, ...peopleResults];

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    trackSearchUsed(query, allResults.length);
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search dialog */}
      <div
        className="relative w-full max-w-md mx-4 bg-white dark:bg-harbor-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-label={t('search.title')}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-harbor-800">
          <span className="text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent outline-none text-sm text-harbor-800 dark:text-white placeholder-gray-400"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline text-[10px] text-gray-400 bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query && allResults.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">{t('search.noResults', { query })}</p>
              <p className="text-xs text-gray-400 mt-1">{t('search.tryDifferent')}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-medium text-gray-400 uppercase px-2 py-1">
                Apps & Features
              </p>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedIndex === i
                      ? 'bg-harbor-100 dark:bg-harbor-800'
                      : 'hover:bg-gray-50 dark:hover:bg-harbor-800/50'
                  }`}
                >
                  <span className="text-lg">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.description}</p>
                  </div>
                  {r.app && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">
                      {r.app}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {peopleResults.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-harbor-800">
              <p className="text-[10px] font-medium text-gray-400 uppercase px-2 py-1">People</p>
              {peopleResults.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedIndex === results.length + i
                      ? 'bg-harbor-100 dark:bg-harbor-800'
                      : 'hover:bg-gray-50 dark:hover:bg-harbor-800/50'
                  }`}
                >
                  <span className="text-lg">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!query && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-harbor-800">
            <p className="text-xs text-gray-400 text-center">
              Type to search apps, features, and people
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small search trigger button for the top bar */
export function SearchTrigger() {
  const [, setOpen] = useState(false);

  const open = () => {
    // Dispatch keyboard event to open GlobalSearch
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
    setOpen(true);
  };

  return (
    <button
      onClick={open}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
      aria-label="Search (⌘K)"
      title="Search (⌘K)"
    >
      🔍
    </button>
  );
}
