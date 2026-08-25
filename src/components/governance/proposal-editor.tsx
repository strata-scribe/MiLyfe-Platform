'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { createProposal } from '@/lib/actions/governance';
import { FormField, inputStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  category: z.enum(['general', 'treasury', 'policy', 'amendment', 'recall']),
  voting_days: z.coerce.number().int().min(3).max(30),
});

type FormData = z.infer<typeof schema>;

interface ProposalEditorProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProposalEditor({ open, onClose, onSuccess }: ProposalEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'general',
      voting_days: 14,
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your proposal here. Be clear about what you want to change, why, and how it will be implemented...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
      },
    },
  });

  if (!open) return null;

  async function onSubmit(data: FormData) {
    const body = editor?.getHTML() || '';
    if (body.length < 50 || body === '<p></p>') {
      setServerError('Proposal body must be at least 50 characters. Explain what you want to change and why.');
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await createProposal({
        title: data.title,
        body,
        category: data.category,
        voting_days: data.voting_days,
      });
      if (result.error) {
        setServerError(result.error);
      } else {
        reset();
        editor?.commands.clearContent();
        onSuccess?.();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Proposal</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Title" error={errors.title} required>
            <input {...register('title')} placeholder="What do you want to propose?" className={inputStyles} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" error={errors.category} required>
              <select {...register('category')} className={selectStyles}>
                <option value="general">General</option>
                <option value="treasury">Treasury Spend</option>
                <option value="policy">Policy Change</option>
                <option value="amendment">Constitutional Amendment</option>
                <option value="recall">Role Recall</option>
              </select>
            </FormField>

            <FormField label="Voting Period (days)" error={errors.voting_days}>
              <select {...register('voting_days')} className={selectStyles}>
                <option value="3">3 days (emergency)</option>
                <option value="7">7 days</option>
                <option value="14">14 days (standard)</option>
                <option value="21">21 days</option>
                <option value="30">30 days</option>
              </select>
            </FormField>
          </div>

          {/* Rich text editor */}
          <div>
            <label className="text-sm font-medium">
              Proposal Body <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 rounded-md border focus-within:ring-2 focus-within:ring-ring">
              {/* Toolbar */}
              {editor && (
                <div className="flex flex-wrap gap-1 border-b px-2 py-1.5">
                  <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    B
                  </ToolbarButton>
                  <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    I
                  </ToolbarButton>
                  <ToolbarButton
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    H2
                  </ToolbarButton>
                  <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    • List
                  </ToolbarButton>
                  <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    1. List
                  </ToolbarButton>
                  <ToolbarButton
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  >
                    " Quote
                  </ToolbarButton>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Explain what you want, why, and how. Be specific enough that people can vote on it clearly.
            </p>
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <SubmitButton loading={isPending} className="flex-1">
              Submit Proposal
            </SubmitButton>
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2.5 text-sm text-muted-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToolbarButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}
