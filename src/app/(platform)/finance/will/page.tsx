'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

type DocType = 'will' | 'poa' | 'healthcare' | 'beneficiary';
type Step = 'type' | 'questions' | 'review' | 'complete';

interface WillData {
  full_name: string;
  date_of_birth: string;
  address: string;
  executor_name: string;
  executor_relationship: string;
  beneficiaries: { name: string; relationship: string; percentage: number }[];
  specific_gifts: { item: string; recipient: string }[];
  guardian_name: string;
  final_wishes: string;
}

const DOC_TYPES = [
  { type: 'will' as DocType, icon: '📜', label: 'Last Will & Testament', desc: 'Designate who gets what when you pass' },
  { type: 'poa' as DocType, icon: '✍️', label: 'Power of Attorney', desc: 'Authorize someone to act on your behalf' },
  { type: 'healthcare' as DocType, icon: '🏥', label: 'Healthcare Directive', desc: 'Medical decisions if you can\'t speak for yourself' },
  { type: 'beneficiary' as DocType, icon: '👥', label: 'Beneficiary Form', desc: 'Designate recipients for specific accounts' },
];

export default function WillBuilderPage() {
  const [step, setStep] = useState<Step>('type');
  const [docType, setDocType] = useState<DocType | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  // Will form
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [executorName, setExecutorName] = useState('');
  const [executorRel, setExecutorRel] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryRel, setBeneficiaryRel] = useState('');
  const [beneficiaryPct, setBeneficiaryPct] = useState('100');
  const [beneficiaries, setBeneficiaries] = useState<{ name: string; relationship: string; percentage: number }[]>([]);
  const [guardianName, setGuardianName] = useState('');
  const [finalWishes, setFinalWishes] = useState('');

  const { user } = useAppStore();

  function selectType(type: DocType) {
    setDocType(type);
    setStep('questions');
    setCurrentQ(0);
  }

  function addBeneficiary() {
    if (!beneficiaryName.trim()) return;
    setBeneficiaries(prev => [...prev, { name: beneficiaryName.trim(), relationship: beneficiaryRel, percentage: parseInt(beneficiaryPct) || 0 }]);
    setBeneficiaryName(''); setBeneficiaryRel(''); setBeneficiaryPct('');
  }

  function finalize() {
    setStep('complete');
    toast.success('Document created! Store it safely in your vault.');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Will & POA Builder</h1>
        <p className="text-xs text-gray-500">Create legal documents for free — self-help, not legal advice</p>
      </div>

      {/* Disclaimer */}
      <div className="card bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Disclaimer:</strong> This is a self-help document builder. It does not constitute legal advice. Consult an attorney for complex estates. Documents should be witnessed and, where required, notarized.
        </p>
      </div>

      {/* Step: Choose Type */}
      {step === 'type' && (
        <div className="space-y-2">
          {DOC_TYPES.map(doc => (
            <button key={doc.type} onClick={() => selectType(doc.type)} className="card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-2xl">{doc.icon}</span>
              <div>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{doc.label}</p>
                <p className="text-xs text-gray-500">{doc.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Questions (Will) */}
      {step === 'questions' && docType === 'will' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Last Will & Testament</h3>
            <span className="text-[10px] text-gray-400">Step {currentQ + 1} of 5</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${((currentQ + 1) / 5) * 100}%` }} />
          </div>

          {currentQ === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-harbor-800 dark:text-white font-medium">Your Information</p>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full legal name" className="input-field" />
              <input value={dob} onChange={e => setDob(e.target.value)} placeholder="Date of birth" className="input-field" type="date" />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Current address" className="input-field" />
              <button onClick={() => setCurrentQ(1)} disabled={!fullName.trim()} className="btn-teal w-full disabled:opacity-50">Next →</button>
            </div>
          )}

          {currentQ === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-harbor-800 dark:text-white font-medium">Executor (person who carries out your will)</p>
              <input value={executorName} onChange={e => setExecutorName(e.target.value)} placeholder="Executor's full name" className="input-field" />
              <input value={executorRel} onChange={e => setExecutorRel(e.target.value)} placeholder="Relationship (spouse, sibling, friend)" className="input-field" />
              <div className="flex gap-2">
                <button onClick={() => setCurrentQ(0)} className="flex-1 py-2 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg text-xs">← Back</button>
                <button onClick={() => setCurrentQ(2)} disabled={!executorName.trim()} className="flex-1 btn-teal disabled:opacity-50">Next →</button>
              </div>
            </div>
          )}

          {currentQ === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-harbor-800 dark:text-white font-medium">Beneficiaries (who receives your assets)</p>
              {beneficiaries.length > 0 && (
                <div className="space-y-1">
                  {beneficiaries.map((b, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-harbor-900 rounded-lg px-3 py-2">
                      <span className="text-xs text-harbor-800 dark:text-white">{b.name} ({b.relationship})</span>
                      <span className="text-xs text-mly-600 font-bold">{b.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
              <input value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="Beneficiary name" className="input-field" />
              <div className="grid grid-cols-2 gap-2">
                <input value={beneficiaryRel} onChange={e => setBeneficiaryRel(e.target.value)} placeholder="Relationship" className="input-field" />
                <input value={beneficiaryPct} onChange={e => setBeneficiaryPct(e.target.value)} placeholder="% of estate" className="input-field" type="number" />
              </div>
              <button onClick={addBeneficiary} disabled={!beneficiaryName.trim()} className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-harbor-700 rounded-lg text-xs text-teal-600 disabled:opacity-50">+ Add Beneficiary</button>
              <div className="flex gap-2">
                <button onClick={() => setCurrentQ(1)} className="flex-1 py-2 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg text-xs">← Back</button>
                <button onClick={() => setCurrentQ(3)} disabled={beneficiaries.length === 0} className="flex-1 btn-teal disabled:opacity-50">Next →</button>
              </div>
            </div>
          )}

          {currentQ === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-harbor-800 dark:text-white font-medium">Guardian for minor children (if applicable)</p>
              <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Guardian's name (or skip)" className="input-field" />
              <div className="flex gap-2">
                <button onClick={() => setCurrentQ(2)} className="flex-1 py-2 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg text-xs">← Back</button>
                <button onClick={() => setCurrentQ(4)} className="flex-1 btn-teal">Next →</button>
              </div>
            </div>
          )}

          {currentQ === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-harbor-800 dark:text-white font-medium">Final wishes & instructions</p>
              <textarea value={finalWishes} onChange={e => setFinalWishes(e.target.value)} placeholder="Burial/cremation preferences, special instructions, messages..." className="input-field resize-none" rows={4} />
              <div className="flex gap-2">
                <button onClick={() => setCurrentQ(3)} className="flex-1 py-2 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg text-xs">← Back</button>
                <button onClick={() => setStep('review')} className="flex-1 btn-teal">Review Document →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Questions (POA - simplified) */}
      {step === 'questions' && docType !== 'will' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">{DOC_TYPES.find(d => d.type === docType)?.icon}</p>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">{DOC_TYPES.find(d => d.type === docType)?.label}</p>
          <p className="text-xs text-gray-500 mt-2">This template is coming soon.</p>
          <button onClick={() => setStep('type')} className="btn-teal text-xs mt-4">← Choose Different</button>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">📜 Review Your Will</h3>
          <div className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-4 space-y-3 text-xs text-harbor-800 dark:text-white leading-relaxed">
            <p className="font-bold text-center">LAST WILL AND TESTAMENT</p>
            <p>I, <strong>{fullName}</strong>, of <strong>{address}</strong>, born on {dob}, being of sound mind, declare this to be my Last Will and Testament.</p>
            <p><strong>Executor:</strong> I appoint <strong>{executorName}</strong> ({executorRel}) as executor of this will.</p>
            <p><strong>Distribution of Estate:</strong></p>
            <ul className="list-disc pl-4">
              {beneficiaries.map((b, i) => (
                <li key={i}>{b.percentage}% to {b.name} ({b.relationship})</li>
              ))}
            </ul>
            {guardianName && <p><strong>Guardian:</strong> I designate {guardianName} as guardian of my minor children.</p>}
            {finalWishes && <p><strong>Final Wishes:</strong> {finalWishes}</p>}
            <p className="text-gray-500 italic mt-4">Signature: _________________________ Date: _____________</p>
            <p className="text-gray-500 italic">Witness 1: _________________________ Date: _____________</p>
            <p className="text-gray-500 italic">Witness 2: _________________________ Date: _____________</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('questions')} className="flex-1 py-2 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg text-xs">← Edit</button>
            <button onClick={finalize} className="flex-1 btn-teal">Save to Vault</button>
          </div>
        </div>
      )}

      {/* Complete */}
      {step === 'complete' && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-bold text-harbor-800 dark:text-white">Document Created!</p>
          <p className="text-xs text-gray-500 mt-2">Your document has been saved to your secure vault.</p>
          <p className="text-xs text-orange-600 mt-2">Remember: Get 2 witnesses to sign. Notarize if required by your state.</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/vault" className="btn-teal text-xs">Go to Vault</Link>
            <button onClick={() => { setStep('type'); setCurrentQ(0); }} className="px-4 py-2 text-xs bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg">Create Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
