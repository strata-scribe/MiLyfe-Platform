'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type VaultTab = 'documents' | 'credentials' | 'activity';

interface VaultDoc {
  id: string;
  title: string;
  type: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  verified: boolean;
  expires_at: string | null;
  created_at: string;
}

interface VaultShare {
  id: string;
  document_id: string;
  shared_with_id: string;
  revoked: boolean;
  created_at: string;
  vault_documents?: { title: string };
  profiles?: { display_name: string };
}

const docTypeIcons: Record<string, string> = {
  id: '🪪',
  certificate: '📜',
  record: '📄',
  credential: '🎓',
};

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState<VaultTab>('documents');
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [shares, setShares] = useState<VaultShare[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<string>('id');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  // Load documents
  useEffect(() => {
    if (!user) return;

    const loadVault = async () => {
      const { data: docs } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (docs) setDocuments(docs);

      // Load shares
      const { data: sharesData } = await supabase
        .from('vault_shares')
        .select('*, vault_documents!vault_shares_document_id_fkey(title), profiles!vault_shares_shared_with_id_fkey(display_name)')
        .eq('shared_by_id', user.id)
        .eq('revoked', false);

      if (sharesData) setShares(sharesData);

      setLoading(false);
    };

    loadVault();
  }, [user, supabase, uploading]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadFile) return;

    setUploading(true);
    setUploadError('');

    // Upload file to vault storage (private bucket)
    const fileExt = uploadFile.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}-${uploadTitle.replace(/\s+/g, '_')}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from('vault')
      .upload(filePath, uploadFile);

    if (storageError) {
      setUploadError(`Upload failed: ${storageError.message}`);
      setUploading(false);
      return;
    }

    // Create document record
    const { error: insertError } = await supabase.from('vault_documents').insert({
      user_id: user.id,
      title: uploadTitle.trim(),
      type: uploadType,
      file_path: filePath,
      file_size: uploadFile.size,
      mime_type: uploadFile.type,
      expires_at: uploadExpiry || null,
    });

    if (insertError) {
      setUploadError(insertError.message);
    } else {
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadExpiry('');
    }

    setUploading(false);
  };

  const handleDelete = async (doc: VaultDoc) => {
    if (!user) return;
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    // Delete from storage
    await supabase.storage.from('vault').remove([doc.file_path]);

    // Delete record
    await supabase.from('vault_documents').delete().eq('id', doc.id);

    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const handleRevoke = async (shareId: string) => {
    await supabase
      .from('vault_shares')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('id', shareId);

    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  const handleDownload = async (doc: VaultDoc) => {
    const { data } = await supabase.storage
      .from('vault')
      .createSignedUrl(doc.file_path, 60); // 60 second expiry

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiVault</h1>
        <div className="flex items-center gap-1">
          <span className="text-xs text-teal-500 font-medium">🔒 Encrypted</span>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Your documents. Your control. Share only what you choose.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {(['documents', 'credentials', 'activity'] as VaultTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'documents' && (
        <div className="space-y-3">
          {/* Upload Form */}
          {showUpload && (
            <form onSubmit={handleUpload} className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-medium text-harbor-800 dark:text-white">Upload Document</h3>

              {uploadError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Document Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="input-field !py-2 text-sm"
                  placeholder="e.g., State ID"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="input-field !py-2 text-sm"
                >
                  <option value="id">ID / License</option>
                  <option value="certificate">Certificate</option>
                  <option value="record">Record</option>
                  <option value="credential">Credential</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">File</label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  required
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-harbor-100 file:text-harbor-700 dark:file:bg-harbor-800 dark:file:text-harbor-200"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Expiration Date (optional)</label>
                <input
                  type="date"
                  value={uploadExpiry}
                  onChange={(e) => setUploadExpiry(e.target.value)}
                  className="input-field !py-2 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadTitle.trim()}
                  className="btn-teal flex-1 text-sm !py-2 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="btn-primary flex-1 text-sm !py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Document List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card flex gap-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🔐</p>
              <p className="text-gray-500">No documents yet.</p>
              <p className="text-sm text-gray-400 mt-1">Upload your first document to get started.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="card flex items-center gap-3">
                <span className="text-2xl">{docTypeIcons[doc.type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-harbor-800 dark:text-white truncate">{doc.title}</h3>
                    {doc.verified && (
                      <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.type} · {formatFileSize(doc.file_size)}
                    {doc.expires_at && ` · Expires ${new Date(doc.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 text-sm"
                    aria-label="Download"
                  >
                    ⬇
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-primary w-full text-sm"
          >
            + Add Document
          </button>
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="space-y-3">
          <div className="card bg-gradient-to-r from-harbor-800 to-harbor-700 text-white">
            <h3 className="font-bold mb-1">MiLyfe Digital ID</h3>
            <p className="text-sm text-harbor-200">Verified Community Member</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-harbor-300">Since {user?.joined_at ? new Date(user.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Today'}</span>
              <span className="text-sm font-bold text-teal-300">Level {Math.min(5, Math.floor((documents.length + 1) / 2) + 1)}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Trust Score</h3>
            <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-3">
              <div
                className="bg-teal-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, 50 + documents.length * 7)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.min(100, 50 + documents.length * 7)}/100 — Built through community participation & verified documents
            </p>
          </div>

          {/* Active Shares */}
          <div className="card">
            <h3 className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Active Shares</h3>
            {shares.length === 0 ? (
              <p className="text-xs text-gray-400">No active shares. Your documents are fully private.</p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                    <span className="text-sm text-harbor-800 dark:text-gray-200">
                      {(share.vault_documents as any)?.title ?? 'Document'} → {(share.profiles as any)?.display_name ?? 'Someone'}
                    </span>
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="text-xs text-red-500 font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No activity yet. Upload a document to start.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="card flex items-center gap-3">
                <span className="text-xl">📤</span>
                <div className="flex-1">
                  <p className="text-sm text-harbor-800 dark:text-white">
                    Uploaded &quot;{doc.title}&quot;
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <div className="flex items-start gap-2">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Your privacy is absolute</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Documents are stored in an encrypted private bucket. Shares are revocable. One tap to delete permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
