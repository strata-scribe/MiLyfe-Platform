'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

type DocSection = 'preamble' | 'rights' | 'governance' | 'economy' | 'enforcement' | 'amendment';

const sections: { key: DocSection; title: string; icon: string }[] = [
  { key: 'preamble', title: 'Preamble', icon: '📜' },
  { key: 'rights', title: 'Bill of Rights', icon: '🛡️' },
  { key: 'governance', title: 'Governance', icon: '⚖️' },
  { key: 'economy', title: 'Economic Rights', icon: '💰' },
  { key: 'enforcement', title: 'Enforcement', icon: '🔒' },
  { key: 'amendment', title: 'Amendments', icon: '📝' },
];

export default function ConstitutionPage() {
  const [active, setActive] = useState<DocSection>('preamble');

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiLyfe Constitution</h1>
        <p className="text-xs text-gray-500">The governing document of this platform. Amendable only by supermajority.</p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActive(s.key)} className={cn('flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', active === s.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            <span>{s.icon}</span> {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card prose-sm space-y-4">
        {active === 'preamble' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Preamble</h2>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              We, the members of the MiLyfe community, in order to form a more connected, equitable, and self-governing civic body, do establish this Constitution for the platform known as MiLyfe.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              This document establishes the rights of every member, the structure of community governance, the principles of the $MLY economy, and the process by which these rules may be amended.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              This platform exists to serve its members — not the other way around. No administrator, corporation, or government entity holds power above the community itself, except where the Constitution of the United States requires compliance.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic">
              Ratified upon platform launch. Effective immediately. Amendable by the people.
            </p>
          </div>
        )}

        {active === 'rights' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Bill of Rights</h2>
            <p className="text-xs text-gray-500">These rights require 75% supermajority to amend.</p>

            {[
              { num: 1, title: 'Right to Privacy', text: 'Your data, messages, vault contents, journal entries, and health records are yours. The platform shall not scan, sell, or share private content without explicit consent or valid legal compulsion (warrant).' },
              { num: 2, title: 'Right to Due Process', text: 'No account shall be suspended, banned, or restricted without: (1) written notice of the specific violation, (2) opportunity to respond, and (3) right to appeal to a community review board.' },
              { num: 3, title: 'Right to Be Heard', text: 'Every member may submit proposals, speak at governance, vote on community decisions, and petition for change. No minimum Standing required to propose or vote.' },
              { num: 4, title: 'Right to Leave', text: 'Any member may export all their data in a standard format, delete their account permanently, and depart the platform with no penalty. Data deletion is true deletion — completed within 30 days.' },
              { num: 5, title: 'Right to Anonymity', text: 'Safety mode, anonymous posting, and anonymous tips cannot be forcibly de-anonymized by platform administrators. Only a valid court order can compel identification.' },
              { num: 6, title: 'Right to Equal Access', text: 'No person shall be denied platform access or features based on race, ethnicity, gender, sexual orientation, religion, disability, criminal history, immigration status, or economic status.' },
              { num: 7, title: 'Right to Economic Participation', text: 'No member shall be excluded from earning, holding, spending, or exchanging $MLY without due process. The $MLY economy is open to all members in good standing.' },
              { num: 8, title: 'Right Against Surveillance', text: 'The platform shall not engage in behavioral prediction, pattern profiling for law enforcement, data sales, or government data partnerships. No tracking beyond what is explicitly stated and consented to.' },
              { num: 9, title: 'Right to Free Expression', text: 'Content shall only be removed for violations defined in the community-voted Content Policy. Political viewpoint shall never be grounds for content removal or account action.' },
              { num: 10, title: 'Right to Knowledge', text: 'MiLearn content, constitutional rights information, community resources, and platform documentation shall always be free and accessible to all members, including offline.' },
            ].map(r => (
              <div key={r.num} className="space-y-1 pb-3 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Article {r.num}: {r.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {active === 'governance' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Governance Structure</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 1: Decision Making</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">All platform decisions affecting the community shall be decided by member vote through the Governance system. No unilateral administrative action shall override a governance vote except to prevent imminent physical harm or comply with law.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 2: Proposals</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Any member may submit a proposal. Proposals require a minimum discussion period of 7 days before voting begins. Voting periods are set by the proposer (minimum 3 days, maximum 30 days).</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 3: Quorum</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Standard proposals: 10% quorum, simple majority passes. Budget allocation over 1000 MLY: 20% quorum. Platform rule changes: 30% quorum. Constitutional amendments: 50% quorum + 67% supermajority. Bill of Rights amendments: 50% quorum + 75% supermajority.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 4: Delegation</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Members may delegate their vote to another member on a per-category or blanket basis. Delegations expire every 90 days and must be re-confirmed. Delegates must disclose their delegated vote count publicly.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 5: Moderators</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Community moderators are elected by governance vote. Terms last 6 months. No moderator may serve more than 3 consecutive terms. Moderators may be recalled by a governance vote at any time (20% quorum required).</p>
              </div>
            </div>
          </div>
        )}

        {active === 'economy' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Economic Rights & $MLY</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 1: Nature of $MLY</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">$MLY is a community credit pegged at 1 MLY = $1 USD by community consensus. It is earned through participation, spent within the community economy, and freely exchangeable between any willing parties without platform permission or restriction.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 2: Earning</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">$MLY is earned through: daily health check-ins ($5), issue reporting ($10), daily UBI for active members ($10), voting on proposals ($3), offering mutual aid ($15), completing courses (varies), guild participation (varies), and content creation ($5).</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 3: Exchange</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Any holder of $MLY may freely exchange, transfer, spend, or convert their holdings with any willing counterparty. The platform facilitates but does not restrict peer-to-peer exchange. No approval is required for any transaction between consenting parties.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 4: Community Treasury</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">10% of all newly minted $MLY is allocated to the Community Treasury. Expenditure from the Treasury requires a governance vote with 20% quorum. The Treasury balance is publicly visible at all times.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 5: No Confiscation</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">No member&apos;s $MLY balance shall be seized, frozen, or confiscated without due process. Fraud-related holds require a governance review within 72 hours.</p>
              </div>
            </div>
          </div>
        )}

        {active === 'enforcement' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Enforcement & Accountability</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 1: Escalation Ladder</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Enforcement follows a strict escalation: (1) Warning with explanation, (2) 24-hour cooldown, (3) Standing penalty (10-20 points), (4) 7-day suspension with appeal right, (5) Permanent ban (requires governance supermajority vote). No step may be skipped except in cases of imminent physical harm.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 2: Transparency</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">All moderation actions are logged publicly (anonymized). Weekly transparency reports show: total warnings, suspensions, content removals, and appeals granted. No secret enforcement.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 3: Appeals</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Any member may appeal any moderation action. First appeal: reviewed by a different moderator. Second appeal: community review board (3 randomly selected Level 4+ members). Final appeal: full governance vote.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 4: Data & Law Enforcement</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">The platform shall not voluntarily share member data with law enforcement. Valid warrants issued by a court with jurisdiction shall be complied with to the minimum extent required by law. Affected members shall be notified unless legally prohibited. Overbroad requests shall be challenged.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 5: Administrator Limits</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Platform administrators may not: override governance votes, access private vaults/messages, modify $MLY balances without audit trail, or grant themselves Standing. Administrative actions are logged and auditable by any member.</p>
              </div>
            </div>
          </div>
        )}

        {active === 'amendment' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">Amendment Process</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 1: Who May Propose</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Any member in good standing may propose a constitutional amendment through the Governance system.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 2: Discussion Period</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Constitutional amendments require a minimum 14-day discussion period before voting begins. During this period, the community may comment, propose modifications, and debate.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 3: Passage Requirements</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">General constitutional amendments: 50% quorum + 67% supermajority. Amendments to the Bill of Rights (Articles 1-10): 50% quorum + 75% supermajority. These thresholds exist to protect minority rights from majority overreach.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 4: Effective Date</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Passed amendments take effect 7 days after vote conclusion, allowing members to prepare for changes. Emergency amendments (safety-related) may take effect immediately with 80% supermajority.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Section 5: Unamendable Principles</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">The following principles may never be amended: (1) The platform shall not sell member data. (2) The platform shall not engage in mass surveillance. (3) Every member retains the right to leave with their data. These exist above all governance.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          This constitution is a living document. Propose amendments through <a href="/govern" className="text-teal-500 underline">Governance</a>.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">Version 1.0 — Ratified August 2026</p>
      </div>
    </div>
  );
}

// Note: Content Policy is available at /constitution/policy
