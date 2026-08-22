import { TopBar } from '@/components/shell/top-bar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { Sidebar } from '@/components/shell/sidebar';
import { RightPanel } from '@/components/shell/right-panel';
import { MiButton } from '@/components/mi/mi-button';
import { MiPanel } from '@/components/mi/mi-panel';
import { AuthProvider } from '@/components/shell/auth-provider';
import { AccessibilityProvider } from '@/components/shell/accessibility-provider';
import { GlobalPlayer } from '@/components/media/global-player';
import { OfflineBanner } from '@/components/shell/offline-banner';
import { GlobalSearch } from '@/components/shell/global-search';
import { AnalyticsProvider } from '@/components/shell/analytics-provider';
import { A11yEnhancements } from '@/components/shell/a11y-enhancements';
import { InstallPrompt } from '@/components/shell/install-prompt';

/**
 * Platform Layout — Responsive Three-Zone System
 * 
 * Mobile (< 768px): TopBar + Content + BottomNav (current behavior)
 * Tablet (768-1023px): Sidebar (icons) + Content (wide)
 * Desktop (1024px+): Sidebar (full) + Content + RightPanel
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AnalyticsProvider>
          <A11yEnhancements />

          {/* Mobile: top bar (hidden on md+) */}
          <div className="md:hidden">
            <TopBar />
          </div>

          {/* Desktop/Tablet: Sidebar */}
          <Sidebar />

          {/* Right Panel (desktop only) */}
          <RightPanel />

          {/* Main content area — shifts based on sidebar/panel */}
          <div className="min-h-screen md:ml-56 lg:ml-60 lg:mr-72 xl:mr-80 pt-14 md:pt-0 pb-20 md:pb-4">
            <OfflineBanner />
            <main
              id="main-content"
              className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6"
            >
              {children}
            </main>
          </div>

          {/* Mobile-only components */}
          <div className="md:hidden">
            <MiButton />
            <MiPanel />
            <BottomNav />
            <InstallPrompt />
          </div>

          {/* Global (all breakpoints) */}
          <GlobalSearch />
          <GlobalPlayer />
        </AnalyticsProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
