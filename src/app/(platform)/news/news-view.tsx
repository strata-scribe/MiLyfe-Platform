'use client';

import { Newspaper, Eye, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_COLORS: Record<string, string> = {
  community: 'default',
  governance: 'harbor',
  economy: 'mly',
  safety: 'destructive',
  culture: 'secondary',
  events: 'success',
};

interface Props {
  featured: any[];
  articles: any[];
}

export function NewsView({ featured, articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-title">News</h1>
          <p className="page-subtitle">Community journalism, by citizens</p>
        </div>
        <EmptyState
          icon={Newspaper}
          title="No news yet"
          description="Community news will appear here as citizens publish articles."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">News</h1>
        <p className="page-subtitle">Community journalism, by citizens</p>
      </div>

      {/* Featured articles */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">Featured articles</h2>
          <div className="space-y-3">
            {featured.map((article) => (
              <Card key={article.id} className="overflow-hidden">
                {article.cover_image && (
                  <div className="h-40 bg-gray-200 dark:bg-harbor-800">
                    <img
                      src={article.cover_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className={article.cover_image ? 'pt-4' : 'pt-4'}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={(CATEGORY_COLORS[article.category] as any) || 'default'} className="capitalize">
                      {article.category}
                    </Badge>
                    {article.featured && <Badge variant="mly">Featured</Badge>}
                  </div>
                  <h3 className="text-base font-bold text-harbor-800 dark:text-white mb-1">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={article.author?.display_name || 'U'} src={article.author?.avatar_url} size="sm" />
                      <div>
                        <p className="text-xs font-medium">{article.author?.display_name}</p>
                        <p className="text-xs text-gray-500">
                          {article.published_at && formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" aria-hidden="true" />{article.view_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All articles */}
      <section aria-labelledby="all-articles-heading">
        <h2 id="all-articles-heading" className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Latest
        </h2>
        <div className="space-y-3">
          {articles.filter(a => !featured.find(f => f.id === a.id)).map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={(CATEGORY_COLORS[article.category] as any) || 'default'} className="capitalize text-[10px]">
                    {article.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-1">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{article.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    @{article.author?.username} · {article.published_at && formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                  </p>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" aria-hidden="true" />{article.view_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
