'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';

const lifeApps = [
  { href: '/health', icon: '💚', name: 'MiHealth', desc: 'Daily check-in & wellness tracking', badge: '+$5/day' },
  { href: '/learn', icon: '📚', name: 'MiLearn', desc: 'Rights, finance, health, career courses', badge: 'New' },
  { href: '/rights', icon: '📜', name: 'MiRights', desc: 'Constitution, police defense, legal tools', badge: null },
  { href: '/career', icon: '💼', name: 'MiCareer', desc: 'Resume, skills, job matching', badge: null },
  { href: '/family', icon: '👨‍👩‍👧', name: 'MiFamily', desc: 'Calendar, budget, kids, elder care', badge: null },
  { href: '/dev', icon: '🎯', name: 'MiDev', desc: 'Goals, habits, journal, mentorship', badge: null },
  { href: '/resources', icon: '⭐', name: 'Resources', desc: 'Free services directory', badge: null },
];

export default function LifePage() {
  const { user } = useAppStore();

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Life</h1>
        <p className="text-xs text-gray-500">Health, education, career, family, growth.</p>
      </div>

      {/* Quick Health Status */}
      <Link href="/health" className="card flex items-center gap-3 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
        <span className="text-3xl">💚</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-harbor-800 dark:text-white">Daily Check-in</p>
          <p className="text-xs text-gray-500">Tap to check in and earn $5 MLY</p>
        </div>
        <span className="text-sm font-bold text-teal-500">+$5</span>
      </Link>

      {/* App Grid */}
      <div className="space-y-3">
        {lifeApps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <span className="text-2xl w-10 text-center">{app.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{app.name}</p>
              <p className="text-xs text-gray-500 truncate">{app.desc}</p>
            </div>
            {app.badge && (
              <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                {app.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
