'use client';

import { useState } from 'react';
import { BookOpen, Plus, Search, Edit, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  userId: string;
  pages: any[];
}

export function WikiView({ userId, pages }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<any | null>(null);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const supabase = createClient();
    const { error } = await supabase.from('wiki_pages').insert({
      slug,
      title: title.trim(),
      body: body.trim(),
      category,
      author_id: userId,
    });

    if (error) {
      if (error.code === '23505') toast.error('A page with this title already exists');
      else toast.error(error.message);
    } else {
      toast.success('Wiki page created!');
      setTitle('');
      setBody('');
      setShowCreate(false);
    }
    setSubmitting(false);
  }

  const filteredPages = searchQuery
    ? pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pages;

  // Group by category
  const grouped = filteredPages.reduce((acc: Record<string, any[]>, page) => {
    const cat = page.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Wiki</h1>
          <p className="page-subtitle">Community knowledge base</p>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(!showCreate); setSelectedPage(null); }}>
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New Page
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wiki..."
          className="pl-9"
          aria-label="Search wiki pages"
        />
      </div>

      {/* Create page form */}
      {showCreate && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader>
            <CardTitle>New Wiki Page</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPage} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title"
                required
                maxLength={100}
                aria-label="Page title"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-950 px-3 text-sm"
                aria-label="Category"
              >
                <option value="general">General</option>
                <option value="guides">Guides</option>
                <option value="governance">Governance</option>
                <option value="economy">Economy</option>
                <option value="safety">Safety</option>
                <option value="technical">Technical</option>
              </select>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your wiki content... (Markdown supported)"
                required
                className="min-h-[200px] font-mono text-sm"
                aria-label="Page content"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Page'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Selected page view */}
      {selectedPage && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedPage.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">{selectedPage.category}</Badge>
                  <span className="text-xs text-gray-500">
                    Last edited {formatDistanceToNow(new Date(selectedPage.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPage(null)}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {selectedPage.body}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages list */}
      {!selectedPage && (
        <>
          {Object.keys(grouped).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No wiki pages yet"
              description="Be the first to contribute knowledge to the community wiki."
            />
          ) : (
            Object.entries(grouped).map(([cat, catPages]) => (
              <section key={cat} aria-labelledby={`wiki-${cat}`}>
                <h2 id={`wiki-${cat}`} className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 capitalize">
                  {cat}
                </h2>
                <div className="space-y-2">
                  {catPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className="card w-full text-left flex items-center justify-between cursor-pointer hover:border-teal-200 dark:hover:border-teal-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 text-teal-500 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                            {page.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {page.revision_count} revision{page.revision_count !== 1 ? 's' : ''} · by @{page.author?.username}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
