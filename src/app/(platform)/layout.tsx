import { TopBar } from '@/components/shell/top-bar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { MiButton } from '@/components/mi/mi-button';
import { MiPanel } from '@/components/mi/mi-panel';
import { AuthProvider } from '@/components/shell/auth-provider';
import { AccessibilityProvider } from '@/components/shell/accessibility-provider';
import { GlobalPlayer } from '@/components/media/global-player';
import { OfflineBanner } from '@/components/shell/offline-banner';
import { GlobalSearch } from '@/components/shell/global-search';
import { AnalyticsProvider } from '@/components/shell/analytics-provider';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AnalyticsProvider>
          <div className="min-h-screen pb-20 pt-14">
            <TopBar />
            <OfflineBanner />
            <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 py-4">
              {children}
            </main>
            <MiButton />
            <MiPanel />
            <GlobalSearch />
            <GlobalPlayer />
            <BottomNav />
          </div>
        </AnalyticsProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
