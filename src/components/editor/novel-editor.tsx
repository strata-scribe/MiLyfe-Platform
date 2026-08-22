'use client';

import { useState } from 'react';
import {
  EditorRoot,
  EditorContent,
  type JSONContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
} from 'novel';
import { cn } from '@/lib/utils/cn';

interface NovelEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

/**
 * Production-ready Notion-style rich text editor powered by Novel (Tiptap under the hood).
 * Features: slash commands, bubble menu, markdown shortcuts, keyboard navigation.
 */
export function NovelEditor({
  initialContent,
  onChange,
  onTextChange,
  placeholder = 'Start writing... (use / for commands)',
  className,
  editable = true,
}: NovelEditorProps) {
  const [openSlash, setOpenSlash] = useState(false);

  return (
    <div className={cn('relative w-full', className)}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          editable={editable}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            onChange?.(json);
            onTextChange?.(editor.getText());
          }}
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none',
            '[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3',
            '[&_.ProseMirror]:rounded-lg [&_.ProseMirror]:border [&_.ProseMirror]:border-gray-200',
            '[&_.ProseMirror]:dark:border-harbor-700 [&_.ProseMirror]:bg-white [&_.ProseMirror]:dark:bg-harbor-900',
            '[&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:ring-2 [&_.ProseMirror]:focus:ring-teal-500',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          )}
          editorProps={{
            attributes: {
              class: 'focus:outline-none text-sm text-harbor-800 dark:text-white leading-relaxed',
              'data-placeholder': placeholder,
            },
          }}
        >
          {/* Slash Command Menu */}
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900 shadow-xl transition-all">
            <EditorCommandEmpty className="px-3 py-2 text-xs text-gray-400">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              <EditorCommandItem
                value="heading1"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">H1</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Heading 1</p>
                  <p className="text-[10px] text-gray-400">Large section heading</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="heading2"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">H2</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Heading 2</p>
                  <p className="text-[10px] text-gray-400">Medium section heading</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="heading3"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">H3</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Heading 3</p>
                  <p className="text-[10px] text-gray-400">Small section heading</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="bulletList"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).toggleBulletList().run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">•</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Bullet List</p>
                  <p className="text-[10px] text-gray-400">Unordered list of items</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="orderedList"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">1.</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Numbered List</p>
                  <p className="text-[10px] text-gray-400">Ordered list of items</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="blockquote"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg">"</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Quote</p>
                  <p className="text-[10px] text-gray-400">Capture a quote</p>
                </div>
              </EditorCommandItem>
              <EditorCommandItem
                value="codeBlock"
                onCommand={({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-harbor-800 rounded-lg cursor-pointer"
              >
                <span className="text-lg font-mono">{'{}'}</span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">Code Block</p>
                  <p className="text-[10px] text-gray-400">Write code with syntax highlighting</p>
                </div>
              </EditorCommandItem>
            </EditorCommandList>
          </EditorCommand>

          {/* Bubble Menu for text formatting */}
          <EditorBubble className="flex items-center gap-0.5 rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900 shadow-xl p-1">
            <BubbleButton command="toggleBold" label="B" className="font-bold" />
            <BubbleButton command="toggleItalic" label="I" className="italic" />
            <BubbleButton command="toggleStrike" label="S" className="line-through" />
            <BubbleButton command="toggleCode" label="<>" className="font-mono text-[10px]" />
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}

function BubbleButton({ command, label, className }: { command: string; label: string; className?: string }) {
  return (
    <EditorBubbleItem
      onSelect={(editor) => {
        switch (command) {
          case 'toggleBold': editor.chain().focus().toggleBold().run(); break;
          case 'toggleItalic': editor.chain().focus().toggleItalic().run(); break;
          case 'toggleStrike': editor.chain().focus().toggleStrike().run(); break;
          case 'toggleCode': editor.chain().focus().toggleCode().run(); break;
        }
      }}
    >
      <button
        type="button"
        className={cn(
          'px-2 py-1 rounded text-xs text-harbor-800 dark:text-white hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors',
          className
        )}
      >
        {label}
      </button>
    </EditorBubbleItem>
  );
}
