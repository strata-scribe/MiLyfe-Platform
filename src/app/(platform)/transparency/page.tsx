import { Metadata } from 'next';
import { Shield, TrendingDown, Wallet, Vote, Clock, BookOpen, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Transparency' };

const ALGORITHMS = [
  {
    id: 'ubi',
    icon: Wallet,
    title: 'Universal Basic Income (UBI)',
    color: 'text-mly-600 dark:text-mly-400',
    bg: 'bg-mly-50 dark:bg-mly-900/20',
    parameters: [
      { label: 'Amount', value: '100 $MLY per citizen per week' },
      { label: 'Schedule', value: 'Every Monday at 6:00 AM UTC' },
      { label: 'Eligibility', value: 'All members with active wallets' },
      { label: 'Cooldown', value: 'Min 6 days between distributions' },
      { label: 'Source', value: 'Community Treasury' },
    ],
    explanation: 'Every citizen receives a flat 100 $MLY weekly into their spending pot. This ensures everyone can participate in the community economy regardless of circumstances. UBI runs automatically and cannot be revoked by any individual — it requires a governance vote to change parameters.',
  },
  {
    id: 'decay',
    icon: TrendingDown,
    title: 'Standing Decay',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    parameters: [
      { label: 'Rate', value: '1% per day (compound)' },
      { label: 'Schedule', value: 'Daily at 3:00 AM UTC' },
      { label: 'Floor', value: '0 (facets never go negative)' },
      { label: 'Affected', value: 'All 8 standing facets equally' },
      { label: 'Exemption', value: 'None — everyone decays equally' },
    ],
    explanation: 'Standing decays at 1% per day using compound reduction. This means a score of 50 loses 0.5 points per day. After 30 days without activity, a score of 50 would be ~36.3. Decay ensures standing reflects recent community contribution, not historical reputation. The only way to maintain or grow standing is through continued participation: attestations from other citizens, completing quests, and community service.',
  },
  {
    id: 'standing',
    icon: Shield,
    title: 'Standing Facets',
    color: 'text-harbor-600 dark:text-harbor-400',
    bg: 'bg-harbor-50 dark:bg-harbor-900/20',
    parameters: [
      { label: 'Facets', value: 'Neighbor, Carer, Maker, Teacher, Keeper, Voice, Shop, Helper' },
      { label: 'Range', value: '0 to 100 per facet' },
      { label: 'Growth', value: 'Via attestations from other citizens (+weight)' },
      { label: 'Max attestation weight', value: '5 points per attestation' },
      { label: 'Daily attestation limit', value: '5 per person (giving)' },
    ],
    explanation: 'Standing is not a single score — it\'s 8 separate facets representing different ways you contribute. Neighbor means you\'re present and helpful locally. Carer means you look after people. Maker means you create things. Teacher means you share knowledge. Keeper means you protect the community. Voice means you participate in governance. Shop means you\'re active in the marketplace. Helper means you do community service. Each facet grows independently through attestations from other citizens, weighted 0.1 to 5 points.',
  },
  {
    id: 'proposals',
    icon: Vote,
    title: 'Proposal Lifecycle',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    parameters: [
      { label: 'Min standing to propose', value: '5.0 overall' },
      { label: 'Voting period', value: '3 to 30 days (proposer chooses)' },
      { label: 'Quorum (general)', value: '10 votes minimum' },
      { label: 'Quorum (treasury)', value: '15 votes minimum' },
      { label: 'Quorum (amendment)', value: '25 votes minimum' },
      { label: 'Quorum (recall)', value: '20 votes minimum' },
      { label: 'Pass condition', value: 'Quorum met + majority votes FOR' },
    ],
    explanation: 'Any citizen with standing ≥ 5 can create a proposal. The voting period is set by the proposer (3–30 days). During this time, any citizen can vote once (FOR or AGAINST). When the period closes, the system checks: (1) Did enough people vote (quorum)? (2) Did more people vote FOR than AGAINST? Both conditions must be true for a proposal to pass. Quorum requirements scale with the seriousness of the proposal category.',
  },
  {
    id: 'freshness',
    icon: Clock,
    title: 'Resource Freshness',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    parameters: [
      { label: 'Check frequency', value: 'Daily at 4:00 AM UTC' },
      { label: 'Trigger', value: 'Resource expires_at passes current time' },
      { label: 'Action', value: 'Mark stale + generate verification quest' },
      { label: 'Quest reward', value: '5–15 $MLY from treasury' },
      { label: 'Quest expiry', value: '7 days' },
    ],
    explanation: 'Community resources (shelters, food banks, services) have expiration dates. When a resource expires, it\'s marked "stale" and a verification quest is automatically created. Citizens can earn $MLY by physically verifying that a resource still exists and updating its information. This keeps the community directory accurate without relying on a central authority.',
  },
  {
    id: 'transfer',
    icon: Zap,
    title: 'Transfer Limits & Safety',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    parameters: [
      { label: 'Max per transfer', value: '10,000 $MLY' },
      { label: 'Rate limit', value: '10 transfers per minute' },
      { label: 'Wallet freeze', value: 'Safety team can freeze wallets' },
      { label: 'Self-transfer', value: 'Blocked' },
      { label: 'Atomicity', value: 'Database transaction (no partial transfers)' },
    ],
    explanation: 'Transfers are atomic — either the full amount moves or nothing does. There\'s no way to end up in an inconsistent state. Wallets can be frozen by the safety team in cases of suspected coercion or fraud. The 10,000 $MLY cap per transfer prevents accidental large transfers. Rate limiting prevents automated draining attacks.',
  },
];

export default function TransparencyPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Transparency</h1>
        <p className="page-subtitle">
          How MiLyfe works. Every algorithm, every parameter, explained plainly.
        </p>
      </div>

      {/* Principles */}
      <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 bg-gradient-to-r from-teal-50/50 to-white dark:from-teal-900/10 dark:to-harbor-950/50 p-6">
        <h2 className="text-lg font-semibold text-harbor-800 dark:text-white flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-teal-500" aria-hidden="true" />
          Our Transparency Principles
        </h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">•</span>
            <span><strong>No hidden algorithms.</strong> Every system that affects your standing, balance, or experience is documented here with exact numbers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">•</span>
            <span><strong>Parameters change only through governance.</strong> These values can only be altered via a passed proposal with community vote.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">•</span>
            <span><strong>Open source.</strong> All code is publicly auditable on <a href="https://github.com/RealMiLyfe/MiLyfe-Platform" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">GitHub</a>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">•</span>
            <span><strong>Equal treatment.</strong> No citizen gets special decay rates, higher UBI, or bypassed rules.</span>
          </li>
        </ul>
      </div>

      {/* Algorithm cards */}
      <div className="space-y-6">
        {ALGORITHMS.map(({ id, icon: Icon, title, color, bg, parameters, explanation }) => (
          <div key={id} className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg ${bg} p-2.5`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold text-harbor-800 dark:text-white">{title}</h2>
              </div>

              {/* Parameters table */}
              <div className="rounded-lg bg-gray-50 dark:bg-harbor-900/50 p-4 mb-4">
                <table className="w-full text-sm">
                  <tbody>
                    {parameters.map(({ label, value }) => (
                      <tr key={label} className="border-b border-gray-100 dark:border-harbor-800 last:border-0">
                        <td className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{label}</td>
                        <td className="py-2 text-harbor-800 dark:text-white font-mono text-xs">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Plain English explanation */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Link href="/treasury" className="rounded-lg border border-gray-200 dark:border-harbor-700 px-4 py-2.5 text-sm font-medium text-harbor-800 dark:text-white hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
          <Users className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
          Treasury Ledger
        </Link>
        <Link href="/governance" className="rounded-lg border border-gray-200 dark:border-harbor-700 px-4 py-2.5 text-sm font-medium text-harbor-800 dark:text-white hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
          <Vote className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
          View Proposals
        </Link>
        <a href="https://github.com/RealMiLyfe/MiLyfe-Platform" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 dark:border-harbor-700 px-4 py-2.5 text-sm font-medium text-harbor-800 dark:text-white hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
          <BookOpen className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
          Source Code
        </a>
      </div>
    </div>
  );
}
