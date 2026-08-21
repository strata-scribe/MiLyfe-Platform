'use client';

import { useRouter } from 'next/navigation';

const rules = [
  { icon: '✅', label: 'Allowed', items: ['Community news and neighborhood updates', 'Photos and videos you created', 'Civic issues, reports, and concerns', 'Event promotion and community organizing', 'Business advertising (honest and accurate)', 'Educational content in any subject', 'Political speech and advocacy (for community issues)', 'Satire and humor (clearly labeled)', 'Art, music, and creative expression', 'Fundraising for community causes'] },
  { icon: '🚫', label: 'Not Allowed', items: ['Content that endangers physical safety of a person', 'Doxxing (publishing private info without consent)', 'Sexual content involving minors — instant permanent ban, reported to law enforcement', 'Coordinated harassment of an individual', 'Impersonating another member or organization', 'Spam (mass unsolicited messages or posts)', 'Fraudulent listings or false advertising', 'Sharing others\' private communications without consent', 'Content designed to scam or defraud community members', 'Threats of violence (as opposed to protected political speech)'] },
  { icon: '⚠️', label: 'Context-Dependent', items: ['Adult content: allowed if clearly labeled, not in public feeds', 'Graphic news content: allowed with content warning', 'Controversial political content: protected but may be labeled', 'Drug discussion: harm reduction allowed, dealing/selling not allowed', 'Legal disputes: factual account allowed, harassment not allowed'] },
];

export default function ContentPolicyPage() {
  const router = useRouter();

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/constitution')} className="text-teal-500 text-sm">← Constitution</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Content Policy</h1>
      </div>

      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          This policy was written by the founding community and is subject to amendment by governance vote (30% quorum, simple majority). The goal is maximum free expression with minimum harm. When in doubt, the 1st Amendment is the guide.
        </p>
      </div>

      {rules.map(section => (
        <div key={section.label} className="card space-y-3">
          <h2 className="text-sm font-bold text-harbor-800 dark:text-white">{section.icon} {section.label}</h2>
          <div className="space-y-1">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={section.label === 'Allowed' ? 'text-teal-500' : section.label === 'Not Allowed' ? 'text-red-400' : 'text-yellow-500'}>•</span>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-harbor-800 dark:text-white">Enforcement Process</h2>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <p>1. Report submitted (any member can report content)</p>
          <p>2. Community moderator reviews within 24 hours</p>
          <p>3. If violation: warning issued, content optionally removed</p>
          <p>4. Repeated violations: escalate per Constitution enforcement ladder</p>
          <p>5. Any action can be appealed within 7 days</p>
          <p>6. Child safety violations: reported to law enforcement immediately, no appeal</p>
        </div>
      </div>

      <div className="card">
        <p className="text-xs text-gray-500 text-center">Version 1.0 — Ratified August 2026 · <button onClick={() => router.push('/govern')} className="text-teal-500 underline">Propose an amendment</button></p>
      </div>
    </div>
  );
}
