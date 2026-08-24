import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-light dark:bg-surface-dark">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-harbor-800 dark:text-white mb-2">404</p>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This page doesn&apos;t exist yet. It might be a future bounty — check the roadmap!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/home">
            <Button variant="harbor">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go Home
            </Button>
          </Link>
          <Link href="/bounties">
            <Button variant="outline">
              View Bounties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
