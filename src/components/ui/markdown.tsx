'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils/cn';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

/**
 * Production-ready Markdown renderer with GFM (tables, strikethrough, etc.).
 * Used for: wiki pages, forum posts, course content, blog preview.
 */
export function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  return (
    <div className={cn(
      'prose dark:prose-invert max-w-none',
      compact ? 'prose-sm' : 'prose-base',
      'prose-headings:text-harbor-800 dark:prose-headings:text-white prose-headings:font-bold',
      'prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed',
      'prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline',
      'prose-code:text-teal-700 dark:prose-code:text-teal-400 prose-code:bg-gray-100 dark:prose-code:bg-harbor-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
      'prose-pre:bg-gray-900 dark:prose-pre:bg-harbor-950 prose-pre:rounded-xl',
      'prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/50 dark:prose-blockquote:bg-teal-900/10 prose-blockquote:rounded-r-lg prose-blockquote:py-1',
      'prose-img:rounded-xl prose-img:shadow-md',
      'prose-table:text-sm',
      'prose-th:bg-gray-50 dark:prose-th:bg-harbor-900 prose-th:px-3 prose-th:py-2',
      'prose-td:px-3 prose-td:py-2',
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
