'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  category: string;
  version: number;
  views: number;
  locked: boolean;
  created_by: string;
  last_edited_by: string | null;
  updated_at: string;
  profiles?: { display_name: string };
}

const CATEGORIES = ['all', 'how-to', 'resources', 'history', 'policies', 'faq', 'neighborhoods', 'general'] as const;

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [viewingPage, setViewingPage] = useState<WikiPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // Create new page
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newContent, setNewContent] = useState('');

  const { user } = useAppStore();

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    const supabase = createClient();
    const { data } = await supabase
      .from('wiki_pages')
      .select('*, profiles!wiki_pages_created_by_fkey(display_name)')
      .order('updated_at', { ascending: false });
    if (data) setPages(data as any);
    setLoading(false);
  }

  async function handleCreatePage() {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase.from('wiki_pages').insert({
      slug,
      title: newTitle.trim(),
      content_md: newContent.trim(),
      category: newCategory,
      created_by: user.id,
      last_edited_by: user.id,
    }).select().single();

    if (!error && data) {
      // Create initial revision
      await supabase.from('wiki_revisions').insert({
        page_id: data.id,
        editor_id: user.id,
        content_md: newContent.trim(),
        edit_summary: 'Initial creation',
        version: 1,
      });

      setNewTitle('');
      setNewContent('');
      setCreating(false);
      loadPages();
    }
    setSaving(false);
  }

  async function handleSaveEdit() {
    if (!user || !viewingPage || !editContent.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const newVersion = viewingPage.version + 1;

    await supabase.from('wiki_pages').update({
      content_md: editContent.trim(),
      last_edited_by: user.id,
      version: newVersion,
      updated_at: new Date().toISOString(),
    }).eq('id', viewingPage.id);

    await supabase.from('wiki_revisions').insert({
      page_id: viewingPage.id,
      editor_id: user.id,
      content_md: editContent.trim(),
      edit_summary: editSummary.trim() || 'Updated page',
      version: newVersion,
    });

    // Increment views count
    setViewingPage({ ...viewingPage, content_md: editContent.trim(), version: newVersion });
    setEditing(false);
    setEditSummary('');
    setSaving(false);
    loadPages();
  }

  const filteredPages = pages.filter((p) => {
    const matchesCategory = category === 'all' || p.category === category;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content_md.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Viewing a specific page
  if (viewingPage) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <button onClick={() => { setViewingPage(null); setEditing(false); }} className="text-xs text-teal-600 hover:underline">
            ← Back to Wiki
          </button>
          {user && !editing && !viewingPage.locked && (
            <button onClick={() => { setEditing(true); setEditContent(viewingPage.content_md); }} className="text-xs text-teal-600 font-medium">
              ✏️ Edit
            </button>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 dark:bg-harbor-800 px-2 py-0.5 rounded capitalize">{viewingPage.category}</span>
            <span className="text-xs text-gray-400">v{viewingPage.version} · {viewingPage.views} views</span>
          </div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">{viewingPage.title}</h1>
        </div>

        {editing ? (
          <div className="card space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input-field resize-none font-mono text-sm"
              rows={15}
            />
            <input
              type="text"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="Edit summary (what did you change?)"
              className="input-field"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} disabled={saving} className="btn-teal flex-1 text-sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="card prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-harbor-700 dark:text-gray-200 leading-relaxed">
              {viewingPage.content_md}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">📖 Community Wiki</h1>
          <p className="text-xs text-gray-500">Community-edited knowledge base. Anyone Level 2+ can edit.</p>
        </div>
        {user && (
          <button onClick={() => setCreating(!creating)} className="btn-teal text-xs">
            + New Page
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create New Page</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Page title"
            className="input-field"
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field">
            {CATEGORIES.filter(c => c !== 'all').map((c) => (
              <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
            ))}
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your content (Markdown supported)..."
            className="input-field resize-none font-mono text-sm"
            rows={10}
          />
          <div className="flex gap-2">
            <button onClick={handleCreatePage} disabled={!newTitle.trim() || !newContent.trim() || saving} className="btn-teal flex-1 text-sm">
              {saving ? 'Creating...' : 'Publish Page'}
            </button>
            <button onClick={() => setCreating(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search wiki..."
        className="input-field"
      />

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all',
              category === c ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600'
            )}
          >
            {c === 'all' ? 'All' : c.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Pages list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card skeleton h-20" />)}</div>
      ) : filteredPages.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">📖</p>
          <p className="text-sm text-gray-500">{search ? 'No pages match your search.' : 'No wiki pages yet.'}</p>
          {user && <button onClick={() => setCreating(true)} className="text-xs text-teal-600 mt-2 hover:underline">Create the first page →</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setViewingPage(page)}
              className="card w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{page.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{page.content_md.slice(0, 100)}...</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                    <span className="capitalize bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">{page.category}</span>
                    <span>v{page.version}</span>
                    <span>{page.views} views</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
