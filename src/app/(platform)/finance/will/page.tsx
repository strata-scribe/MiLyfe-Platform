'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface LegalDocument {
  id: string;
  user_id: string;
  document_type: string;
  title: string;
  content: string;
  status: 'draft' | 'finalized' | 'witnessed';
  witnesses: string[];
  created_at: string;
  updated_at: string;
}

interface Beneficiary {
  name: string;
  relationship: string;
  allocation: string;
}

interface WizardData {
  documentType: 'last_will' | 'living_trust' | 'financial_poa' | 'healthcare_poa';
  // Personal info
  fullName: string;
  address: string;
  dateOfBirth: string;
  ssn_last4: string;
  // Beneficiaries/Agents
  beneficiaries: Beneficiary[];
  // Executor
  executorName: string;
  executorRelationship: string;
  alternateExecutor: string;
  // Witnesses
  witness1: string;
  witness2: string;
}

type PageView = 'list' | 'wizard' | 'preview';

const DOC_TYPES = [
  { value: 'last_will', label: 'Last Will & Testament', icon: '📜', desc: 'Distribute assets after passing' },
  { value: 'living_trust', label: 'Living Trust', icon: '🏦', desc: 'Manage assets during life & after' },
  { value: 'financial_poa', label: 'Financial Power of Attorney', icon: '💼', desc: 'Authorize someone for finances' },
  { value: 'healthcare_poa', label: 'Healthcare Power of Attorney', icon: '🏥', desc: 'Medical decisions if incapacitated' },
];

const INITIAL_WIZARD: WizardData = {
  documentType: 'last_will',
  fullName: '', address: '', dateOfBirth: '', ssn_last4: '',
  beneficiaries: [{ name: '', relationship: '', allocation: '' }],
  executorName: '', executorRelationship: '', alternateExecutor: '',
  witness1: '', witness2: '',
};

export default function WillAndPOAPage() {
  const [view, setView] = useState<PageView>('list');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardData>(INITIAL_WIZARD);
  const [generatedContent, setGeneratedContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { user } = useAppStore();
  const TOTAL_STEPS = 6;

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
    setLoading(false);
  }

  function startWizard() {
    setWizard(INITIAL_WIZARD);
    setStep(1);
    setView('wizard');
  }

  function addBeneficiary() {
    setWizard(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { name: '', relationship: '', allocation: '' }],
    }));
  }

  function updateBeneficiary(index: number, field: keyof Beneficiary, value: string) {
    setWizard(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((b, i) => i === index ? { ...b, [field]: value } : b),
    }));
  }

  function removeBeneficiary(index: number) {
    if (wizard.beneficiaries.length <= 1) return;
    setWizard(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter((_, i) => i !== index),
    }));
  }

  function generateDocument(): string {
    const docType = DOC_TYPES.find(d => d.value === wizard.documentType);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let content = `${docType?.label?.toUpperCase() || 'LEGAL DOCUMENT'}\n\n`;
    content += `Date: ${date}\n\n`;
    content += `I, ${wizard.fullName}, residing at ${wizard.address}, born on ${wizard.dateOfBirth}, `;
    content += `being of sound mind and body, do hereby declare this to be my ${docType?.label}.\n\n`;

    if (wizard.documentType === 'last_will' || wizard.documentType === 'living_trust') {
      content += `ARTICLE I — BENEFICIARIES\n\n`;
      wizard.beneficiaries.forEach((b, i) => {
        content += `${i + 1}. ${b.name} (${b.relationship}): ${b.allocation}\n`;
      });
      content += `\nARTICLE II — EXECUTOR/TRUSTEE\n\n`;
      content += `I appoint ${wizard.executorName} (${wizard.executorRelationship}) as the Executor/Trustee of this document.\n`;
      if (wizard.alternateExecutor) {
        content += `In the event they cannot serve, I appoint ${wizard.alternateExecutor} as alternate.\n`;
      }
    } else {
      content += `ARTICLE I — GRANT OF AUTHORITY\n\n`;
      content += `I hereby appoint ${wizard.beneficiaries[0]?.name || '[Agent]'} (${wizard.beneficiaries[0]?.relationship || '[Relationship]'}) `;
      content += `as my agent with authority to ${wizard.documentType === 'financial_poa' ? 'manage my financial affairs' : 'make healthcare decisions on my behalf'} `;
      content += `in the event I am unable to do so.\n\n`;
      content += `Scope: ${wizard.beneficiaries[0]?.allocation || 'Full authority as permitted by law.'}\n`;
    }

    content += `\nWITNESSES\n\n`;
    content += `Witness 1: ${wizard.witness1}\n`;
    content += `Witness 2: ${wizard.witness2}\n\n`;
    content += `___________________________\n`;
    content += `Signature: ${wizard.fullName}\n`;
    content += `Date: ${date}\n\n`;
    content += `___________________________\n`;
    content += `Witness 1 Signature\n\n`;
    content += `___________________________\n`;
    content += `Witness 2 Signature\n`;

    return content;
  }

  function goToPreview() {
    const content = generateDocument();
    setGeneratedContent(content);
    setView('preview');
  }

  async function saveToVault() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const docType = DOC_TYPES.find(d => d.value === wizard.documentType);

    const { error } = await supabase.from('legal_documents').insert({
      user_id: user.id,
      document_type: wizard.documentType,
      title: `${docType?.label} — ${wizard.fullName}`,
      content: generatedContent,
      status: 'draft',
      witnesses: [wizard.witness1, wizard.witness2],
    });

    if (error) {
      toast.error('Failed to save document');
    } else {
      toast.success('Document saved to MiVault!');
      setView('list');
      loadDocuments();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Will & POA Builder</h1>
        <p className="text-xs text-gray-500">Create legal documents with community witnesses</p>
      </div>

      {/* Document List View */}
      {view === 'list' && (
        <div className="space-y-3">
          <button onClick={startWizard} className="btn-teal w-full">+ Create New Document</button>

          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-16" />) :
            documents.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📜</p>
                <p className="text-sm text-gray-500">No documents yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first will, trust, or power of attorney</p>
              </div>
            ) : documents.map(doc => (
              <div key={doc.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{DOC_TYPES.find(d => d.value === doc.document_type)?.icon || '📄'}</span>
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{doc.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(doc.created_at).toLocaleDateString()} · {doc.status}</p>
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize',
                  doc.status === 'witnessed' ? 'bg-green-100 text-green-700' :
                  doc.status === 'finalized' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>{doc.status}</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Wizard View */}
      {view === 'wizard' && (
        <div className="space-y-3">
          {/* Progress */}
          <div className="flex items-center gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className={cn('flex-1 h-1 rounded-full', i < step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-harbor-700')} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-right">Step {step} of {TOTAL_STEPS}</p>

          {/* Step 1: Document Type */}
          {step === 1 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">What type of document?</h3>
              <div className="space-y-2">
                {DOC_TYPES.map(type => (
                  <button key={type.value} onClick={() => setWizard(prev => ({ ...prev, documentType: type.value as any }))} className={cn('w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3', wizard.documentType === type.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}>
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-harbor-800 dark:text-white">{type.label}</p>
                      <p className="text-[10px] text-gray-500">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Your Information</h3>
              <input value={wizard.fullName} onChange={e => setWizard(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Full legal name" className="input-field" />
              <input value={wizard.address} onChange={e => setWizard(prev => ({ ...prev, address: e.target.value }))} placeholder="Full address" className="input-field" />
              <input value={wizard.dateOfBirth} onChange={e => setWizard(prev => ({ ...prev, dateOfBirth: e.target.value }))} placeholder="Date of birth" className="input-field" type="date" />
              <input value={wizard.ssn_last4} onChange={e => setWizard(prev => ({ ...prev, ssn_last4: e.target.value }))} placeholder="Last 4 of SSN (optional, for verification)" className="input-field" maxLength={4} />
            </div>
          )}

          {/* Step 3: Beneficiaries / Agents */}
          {step === 3 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
                {wizard.documentType.includes('poa') ? 'Agent Information' : 'Beneficiaries'}
              </h3>
              <p className="text-xs text-gray-500">
                {wizard.documentType.includes('poa') ? 'Who should act on your behalf?' : 'Who receives what?'}
              </p>
              {wizard.beneficiaries.map((b, i) => (
                <div key={i} className="space-y-2 p-2 bg-gray-50 dark:bg-harbor-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">#{i + 1}</span>
                    {wizard.beneficiaries.length > 1 && (
                      <button onClick={() => removeBeneficiary(i)} className="text-red-400 text-xs">Remove</button>
                    )}
                  </div>
                  <input value={b.name} onChange={e => updateBeneficiary(i, 'name', e.target.value)} placeholder="Full name" className="input-field" />
                  <input value={b.relationship} onChange={e => updateBeneficiary(i, 'relationship', e.target.value)} placeholder="Relationship (spouse, child, friend...)" className="input-field" />
                  <input value={b.allocation} onChange={e => updateBeneficiary(i, 'allocation', e.target.value)} placeholder={wizard.documentType.includes('poa') ? 'Authority scope' : 'What they receive (e.g., 50% of estate, house...)'} className="input-field" />
                </div>
              ))}
              {!wizard.documentType.includes('poa') && (
                <button onClick={addBeneficiary} className="text-xs text-teal-600 hover:text-teal-700">+ Add another beneficiary</button>
              )}
            </div>
          )}

          {/* Step 4: Executor/Trustee */}
          {step === 4 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
                {wizard.documentType === 'living_trust' ? 'Trustee' : 'Executor'}
              </h3>
              <p className="text-xs text-gray-500">Who manages the execution of this document?</p>
              <input value={wizard.executorName} onChange={e => setWizard(prev => ({ ...prev, executorName: e.target.value }))} placeholder="Executor/Trustee name" className="input-field" />
              <input value={wizard.executorRelationship} onChange={e => setWizard(prev => ({ ...prev, executorRelationship: e.target.value }))} placeholder="Relationship" className="input-field" />
              <input value={wizard.alternateExecutor} onChange={e => setWizard(prev => ({ ...prev, alternateExecutor: e.target.value }))} placeholder="Alternate (if first cannot serve)" className="input-field" />
            </div>
          )}

          {/* Step 5: Witnesses */}
          {step === 5 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Witnesses</h3>
              <p className="text-xs text-gray-500">Two community members (Level 3+) who will witness your signing.</p>
              <input value={wizard.witness1} onChange={e => setWizard(prev => ({ ...prev, witness1: e.target.value }))} placeholder="Witness 1 — full name" className="input-field" />
              <input value={wizard.witness2} onChange={e => setWizard(prev => ({ ...prev, witness2: e.target.value }))} placeholder="Witness 2 — full name" className="input-field" />
              <p className="text-[10px] text-gray-400">Witnesses must be Level 3+ community members and cannot be beneficiaries.</p>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Review Your Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-harbor-800">
                  <span className="text-gray-500">Document</span>
                  <span className="text-harbor-800 dark:text-white">{DOC_TYPES.find(d => d.value === wizard.documentType)?.label}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-harbor-800">
                  <span className="text-gray-500">Name</span>
                  <span className="text-harbor-800 dark:text-white">{wizard.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-harbor-800">
                  <span className="text-gray-500">Beneficiaries</span>
                  <span className="text-harbor-800 dark:text-white">{wizard.beneficiaries.filter(b => b.name).length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-harbor-800">
                  <span className="text-gray-500">Executor</span>
                  <span className="text-harbor-800 dark:text-white">{wizard.executorName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Witnesses</span>
                  <span className="text-harbor-800 dark:text-white">{wizard.witness1}, {wizard.witness2}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2 border border-gray-200 dark:border-harbor-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                Back
              </button>
            )}
            <button onClick={() => { setView('list'); }} className="py-2 px-3 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            {step < TOTAL_STEPS ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-teal flex-1">Next</button>
            ) : (
              <button onClick={goToPreview} className="btn-teal flex-1">Generate Document</button>
            )}
          </div>
        </div>
      )}

      {/* Preview View */}
      {view === 'preview' && (
        <div className="space-y-3">
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Document Preview</h3>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-harbor-900 p-3 rounded-lg max-h-96 overflow-y-auto">
              {generatedContent}
            </pre>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setView('wizard'); setStep(6); }} className="flex-1 py-2 border border-gray-200 dark:border-harbor-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
              Edit
            </button>
            <button onClick={saveToVault} disabled={saving} className="btn-teal flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : '🔐 Save to MiVault'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">This is a template — consult a legal professional for your jurisdiction.</p>
        </div>
      )}
    </div>
  );
}
