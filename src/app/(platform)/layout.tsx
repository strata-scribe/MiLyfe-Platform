import { TopBar } from '@/components/shell/top-bar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { MiButton } from '@/components/mi/mi-button';
import { MiPanel } from '@/components/mi/mi-panel';
import { AuthProvider } from '@/components/shell/auth-provider';
import { AccessibilityProvider } from '@/components/shell/accessibility-provider';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <div className="min-h-screen pb-20 pt-14">
          <TopBar />
          <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 py-4">
            {children}
          </main>
          <MiButton />
          <MiPanel />
          <BottomNav />
        </div>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
