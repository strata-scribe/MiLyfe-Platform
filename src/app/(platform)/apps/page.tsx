'use client';

import { AllAppsGrid } from '@/components/ui/app-grid';

export default function AppsPage() {
  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">All Apps</h1>
        <p className="text-xs text-gray-500">Everything MiLyfe has to offer</p>
      </div>
      <AllAppsGrid />
    </div>
  );
}
