'use client';

import Link from 'next/link';

interface AppLink {
  href: string;
  icon: string;
  label: string;
  color: string;
}

const CITY_APPS: AppLink[] = [
  { href: '/city', icon: '🚨', label: 'Report', color: 'from-red-400 to-red-600' },
  { href: '/city/projects', icon: '🔧', label: 'Projects', color: 'from-amber-400 to-amber-600' },
  { href: '/govern', icon: '🗳️', label: 'Govern', color: 'from-purple-400 to-purple-600' },
  { href: '/nav', icon: '🗺️', label: 'Navigate', color: 'from-blue-400 to-blue-600' },
  { href: '/broadcast', icon: '📢', label: 'Alerts', color: 'from-red-500 to-orange-500' },
  { href: '/transparency', icon: '📊', label: 'Stats', color: 'from-teal-400 to-teal-600' },
];

const SOCIAL_APPS: AppLink[] = [
  { href: '/social', icon: '📱', label: 'Feed', color: 'from-pink-400 to-pink-600' },
  { href: '/forum', icon: '💬', label: 'Forum', color: 'from-indigo-400 to-indigo-600' },
  { href: '/connect', icon: '✉️', label: 'Messages', color: 'from-teal-400 to-teal-600' },
  { href: '/media', icon: '🎬', label: 'Media', color: 'from-purple-400 to-purple-600' },
  { href: '/news', icon: '📰', label: 'News', color: 'from-blue-400 to-blue-600' },
  { href: '/record', icon: '📹', label: 'Record', color: 'from-red-400 to-red-600' },
];

const POCKET_APPS: AppLink[] = [
  { href: '/wallet', icon: '💰', label: 'Wallet', color: 'from-amber-400 to-amber-600' },
  { href: '/market', icon: '🛒', label: 'Market', color: 'from-green-400 to-green-600' },
  { href: '/shop', icon: '🛍️', label: 'Shop', color: 'from-pink-400 to-pink-600' },
  { href: '/auto', icon: '🚗', label: 'Auto', color: 'from-blue-400 to-blue-600' },
  { href: '/housing', icon: '🏠', label: 'Housing', color: 'from-teal-400 to-teal-600' },
  { href: '/rideshare', icon: '🚙', label: 'Rides', color: 'from-purple-400 to-purple-600' },
];

const YOU_APPS: AppLink[] = [
  { href: '/profile', icon: '👤', label: 'Profile', color: 'from-harbor-400 to-harbor-600' },
  { href: '/health', icon: '❤️', label: 'Health', color: 'from-rose-400 to-rose-600' },
  { href: '/twin', icon: '🪞', label: 'Twin', color: 'from-violet-400 to-violet-600' },
  { href: '/achievements', icon: '🏆', label: 'Badges', color: 'from-amber-400 to-amber-600' },
  { href: '/learn', icon: '📚', label: 'Learn', color: 'from-blue-400 to-blue-600' },
  { href: '/career', icon: '💼', label: 'Career', color: 'from-green-400 to-green-600' },
  { href: '/privacy', icon: '🔒', label: 'Privacy', color: 'from-gray-400 to-gray-600' },
  { href: '/vault', icon: '🗄️', label: 'Vault', color: 'from-harbor-500 to-harbor-700' },
];

const ALL_APPS: AppLink[] = [
  // Core
  { href: '/home', icon: '🏠', label: 'Home', color: 'from-teal-400 to-teal-600' },
  { href: '/city', icon: '🏙️', label: 'City', color: 'from-red-400 to-red-600' },
  { href: '/health', icon: '❤️', label: 'Health', color: 'from-rose-400 to-rose-600' },
  { href: '/wallet', icon: '💰', label: 'Wallet', color: 'from-amber-400 to-amber-600' },
  { href: '/connect', icon: '✉️', label: 'Messages', color: 'from-teal-400 to-teal-600' },
  { href: '/social', icon: '📱', label: 'Social', color: 'from-pink-400 to-pink-600' },
  { href: '/forum', icon: '💬', label: 'Forum', color: 'from-indigo-400 to-indigo-600' },
  { href: '/media', icon: '🎬', label: 'Media', color: 'from-purple-400 to-purple-600' },
  // Commerce
  { href: '/market', icon: '🛒', label: 'Market', color: 'from-green-400 to-green-600' },
  { href: '/shop', icon: '🛍️', label: 'Shop', color: 'from-pink-400 to-pink-600' },
  { href: '/auto', icon: '🚗', label: 'Auto', color: 'from-blue-400 to-blue-600' },
  { href: '/housing', icon: '🏠', label: 'Housing', color: 'from-teal-400 to-teal-600' },
  // Life
  { href: '/learn', icon: '📚', label: 'Learn', color: 'from-blue-400 to-blue-600' },
  { href: '/career', icon: '💼', label: 'Career', color: 'from-green-400 to-green-600' },
  { href: '/mihome', icon: '🏡', label: 'MiHome', color: 'from-emerald-400 to-emerald-600' },
  { href: '/family', icon: '👨‍👩‍👧', label: 'Family', color: 'from-blue-400 to-blue-600' },
  // Civic
  { href: '/govern', icon: '🗳️', label: 'Govern', color: 'from-purple-400 to-purple-600' },
  { href: '/guild', icon: '🛡️', label: 'Guild', color: 'from-amber-500 to-amber-700' },
  { href: '/nav', icon: '🗺️', label: 'Navigate', color: 'from-blue-400 to-blue-600' },
  { href: '/news', icon: '📰', label: 'News', color: 'from-blue-400 to-blue-600' },
  // Finance
  { href: '/finance/circles', icon: '🫂', label: 'Circles', color: 'from-teal-400 to-teal-600' },
  { href: '/finance/lending', icon: '🤝', label: 'Lending', color: 'from-green-400 to-green-600' },
  { href: '/finance/emergency', icon: '🚨', label: 'Emergency', color: 'from-red-400 to-red-600' },
  { href: '/finance/health-sharing', icon: '🏥', label: 'Health Pool', color: 'from-pink-400 to-pink-600' },
  // Media
  { href: '/media/tv', icon: '📺', label: 'MiTV', color: 'from-red-500 to-red-700' },
  { href: '/media/blog', icon: '✍️', label: 'Blog', color: 'from-indigo-400 to-indigo-600' },
  { href: '/media/podcast', icon: '🎙️', label: 'Podcast', color: 'from-purple-400 to-purple-600' },
  { href: '/media/radio', icon: '📻', label: 'Radio', color: 'from-amber-400 to-amber-600' },
  // People Services
  { href: '/reentry', icon: '🔓', label: 'Reentry', color: 'from-teal-500 to-teal-700' },
  { href: '/shelter', icon: '🏕️', label: 'Shelter', color: 'from-blue-500 to-blue-700' },
  { href: '/recovery', icon: '💪', label: 'Recovery', color: 'from-green-500 to-green-700' },
  { href: '/veterans', icon: '🎖️', label: 'Veterans', color: 'from-green-600 to-green-800' },
  // Tools
  { href: '/wiki', icon: '📖', label: 'Wiki', color: 'from-amber-400 to-amber-600' },
  { href: '/academia', icon: '🔬', label: 'Research', color: 'from-indigo-400 to-indigo-600' },
  { href: '/vault', icon: '🗄️', label: 'Vault', color: 'from-harbor-500 to-harbor-700' },
  { href: '/twin', icon: '🪞', label: 'Twin', color: 'from-violet-400 to-violet-600' },
  { href: '/rights', icon: '⚖️', label: 'Rights', color: 'from-harbor-600 to-harbor-800' },
  { href: '/record', icon: '📹', label: 'Record', color: 'from-red-400 to-red-600' },
  { href: '/achievements', icon: '🏆', label: 'Badges', color: 'from-amber-400 to-amber-600' },
  { href: '/dev-portal', icon: '🛠️', label: 'Develop', color: 'from-gray-500 to-gray-700' },
];

function AppGrid({ apps, columns = 4 }: { apps: AppLink[]; columns?: 3 | 4 | 5 }) {
  return (
    <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3' : columns === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
      {apps.map((app) => (
        <Link
          key={app.href}
          href={app.href}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-harbor-800/50 transition-colors"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-lg shadow-sm`}>
            {app.icon}
          </div>
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{app.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function CityAppGrid() { return <AppGrid apps={CITY_APPS} columns={3} />; }
export function SocialAppGrid() { return <AppGrid apps={SOCIAL_APPS} columns={3} />; }
export function PocketAppGrid() { return <AppGrid apps={POCKET_APPS} columns={3} />; }
export function YouAppGrid() { return <AppGrid apps={YOU_APPS} columns={4} />; }
export function AllAppsGrid() { return <AppGrid apps={ALL_APPS} columns={4} />; }
export { ALL_APPS, CITY_APPS, SOCIAL_APPS, POCKET_APPS, YOU_APPS };
