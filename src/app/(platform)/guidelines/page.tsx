import { Metadata } from 'next';
import { Shield, Heart, Users, Scale, AlertTriangle, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Community Guidelines' };

const PRINCIPLES = [
  {
    icon: Heart,
    title: 'Respect & Dignity',
    color: 'text-rose-500',
    rules: [
      'Treat every citizen with respect, regardless of background or belief',
      'No harassment, bullying, or threats of any kind',
      'No hate speech targeting race, gender, orientation, disability, or religion',
      'Disagree with ideas, not with people',
    ],
  },
  {
    icon: Shield,
    title: 'Safety First',
    color: 'text-teal-500',
    rules: [
      'Never share someone\'s personal information without consent',
      'Report suspected abuse, fraud, or coercion — don\'t ignore it',
      'The safety module exists for real situations — never misuse it',
      'If you see someone in crisis, direct them to the safety resources',
    ],
  },
  {
    icon: ThumbsUp,
    title: 'Honest Participation',
    color: 'text-green-500',
    rules: [
      'Don\'t create fake accounts or impersonate others',
      'Don\'t manipulate votes, standing, or marketplace listings',
      'Keep community resources accurate — verify before updating',
      'Earn $MLY through real contribution, not gaming the system',
    ],
  },
  {
    icon: Users,
    title: 'Community Stewardship',
    color: 'text-harbor-500',
    rules: [
      'The marketplace is for genuine exchange — no scams or deceptive listings',
      'Proposals should serve the community, not personal gain',
      'Attestations should be honest — don\'t trade them for favors',
      'When you see good work, recognize it. Standing is community-driven.',
    ],
  },
  {
    icon: Scale,
    title: 'Governance Ethics',
    color: 'text-purple-500',
    rules: [
      'Vote based on merit, not personal relationships',
      'Disclose conflicts of interest on proposals you\'re connected to',
      'Respect vote outcomes — even when you disagree',
      'Use recall sparingly and only for genuine misconduct',
    ],
  },
];

const CONSEQUENCES = [
  { severity: 'Warning', description: 'First-time minor violations result in a private warning and education.' },
  { severity: 'Temporary restriction', description: 'Repeated violations may limit posting, voting, or transfer abilities for 7-30 days.' },
  { severity: 'Standing reduction', description: 'Severe violations may result in standing loss across relevant facets.' },
  { severity: 'Account suspension', description: 'Egregious or repeated serious violations may result in temporary or permanent suspension.' },
];

export default function GuidelinesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Community Guidelines</h1>
        <p className="page-subtitle">
          The rules we live by. Simple, fair, and enforced equally.
        </p>
      </div>

      {/* Preamble */}
      <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 bg-gradient-to-r from-teal-50/50 to-white dark:from-teal-900/10 dark:to-harbor-950/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          MiLyfe exists because we believe civic technology should be free, transparent, and owned by the people who use it. 
          These guidelines protect that vision. They apply equally to every citizen — no exceptions for standing, tenure, or role.
          Moderation decisions are logged publicly. If you think a decision was wrong, you can appeal through governance.
        </p>
      </div>

      {/* Principles */}
      <div className="space-y-6">
        {PRINCIPLES.map(({ icon: Icon, title, color, rules }) => (
          <div key={title} className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-6">
            <h2 className="font-bold text-harbor-800 dark:text-white flex items-center gap-2 mb-3">
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
              {title}
            </h2>
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Consequences */}
      <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-6">
        <h2 className="font-bold text-harbor-800 dark:text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-500" aria-hidden="true" />
          Enforcement
        </h2>
        <div className="space-y-3">
          {CONSEQUENCES.map(({ severity, description }) => (
            <div key={severity} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-harbor-900/50">
              <span className="text-sm font-semibold text-harbor-800 dark:text-white whitespace-nowrap min-w-[160px]">{severity}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{description}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          All moderation actions are logged publicly. Appeals can be filed through the governance system.
        </p>
      </div>

      <div className="text-center pt-2">
        <Link href="/transparency" className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
          ← See how all platform systems work
        </Link>
      </div>
    </div>
  );
}
