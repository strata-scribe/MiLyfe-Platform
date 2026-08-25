import { Sidebar } from '@/components/shell/sidebar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { TopBar } from '@/components/shell/top-bar';
import { AuthProvider } from '@/components/shell/auth-provider';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ServiceWorkerRegistrar } from '@/components/shell/sw-registrar';
import { MiBubble } from '@/components/mi/mi-bubble';
import { CommandSearch } from '@/components/shell/command-search';
import { DataCacher } from '@/components/shell/data-cacher';
import { Toaster } from 'sonner';

/**
 * Platform Layout — Responsive shell
 *
 * Mobile (< 768px): TopBar + Content + BottomNav
 * Desktop (768px+): Sidebar + Content
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* Offline status banner */}
      <OfflineIndicator />

      {/* Service worker registration */}
      <ServiceWorkerRegistrar />

      {/* Mobile top bar */}
      <TopBar />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="min-h-screen pt-14 md:pt-0 pb-20 md:pb-4 md:ml-56 lg:ml-60">
        <main
          id="main-content"
          className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Data cacher (silently caches critical data to IndexedDB for offline) */}
      <DataCacher />

      {/* Mi ambient bubble */}
      <MiBubble />

      {/* Global search (Cmd+K) */}
      <CommandSearch />

      <Toaster position="top-right" richColors closeButton theme="system" />
    </AuthProvider>
  );
}
