'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitReport, type ReportInput } from '@/lib/actions/report';
import { toast } from 'sonner';

interface ReportButtonProps {
  resourceType: ReportInput['resource_type'];
  resourceId: string;
  /** Compact mode shows just an icon button */
  compact?: boolean;
}

const REASONS: { value: ReportInput['reason']; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

export function ReportButton({ resourceType, resourceId, compact }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportInput['reason'] | ''>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    setLoading(true);
    const result = await submitReport({
      resource_type: resourceType,
      resource_id: resourceId,
      reason,
      details,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Report submitted. Thank you for keeping the community safe.');
      setOpen(false);
      setReason('');
      setDetails('');
    }
    setLoading(false);
  }

  return (
    <>
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Report"
          title="Report this content"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-gray-500 hover:text-red-500">
          <Flag className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Report
        </Button>
      )}

      {/* Report modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-harbor-950 rounded-xl border border-gray-100 dark:border-harbor-800 shadow-xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Report content"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-harbor-800 dark:text-white">Report Content</h2>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-harbor-800 dark:text-gray-200 mb-2">
                  What&apos;s the issue?
                </label>
                <div className="space-y-1.5">
                  {REASONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer border transition-colors ${
                        reason === value
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-100 dark:border-harbor-800 hover:bg-gray-50 dark:hover:bg-harbor-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="accent-teal-500"
                      />
                      <span className="text-sm text-harbor-800 dark:text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="report-details" className="block text-sm font-medium text-harbor-800 dark:text-gray-200 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Anything else we should know..."
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="destructive" disabled={!reason || loading} className="flex-1">
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
