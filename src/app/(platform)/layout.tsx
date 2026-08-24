import { Sidebar } from '@/components/shell/sidebar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { TopBar } from '@/components/shell/top-bar';
import { AuthProvider } from '@/components/shell/auth-provider';
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

      <Toaster position="top-right" richColors closeButton theme="system" />
    </AuthProvider>
  );
}
